import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { CENTRO, generarLotesEjemplo } from '../data/lotesEjemplo';
import { ESTADOS } from '../config/estados';
import type { Lote } from '../types/lote';

const token = import.meta.env.VITE_MAPBOX_TOKEN;
if (!token) {
    console.error('Falta VITE_MAPBOX_TOKEN en el archivo .env de la raíz del proyecto');
}
mapboxgl.accessToken = token;

interface Props {
    loteSeleccionadoId: string | null;
    onSeleccionar: (lote: Lote) => void;
}

export default function MapaLotes({ loteSeleccionadoId, onSeleccionar }: Props) {
    const contenedorRef = useRef<HTMLDivElement>(null);
    const mapaRef = useRef<mapboxgl.Map | null>(null);

    // Guardamos la función en una ref para que el clic del mapa siempre use la versión actual
    const onSeleccionarRef = useRef(onSeleccionar);
    useEffect(() => {
        onSeleccionarRef.current = onSeleccionar;
    }, [onSeleccionar]);

    // 1. Crear el mapa UNA sola vez
    useEffect(() => {
        if (!contenedorRef.current) return;

        const mapa = new mapboxgl.Map({
            container: contenedorRef.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12', // vista satelital con calles
            center: CENTRO,
            zoom: 17.5,
            pitch: 55,    // inclinación de la cámara (0 = desde arriba, 85 = casi horizontal)
            bearing: -15, // rotación
        });
        mapaRef.current = mapa;

        mapa.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), 'top-right');

        mapa.on('load', () => {
            // Relieve 3D del terreno
            mapa.addSource('terreno', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 14,
            });
            mapa.setTerrain({ source: 'terreno', exaggeration: 1.3 });

            // Fuente de datos: nuestros lotes en GeoJSON
            mapa.addSource('lotes', { type: 'geojson', data: generarLotesEjemplo() });

            // Capa 1: relleno con el color según el estado
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
                        ESTADOS.NO_DISPONIBLE.color, // valor por defecto
                    ],
                    'fill-opacity': 0.6,
                },
            });

            // Capa 2: borde blanco de cada lote
            mapa.addLayer({
                id: 'lotes-borde',
                type: 'line',
                source: 'lotes',
                paint: { 'line-color': '#FFFFFF', 'line-width': 1.5 },
            });

            // Capa 3: resaltado del lote seleccionado (empieza sin mostrar ninguno)
            mapa.addLayer({
                id: 'lote-seleccionado',
                type: 'line',
                source: 'lotes',
                filter: ['==', ['get', 'id'], ''],
                paint: { 'line-color': '#38BDF8', 'line-width': 4 },
            });

            // Capa 4: etiqueta "A-1", "B-3"... sobre cada lote
            mapa.addLayer({
                id: 'lotes-etiqueta',
                type: 'symbol',
                source: 'lotes',
                layout: {
                    'text-field': ['concat', ['get', 'manzana'], '-', ['to-string', ['get', 'numero']]],
                    'text-size': 14,
                },
                paint: {
                    'text-color': '#FFFFFF',
                    'text-halo-color': '#0F4A2F',
                    'text-halo-width': 1.5,
                },
            });

            // Clic en un lote: seleccionarlo y volar la cámara hacia él
            mapa.on('click', 'lotes-relleno', (e) => {
                const feature = e.features?.[0];
                if (!feature) return;
                onSeleccionarRef.current(feature.properties as unknown as Lote);
                mapa.flyTo({ center: e.lngLat, zoom: 18.5, pitch: 60, duration: 1200 });
            });

            // Cursor de "manito" al pasar sobre un lote
            mapa.on('mouseenter', 'lotes-relleno', () => {
                mapa.getCanvas().style.cursor = 'pointer';
            });
            mapa.on('mouseleave', 'lotes-relleno', () => {
                mapa.getCanvas().style.cursor = '';
            });
        });

        // Al desmontar el componente, liberar el mapa
        return () => {
            mapa.remove();
            mapaRef.current = null;
        };
    }, []);

    // 2. Cada vez que cambia el lote seleccionado, actualizar el resaltado
    useEffect(() => {
        const mapa = mapaRef.current;
        if (!mapa || !mapa.getLayer('lote-seleccionado')) return;
        mapa.setFilter('lote-seleccionado', ['==', ['get', 'id'], loteSeleccionadoId ?? '']);
    }, [loteSeleccionadoId]);

    return <div ref={contenedorRef} className="mapa" />;
}