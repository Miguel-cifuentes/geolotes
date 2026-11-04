import type { ExpressionSpecification } from 'mapbox-gl';
import type { FeatureCollection, Polygon } from 'geojson';
import type { Lote, EstadoLote } from '../types/lote';
import type { Filtros, Rangos } from '../types/filtros';

export const TODOS_LOS_ESTADOS: EstadoLote[] = ['DISPONIBLE', 'RESERVADO', 'VENDIDO', 'NO_DISPONIBLE'];

// Calcula los rangos a partir de los lotes reales (sirve igual cuando vengan de la API)
export function calcularRangos(lotes: FeatureCollection<Polygon, Lote>): Rangos {
    const precios = lotes.features.map((f) => f.properties.precio);
    const areas = lotes.features.map((f) => f.properties.areaM2);
    return {
        precioMin: Math.min(...precios),
        precioMax: Math.max(...precios),
        areaMin: Math.min(...areas),
        areaMax: Math.max(...areas),
    };
}

// Sin filtros: todos los estados, sin tope de precio ni área mínima
export function filtrosIniciales(rangos: Rangos): Filtros {
    return { estados: TODOS_LOS_ESTADOS, precioMax: rangos.precioMax, areaMin: rangos.areaMin };
}

// ¿Este lote cumple los filtros? (para el contador)
export function cumpleFiltros(lote: Lote, f: Filtros): boolean {
    return f.estados.includes(lote.estado) && lote.precio <= f.precioMax && lote.areaM2 >= f.areaMin;
}

// La MISMA regla, escrita como expresión de Mapbox (para pintar el mapa).
// Mapbox la evalúa en la tarjeta gráfica para cada lote.
export function expresionFiltros(f: Filtros): ExpressionSpecification {
    return [
        'all',
        ['in', ['get', 'estado'], ['literal', f.estados]],
        ['<=', ['get', 'precio'], f.precioMax],
        ['>=', ['get', 'areaM2'], f.areaMin],
    ];
}