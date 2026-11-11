package co.geolotes.lotes.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ManejadorErrores {

    // 400: falta el estado
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> validacion(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> errores.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return Map.of("mensaje", "Datos inválidos", "errores", errores);
    }

    // 400: JSON mal formado o un estado que no existe (ej. "REGALADO")
    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> jsonInvalido(HttpMessageNotReadableException ex) {
        return Map.of("mensaje",
                "El cuerpo no es válido. Estados permitidos: DISPONIBLE, RESERVADO, VENDIDO, NO_DISPONIBLE");
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