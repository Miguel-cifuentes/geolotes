import { useState } from 'react';
import type { EstadoLote, Lote } from '../types/lote';
import { ESTADOS } from '../config/estados';
import { cambiarEstadoLote, ErrorConflicto } from '../services/lotesApi';

type Envio = 'quieto' | 'guardando' | 'guardado' | 'conflicto' | 'error';

interface Props {
    lote: Lote;
    onCambiado: (lote: Lote) => void;
}

/*
 * Decisión CAP (CP): el mapa solo cambia cuando lotes-service confirma el cambio.
 * Si falla o hay conflicto, se muestra el error y el color queda como estaba.
 */
export default function CambioEstado({ lote, onCambiado }: Props) {
    const [nuevo, setNuevo] = useState<EstadoLote>(lote.estado);
    const [envio, setEnvio] = useState<Envio>('quieto');

    async function guardar() {
        setEnvio('guardando');
        try {
            const actualizado = await cambiarEstadoLote(lote.id, nuevo);
            onCambiado(actualizado);
            setEnvio('guardado');
        } catch (error) {
            setEnvio(error instanceof ErrorConflicto ? 'conflicto' : 'error');
        }
    }

    const mensajes: Record<Envio, string> = {
        quieto: '',
        guardando: '',
        guardado: '✓ Estado actualizado.',
        conflicto: 'Otra persona cambió este lote al mismo tiempo. Recarga la página y revisa el estado.',
        error: 'No se pudo guardar. Revisa la conexión e intenta de nuevo.',
    };
    const hayError = envio === 'conflicto' || envio === 'error';

    return (
        <section className="vendedor">
            <h3>Panel del vendedor</h3>
            <label htmlFor="nuevo-estado">Estado del lote</label>
            <select
                id="nuevo-estado"
                value={nuevo}
                disabled={envio === 'guardando'}
                onChange={(e) => {
                    setNuevo(e.target.value as EstadoLote);
                    setEnvio('quieto');
                }}
            >
                {(Object.keys(ESTADOS) as EstadoLote[]).map((e) => (
                    <option key={e} value={e}>{ESTADOS[e].etiqueta}</option>
                ))}
            </select>
            <button
                className="btn-primario"
                onClick={guardar}
                disabled={nuevo === lote.estado || envio === 'guardando'}
            >
                {envio === 'guardando' ? 'Guardando…' : 'Guardar estado'}
            </button>
            <p className={`vendedor-msg${hayError ? ' error' : ''}`} aria-live="polite">
                {mensajes[envio]}
            </p>
        </section>
    );
}