package co.geolotes.lotes.service;

import co.geolotes.lotes.exception.LoteException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.UUID;

/*
 * Guarda los videos y las fotos 360° de los lotes como archivos en una carpeta (geolotes.videos.carpeta).
 * En la base de datos solo queda el NOMBRE del archivo: la base no se llena de datos binarios
 * y el video se entrega por partes (Range), así el navegador puede adelantarlo sin descargarlo todo.
 */
@Component
public class AlmacenVideos {

    // Una foto 360° de celular pesa entre 3 y 20 MB; 40 MB deja margen sin aceptar cualquier cosa
    public static final long TAMANO_MAXIMO_FOTO = 40L * 1024 * 1024;

    private final Path carpeta;

    public AlmacenVideos(@Value("${geolotes.videos.carpeta:videos}") String carpeta) {
        this.carpeta = Path.of(carpeta).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.carpeta);
        } catch (IOException e) {
            throw new UncheckedIOException("No se pudo crear la carpeta de videos " + this.carpeta, e);
        }
    }

    public String guardar(String loteId, MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new LoteException(HttpStatus.BAD_REQUEST, "Selecciona un archivo de video.");
        }
        String extension = extensionPermitida(archivo);
        String nombre = loteId + "-" + UUID.randomUUID() + "." + extension;
        Path destino = carpeta.resolve(nombre);
        try (InputStream entrada = archivo.getInputStream()) {
            Files.copy(entrada, destino);
        } catch (IOException e) {
            throw new LoteException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar el video. Intenta de nuevo.");
        }
        return nombre;
    }

    // Foto 360°: imagen equirectangular (proporción 2:1) en JPG, como la exportan 360 Photo Cam y las cámaras 360
    public String guardarFoto360(String loteId, MultipartFile archivo) {
        if (archivo == null || archivo.isEmpty()) {
            throw new LoteException(HttpStatus.BAD_REQUEST, "Selecciona la foto 360° del lote.");
        }
        String tipo = archivo.getContentType() == null ? "" : archivo.getContentType().toLowerCase(Locale.ROOT);
        String nombreOriginal = archivo.getOriginalFilename() == null ? "" : archivo.getOriginalFilename().toLowerCase(Locale.ROOT);
        boolean esJpg = tipo.equals("image/jpeg") || nombreOriginal.endsWith(".jpg") || nombreOriginal.endsWith(".jpeg");
        if (!esJpg) {
            throw new LoteException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "La foto 360° debe ser JPG, como la guarda 360 Photo Cam.");
        }
        if (archivo.getSize() > TAMANO_MAXIMO_FOTO) {
            throw new LoteException(HttpStatus.CONTENT_TOO_LARGE, "La foto 360° no puede pasar de 40 MB.");
        }
        String nombre = loteId + "-360-" + UUID.randomUUID() + ".jpg";
        try (InputStream entrada = archivo.getInputStream()) {
            Files.copy(entrada, carpeta.resolve(nombre));
        } catch (IOException e) {
            throw new LoteException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar la foto 360°. Intenta de nuevo.");
        }
        return nombre;
    }

    public Resource abrir(String nombre) {
        Path archivo = carpeta.resolve(nombre).normalize();
        if (!archivo.startsWith(carpeta) || !Files.isRegularFile(archivo)) {
            throw new LoteException(HttpStatus.NOT_FOUND, "El archivo de este lote ya no está disponible.");
        }
        return new FileSystemResource(archivo);
    }

    public MediaType tipo(String nombre) {
        if (nombre.endsWith(".jpg")) return MediaType.IMAGE_JPEG;
        return nombre.endsWith(".webm") ? MediaType.parseMediaType("video/webm") : MediaType.parseMediaType("video/mp4");
    }

    public void borrar(String nombre) {
        if (nombre == null) return;
        try {
            Files.deleteIfExists(carpeta.resolve(nombre).normalize());
        } catch (IOException e) {
            // Si el archivo no se puede borrar, el lote igual queda sin video: no es grave
        }
    }

    // Solo MP4 y WebM: son los formatos que reproducen todos los navegadores
    private String extensionPermitida(MultipartFile archivo) {
        String tipo = archivo.getContentType() == null ? "" : archivo.getContentType().toLowerCase(Locale.ROOT);
        String nombre = archivo.getOriginalFilename() == null ? "" : archivo.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (tipo.equals("video/mp4") || nombre.endsWith(".mp4")) return "mp4";
        if (tipo.equals("video/webm") || nombre.endsWith(".webm")) return "webm";
        throw new LoteException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "Formato no soportado. Sube el video en MP4 o WebM (los celulares Android graban en MP4).");
    }
}
