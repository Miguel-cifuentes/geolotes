import type { Lote } from '../types/lote';
import { ESTADOS } from '../config/estados';

// ⚠️ Cambia por el número del vendedor (57 + celular, sin espacios ni +)
const WHATSAPP_VENDEDOR = '573112642383';

const formatoPesos = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
});

interface Props {
    lote: Lote;
    onCerrar: () => void;
}

export default function PanelLote({ lote, onCerrar }: Props) {
    const estado = ESTADOS[lote.estado];
    const mensaje = `Hola, me interesa el Lote ${lote.numero} de la Manzana ${lote.manzana} que vi en GeoLotes.`;
    const enlaceWhatsapp = `https://wa.me/${WHATSAPP_VENDEDOR}?text=${encodeURIComponent(mensaje)}`;

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
                    <button className="btn-primario" onClick={() => alert('Formulario de visita: próximo paso')}>
                        Agendar visita
                    </button>
                    <a className="btn-secundario" href={enlaceWhatsapp} target="_blank" rel="noreferrer">
                        Escribir por WhatsApp
                    </a>
                </div>
            ) : (
                <p className="no-disponible">Este lote ya no está a la venta.</p>
            )}
        </aside>
    );
}