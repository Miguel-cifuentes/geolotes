import { ESTADOS } from '../config/estados';
import { PROYECTO, enlaceWhatsapp } from '../config/proyecto';
import type { Sesion } from '../services/sesion';
import { IconoCandado, IconoLlave, IconoSalir, IconoTelefono, IconoUbicacion, IconoUsuario } from './Iconos';

interface Props {
    disponibles: number;
    total: number;
    sesion: Sesion | null;
    modoVendedor: boolean;           // hay sesión y la persona está en la vista del vendedor
    onVistaVendedor: () => void;     // "Soy vendedor" / "Modo vendedor"
    onVistaComprador: () => void;    // vuelve a ver el mapa como comprador, sin cerrar la sesión
    onSalir: () => void;             // cierra la sesión
}

export default function Encabezado({
    disponibles, total, sesion, modoVendedor, onVistaVendedor, onVistaComprador, onSalir,
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
                    // Vista del vendedor: su nombre, volver a comprador y cerrar sesión
                    <div className="barra-sesion">
                        <span className="barra-vendedor" title={`Sesión de ${sesion.usuario}`}>
                            <IconoCandado width={15} height={15} />
                            <span>{sesion.nombre}</span>
                        </span>
                        <button className="btn-secundario btn-barra" onClick={onVistaComprador} aria-label="Ver como comprador">
                            <IconoUsuario width={16} height={16} />
                            <span>Ver como comprador</span>
                        </button>
                        <button className="btn-icono btn-salir" onClick={onSalir} aria-label="Cerrar sesión" title="Cerrar sesión">
                            <IconoSalir width={18} height={18} />
                        </button>
                    </div>
                ) : (
                    // Vista del comprador: un acceso discreto para el vendedor y el contacto por WhatsApp
                    <>
                        <button
                            className="btn-secundario btn-barra"
                            onClick={onVistaVendedor}
                            aria-label={sesion ? 'Volver al modo vendedor' : 'Soy vendedor: iniciar sesión'}
                        >
                            <IconoLlave width={16} height={16} />
                            <span>{sesion ? 'Modo vendedor' : 'Soy vendedor'}</span>
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
