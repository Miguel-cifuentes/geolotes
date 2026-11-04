import { useEffect, useMemo, useState } from 'react';
import MapaLotes from './components/MapaLotes';
import PanelLote from './components/PanelLote';
import Leyenda from './components/Leyenda';
import PanelFiltros from './components/PanelFiltros';
import { generarLotesEjemplo } from './data/lotesEjemplo';
import { calcularRangos, cumpleFiltros, filtrosIniciales } from './utils/filtros';
import type { Lote } from './types/lote';
import type { Filtros } from './types/filtros';

export default function App() {
    // Una sola fuente de datos para toda la app.
    // Cuando lotes-service esté listo (#22), esta línea se reemplaza por la carga desde la API.
    const lotes = useMemo(() => generarLotesEjemplo(), []);
    const rangos = useMemo(() => calcularRangos(lotes), [lotes]);

    const [filtros, setFiltros] = useState<Filtros>(() => filtrosIniciales(rangos));
    // Si la dirección trae ?lote=A-3, ese lote arranca seleccionado
    const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(() => {
        const id = new URLSearchParams(window.location.search).get('lote')?.toUpperCase();
        return lotes.features.find((f) => f.properties.id === id)?.properties ?? null;
    });

    // Mantener la dirección al día: ?lote=A-3 al seleccionar, sin parámetro al cerrar.
    // replaceState cambia la URL sin recargar la página ni llenar el historial.
    useEffect(() => {
        const url = new URL(window.location.href);
        if (loteSeleccionado) url.searchParams.set('lote', loteSeleccionado.id);
        else url.searchParams.delete('lote');
        window.history.replaceState(null, '', url);
    }, [loteSeleccionado]);

    const visibles = lotes.features.filter((f) => cumpleFiltros(f.properties, filtros)).length;

    return (
        <div className="app">
            <header className="barra">
                <span className="marca">Geo<b>Lotes</b></span>
                <span className="eslogan">Tu próximo lote está aquí</span>
            </header>

            <main className="contenido">
                <MapaLotes
                    lotes={lotes}
                    filtros={filtros}
                    loteSeleccionadoId={loteSeleccionado?.id ?? null}
                    onSeleccionar={setLoteSeleccionado}
                />
                <PanelFiltros
                    filtros={filtros}
                    rangos={rangos}
                    visibles={visibles}
                    total={lotes.features.length}
                    onCambiar={setFiltros}
                    onLimpiar={() => setFiltros(filtrosIniciales(rangos))}
                />
                <Leyenda />
                {loteSeleccionado && (
                    <PanelLote lote={loteSeleccionado} onCerrar={() => setLoteSeleccionado(null)} />
                )}
            </main>
        </div>
    );
}
