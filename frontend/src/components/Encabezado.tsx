import { ESTADOS } from '../config/estados';
import { PROYECTO, enlaceWhatsapp } from '../config/proyecto';
import type { Sesion } from '../services/sesion';
import { IconoCandado, IconoSalir, IconoTelefono, IconoUbicacion } from './Iconos';

interface Props {
    disponibles: number;
    total: number;
    sesion: Sesion | null;
    onSalir: () => void;
}

export default function Encabezado({ disponibles, total, sesion, onSalir }: Props) {
    const contacto = enlaceWhatsapp(
        `Hola, quiero información sobre los lotes de ${PROYECTO.nombre} que vi en GeoLotes.`,
    );

    return (
        <header className="barra">
            <img className="barra-logo" src="/logo-geolotes.png" alt="GeoLotes · Tu próximo lote está aquí" />

            <span className="barra-divisor" aria-hidden="true" />

            <div className="barra-proyecto">
                <span className="barra-etiqueta">Proyecto</span>
                <span className="barra-nombre">
                    <IconoUbicacion width={16} height={16} />
                    {PROYECTO.nombre} · {PROYECTO.ciudad}
                </span>
            </div>

            <div className="barra-derecha">
                {total > 0 && (
                    <span className="barra-resumen">
                        <span className="punto" style={{ background: ESTADOS.DISPONIBLE.color }} />
                        <b>{disponibles}</b> de {total} lotes disponibles
                    </span>
                )}
                {sesion ? (
                    // El vendedor no necesita contactarse a sí mismo: ve su sesión y el botón para salir
                    <div className="barra-sesion">
                        <span className="barra-vendedor" title={`Sesión de ${sesion.usuario}`}>
                            <IconoCandado width={15} height={15} />
                            <span>{sesion.nombre}</span>
                        </span>
                        <button className="btn-secundario btn-pequeno btn-salir" onClick={onSalir} aria-label="Cerrar sesión">
                            <IconoSalir width={16} height={16} />
                            <span>Salir</span>
                        </button>
                    </div>
                ) : (
                    <a
                        className="btn-primario btn-contacto"
                        href={contacto}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Contactar al vendedor por WhatsApp"
                    >
                        <IconoTelefono width={16} height={16} />
                        <span>Contactar al vendedor</span>
                    </a>
                )}
            </div>
        </header>
    );
}
