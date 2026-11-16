package co.geolotes.lotes.dto;

import co.geolotes.lotes.model.EstadoLote;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

// Datos que el vendedor puede corregir de un lote existente.
// La manzana y el número forman el id del lote, por eso no se cambian aquí.
public record ActualizarLoteRequest(
        @NotNull(message = "Escribe el precio.")
        @PositiveOrZero(message = "El precio no puede ser negativo.")
        Long precio,

        @NotNull(message = "Elige el estado.")
        EstadoLote estado,

        @Size(max = 1000, message = "La descripción admite máximo 1000 caracteres.")
        String descripcion
) {
}
