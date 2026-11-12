import { useState } from 'react';
import type { Lote } from '../types/lote';
import { ESTADOS } from '../config/estados';
import { PROYECTO, enlaceWhatsapp } from '../config/proyecto';
import { formatoPesos } from '../utils/formato';
import FormularioVisita from './FormularioVisita';
import CambioEstado from './CambioEstado';
import {
    IconoArea, IconoCalendario, IconoCerrar, IconoCheck, IconoCompartir, IconoGrafica, IconoInfo, IconoMensaje,
} from './Iconos';

interface Props {
    lote: Lote;
    modoVendedor: boolean;
    onEstadoCambiado: (lote: Lote) => void;
    onCerrar: () => void;
}

export default function PanelLote({ lote, modoVendedor, onEstadoCambiado, onCerrar }: Props) {
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [copiado, setCopiado] = useState(false);

    const estado = ESTADOS[lote.estado];
    const seVende = lote.estado === 'DISPONIBLE' || lote.estado === 'RESERVADO';
    const valorM2 = lote.areaM2 > 0 ? Math.round(lote.precio / lote.areaM2) : null;

    const enlace = `${window.location.origin}${window.location.pathname}?lote=${lote.id}`;
    const whatsapp = enlaceWhatsapp(
        `Hola, me interesa el Lote ${lote.numero} de la Manzana ${lote.manzana} que vi en GeoLotes: ${enlace}`,
    );

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

    const botonCompartir = (
        <button className="btn-secundario" onClick={compartir} aria-live="polite">
            {copiado ? <IconoCheck width={16} height={16} /> : <IconoCompartir width={16} height={16} />}
            {copiado ? 'Enlace copiado' : 'Compartir'}
        </button>
    );

    return (
        <aside className="panel tarjeta-flotante" aria-label={`Lote ${lote.numero} de la manzana ${lote.manzana}`}>
            <div className="panel-cabecera">
                <span className="estado">
                    <span className="punto" style={{ background: estado.color }} />
                    {estado.etiqueta}
                </span>
                <button className="btn-icono" onClick={onCerrar} aria-label="Cerrar ficha">
                    <IconoCerrar />
                </button>
            </div>

            <div className="panel-titulo">
                <p className="panel-sub">Manzana {lote.manzana} · {PROYECTO.nombre}</p>
                <h2>Lote {lote.numero}</h2>
            </div>

            <div className="precio">
                <span>Precio</span>
                <strong>{formatoPesos.format(lote.precio)}</strong>
            </div>

            <dl className="datos">
                <div className="dato">
                    <dt><IconoArea width={15} height={15} />Área</dt>
                    <dd>{lote.areaM2} m²</dd>
                </div>
                <div className="dato">
                    <dt><IconoGrafica width={15} height={15} />Valor por m²</dt>
                    <dd>{valorM2 !== null ? formatoPesos.format(valorM2) : '—'}</dd>
                </div>
            </dl>

            {lote.descripcion && <p className="descripcion">{lote.descripcion}</p>}

            {seVende ? (
                <div className="acciones">
                    <button className="btn-primario" onClick={() => setMostrarFormulario(true)}>
                        <IconoCalendario width={16} height={16} />
                        Agendar visita
                    </button>
                    <div className="acciones-fila">
                        <a className="btn-secundario" href={whatsapp} target="_blank" rel="noreferrer">
                            <IconoMensaje width={16} height={16} />
                            WhatsApp
                        </a>
                        {botonCompartir}
                    </div>
                </div>
            ) : (
                <div className="acciones">
                    <p className="no-disponible">
                        <IconoInfo width={18} height={18} />
                        Este lote ya no está a la venta. Los lotes en verde siguen disponibles.
                    </p>
                    {botonCompartir}
                </div>
            )}

            {/* Solo con ?vendedor. key: al cambiar de lote, el selector se reinicia */}
            {modoVendedor && (
                <CambioEstado key={lote.id} lote={lote} onCambiado={onEstadoCambiado} />
            )}

            {mostrarFormulario && (
                <FormularioVisita lote={lote} onCerrar={() => setMostrarFormulario(false)} />
            )}
        </aside>
    );
}
