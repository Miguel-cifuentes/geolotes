package co.geolotes.lotes.service;

import co.geolotes.lotes.dto.ActualizarLoteRequest;
import co.geolotes.lotes.dto.GeometriaRequest;
import co.geolotes.lotes.dto.GuardarLoteRequest;
import co.geolotes.lotes.dto.LoteResponse;
import co.geolotes.lotes.exception.LoteException;
import co.geolotes.lotes.exception.LoteNoEncontradoException;
import co.geolotes.lotes.model.EstadoLote;
import co.geolotes.lotes.model.Lote;
import co.geolotes.lotes.repository.LoteRepository;
import org.springframework.core.io.Resource;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;

@Service
public class LoteService {

    private final LoteRepository repositorio;
    private final AlmacenVideos videos;

    public LoteService(LoteRepository repositorio, AlmacenVideos videos) {
        this.repositorio = repositorio;
        this.videos = videos;
    }

    public record VideoLote(Resource recurso, MediaType tipo) {
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

    // ---------- Segmentación manual del vendedor ----------

    @Transactional
    public LoteResponse crear(GuardarLoteRequest datos) {
        String manzana = datos.manzana().trim().toUpperCase(Locale.ROOT);
        String id = manzana + "-" + datos.numero();
        if (repositorio.existsById(id)) {
            throw new LoteException(HttpStatus.CONFLICT,
                    "Ya existe el lote " + datos.numero() + " de la manzana " + manzana + ".");
        }
        String geojson = aGeoJson(datos.geometria());
        validarForma(geojson, id);
        repositorio.insertar(id, manzana, datos.numero(), datos.precio(), datos.estado().name(),
                limpiar(datos.descripcion()), geojson);
        return LoteResponse.desde(buscar(id));
    }

    @Transactional
    public LoteResponse actualizar(String id, ActualizarLoteRequest datos) {
        Lote lote = buscar(id);
        lote.setPrecio(datos.precio());
        lote.setEstado(datos.estado());
        lote.setDescripcion(limpiar(datos.descripcion()));
        repositorio.flush(); // bloqueo optimista, igual que el cambio de estado
        return LoteResponse.desde(lote);
    }

    @Transactional
    public LoteResponse actualizarGeometria(String id, GeometriaRequest geometria) {
        Lote lote = buscar(id);
        String geojson = aGeoJson(geometria);
        validarForma(geojson, lote.getId());
        repositorio.actualizarGeometria(lote.getId(), geojson);
        return LoteResponse.desde(buscar(lote.getId())); // ya con el área nueva
    }

    @Transactional
    public void eliminar(String id) {
        Lote lote = buscar(id);
        String video = lote.getVideo();
        String foto360 = lote.getFoto360();
        repositorio.delete(lote);
        repositorio.flush();
        videos.borrar(video);
        videos.borrar(foto360);
    }

    // ---------- Video del lote ----------

    @Transactional
    public LoteResponse subirVideo(String id, MultipartFile archivo) {
        Lote lote = buscar(id);
        String anterior = lote.getVideo();
        String nuevo = videos.guardar(lote.getId(), archivo);
        try {
            lote.setVideo(nuevo);
            repositorio.flush();
        } catch (RuntimeException e) {
            videos.borrar(nuevo); // si la base falla, no dejamos el archivo huérfano
            throw e;
        }
        videos.borrar(anterior);
        return LoteResponse.desde(lote);
    }

    @Transactional
    public LoteResponse quitarVideo(String id) {
        Lote lote = buscar(id);
        String anterior = lote.getVideo();
        lote.setVideo(null);
        repositorio.flush();
        videos.borrar(anterior);
        return LoteResponse.desde(lote);
    }

    @Transactional(readOnly = true)
    public VideoLote obtenerVideo(String id) {
        Lote lote = buscar(id);
        if (lote.getVideo() == null) {
            throw new LoteException(HttpStatus.NOT_FOUND, "Este lote no tiene video.");
        }
        return new VideoLote(videos.abrir(lote.getVideo()), videos.tipo(lote.getVideo()));
    }

