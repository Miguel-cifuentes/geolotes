const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

export function Cargando() {
    return (
        <div className="estado-carga" role="status">
            <div className="spinner" aria-hidden="true" />
            <p>Cargando lotes…</p>
        </div>
    );
}

export function ErrorCarga({ onReintentar }: { onReintentar: () => void }) {
    return (
        <div className="estado-carga" role="alert">
            <h2>No pudimos cargar los lotes</h2>
            <p>Revisa tu conexión a internet e intenta de nuevo.</p>
            <button className="btn-primario" onClick={onReintentar}>Reintentar</button>
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
      <span>
        Sin conexión con el servidor. Mostrando la información del <b>{formatoFecha.format(fecha)}</b>;
        algunos estados pueden haber cambiado.
      </span>
            <button onClick={onReintentar} disabled={reintentando}>
                {reintentando ? 'Reintentando…' : 'Reintentar'}
            </button>
        </div>
    );
}