package co.geolotes.visitas.exception;

import java.util.UUID;

public class VisitaNoEncontradaException extends RuntimeException {
    public VisitaNoEncontradaException(UUID id) {
        super("No existe una solicitud de visita con id " + id);
    }
}
