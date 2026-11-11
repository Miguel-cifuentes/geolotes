package co.geolotes.lotes.dto;

import co.geolotes.lotes.model.EstadoLote;
import jakarta.validation.constraints.NotNull;

public record CambiarEstadoRequest(
        @NotNull(message = "El estado es obligatorio.")
        EstadoLote estado
) {
}