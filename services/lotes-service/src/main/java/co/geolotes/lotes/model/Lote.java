package co.geolotes.lotes.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "lotes")
public class Lote {

    @Id
    @Column(length = 20)
    private String id;

    @Column(nullable = false, length = 5)
    private String manzana;

    @Column(nullable = false)
    private Integer numero;

    @Column(name = "area_m2", nullable = false)
    private Double areaM2;

    @Column(nullable = false)
    private Long precio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private EstadoLote estado;

    private String descripcion;

    // Nombre del archivo de video guardado en la carpeta de videos (null si no tiene)
    @Column(length = 120)
    private String video;

    // Nombre del archivo de la foto 360° (equirectangular JPG); null si no tiene
    @Column(length = 120)
    private String foto360;

    // La columna "geom" (el polígono) existe en la tabla pero NO se mapea aquí:
    // PostGIS la lee directamente al generar el GeoJSON (ver LoteRepository).

    // Bloqueo optimista: si dos personas cambian el mismo lote a la vez,
    // la segunda falla en lugar de sobrescribir a la primera sin saberlo.
    @Version
    private Long version;

    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;

    protected Lote() {
    }

    @PreUpdate
    void alActualizar() {
        this.actualizadoEn = Instant.now();
    }

    public String getId() { return id; }
    public String getManzana() { return manzana; }
    public Integer getNumero() { return numero; }
    public Double getAreaM2() { return areaM2; }
    public Long getPrecio() { return precio; }
    public EstadoLote getEstado() { return estado; }
    public String getDescripcion() { return descripcion; }
    public Long getVersion() { return version; }
    public Instant getActualizadoEn() { return actualizadoEn; }

    public String getVideo() { return video; }
    public String getFoto360() { return foto360; }

    public void setEstado(EstadoLote estado) { this.estado = estado; }
    public void setPrecio(Long precio) { this.precio = precio; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public void setVideo(String video) { this.video = video; }
    public void setFoto360(String foto360) { this.foto360 = foto360; }
}