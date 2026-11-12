import { IconoAlerta, IconoRecargar } from './Iconos';

const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export function Cargando() {
    return (
        <div className="estado-carga" role="status">
            <img className="estado-carga-logo" src="/logo-geolotes.png" alt="GeoLotes" />
            <div className="spinner" aria-hidden="true" />
            <p>Cargando los lotes del proyecto…</p>
        </div>
    );
}

export function ErrorCarga({ onReintentar }: { onReintentar: () => void }) {
    return (
        <div className="estado-carga" role="alert">
            <span className="estado-carga-icono"><IconoAlerta width={28} height={28} /></span>
            <h2>No pudimos cargar los lotes</h2>
            <p>Revisa tu conexión a internet e intenta de nuevo.</p>
            <button className="btn-primario" onClick={onReintentar}>
                <IconoRecargar width={16} height={16} />
                Reintentar
            </button>
        </div>
    );
}

interface AvisoProps {
    fecha: Date;
    reintentando: boolean;
    onReintentar: () => void;
}

export function AvisoCopia({ fecha, reintentando, onReintentar }: AvisoProps) {
    return (
        <div className="aviso-copia" role="status">
            <IconoAlerta width={18} height={18} />
            <span>
                Sin conexión con el servidor. Mostrando la información del <b>{formatoFecha.format(fecha)}</b>;
                algunos estados pueden haber cambiado.
            </span>
            <button className="btn-secundario btn-pequeno" onClick={onReintentar} disabled={reintentando}>
                <IconoRecargar width={14} height={14} />
                {reintentando ? 'Reintentando…' : 'Reintentar'}
            </button>
        </div>
    );
}
