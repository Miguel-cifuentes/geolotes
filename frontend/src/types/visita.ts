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