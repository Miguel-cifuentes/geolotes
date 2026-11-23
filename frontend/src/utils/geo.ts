import type { Feature, Polygon } from 'geojson';
import type { Punto } from '../types/lote';

// Centro aproximado de un lote: el promedio de sus esquinas.
// Sirve para que la cámara vuele al lote aunque no se haya hecho clic sobre él.
export function centroLote(feature: Feature<Polygon>): [number, number] {
    // El primer punto se repite al final para cerrar el polígono; lo quitamos
    const esquinas = feature.geometry.coordinates[0].slice(0, -1);
    const lon = esquinas.reduce((suma, [x]) => suma + x, 0) / esquinas.length;
    const lat = esquinas.reduce((suma, [, y]) => suma + y, 0) / esquinas.length;
    return [lon, lat];
}

// Esquinas de un lote, sin el punto repetido que cierra el polígono
export function esquinasLote(feature: Feature<Polygon>): Punto[] {
    return feature.geometry.coordinates[0].slice(0, -1).map(([lon, lat]) => [lon, lat] as Punto);
}

// Área aproximada en m² mientras el vendedor dibuja (fórmula del área de Gauss sobre metros locales).
// La cifra oficial la calcula PostGIS al guardar.
export function areaAproximada(puntos: Punto[]): number {
    if (puntos.length < 3) return 0;
    const latMedia = puntos.reduce((suma, [, lat]) => suma + lat, 0) / puntos.length;
    const mPorGradoLat = 110574;
    const mPorGradoLon = 111320 * Math.cos((latMedia * Math.PI) / 180);
    const xy = puntos.map(([lon, lat]) => [lon * mPorGradoLon, lat * mPorGradoLat]);
    let doble = 0;
    for (let i = 0; i < xy.length; i++) {
        const [x1, y1] = xy[i];
        const [x2, y2] = xy[(i + 1) % xy.length];
        doble += x1 * y2 - x2 * y1;
    }
    return Math.round(Math.abs(doble) / 2);
}
