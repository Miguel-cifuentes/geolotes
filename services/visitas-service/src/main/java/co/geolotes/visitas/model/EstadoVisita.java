package co.geolotes.visitas.model;

// Ciclo de vida de una solicitud: el vendedor la confirma y luego la marca como realizada
public enum EstadoVisita {
    PENDIENTE,
    CONFIRMADA,
    REALIZADA,
    CANCELADA
}