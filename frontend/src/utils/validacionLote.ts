import type { EstadoLote } from '../types/lote';
import { TAMANO_MAXIMO_VIDEO } from '../config/video.ts';

// Validación del formulario del lote (panel del vendedor).
// Se movió tal cual desde FormularioLote.tsx para poder probarla sin el navegador.

export interface Campos {
    manzana: string;
    numero: string;
    precio: string;
    estado: EstadoLote;
    descripcion: string;
}

export type Errores = Partial<Record<keyof Campos | 'video', string>>;

export function validar(c: Campos, creando: boolean, archivo: File | null): Errores {
    const e: Errores = {};
    if (creando) {
        if (!/^[A-Za-z0-9]{1,5}$/.test(c.manzana.trim())) e.manzana = 'Letras o números, máximo 5 (ej. A, B2).';
        const numero = Number(c.numero);
        if (!Number.isInteger(numero) || numero < 1 || numero > 9999) e.numero = 'Número entero entre 1 y 9999.';
    }
    const precio = Number(c.precio);
    if (c.precio.trim() === '' || !Number.isFinite(precio) || precio < 0) e.precio = 'Escribe el precio en pesos.';
    if (c.descripcion.length > 1000) e.descripcion = 'Máximo 1000 caracteres.';
    if (archivo) {
        const nombre = archivo.name.toLowerCase();
        if (!nombre.endsWith('.mp4') && !nombre.endsWith('.webm')) e.video = 'Sube el video en MP4 o WebM.';
        else if (archivo.size > TAMANO_MAXIMO_VIDEO) e.video = 'El video supera 300 MB. Recórtalo o comprímelo.';
    }
    return e;
}
