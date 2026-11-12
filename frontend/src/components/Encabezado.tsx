import { ESTADOS } from '../config/estados';
import { PROYECTO, enlaceWhatsapp } from '../config/proyecto';
import { IconoTelefono, IconoUbicacion } from './Iconos';

interface Props {
    disponibles: number;
    total: number;
}

export default function Encabezado({ disponibles, total }: Props) {
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
            </div>
        </header>
    );
}
