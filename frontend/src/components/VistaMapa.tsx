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
}

export default function VistaMapa({ lotes }: Props) {
    const rangos = useMemo(() => calcularRangos(lotes), [lotes]);
    const [filtros, setFiltros] = useState<Filtros>(() => filtrosIniciales(rangos));

    // Si la dirección trae ?lote=A-3, ese lote arranca seleccionado
    const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(() => {
        const id = new URLSearchParams(window.location.search).get('lote')?.toUpperCase();
        return lotes.features.find((f) => f.properties.id === id)?.properties ?? null;
    });

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
            <Leyenda />
            {loteSeleccionado && (
                <PanelLote lote={loteSeleccionado} onCerrar={() => setLoteSeleccionado(null)} />
            )}
        </>
    );
}