import type { EstadoLote } from '../types/lote';
import { TAMANO_MAXIMO_VIDEO } from '../config/video.ts';

// Validación del formulario del lote (panel del vendedor).
// Vive fuera del componente para poder probarla sin el navegador (tests/validacionLote.test.ts).

export interface Campos {
    manzana: string;
    numero: string;
    precio: string;
    estado: EstadoLote;
    descripcion: string;
}

export type Errores = Partial<Record<keyof Campos | 'video', string>>;

const MAXIMO_DESCRIPCION = 1000;
const NUMERO_MAXIMO = 9999;
const EXTENSIONES_VIDEO = ['.mp4', '.webm'];

// Cada regla devuelve su mensaje de error, o undefined si el dato es válido

function errorManzana(manzana: string): string | undefined {
    if (!/^[A-Za-z0-9]{1,5}$/.test(manzana.trim())) return 'Letras o números, máximo 5 (ej. A, B2).';
}

function errorNumero(texto: string): string | undefined {
    const numero = Number(texto);
    const enRango = Number.isInteger(numero) && numero >= 1 && numero <= NUMERO_MAXIMO;
    if (!enRango) return 'Número entero entre 1 y 9999.';
}

function errorPrecio(texto: string): string | undefined {
    const precio = Number(texto);
    const valido = texto.trim() !== '' && Number.isFinite(precio) && precio >= 0;
    if (!valido) return 'Escribe el precio en pesos.';
}

function errorDescripcion(descripcion: string): string | undefined {
    if (descripcion.length > MAXIMO_DESCRIPCION) return 'Máximo 1000 caracteres.';
}

// El formato se revisa antes que el tamaño
function errorVideo(archivo: File | null): string | undefined {
    if (!archivo) return undefined;
    const nombre = archivo.name.toLowerCase();
    if (!EXTENSIONES_VIDEO.some((extension) => nombre.endsWith(extension))) return 'Sube el video en MP4 o WebM.';
    if (archivo.size > TAMANO_MAXIMO_VIDEO) return 'El video supera 300 MB. Recórtalo o comprímelo.';
}

// La manzana y el número solo se validan al crear: al editar no se pueden cambiar
export function validar(c: Campos, creando: boolean, archivo: File | null): Errores {
    const errores: Errores = {
        manzana: creando ? errorManzana(c.manzana) : undefined,
        numero: creando ? errorNumero(c.numero) : undefined,
        precio: errorPrecio(c.precio),
        descripcion: errorDescripcion(c.descripcion),
        video: errorVideo(archivo),
    };
    return quitarVacios(errores);
}

// Deja solo los campos que tienen error (el formulario cuenta las llaves para saber si hay errores)
function quitarVacios(errores: Errores): Errores {
    return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje !== undefined)) as Errores;
}
