import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { FeatureCollection, Polygon } from 'geojson';
import { CENTRO } from '../data/lotesEjemplo';
import { ESTADOS } from '../config/estados';
import { expresionFiltros } from '../utils/filtros';
import { centroLote } from '../utils/geo';
import type { Lote } from '../types/lote';
import type { Filtros } from '../types/filtros';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

/*
 * Fondo satelital.
 * - 'esri' (por defecto): imagen de Esri World Imagery sobre el mapa de calles de Mapbox.
 *   No depende del límite de teselas satelitales de la cuenta de Mapbox.
 * - 'mapbox': el satelital propio de Mapbox (VITE_SATELITE=mapbox en el .env).
 */
const SATELITE_MAPBOX = import.meta.env.VITE_SATELITE === 'mapbox';
const ESTILO_MAPA = SATELITE_MAPBOX
    ? 'mapbox://styles/mapbox/satellite-streets-v12'
    : 'mapbox://styles/mapbox/streets-v12';

// Recuadro de ~2 km alrededor del proyecto: fuera de él no se piden teselas
const MARGEN = 0.01; // grados (≈ 1,1 km)
const LIMITES: [[number, number], [number, number]] = [
    [CENTRO[0] - MARGEN, CENTRO[1] - MARGEN],
    [CENTRO[0] + MARGEN, CENTRO[1] + MARGEN],
];

interface Props {
    lotes: FeatureCollection<Polygon, Lote>;
    filtros: Filtros;
    loteSeleccionadoId: string | null;
    onSeleccionar: (lote: Lote) => void;
}

// Pone la imagen satelital de Esri debajo de los nombres de calles y lugares
function agregarSateliteEsri(mapa: mapboxgl.Map) {
    mapa.addSource('satelite-esri', {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 19,
        attribution: 'Imágenes: Esri, Maxar, Earthstar Geographics y la comunidad de usuarios GIS',
    });
    // La primera capa de texto del estilo: la imagen va justo antes, para que las etiquetas queden encima
    const primeraEtiqueta = mapa.getStyle()?.layers?.find((capa) => capa.type === 'symbol')?.id;
    mapa.addLayer({ id: 'satelite-esri', type: 'raster', source: 'satelite-esri' }, primeraEtiqueta);
}

// Atenúa los lotes que no cumplen los filtros
function aplicarFiltros(mapa: mapboxgl.Map, filtros: Filtros) {
    if (!mapa.getLayer('lotes-relleno')) return;
    const cumple = expresionFiltros(filtros);
    mapa.setPaintProperty('lotes-relleno', 'fill-opacity', ['case', cumple, 0.6, 0.1]);
    mapa.setPaintProperty('lotes-borde', 'line-opacity', ['case', cumple, 1, 0.25]);
    mapa.setPaintProperty('lotes-etiqueta', 'text-opacity', ['case', cumple, 1, 0.3]);
}

// Resalta el lote seleccionado y lleva la cámara hasta él
function enfocarLote(
    mapa: mapboxgl.Map,
    lotes: FeatureCollection<Polygon, Lote>,
    id: string | null,
) {
    if (!mapa.getLayer('lote-seleccionado')) return;
    mapa.setFilter('lote-seleccionado', ['==', ['get', 'id'], id ?? '']);
    if (!id) return;
    const feature = lotes.features.find((f) => f.properties.id === id);
    if (feature) {
        mapa.flyTo({ center: centroLote(feature), zoom: 18, pitch: 60, duration: 1200 });
    }
}

