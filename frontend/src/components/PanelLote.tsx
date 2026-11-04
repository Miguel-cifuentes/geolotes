import { useState } from 'react';
import type { Lote } from '../types/lote';
import { ESTADOS } from '../config/estados';
import { formatoPesos } from '../utils/formato';
import FormularioVisita from './FormularioVisita';

// ⚠️ Número del vendedor (57 + celular, sin espacios ni +)
const WHATSAPP_VENDEDOR = '573112642383';

interface Props {
    lote: Lote;
    onCerrar: () => void;
}

export default function PanelLote({ lote, onCerrar }: Props) {
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [copiado, setCopiado] = useState(false);

    const estado = ESTADOS[lote.estado];
    const enlace = `${window.location.origin}${window.location.pathname}?lote=${lote.id}`;
    const mensaje = `Hola, me interesa el Lote ${lote.numero} de la Manzana ${lote.manzana} que vi en GeoLotes: ${enlace}`;
    const enlaceWhatsapp = `https://wa.me/${WHATSAPP_VENDEDOR}?text=${encodeURIComponent(mensaje)}`;

    async function compartir() {
        const datos = {
            title: `GeoLotes · Lote ${lote.manzana}-${lote.numero}`,
            text: `Mira este lote: ${lote.areaM2} m², ${formatoPesos.format(lote.precio)}`,
            url: enlace,
        };
        // Celular: abre el menú de compartir del teléfono (WhatsApp, correo, etc.)
        if (navigator.share) {
            try {
                await navigator.share(datos);
            } catch {
                // El usuario cerró el menú sin compartir: no es un error
            }
            return;
        }
        // Computador: copia el enlace al portapapeles
        await navigator.clipboard.writeText(enlace);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
    }

    return (
        <aside className="panel">
            <button className="panel-cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>

            <p className="panel-sub">Manzana {lote.manzana}</p>
            <h2>Lote {lote.numero}</h2>

            <span className="estado" style={{ background: estado.color }}>{estado.etiqueta}</span>

            <dl className="datos">
                <div><dt>Área</dt><dd>{lote.areaM2} m²</dd></div>
                <div><dt>Precio</dt><dd>{formatoPesos.format(lote.precio)}</dd></div>
            </dl>

            <p className="descripcion">{lote.descripcion}</p>

            {lote.estado === 'DISPONIBLE' || lote.estado === 'RESERVADO' ? (
                <div className="acciones">
                    <button className="btn-primario" onClick={() => setMostrarFormulario(true)}>
                        Agendar visita
                    </button>
                    <a className="btn-secundario" href={enlaceWhatsapp} target="_blank" rel="noreferrer">
                        Escribir por WhatsApp
                    </a>
                </div>
            ) : (
                <p className="no-disponible">Este lote ya no está a la venta.</p>
            )}

            <button className="btn-compartir" onClick={compartir} aria-live="polite">
                {copiado ? '✓ Enlace copiado' : 'Compartir lote'}
            </button>

            {mostrarFormulario && (
                <FormularioVisita lote={lote} onCerrar={() => setMostrarFormulario(false)} />
            )}
        </aside>
    );
}