package co.geolotes.lotes.exception;

public class LoteNoEncontradoException extends RuntimeException {
    public LoteNoEncontradoException(String id) {
        super("No existe un lote con id " + id);
    }
}