import type { EstadoVisita, SolicitudVisita, Visita } from '../types/visita';
import { cerrarSesion, encabezadoAutorizacion } from './sesion';

// Error con los mensajes por campo que devuelve visitas-service cuando responde 400
export class ErrorValidacion extends Error {
    readonly errores: Partial<Record<keyof SolicitudVisita, string>>;

    constructor(errores: Partial<Record<keyof SolicitudVisita, string>>) {
        super('Datos inválidos');
        this.errores = errores;
    }
}

// Envía la solicitud a visitas-service (a través del proxy de Vite o del API Gateway)
export async function enviarSolicitudVisita(solicitud: SolicitudVisita): Promise<void> {
    const respuesta = await fetch('/api/visitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(solicitud),
    });

    // 400: el backend rechazó algún campo; traemos sus mensajes para mostrarlos en el formulario
    if (respuesta.status === 400) {
        const cuerpo = await respuesta.json().catch(() => ({}));
        throw new ErrorValidacion(cuerpo.errores ?? {});
    }

    if (!respuesta.ok) {
        throw new Error(`visitas-service respondió ${respuesta.status}`);
    }
}

// ---------- Panel del vendedor (exigen sesión: visitas-service responde 401 sin token) ----------

async function pedirComoVendedor(ruta: string, opciones: RequestInit = {}): Promise<Response> {
    let respuesta: Response;
    try {
        respuesta = await fetch(ruta, {
            ...opciones,
            headers: { ...(opciones.headers ?? {}), ...encabezadoAutorizacion() },
        });
    } catch {
        throw new Error('No hay conexión con visitas-service.');
    }
    if (respuesta.status === 401) {
        cerrarSesion(); // el token venció: App vuelve a pedir el ingreso
        throw new Error('Tu sesión terminó. Inicia sesión de nuevo.');
    }
    if (!respuesta.ok) throw new Error(`visitas-service respondió ${respuesta.status}.`);
    return respuesta;
}

export async function listarVisitas(estado?: EstadoVisita): Promise<Visita[]> {
    const ruta = estado ? `/api/visitas?estado=${estado}` : '/api/visitas';
    return (await (await pedirComoVendedor(ruta)).json()) as Visita[];
}

export async function cambiarEstadoVisita(id: string, estado: EstadoVisita): Promise<Visita> {
    const respuesta = await pedirComoVendedor(`/api/visitas/${encodeURIComponent(id)}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
    });
    return (await respuesta.json()) as Visita;
}