    // ---------- Foto 360° del lote ----------

    @Transactional
    public LoteResponse subirFoto360(String id, MultipartFile archivo) {
        Lote lote = buscar(id);
        String anterior = lote.getFoto360();
        String nueva = videos.guardarFoto360(lote.getId(), archivo);
        try {
            lote.setFoto360(nueva);
            repositorio.flush();
        } catch (RuntimeException e) {
            videos.borrar(nueva); // si la base falla, no dejamos el archivo huérfano
            throw e;
        }
        videos.borrar(anterior);
        return LoteResponse.desde(lote);
    }

    @Transactional
    public LoteResponse quitarFoto360(String id) {
        Lote lote = buscar(id);
        String anterior = lote.getFoto360();
        lote.setFoto360(null);
        repositorio.flush();
        videos.borrar(anterior);
        return LoteResponse.desde(lote);
    }

    @Transactional(readOnly = true)
    public VideoLote obtenerFoto360(String id) {
        Lote lote = buscar(id);
        if (lote.getFoto360() == null) {
            throw new LoteException(HttpStatus.NOT_FOUND, "Este lote no tiene foto 360°.");
        }
        return new VideoLote(videos.abrir(lote.getFoto360()), videos.tipo(lote.getFoto360()));
    }

    // ---------- Apoyo ----------

    private Lote buscar(String id) {
        String idNormalizado = id.trim().toUpperCase(Locale.ROOT); // "a-1" → "A-1"
        return repositorio.findById(idNormalizado)
                .orElseThrow(() -> new LoteNoEncontradoException(idNormalizado));
    }

    // La forma debe ser un polígono simple y no montarse sobre otro lote
    private void validarForma(String geojson, String idPropio) {
        Boolean valida;
        try {
            valida = repositorio.esPoligonoValido(geojson);
        } catch (DataAccessException e) {
            throw new LoteException(HttpStatus.BAD_REQUEST, "La forma del lote no es un polígono válido.");
        }
        if (!Boolean.TRUE.equals(valida)) {
            throw new LoteException(HttpStatus.BAD_REQUEST,
                    "La forma se cruza consigo misma o es demasiado pequeña. Marca las esquinas en orden, siguiendo el borde.");
        }
        List<String> cruces = repositorio.lotesQueSeCruzan(geojson, idPropio);
        if (!cruces.isEmpty()) {
            throw new LoteException(HttpStatus.CONFLICT,
                    "La forma se monta sobre " + String.join(", ", cruces) + ". Ajusta los puntos para que no se crucen.");
        }
    }

    // Convierte la forma recibida en texto GeoJSON. Solo usa el borde exterior y lo cierra si hace falta.
    private static String aGeoJson(GeometriaRequest geometria) {
        List<List<Double>> borde = geometria.coordinates().get(0);
        if (borde == null || borde.size() < 3) {
            throw new LoteException(HttpStatus.BAD_REQUEST, "El lote necesita al menos 3 esquinas.");
        }
        StringBuilder json = new StringBuilder("{\"type\":\"Polygon\",\"coordinates\":[[");
        for (List<Double> punto : borde) {
            json.append(posicion(punto)).append(',');
        }
        List<Double> primero = borde.get(0);
        List<Double> ultimo = borde.get(borde.size() - 1);
        boolean cerrado = primero.get(0).equals(ultimo.get(0)) && primero.get(1).equals(ultimo.get(1));
        if (!cerrado) {
            json.append(posicion(primero)).append(',');
        }
        json.setLength(json.length() - 1);
        return json.append("]]}").toString();
    }

    private static String posicion(List<Double> punto) {
        if (punto == null || punto.size() < 2 || punto.get(0) == null || punto.get(1) == null
                || Math.abs(punto.get(0)) > 180 || Math.abs(punto.get(1)) > 90) {
            throw new LoteException(HttpStatus.BAD_REQUEST, "Hay un punto del lote con coordenadas no válidas.");
        }
        return "[" + punto.get(0) + "," + punto.get(1) + "]";
    }

    private static String limpiar(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
