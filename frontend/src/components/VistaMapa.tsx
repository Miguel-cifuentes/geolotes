import { useEffect, useMemo, useState } from 'react';
import type { FeatureCollection, Polygon } from 'geojson';
import MapaLotes from './MapaLotes';
import PanelLote from './PanelLote';
import Leyenda from './Leyenda';
import PanelFiltros from './PanelFiltros';
import { calcularRangos, cumpleFiltros, filtrosIniciales } from '../utils/filtros';
import type { Lote } from '../types/lote';
import type { Filtros } from '../types/filtros';

interface Props {
    lotes: FeatureCollection<Polygon, Lote>;
    onLoteActualizado: (lote: Lote) => void;
}

export default function VistaMapa({ lotes, onLoteActualizado }: Props) {
    const rangos = useMemo(() => calcularRangos(lotes), [lotes]);
    const [filtros, setFiltros] = useState<Filtros>(() => filtrosIniciales(rangos));

    // Si la dirección trae ?lote=A-3, ese lote arranca seleccionado
    const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(() => {
        const id = new URLSearchParams(window.location.search).get('lote')?.toUpperCase();
        return lotes.features.find((f) => f.properties.id === id)?.properties ?? null;
    });

    // ?vendedor en la dirección muestra el panel para cambiar estados (el login llega en el corte 3)
    const [modoVendedor] = useState(() => new URLSearchParams(window.location.search).has('vendedor'));

    function estadoCambiado(actualizado: Lote) {
        onLoteActualizado(actualizado);    // recolorea el mapa
        setLoteSeleccionado(actualizado);  // refresca la ficha abierta
    }

    // Mantener la dirección al día sin recargar la página
    useEffect(() => {
        const url = new URL(window.location.href);
        if (loteSeleccionado) url.searchParams.set('lote', loteSeleccionado.id);
        else url.searchParams.delete('lote');
        window.history.replaceState(null, '', url);
    }, [loteSeleccionado]);

    const visibles = lotes.features.filter((f) => cumpleFiltros(f.properties, filtros)).length;

    return (
        <>
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
            <Leyenda lotes={lotes} />
            {loteSeleccionado && (
                <PanelLote
                    lote={loteSeleccionado}
                    modoVendedor={modoVendedor}
                    onEstadoCambiado={estadoCambiado}
                    onCerrar={() => setLoteSeleccionado(null)}
                />
            )}
        </>
    );
}
