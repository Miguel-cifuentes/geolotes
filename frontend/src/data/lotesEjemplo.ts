import type { Feature, FeatureCollection, Polygon } from 'geojson';
import type { EstadoLote, Lote } from '../types/lote';

// ⚠️ Reemplaza con TU punto de Google Maps, en orden [longitud, latitud].
// Google te da "4.09612, -73.66105" → aquí va [-73.66105, 4.09612]
export const CENTRO: [number, number] = [-73.666010, 4.081682];

// Medidas de cada lote en metros
const ANCHO_M = 12;
const FONDO_M = 25;
const VIA_M = 10; // vía entre la manzana A y la manzana B

// Conversión aproximada de metros a grados, válida para distancias cortas
const metrosALat = (m: number) => m / 110574;
const metrosALon = (m: number, lat: number) => m / (111320 * Math.cos((lat * Math.PI) / 180));

const ESTADOS_EJEMPLO: EstadoLote[] = [
    'DISPONIBLE', 'DISPONIBLE', 'RESERVADO', 'VENDIDO', 'DISPONIBLE',   // Manzana A
    'VENDIDO', 'DISPONIBLE', 'NO_DISPONIBLE', 'RESERVADO', 'DISPONIBLE', // Manzana B
];

// Genera 2 manzanas de 5 lotes cada una alrededor de CENTRO.
// Es temporal: cuando lotes-service esté listo, estos datos vendrán de la API.
export function generarLotesEjemplo(): FeatureCollection<Polygon, Lote> {
    const [lon0, lat0] = CENTRO;
    const dx = metrosALon(ANCHO_M, lat0);
    const dy = metrosALat(FONDO_M);
    const via = metrosALat(VIA_M);

    const features: Feature<Polygon, Lote>[] = ESTADOS_EJEMPLO.map((estado, i) => {
        const fila = Math.floor(i / 5); // 0 = manzana A (norte), 1 = manzana B (sur)
        const columna = i % 5;

        const oeste = lon0 + (columna - 2.5) * dx;
        const este = oeste + dx;
        const norte = fila === 0 ? lat0 + via / 2 + dy : lat0 - via / 2;
        const sur = norte - dy;

        const manzana = fila === 0 ? 'A' : 'B';
        const numero = columna + 1;

        return {
            type: 'Feature',
            properties: {
                id: `${manzana}-${numero}`,
                manzana,
                numero,
                areaM2: ANCHO_M * FONDO_M,
                precio: 85_000_000 + columna * 5_000_000,
                estado,
                descripcion: `Lote ${numero} de la manzana ${manzana}, sector La Porfía. Terreno plano con acceso por vía interna.`,
            },
            geometry: {
                type: 'Polygon',
                // Un polígono se cierra repitiendo el primer punto al final
                coordinates: [[[oeste, norte], [este, norte], [este, sur], [oeste, sur], [oeste, norte]]],
            },
        };
    });

    return { type: 'FeatureCollection', features };
}