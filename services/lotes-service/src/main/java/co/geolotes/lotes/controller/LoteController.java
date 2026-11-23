package co.geolotes.lotes.controller;

import co.geolotes.lotes.dto.ActualizarLoteRequest;
import co.geolotes.lotes.dto.CambiarEstadoRequest;
import co.geolotes.lotes.dto.GeometriaRequest;
import co.geolotes.lotes.dto.GuardarLoteRequest;
import co.geolotes.lotes.dto.LoteResponse;
import co.geolotes.lotes.service.LoteService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

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

    // Público: el video del lote. Spring atiende las peticiones por partes (Range) para poder adelantarlo.
    @GetMapping("/{id}/video")
    public ResponseEntity<Resource> video(@PathVariable String id) {
        LoteService.VideoLote video = servicio.obtenerVideo(id);
        return ResponseEntity.ok()
                .contentType(video.tipo())
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30))) // el nombre cambia si se reemplaza
                .body(video.recurso());
    }

    // ---------- Vendedor (en el corte 3 se protegerá con login) ----------

    @PatchMapping("/{id}/estado")
    public LoteResponse cambiarEstado(@PathVariable String id,
                                      @Valid @RequestBody CambiarEstadoRequest cambio) {
        return servicio.cambiarEstado(id, cambio.estado());
    }

    // Segmentación: el vendedor dibuja un lote nuevo en el mapa
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LoteResponse crear(@Valid @RequestBody GuardarLoteRequest datos) {
        return servicio.crear(datos);
    }

    @PutMapping("/{id}")
    public LoteResponse actualizar(@PathVariable String id, @Valid @RequestBody ActualizarLoteRequest datos) {
        return servicio.actualizar(id, datos);
    }

    // Segmentación: el vendedor ajusta la forma de un lote existente
    @PutMapping("/{id}/geometria")
    public LoteResponse actualizarGeometria(@PathVariable String id, @Valid @RequestBody GeometriaRequest geometria) {
        return servicio.actualizarGeometria(id, geometria);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable String id) {
        servicio.eliminar(id);
    }

    @PostMapping(path = "/{id}/video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public LoteResponse subirVideo(@PathVariable String id, @RequestParam("archivo") MultipartFile archivo) {
        return servicio.subirVideo(id, archivo);
    }

    @DeleteMapping("/{id}/video")
    public LoteResponse quitarVideo(@PathVariable String id) {
        return servicio.quitarVideo(id);
    }

    // Público: la foto 360° del lote (JPG equirectangular) para el visor de la ficha
    @GetMapping("/{id}/foto360")
    public ResponseEntity<Resource> foto360(@PathVariable String id) {
        LoteService.VideoLote foto = servicio.obtenerFoto360(id);
        return ResponseEntity.ok()
                .contentType(foto.tipo())
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30))) // el nombre cambia si se reemplaza
                .body(foto.recurso());
    }

    // Solo el vendedor (FiltroVendedor exige el token en POST y DELETE)
    @PostMapping(path = "/{id}/foto360", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public LoteResponse subirFoto360(@PathVariable String id, @RequestParam("archivo") MultipartFile archivo) {
        return servicio.subirFoto360(id, archivo);
    }

    @DeleteMapping("/{id}/foto360")
    public LoteResponse quitarFoto360(@PathVariable String id) {
        return servicio.quitarFoto360(id);
    }
}
