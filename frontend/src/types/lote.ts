// Estados definidos en el manual de marca (sección 08)
export type EstadoLote = 'DISPONIBLE' | 'RESERVADO' | 'VENDIDO' | 'NO_DISPONIBLE';

// Este es el CONTRATO con el backend: lotes-service debe devolver exactamente estos campos.
// Muéstrenselo a David para que su entidad Java use los mismos nombres.
export interface Lote {
    id: string;
    manzana: string;
    numero: number;
    areaM2: number;
    precio: number;       // en pesos colombianos
    estado: EstadoLote;
    descripcion: string;
    video?: string | null; // nombre del archivo de video; vacío si el lote no tiene
    foto360?: string | null; // nombre de la foto 360° (JPG equirectangular); vacío si no tiene
}

// Un punto del mapa: [longitud, latitud]
export type Punto = [number, number];