import type { FeatureCollection, Polygon } from 'geojson';
import type { EstadoLote, Lote, Punto } from '../types/lote';
import { cerrarSesion, encabezadoAutorizacion } from './sesion';

// Pide los lotes a lotes-service (a través del proxy de Vite o del API Gateway)
export async function obtenerLotes(): Promise<FeatureCollection<Polygon, Lote>> {
    // Solo en desarrollo: ?falla en la dirección simula que el servidor está caído
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('falla')) {
        throw new Error('Falla simulada del servidor');
    }

    const respuesta = await fetch('/api/lotes');
    if (!respuesta.ok) {
        throw new Error(`lotes-service respondió ${respuesta.status}`);
    }
    return (await respuesta.json()) as FeatureCollection<Polygon, Lote>;
}

// 409: otra persona cambió el mismo lote al mismo tiempo (bloqueo optimista en lotes-service)
export class ErrorConflicto extends Error {}

// Cambia el estado de un lote (vista del vendedor). Devuelve el lote ya actualizado.
export async function cambiarEstadoLote(id: string, estado: EstadoLote): Promise<Lote> {
    const respuesta = await fetch(`/api/lotes/${encodeURIComponent(id)}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...encabezadoAutorizacion() },
        body: JSON.stringify({ estado }),
    });
    if (respuesta.status === 401) {
        cerrarSesion(); // el token venció: App vuelve a pedir el ingreso
        throw new Error('Tu sesión terminó. Inicia sesión de nuevo.');
    }
    if (respuesta.status === 409) {
        throw new ErrorConflicto('El lote fue modificado por otra persona');
    }
    if (!respuesta.ok) {
        throw new Error(`lotes-service respondió ${respuesta.status}`);
    }
    return (await respuesta.json()) as Lote;
}

// ---------- Segmentación manual y videos (panel del vendedor) ----------

export const TAMANO_MAXIMO_VIDEO = 300 * 1024 * 1024; // igual que application.yaml

export interface DatosLote {
    manzana: string;
    numero: number;
    precio: number;
    estado: EstadoLote;
    descripcion: string;
}

// Error con el mensaje que manda lotes-service, por ejemplo "La forma se monta sobre A-3…"
export class ErrorApi extends Error {
    readonly estado: number;
    readonly errores: Record<string, string>;

    constructor(estado: number, mensaje: string, errores: Record<string, string> = {}) {
        super(mensaje);
        this.estado = estado;
        this.errores = errores;
    }
}

interface CuerpoError {
    mensaje?: string;
    errores?: Record<string, string>;
}

const SESION_TERMINADA = 'Tu sesión terminó. Inicia sesión de nuevo.';

function errorDesde(estado: number, cuerpo: CuerpoError): ErrorApi {
    if (estado === 401) {
        cerrarSesion(); // el token venció o no es válido: App vuelve a pedir el ingreso
        return new ErrorApi(401, SESION_TERMINADA);
    }
    return new ErrorApi(estado, cuerpo.mensaje ?? `lotes-service respondió ${estado}`, cuerpo.errores ?? {});
}

async function enviar(url: string, metodo: string, cuerpo?: unknown): Promise<Response> {
    let respuesta: Response;
    try {
        respuesta = await fetch(url, {
            method: metodo,
            headers: {
                ...(cuerpo === undefined ? {} : { 'Content-Type': 'application/json' }),
                ...encabezadoAutorizacion(),
            },
            body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        });
    } catch {
        throw new ErrorApi(0, 'No hay conexión con el servidor. Revisa que lotes-service esté corriendo.');
    }
    if (!respuesta.ok) {
        const datos = (await respuesta.json().catch(() => ({}))) as CuerpoError;
        throw errorDesde(respuesta.status, datos);
    }
    return respuesta;
}

// GeoJSON del polígono: el primer punto se repite al final para cerrarlo
function aPoligono(puntos: Punto[]) {
    return { type: 'Polygon', coordinates: [[...puntos, puntos[0]]] };
}

const urlLote = (id: string) => `/api/lotes/${encodeURIComponent(id)}`;

export async function crearLote(datos: DatosLote, puntos: Punto[]): Promise<Lote> {
    const respuesta = await enviar('/api/lotes', 'POST', { ...datos, geometria: aPoligono(puntos) });
    return (await respuesta.json()) as Lote;
}

export async function actualizarLote(
    id: string,
    datos: Pick<DatosLote, 'precio' | 'estado' | 'descripcion'>,
): Promise<Lote> {
    const respuesta = await enviar(urlLote(id), 'PUT', datos);
    return (await respuesta.json()) as Lote;
}

export async function actualizarForma(id: string, puntos: Punto[]): Promise<Lote> {
    const respuesta = await enviar(`${urlLote(id)}/geometria`, 'PUT', aPoligono(puntos));
    return (await respuesta.json()) as Lote;
}

export async function eliminarLote(id: string): Promise<void> {
    await enviar(urlLote(id), 'DELETE');
}

export async function quitarVideo(id: string): Promise<Lote> {
    const respuesta = await enviar(`${urlLote(id)}/video`, 'DELETE');
    return (await respuesta.json()) as Lote;
}

// Sube el video con XMLHttpRequest porque fetch no informa el avance de la subida
export function subirVideo(id: string, archivo: File, onProgreso: (fraccion: number) => void): Promise<Lote> {
    return new Promise((resolver, rechazar) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${urlLote(id)}/video`);
        for (const [nombre, valor] of Object.entries(encabezadoAutorizacion())) xhr.setRequestHeader(nombre, valor);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgreso(e.loaded / e.total);
        };
        xhr.onload = () => {
            let cuerpo: unknown = {};
            try {
                cuerpo = JSON.parse(xhr.responseText);
            } catch {
                // respuesta vacía o que no es JSON
            }
            if (xhr.status >= 200 && xhr.status < 300) resolver(cuerpo as Lote);
            else rechazar(errorDesde(xhr.status, cuerpo as CuerpoError));
        };
        xhr.onerror = () => rechazar(new ErrorApi(0, 'Se perdió la conexión mientras subía el video.'));
        const formulario = new FormData();
        formulario.append('archivo', archivo);
        xhr.send(formulario);
    });
}

// Dirección del video. ?v= cambia cuando se reemplaza el video, así el navegador no usa el viejo.
export function urlVideo(lote: Pick<Lote, 'id' | 'video'>): string {
    return `${urlLote(lote.id)}/video?v=${encodeURIComponent(lote.video ?? '')}`;
}
