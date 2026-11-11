import type { SolicitudVisita } from '../types/visita';

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