import type { EstadoLote } from '../types/lote';

// Colores EXCLUSIVOS del mapa. No usarlos en botones ni otros elementos de interfaz,
// para no confundirlos con el verde de marca (#0F4A2F).
export const ESTADOS: Record<EstadoLote, { etiqueta: string; color: string }> = {
    DISPONIBLE:    { etiqueta: 'Disponible',    color: '#22C55E' },
    RESERVADO:     { etiqueta: 'Reservado',     color: '#F59E0B' },
    VENDIDO:       { etiqueta: 'Vendido',       color: '#EF4444' },
    NO_DISPONIBLE: { etiqueta: 'No disponible', color: '#9CA3AF' },
};