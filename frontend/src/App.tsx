import VistaMapa from './components/VistaMapa';
import Encabezado from './components/Encabezado';
import { AvisoCopia, Cargando, ErrorCarga } from './components/EstadosCarga';
import { useLotes } from './hooks/useLotes';

export default function App() {
    const { estado, lotes, copiaDel, reintentar, actualizarLote } = useLotes();

    const total = lotes?.features.length ?? 0;
    const disponibles = lotes?.features.filter((f) => f.properties.estado === 'DISPONIBLE').length ?? 0;

    return (
        <div className="app">
            <Encabezado disponibles={disponibles} total={total} />

            {/* Aviso entre la barra y el mapa: no tapa los filtros ni la ficha */}
            {lotes && copiaDel && (
                <AvisoCopia fecha={copiaDel} reintentando={estado === 'cargando'} onReintentar={reintentar} />
            )}

            <main className="contenido">
                {lotes ? (
                    // Con datos (nuevos o de la copia) el mapa siempre se muestra
                    <VistaMapa lotes={lotes} onLoteActualizado={actualizarLote} />
                ) : estado === 'error' ? (
                    <ErrorCarga onReintentar={reintentar} />
                ) : (
                    <Cargando />
                )}
            </main>
        </div>
    );
}
