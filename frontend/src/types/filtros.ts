import type { EstadoLote } from './lote';

// Qué está filtrando el usuario en este momento
export interface Filtros {
    estados: EstadoLote[]; // estados visibles
    precioMax: number;     // en pesos colombianos
    areaMin: number;       // en m²
}

// Valores mínimo y máximo reales de los lotes, para armar los controles
export interface Rangos {
    precioMin: number;
    precioMax: number;
    areaMin: number;
    areaMax: number;
}