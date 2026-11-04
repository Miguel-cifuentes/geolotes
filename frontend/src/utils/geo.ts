import type { Feature, Polygon } from 'geojson';

// Centro aproximado de un lote: el promedio de sus esquinas.
// Sirve para que la cámara vuele al lote aunque no se haya hecho clic sobre él.
export function centroLote(feature: Feature<Polygon>): [number, number] {
    // El primer punto se repite al final para cerrar el polígono; lo quitamos
    const esquinas = feature.geometry.coordinates[0].slice(0, -1);
    const lon = esquinas.reduce((suma, [x]) => suma + x, 0) / esquinas.length;
    const lat = esquinas.reduce((suma, [, y]) => suma + y, 0) / esquinas.length;
    return [lon, lat];
}