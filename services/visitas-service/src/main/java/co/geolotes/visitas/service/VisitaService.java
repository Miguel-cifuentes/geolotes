package co.geolotes.visitas.service;

import co.geolotes.visitas.dto.CrearVisitaRequest;
import co.geolotes.visitas.dto.VisitaResponse;
import co.geolotes.visitas.exception.VisitaNoEncontradaException;
import co.geolotes.visitas.model.EstadoVisita;
import co.geolotes.visitas.model.SolicitudVisita;
import co.geolotes.visitas.repository.SolicitudVisitaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
public class VisitaService {

    private final SolicitudVisitaRepository repositorio;

    // Inyección por constructor: Spring entrega el repositorio automáticamente
    public VisitaService(SolicitudVisitaRepository repositorio) {
        this.repositorio = repositorio;
    }

    /*
     * Decisión CAP (AP): NO consultamos a lotes-service para validar el loteId.
     * Si lotes-service estuviera caído, perderíamos al interesado.
     * Preferimos aceptar siempre la solicitud; el vendedor la revisa al confirmarla.
     */
    @Transactional
    public VisitaResponse crear(CrearVisitaRequest r) {
        SolicitudVisita visita = new SolicitudVisita(
                r.loteId(),
                r.nombre().trim(),
                r.telefono(),
                vacioANulo(r.correo()),
                r.fechaPreferida(),
                r.franja(),
                vacioANulo(r.mensaje()),
                r.aceptaTratamientoDatos()
        );
        return VisitaResponse.desde(repositorio.save(visita));
    }

    @Transactional(readOnly = true)
    public List<VisitaResponse> listar(EstadoVisita estado) {
        List<SolicitudVisita> visitas = (estado == null)
                ? repositorio.findAllByOrderByFechaPreferidaAsc()
                : repositorio.findByEstadoOrderByFechaPreferidaAsc(estado);
        return visitas.stream().map(VisitaResponse::desde).toList();
    }

    @Transactional
    public VisitaResponse cambiarEstado(UUID id, EstadoVisita nuevoEstado) {
        SolicitudVisita visita = repositorio.findById(id)
                .orElseThrow(() -> new VisitaNoEncontradaException(id));
        visita.setEstado(nuevoEstado);
        return VisitaResponse.desde(visita); // @Transactional guarda el cambio al terminar
    }

    private static String vacioANulo(String texto) {
        return (texto == null || texto.isBlank()) ? null : texto.trim();
    }
}