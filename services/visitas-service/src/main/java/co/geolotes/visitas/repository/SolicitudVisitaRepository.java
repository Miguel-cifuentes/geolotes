package co.geolotes.visitas.repository;

import co.geolotes.visitas.model.EstadoVisita;
import co.geolotes.visitas.model.SolicitudVisita;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

// Spring genera el SQL a partir del nombre de cada método
public interface SolicitudVisitaRepository extends JpaRepository<SolicitudVisita, UUID> {

    List<SolicitudVisita> findAllByOrderByFechaPreferidaAsc();

    List<SolicitudVisita> findByEstadoOrderByFechaPreferidaAsc(EstadoVisita estado);
}
