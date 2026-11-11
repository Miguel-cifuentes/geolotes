package co.geolotes.lotes.controller;

import co.geolotes.lotes.dto.CambiarEstadoRequest;
import co.geolotes.lotes.dto.LoteResponse;
import co.geolotes.lotes.service.LoteService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

// Ruta /lotes (sin /api): el Gateway recibirá /api/lotes y quitará el prefijo
@RestController
@RequestMapping("/lotes")
public class LoteController {

    private final LoteService servicio;

    public LoteController(LoteService servicio) {
        this.servicio = servicio;
    }

    // Público: el mapa del frontend pinta esta respuesta directamente
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public String listarGeoJson() {
        return servicio.obtenerGeoJson();
    }

    // Público: ficha de un lote (para el enlace compartido)
    @GetMapping("/{id}")
    public LoteResponse obtener(@PathVariable String id) {
        return servicio.obtener(id);
    }

    // Para el vendedor (en el corte 3 se protegerá con login)
    @PatchMapping("/{id}/estado")
    public LoteResponse cambiarEstado(@PathVariable String id,
                                      @Valid @RequestBody CambiarEstadoRequest cambio) {
        return servicio.cambiarEstado(id, cambio.estado());
    }
}