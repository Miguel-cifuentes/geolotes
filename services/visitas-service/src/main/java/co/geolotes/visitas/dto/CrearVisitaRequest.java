package co.geolotes.visitas.dto;

import co.geolotes.visitas.model.Franja;
import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record CrearVisitaRequest(

        @NotBlank(message = "El lote es obligatorio.")
        @Size(max = 20)
        String loteId,

        @NotBlank(message = "Escribe tu nombre completo.")
        @Size(min = 3, max = 120, message = "Escribe tu nombre completo.")
        String nombre,

        @NotBlank(message = "El celular es obligatorio.")
        @Pattern(regexp = "^3\\d{9}$", message = "Celular colombiano de 10 dígitos, empezando por 3.")
        String telefono,

        @Email(message = "Correo no válido.")
        @Size(max = 150)
        String correo,

        @NotNull(message = "La fecha es obligatoria.")
        @Future(message = "Elige una fecha a partir de mañana.")
        LocalDate fechaPreferida,

        @NotNull(message = "El horario es obligatorio.")
        Franja franja,

        @Size(max = 1000, message = "El mensaje es demasiado largo.")
        String mensaje,

        @AssertTrue(message = "Debes autorizar el tratamiento de tus datos.")
        boolean aceptaTratamientoDatos
) {
}
