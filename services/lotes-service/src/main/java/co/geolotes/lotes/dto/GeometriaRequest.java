package co.geolotes.lotes.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.List;

// Forma del lote en GeoJSON: {"type":"Polygon","coordinates":[[[lon, lat], [lon, lat], ...]]}
public record GeometriaRequest(
        @NotNull(message = "Falta el tipo de la forma.")
        @Pattern(regexp = "Polygon", message = "La forma del lote debe ser un polígono.")
        String type,

        @NotEmpty(message = "Dibuja la forma del lote.")
        List<List<List<Double>>> coordinates
) {
}
