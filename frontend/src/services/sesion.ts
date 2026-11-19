// Sesión del vendedor: el token que entrega lotes-service al iniciar sesión.
// Se guarda en localStorage para no pedir la clave en cada recarga; vence a las 8 horas.

export interface Sesion {
    token: string;
    usuario: string;
    nombre: string;
    expiraEn: number; // milisegundos, como Date.now()
}

const CLAVE = 'geolotes.sesion';
export const EVENTO_SESION = 'geolotes:sesion';

function avisarCambio() {
    window.dispatchEvent(new Event(EVENTO_SESION));
}

export function leerSesion(): Sesion | null {
    try {
        const texto = localStorage.getItem(CLAVE);
        if (!texto) return null;
        const sesion = JSON.parse(texto) as Partial<Sesion>;
        const valida =
            typeof sesion.token === 'string' &&
            typeof sesion.usuario === 'string' &&
            typeof sesion.nombre === 'string' &&
            typeof sesion.expiraEn === 'number';
        if (!valida || sesion.expiraEn! <= Date.now()) {
            localStorage.removeItem(CLAVE);
            return null;
        }
        return sesion as Sesion;
    } catch {
        return null; // navegador sin almacenamiento o dato dañado
    }
}

export function cerrarSesion() {
    try {
        localStorage.removeItem(CLAVE);
    } catch {
        // sin almacenamiento no hay nada que borrar
    }
    avisarCambio();
}

// Cabecera para las peticiones del panel del vendedor
export function encabezadoAutorizacion(): Record<string, string> {
    const sesion = leerSesion();
    return sesion ? { Authorization: `Bearer ${sesion.token}` } : {};
}

export async function iniciarSesion(usuario: string, clave: string): Promise<Sesion> {
    let respuesta: Response;
    try {
        respuesta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, clave }),
        });
    } catch {
        throw new Error('No hay conexión con el servidor. Revisa que lotes-service esté corriendo.');
    }

    const cuerpo = (await respuesta.json().catch(() => ({}))) as Partial<Sesion> & { mensaje?: string };
    if (!respuesta.ok) {
        // 401: usuario o clave incorrectos · 429: demasiados intentos
        throw new Error(cuerpo.mensaje ?? `No se pudo iniciar sesión (${respuesta.status}).`);
    }

    const sesion = cuerpo as Sesion;
    try {
        localStorage.setItem(CLAVE, JSON.stringify(sesion));
    } catch {
        // Sin almacenamiento la sesión no sobrevive a una recarga, pero el resto funciona
    }
    avisarCambio();
    return sesion;
}
