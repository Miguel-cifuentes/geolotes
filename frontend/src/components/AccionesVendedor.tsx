import { useState } from 'react';
import type { Lote } from '../types/lote';
import { eliminarLote, ErrorApi } from '../services/lotesApi';
import CambioEstado from './CambioEstado';
import { IconoArea, IconoBasura, IconoLapiz } from './Iconos';

interface Props {
    lote: Lote;
    onEstadoCambiado: (lote: Lote) => void;
    onEditarDatos: () => void;
    onEditarForma: () => void;
    onEliminado: (id: string) => void;
}

// Lo que el vendedor puede hacer con un lote ya dibujado (solo con ?vendedor)
export default function AccionesVendedor({ lote, onEstadoCambiado, onEditarDatos, onEditarForma, onEliminado }: Props) {
    const [confirmando, setConfirmando] = useState(false);
    const [eliminando, setEliminando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function eliminar() {
        setEliminando(true);
        setError(null);
        try {
            await eliminarLote(lote.id);
            onEliminado(lote.id);
        } catch (e) {
            setError(e instanceof ErrorApi ? e.message : 'No se pudo eliminar el lote.');
            setEliminando(false);
        }
    }

    return (
        <section className="vendedor" aria-label="Panel del vendedor">
            <h3>Panel del vendedor</h3>

            {/* key con el estado: si cambia desde el formulario, el selector muestra el valor nuevo */}
            <CambioEstado key={`${lote.id}-${lote.estado}`} lote={lote} onCambiado={onEstadoCambiado} />

            <div className="vendedor-acciones">
                <button className="btn-secundario btn-pequeno" onClick={onEditarDatos}>
                    <IconoLapiz width={15} height={15} />
                    Datos, video y 360°
                </button>
                <button className="btn-secundario btn-pequeno" onClick={onEditarForma}>
                    <IconoArea width={15} height={15} />
                    Ajustar forma
                </button>
            </div>

            {confirmando ? (
                <div className="confirmar" role="alertdialog" aria-label="Confirmar eliminación">
                    <p>¿Eliminar el lote {lote.numero} de la manzana {lote.manzana}? También se borran su video y su foto 360°. No se puede deshacer.</p>
                    <div className="confirmar-botones">
                        <button className="btn-peligro btn-pequeno" onClick={eliminar} disabled={eliminando}>
                            {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
                        </button>
                        <button className="btn-fantasma" onClick={() => setConfirmando(false)} disabled={eliminando}>
                            Cancelar
                        </button>
                    </div>
                </div>
            ) : (
                <button className="btn-fantasma btn-eliminar" onClick={() => setConfirmando(true)}>
                    <IconoBasura width={15} height={15} />
                    Eliminar lote
                </button>
            )}

            {error && <p className="vendedor-msg error" role="alert">{error}</p>}
        </section>
    );
}
