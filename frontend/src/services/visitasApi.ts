import type { SolicitudVisita } from '../types/visita';

// TEMPORAL: simula el envío al backend.
// Cuando visitas-service esté listo, reemplazamos el cuerpo por un fetch a /api/visitas.
export async function enviarSolicitudVisita(solicitud: SolicitudVisita): Promise<void> {
    await new Promise((resolver) => setTimeout(resolver, 800)); // simula la demora de la red
    console.log('Solicitud de visita (simulada):', solicitud);
}