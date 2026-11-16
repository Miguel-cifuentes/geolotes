package co.geolotes.lotes.exception;

import org.springframework.http.HttpStatus;

// Error de una regla del negocio, con el código HTTP que debe recibir el frontend
public class LoteException extends RuntimeException {

    private final HttpStatus estado;

    public LoteException(HttpStatus estado, String mensaje) {
        super(mensaje);
        this.estado = estado;
    }

    public HttpStatus getEstado() {
        return estado;
    }
}
