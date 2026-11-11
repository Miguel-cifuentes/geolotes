import type { FeatureCollection, Polygon } from 'geojson';
import type { EstadoLote, Lote } from '../types/lote';

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado }),
    });
    if (respuesta.status === 409) {
        throw new ErrorConflicto('El lote fue modificado por otra persona');
    }
    if (!respuesta.ok) {
        throw new Error(`lotes-service respondió ${respuesta.status}`);
    }
    return (await respuesta.json()) as Lote;
}