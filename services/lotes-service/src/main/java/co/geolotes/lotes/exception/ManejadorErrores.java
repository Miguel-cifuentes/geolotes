package co.geolotes.lotes.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ManejadorErrores {

    // 400: algún dato del formulario no es válido
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> validacion(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errores.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return Map.of("mensaje", "Datos inválidos", "errores", errores);
    }

    // 400: JSON mal formado, un estado que no existe (ej. "REGALADO") o coordenadas que no son números
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> jsonInvalido(HttpMessageNotReadableException ex) {
        return Map.of("mensaje",
                "Los datos enviados no son válidos. Estados permitidos: DISPONIBLE, RESERVADO, VENDIDO, NO_DISPONIBLE");
    }

    // Reglas del negocio: forma inválida (400), lote repetido o lotes que se cruzan (409), video (404/415)
    @ExceptionHandler(LoteException.class)
    public ResponseEntity<Map<String, Object>> reglaDeNegocio(LoteException ex) {
        return ResponseEntity.status(ex.getEstado()).body(Map.of("mensaje", ex.getMessage()));
    }

    // 409: la base rechazó el dato (por ejemplo, manzana y número repetidos)
    @ExceptionHandler(DataIntegrityViolationException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> integridad(DataIntegrityViolationException ex) {
        return Map.of("mensaje", "Ya existe un lote con esa manzana y número.");
    }

    // 413: el video supera el máximo configurado en application.yaml
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.CONTENT_TOO_LARGE)
    public Map<String, Object> videoMuyGrande(MaxUploadSizeExceededException ex) {
        return Map.of("mensaje", "El video supera el máximo de 300 MB. Recórtalo o comprímelo e intenta de nuevo.");
    }

    // 404: el lote no existe
    @ExceptionHandler(LoteNoEncontradoException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> noEncontrado(LoteNoEncontradoException ex) {
        return Map.of("mensaje", ex.getMessage());
    }

    // 409: otra persona modificó el mismo lote al mismo tiempo
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public Map<String, Object> conflicto(ObjectOptimisticLockingFailureException ex) {
        return Map.of("mensaje", "El lote fue modificado por otra persona. Recarga e intenta de nuevo.");
    }
}