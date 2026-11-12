// Datos del proyecto y del vendedor que se muestran en la interfaz.
// Cuando haya más zonas, esto vendrá del backend.
export const PROYECTO = {
    nombre: 'La Porfía',
    ciudad: 'Villavicencio, Meta',
};

// ⚠️ Número del vendedor (57 + celular, sin espacios ni +)
export const WHATSAPP_VENDEDOR = '573112642383';

export function enlaceWhatsapp(mensaje: string): string {
    return `https://wa.me/${WHATSAPP_VENDEDOR}?text=${encodeURIComponent(mensaje)}`;
}
