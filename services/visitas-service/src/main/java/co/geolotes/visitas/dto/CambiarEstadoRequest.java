package co.geolotes.visitas.dto;

import co.geolotes.visitas.model.EstadoVisita;
import jakarta.validation.constraints.NotNull;

public record CambiarEstadoRequest(
        @NotNull(message = "El estado es obligatorio.")
        EstadoVisita estado
) {
}
