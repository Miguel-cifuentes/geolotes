package co.geolotes.lotes.auth;

import org.springframework.http.HttpStatus;

// 401: usuario o clave incorrectos · 429: demasiados intentos
public class AutenticacionException extends RuntimeException {

    private final HttpStatus estado;

    public AutenticacionException(HttpStatus estado, String mensaje) {
        super(mensaje);
        this.estado = estado;
    }

    public HttpStatus getEstado() {
        return estado;
    }
}