export default function MapaLotes({ lotes, filtros, loteSeleccionadoId, onSeleccionar }: Props) {
    const contenedorRef = useRef<HTMLDivElement>(null);
    const mapaRef = useRef<mapboxgl.Map | null>(null);

    // Versión más reciente de las props, para usarla dentro de los eventos del mapa
    const onSeleccionarRef = useRef(onSeleccionar);
    const lotesRef = useRef(lotes);
    const filtrosRef = useRef(filtros);
    const seleccionadoRef = useRef(loteSeleccionadoId);
    useEffect(() => {
        onSeleccionarRef.current = onSeleccionar;
        lotesRef.current = lotes;
        filtrosRef.current = filtros;
        seleccionadoRef.current = loteSeleccionadoId;
    });

    // 1. Crear el mapa UNA sola vez
    useEffect(() => {
        if (!contenedorRef.current) return;

        const mapa = new mapboxgl.Map({
            container: contenedorRef.current,
            style: ESTILO_MAPA,
            center: CENTRO,
            zoom: 18,
            pitch: 60,
            bearing: -15,
            minZoom: 15,
            maxZoom: 19.5,
            maxPitch: 60,
            maxBounds: LIMITES,
        });
        mapaRef.current = mapa;
        mapa.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

        mapa.on('load', () => {
            if (!SATELITE_MAPBOX) agregarSateliteEsri(mapa);

            mapa.addSource('terreno', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 14,
            });
            mapa.setTerrain({ source: 'terreno', exaggeration: 1.3 });

            mapa.addSource('lotes', { type: 'geojson', data: lotesRef.current });

            mapa.addLayer({
                id: 'lotes-relleno',
                type: 'fill',
                source: 'lotes',
                paint: {
                    'fill-color': [
                        'match', ['get', 'estado'],
                        'DISPONIBLE', ESTADOS.DISPONIBLE.color,
                        'RESERVADO', ESTADOS.RESERVADO.color,
                        'VENDIDO', ESTADOS.VENDIDO.color,
                        ESTADOS.NO_DISPONIBLE.color,
                    ],
                    'fill-opacity': 0.6,
                },
            });

            mapa.addLayer({
                id: 'lotes-borde',
                type: 'line',
                source: 'lotes',
                paint: { 'line-color': '#FFFFFF', 'line-width': 1.5 },
            });

            mapa.addLayer({
                id: 'lote-seleccionado',
                type: 'line',
                source: 'lotes',
                filter: ['==', ['get', 'id'], ''],
                paint: { 'line-color': '#38BDF8', 'line-width': 4 },
            });

            mapa.addLayer({
                id: 'lotes-etiqueta',
                type: 'symbol',
                source: 'lotes',
                layout: {
                    'text-field': ['concat', ['get', 'manzana'], '-', ['to-string', ['get', 'numero']]],
                    'text-size': 14,
                    'text-allow-overlap': true,
                },
                paint: {
                    'text-color': '#FFFFFF',
                    'text-halo-color': '#0F4A2F',
                    'text-halo-width': 1.5,
                },
            });

            // Lo que haya cambiado mientras el mapa cargaba: filtros y lote del enlace
            aplicarFiltros(mapa, filtrosRef.current);
            enfocarLote(mapa, lotesRef.current, seleccionadoRef.current);

            // El clic solo avisa qué lote se eligió; el vuelo lo hace enfocarLote
            mapa.on('click', 'lotes-relleno', (e) => {
                const feature = e.features?.[0];
                if (feature) onSeleccionarRef.current(feature.properties as unknown as Lote);
            });
            mapa.on('mouseenter', 'lotes-relleno', () => { mapa.getCanvas().style.cursor = 'pointer'; });
            mapa.on('mouseleave', 'lotes-relleno', () => { mapa.getCanvas().style.cursor = ''; });
        });

        return () => {
            mapa.remove();
            mapaRef.current = null;
        };
    }, []);

    // 2. Si cambian los lotes (al llegar de la API), actualizar la fuente
    useEffect(() => {
        const fuente = mapaRef.current?.getSource('lotes') as mapboxgl.GeoJSONSource | undefined;
        fuente?.setData(lotes);
    }, [lotes]);

    // 3. Si cambian los filtros, atenuar los lotes que no cumplen
    useEffect(() => {
        if (mapaRef.current) aplicarFiltros(mapaRef.current, filtros);
    }, [filtros]);

    // 4. Si cambia el lote seleccionado (clic o enlace), resaltarlo y volar hacia él
    useEffect(() => {
        if (mapaRef.current) enfocarLote(mapaRef.current, lotesRef.current, loteSeleccionadoId);
    }, [loteSeleccionadoId]);

    return <div ref={contenedorRef} className="mapa" />;
}