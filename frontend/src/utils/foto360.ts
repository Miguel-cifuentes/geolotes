// Reglas de la foto 360° del lote, separadas del formulario para poder probarlas solas

export const TAMANO_MAXIMO_FOTO360 = 40 * 1024 * 1024; // igual que AlmacenVideos.TAMANO_MAXIMO_FOTO

// Revisa el archivo antes de subirlo. Devuelve el mensaje de error, o null si está bien.
export function errorFoto360(archivo: File): string | null {
    const nombre = archivo.name.toLowerCase();
    const esJpg = archivo.type === 'image/jpeg' || nombre.endsWith('.jpg') || nombre.endsWith('.jpeg');
    if (!esJpg) return 'La foto 360° debe ser JPG, como la guarda 360 Photo Cam.';
    if (archivo.size > TAMANO_MAXIMO_FOTO360) return 'La foto 360° supera 40 MB.';
    return null;
}

// Una foto 360° completa mide el doble de ancho que de alto (2:1).
// Si no, probablemente es una foto normal o una panorámica recortada y se verá deformada.
export function esProporcion360(ancho: number, alto: number): boolean {
    if (alto <= 0) return false;
    const proporcion = ancho / alto;
    return proporcion >= 1.9 && proporcion <= 2.1;
}

export function medirImagen(archivo: File): Promise<{ ancho: number; alto: number }> {
    return new Promise((resolver, rechazar) => {
        const url = URL.createObjectURL(archivo);
        const imagen = new Image();
        imagen.onload = () => {
            resolver({ ancho: imagen.naturalWidth, alto: imagen.naturalHeight });
            URL.revokeObjectURL(url);
        };
        imagen.onerror = () => {
            rechazar(new Error('No se pudo leer la imagen.'));
            URL.revokeObjectURL(url);
        };
        imagen.src = url;
    });
}
