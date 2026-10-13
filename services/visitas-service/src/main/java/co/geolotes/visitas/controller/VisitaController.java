package co.geolotes.visitas.controller;

import co.geolotes.visitas.dto.CambiarEstadoRequest;
import co.geolotes.visitas.dto.CrearVisitaRequest;
import co.geolotes.visitas.dto.VisitaResponse;
import co.geolotes.visitas.model.EstadoVisita;
import co.geolotes.visitas.service.VisitaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

// La ruta es /visitas (sin /api): el Gateway recibirá /api/visitas y quitará el prefijo
@RestController
@RequestMapping("/visitas")
public class VisitaController {

    private final VisitaService servicio;

    public VisitaController(VisitaService servicio) {
        this.servicio = servicio;
    }

    // Público: lo usa el formulario de "Agendar visita"
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public VisitaResponse crear(@Valid @RequestBody CrearVisitaRequest solicitud) {
        return servicio.crear(solicitud);
    }

    // Para el vendedor (en el corte 3 se protegerá con login)
    @GetMapping
    public List<VisitaResponse> listar(@RequestParam(required = false) EstadoVisita estado) {
        return servicio.listar(estado);
    }

    // Para el vendedor: confirmar, marcar realizada o cancelar
    @PatchMapping("/{id}/estado")
    public VisitaResponse cambiarEstado(@PathVariable UUID id,
                                        @Valid @RequestBody CambiarEstadoRequest cambio) {
        return servicio.cambiarEstado(id, cambio.estado());
    }
}