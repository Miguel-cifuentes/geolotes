import type { FeatureCollection, Polygon } from 'geojson';
import type { Lote } from '../types/lote';

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