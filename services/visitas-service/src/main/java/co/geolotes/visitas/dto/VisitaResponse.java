package co.geolotes.visitas.dto;

import co.geolotes.visitas.model.EstadoVisita;
import co.geolotes.visitas.model.Franja;
import co.geolotes.visitas.model.SolicitudVisita;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record VisitaResponse(
        UUID id,
        String loteId,
        String nombre,
        String telefono,
        String correo,
        LocalDate fechaPreferida,
        Franja franja,
        String mensaje,
        EstadoVisita estado,
        Instant fechaCreacion
) {
    public static VisitaResponse desde(SolicitudVisita v) {
        return new VisitaResponse(
                v.getId(), v.getLoteId(), v.getNombre(), v.getTelefono(), v.getCorreo(),
                v.getFechaPreferida(), v.getFranja(), v.getMensaje(), v.getEstado(),
                v.getFechaCreacion()
        );
    }
}
