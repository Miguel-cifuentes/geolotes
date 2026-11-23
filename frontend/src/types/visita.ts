// CONTRATO con visitas-service: David debe recibir exactamente estos campos
export type FranjaHoraria = 'MANANA' | 'TARDE';

export interface SolicitudVisita {
    loteId: string;
    nombre: string;
    telefono: string;
    correo: string;          // opcional, puede ir vacío
    fechaPreferida: string;  // formato YYYY-MM-DD
    franja: FranjaHoraria;
    mensaje: string;
    aceptaTratamientoDatos: boolean;
}
// ---------- Lo que ve el vendedor ----------
export type EstadoVisita = 'PENDIENTE' | 'CONFIRMADA' | 'REALIZADA' | 'CANCELADA';

// Una solicitud tal como la devuelve visitas-service (GET /visitas)
export interface Visita {
    id: string;
    loteId: string;
    nombre: string;
    telefono: string;
    correo: string | null;
    fechaPreferida: string; // YYYY-MM-DD
    franja: FranjaHoraria;
    mensaje: string | null;
    estado: EstadoVisita;
    fechaCreacion: string;  // instante ISO
}
