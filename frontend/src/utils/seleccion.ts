import type { Lote } from '../types/lote';

export function alTocarLote(lote: Lote, modoVendedor: boolean) {
    if (lote.estado === 'VENDIDO' && !modoVendedor) {
        return { abrirFicha: false, aviso: 'Ese lote ya está vendido' };
    }
    return { abrirFicha: true, aviso: null };
}
