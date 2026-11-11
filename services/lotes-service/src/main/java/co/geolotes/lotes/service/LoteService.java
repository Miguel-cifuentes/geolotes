package co.geolotes.lotes.service;

import co.geolotes.lotes.dto.LoteResponse;
import co.geolotes.lotes.exception.LoteNoEncontradoException;
import co.geolotes.lotes.model.EstadoLote;
import co.geolotes.lotes.model.Lote;
import co.geolotes.lotes.repository.LoteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoteService {

    private final LoteRepository repositorio;

    public LoteService(LoteRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Transactional(readOnly = true)
    public String obtenerGeoJson() {
        return repositorio.obtenerGeoJson();
    }

    @Transactional(readOnly = true)
    public LoteResponse obtener(String id) {
        return LoteResponse.desde(buscar(id));
    }

    /*
     * Decisión CAP (CP): el cambio de estado va a UNA sola base de datos (fuente de verdad),
     * dentro de una transacción y con bloqueo optimista (@Version).
     * Si la base no responde o hay un conflicto, devolvemos error en lugar de
     * arriesgarnos a mostrar un lote vendido como disponible.
     */
    @Transactional
    public LoteResponse cambiarEstado(String id, EstadoLote nuevoEstado) {
        Lote lote = buscar(id);
        lote.setEstado(nuevoEstado);
        repositorio.flush(); // ejecuta el UPDATE ya, para detectar conflictos de versión aquí mismo
        return LoteResponse.desde(lote);
    }

    private Lote buscar(String id) {
        String idNormalizado = id.trim().toUpperCase(); // "a-1" → "A-1"
        return repositorio.findById(idNormalizado)
                .orElseThrow(() -> new LoteNoEncontradoException(idNormalizado));
    }
}