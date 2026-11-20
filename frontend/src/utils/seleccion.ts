import type { Lote } from '../types/lote';

// Qué debe pasar cuando el usuario toca un lote en el plano
export interface ResultadoToque {
    abrirFicha: boolean;
    aviso: string | null;
}

export const AVISO_LOTE_VENDIDO = 'Ese lote ya está vendido';

const ABRIR_FICHA: ResultadoToque = { abrirFicha: true, aviso: null };

// HU-02 c3: el comprador no abre la ficha de un lote vendido.
// El vendedor sí, porque desde la ficha cambia el estado del lote.
export function alTocarLote(lote: Lote, modoVendedor: boolean): ResultadoToque {
    const vendidoParaComprador = lote.estado === 'VENDIDO' && !modoVendedor;
    return vendidoParaComprador ? { abrirFicha: false, aviso: AVISO_LOTE_VENDIDO } : ABRIR_FICHA;
}
