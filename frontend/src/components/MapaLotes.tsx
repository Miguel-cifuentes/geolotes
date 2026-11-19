import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Feature, FeatureCollection, Polygon } from 'geojson';
import { CENTRO } from '../data/lotesEjemplo';
import { ESTADOS } from '../config/estados';
import { expresionFiltros } from '../utils/filtros';
import { centroLote } from '../utils/geo';
import type { Lote, Punto } from '../types/lote';
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

// Lote que el vendedor está dibujando ('nuevo') o ajustando ('forma')
export interface Dibujo {
    modo: 'nuevo' | 'forma';
    puntos: Punto[];
}

interface Props {
    lotes: FeatureCollection<Polygon, Lote>;
    filtros: Filtros;
    loteSeleccionadoId: string | null;
    onSeleccionar: (id: string) => void;
    dibujo?: Dibujo | null;
    onAgregarPunto?: (punto: Punto) => void;
    onMoverPunto?: (indice: number, punto: Punto) => void;
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

// Lo que se pinta mientras se dibuja: una línea con 2 puntos, un polígono desde 3
function datosDibujo(puntos: Punto[]): FeatureCollection {
    const features: Feature[] = [];
    if (puntos.length >= 3) {
        features.push({
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [[...puntos, puntos[0]]] },
        });
    } else if (puntos.length === 2) {
        features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: puntos } });
    }
    return { type: 'FeatureCollection', features };
}

function pintarDibujo(mapa: mapboxgl.Map, puntos: Punto[]) {
    const fuente = mapa.getSource('dibujo') as mapboxgl.GeoJSONSource | undefined;
    fuente?.setData(datosDibujo(puntos));
}

export default function MapaLotes({
    lotes, filtros, loteSeleccionadoId, onSeleccionar, dibujo = null, onAgregarPunto, onMoverPunto,
}: Props) {
    const contenedorRef = useRef<HTMLDivElement>(null);
    const mapaRef = useRef<mapboxgl.Map | null>(null);
    const marcadoresRef = useRef<mapboxgl.Marker[]>([]);

    // Versión más reciente de las props, para usarla dentro de los eventos del mapa
    const onSeleccionarRef = useRef(onSeleccionar);
    const onAgregarPuntoRef = useRef(onAgregarPunto);
    const onMoverPuntoRef = useRef(onMoverPunto);
    const dibujoRef = useRef(dibujo);
    const lotesRef = useRef(lotes);
    const filtrosRef = useRef(filtros);
    const seleccionadoRef = useRef(loteSeleccionadoId);
    useEffect(() => {
        onSeleccionarRef.current = onSeleccionar;
        onAgregarPuntoRef.current = onAgregarPunto;
        onMoverPuntoRef.current = onMoverPunto;
        dibujoRef.current = dibujo;
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

            // Segmentación: el lote que el vendedor dibuja, por encima de los demás
            mapa.addSource('dibujo', { type: 'geojson', data: datosDibujo([]) });
            mapa.addLayer({
                id: 'dibujo-relleno',
                type: 'fill',
                source: 'dibujo',
                paint: { 'fill-color': '#A7D26D', 'fill-opacity': 0.35 },
            });
            mapa.addLayer({
                id: 'dibujo-borde',
                type: 'line',
                source: 'dibujo',
                paint: { 'line-color': '#A7D26D', 'line-width': 3, 'line-dasharray': [2, 1] },
            });

            // Lo que haya cambiado mientras el mapa cargaba: filtros, lote del enlace y dibujo
            aplicarFiltros(mapa, filtrosRef.current);
            enfocarLote(mapa, lotesRef.current, seleccionadoRef.current);
            pintarDibujo(mapa, dibujoRef.current?.puntos ?? []);

            // Al dibujar un lote nuevo, cada clic en el mapa agrega una esquina
            mapa.on('click', (e) => {
                if (dibujoRef.current?.modo === 'nuevo') {
                    onAgregarPuntoRef.current?.([e.lngLat.lng, e.lngLat.lat]);
                }
            });

            // Fuera del dibujo, el clic en un lote lo selecciona; el vuelo lo hace enfocarLote
            mapa.on('click', 'lotes-relleno', (e) => {
                if (dibujoRef.current) return;
                const id = e.features?.[0]?.properties?.id;
                if (typeof id === 'string') onSeleccionarRef.current(id);
            });
            mapa.on('mouseenter', 'lotes-relleno', () => {
                if (!dibujoRef.current) mapa.getCanvas().style.cursor = 'pointer';
            });
            mapa.on('mouseleave', 'lotes-relleno', () => {
                if (!dibujoRef.current) mapa.getCanvas().style.cursor = '';
            });
        });

        return () => {
            marcadoresRef.current.forEach((m) => m.remove());
            marcadoresRef.current = [];
            mapa.remove();
            mapaRef.current = null;
        };
    }, []);

    // 2. Si cambian los lotes (al llegar de la API o tras una edición), actualizar la fuente
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

    // 5. Segmentación: pintar el lote en dibujo y poner un punto arrastrable en cada esquina
    useEffect(() => {
        const mapa = mapaRef.current;
        if (!mapa) return;

        const puntos = dibujo?.puntos ?? [];
        pintarDibujo(mapa, puntos);
        mapa.getCanvas().style.cursor = dibujo?.modo === 'nuevo' ? 'crosshair' : '';

        marcadoresRef.current.forEach((m) => m.remove());
        marcadoresRef.current = puntos.map((punto, indice) => {
            const elemento = document.createElement('div');
            elemento.className = indice === 0 ? 'vertice vertice-inicio' : 'vertice';
            elemento.title = 'Arrastra para mover esta esquina';

            const marcador = new mapboxgl.Marker({ element: elemento, draggable: true })
                .setLngLat(punto)
                .addTo(mapa);

            // Mientras arrastra, el polígono sigue al punto; al soltar, se guarda en el estado
            marcador.on('drag', () => {
                const { lng, lat } = marcador.getLngLat();
                pintarDibujo(mapa, puntos.map((p, i) => (i === indice ? [lng, lat] : p)));
            });
            marcador.on('dragend', () => {
                const { lng, lat } = marcador.getLngLat();
                onMoverPuntoRef.current?.(indice, [lng, lat]);
            });
            return marcador;
        });
    }, [dibujo]);

    return <div ref={contenedorRef} className="mapa" />;
}
