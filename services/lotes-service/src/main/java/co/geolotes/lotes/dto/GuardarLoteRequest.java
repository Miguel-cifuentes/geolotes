package co.geolotes.lotes.dto;

import co.geolotes.lotes.model.EstadoLote;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

// Datos de un lote nuevo dibujado por el vendedor
public record GuardarLoteRequest(
        @NotBlank(message = "Escribe la manzana.")
        @Pattern(regexp = "[A-Za-z0-9]{1,5}", message = "La manzana lleva solo letras o números (máximo 5).")
        String manzana,

        @NotNull(message = "Escribe el número del lote.")
        @Min(value = 1, message = "El número debe ser mayor que 0.")
        @Max(value = 9999, message = "El número debe ser menor que 10000.")
        Integer numero,

        @NotNull(message = "Escribe el precio.")
        @PositiveOrZero(message = "El precio no puede ser negativo.")
        Long precio,

        @NotNull(message = "Elige el estado.")
        EstadoLote estado,

        @Size(max = 1000, message = "La descripción admite máximo 1000 caracteres.")
        String descripcion,

        @NotNull(message = "Dibuja la forma del lote.")
        @Valid
        GeometriaRequest geometria
) {
}
