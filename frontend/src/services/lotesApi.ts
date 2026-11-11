import type { FeatureCollection, Polygon } from 'geojson';
import type { Lote } from '../types/lote';
import { generarLotesEjemplo } from '../data/lotesEjemplo';

const espera = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

// TEMPORAL: simula la respuesta de lotes-service.
// En la #22 el cuerpo se reemplaza por: fetch('/api/lotes') → respuesta.json()
export async function obtenerLotes(): Promise<FeatureCollection<Polygon, Lote>> {
    await espera(700); // simula la demora de la red

    // Solo en desarrollo: ?falla en la dirección simula que el servidor está caído
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('falla')) {
        throw new Error('Falla simulada del servidor');
    }

    return generarLotesEjemplo();
}