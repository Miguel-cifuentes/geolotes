import VistaMapa from './components/VistaMapa';
import { AvisoCopia, Cargando, ErrorCarga } from './components/EstadosCarga';
import { useLotes } from './hooks/useLotes';

export default function App() {
    const { estado, lotes, copiaDel, reintentar } = useLotes();

    return (
        <div className="app">
            <header className="barra">
                <span className="marca">Geo<b>Lotes</b></span>
                <span className="eslogan">Tu próximo lote está aquí</span>
            </header>

            {/* Aviso entre la barra y el mapa: no tapa los filtros ni la ficha */}
            {lotes && copiaDel && (
                <AvisoCopia fecha={copiaDel} reintentando={estado === 'cargando'} onReintentar={reintentar} />
            )}

            <main className="contenido">
                {lotes ? (
                    // Con datos (nuevos o de la copia) el mapa siempre se muestra
                    <VistaMapa lotes={lotes} />
                ) : estado === 'error' ? (
                    <ErrorCarga onReintentar={reintentar} />
                ) : (
                    <Cargando />
                )}
            </main>
        </div>
    );
}