import { useCallback, useEffect, useState } from 'react';
import type { FeatureCollection, Polygon } from 'geojson';
import type { Lote } from '../types/lote';
import { obtenerLotes } from '../services/lotesApi';

type Coleccion = FeatureCollection<Polygon, Lote>;
export type EstadoCarga = 'cargando' | 'listo' | 'error';

const CLAVE_CACHE = 'geolotes:lotes';

interface Cache {
    guardadoEn: string; // fecha ISO
    datos: Coleccion;
}

// localStorage puede fallar (modo incógnito, sin espacio): siempre dentro de try/catch
function leerCache(): Cache | null {
    try {
        const texto = localStorage.getItem(CLAVE_CACHE);
        return texto ? (JSON.parse(texto) as Cache) : null;
    } catch {
        return null;
    }
}

function guardarCache(datos: Coleccion) {
    try {
        const cache: Cache = { guardadoEn: new Date().toISOString(), datos };
        localStorage.setItem(CLAVE_CACHE, JSON.stringify(cache));
    } catch {
        // Sin espacio o bloqueado: seguimos sin copia, no es grave
    }
}

/*
 * Decisión CAP (AP) en el cliente: si el servidor no responde, mostramos la última
 * copia guardada en lugar de una pantalla vacía. Puede estar desactualizada,
 * por eso la interfaz lo avisa con la fecha de la copia.
 */
export function useLotes() {
    const [estado, setEstado] = useState<EstadoCarga>('cargando');
    const [lotes, setLotes] = useState<Coleccion | null>(null);
    const [copiaDel, setCopiaDel] = useState<Date | null>(null); // fecha si se muestra la copia
    const [intento, setIntento] = useState(0);

    useEffect(() => {
        let cancelado = false; // evita actualizar si el componente ya se desmontó

        obtenerLotes()
            .then((datos) => {
                if (cancelado) return;
                guardarCache(datos);
                setLotes(datos);
                setCopiaDel(null);
                setEstado('listo');
            })
            .catch(() => {
                if (cancelado) return;
                const cache = leerCache();
                if (cache) {
                    setLotes(cache.datos);
                    setCopiaDel(new Date(cache.guardadoEn));
                    setEstado('listo');
                } else {
                    setEstado('error');
                }
            });

        return () => {
            cancelado = true;
        };
    }, [intento]);

    const reintentar = useCallback(() => {
        setEstado('cargando');
        setIntento((n) => n + 1);
    }, []);

    return { estado, lotes, copiaDel, reintentar };
}