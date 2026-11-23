import { ESTADOS } from '../config/estados';
import { PROYECTO, enlaceWhatsapp } from '../config/proyecto';
import type { Sesion } from '../services/sesion';
import { IconoCalendario, IconoCandado, IconoLlave, IconoSalir, IconoTelefono, IconoUbicacion } from './Iconos';

interface Props {
    disponibles: number;
    total: number;
    sesion: Sesion | null;
    modoVendedor: boolean;           // hay sesión y la persona está en la vista del vendedor
    onSoyVendedor: () => void;       // abre el inicio de sesión
    onVolverAComprador: () => void;  // cierra la sesión y vuelve al mapa del comprador
    visitasPendientes: number | null; // número en el botón "Visitas"; null mientras se consulta
    onVerVisitas: () => void;         // abre el panel de visitas agendadas
}

export default function Encabezado({
    disponibles, total, sesion, modoVendedor, onSoyVendedor, onVolverAComprador, visitasPendientes, onVerVisitas,
}: Props) {
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
                {modoVendedor && sesion ? (
                    // Vista del vendedor: su nombre y el botón para volver a comprador (cierra la sesión)
                    <div className="barra-sesion">
                        <span className="barra-vendedor" title={`Sesión de ${sesion.usuario}`}>
                            <IconoCandado width={15} height={15} />
                            <span>{sesion.nombre}</span>
                        </span>
                        <button
                            className="btn-secundario btn-barra btn-visitas"
                            onClick={onVerVisitas}
                            aria-label={`Visitas agendadas${visitasPendientes ? `: ${visitasPendientes} pendientes` : ''}`}
                        >
                            <IconoCalendario width={16} height={16} />
                            <span>Visitas</span>
                            {visitasPendientes ? <b className="insignia">{visitasPendientes}</b> : null}
                        </button>
                        <button
                            className="btn-secundario btn-barra"
                            onClick={onVolverAComprador}
                            aria-label="Volver a comprador y cerrar sesión"
                        >
                            <IconoSalir width={16} height={16} />
                            <span>Volver a comprador</span>
                        </button>
                    </div>
                ) : (
                    // Vista del comprador: el acceso del vendedor y el contacto por WhatsApp
                    <>
                        <button
                            className="btn-secundario btn-barra"
                            onClick={onSoyVendedor}
                            aria-label="Soy vendedor: iniciar sesión"
                        >
                            <IconoLlave width={16} height={16} />
                            <span>Soy vendedor</span>
                        </button>
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
                    </>
                )}
            </div>
        </header>
    );
}
