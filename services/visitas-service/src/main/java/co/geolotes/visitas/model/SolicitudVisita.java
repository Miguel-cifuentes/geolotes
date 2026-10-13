package co.geolotes.visitas.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "solicitudes_visita")
public class SolicitudVisita {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Solo guardamos el ID del lote, no una relación con la tabla de lotes:
    // esa tabla vive en OTRO servicio y OTRA base de datos.
    @Column(nullable = false, length = 20)
    private String loteId;

    @Column(nullable = false, length = 120)
    private String nombre;

    @Column(nullable = false, length = 10)
    private String telefono;

    @Column(length = 150)
    private String correo;

    @Column(nullable = false)
    private LocalDate fechaPreferida;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Franja franja;

    @Column(length = 1000)
    private String mensaje;

    @Column(nullable = false)
    private boolean aceptaTratamientoDatos;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private EstadoVisita estado = EstadoVisita.PENDIENTE;

    @Column(nullable = false, updatable = false)
    private Instant fechaCreacion;

    // JPA necesita un constructor vacío
    protected SolicitudVisita() {
    }

    public SolicitudVisita(String loteId, String nombre, String telefono, String correo,
                           LocalDate fechaPreferida, Franja franja, String mensaje,
                           boolean aceptaTratamientoDatos) {
        this.loteId = loteId;
        this.nombre = nombre;
        this.telefono = telefono;
        this.correo = correo;
        this.fechaPreferida = fechaPreferida;
        this.franja = franja;
        this.mensaje = mensaje;
        this.aceptaTratamientoDatos = aceptaTratamientoDatos;
    }

    // Se ejecuta automáticamente justo antes de guardar por primera vez
    @PrePersist
    void alCrear() {
        this.fechaCreacion = Instant.now();
    }

    public UUID getId() { return id; }
    public String getLoteId() { return loteId; }
    public String getNombre() { return nombre; }
    public String getTelefono() { return telefono; }
    public String getCorreo() { return correo; }
    public LocalDate getFechaPreferida() { return fechaPreferida; }
    public Franja getFranja() { return franja; }
    public String getMensaje() { return mensaje; }
    public boolean isAceptaTratamientoDatos() { return aceptaTratamientoDatos; }
    public EstadoVisita getEstado() { return estado; }
    public Instant getFechaCreacion() { return fechaCreacion; }

    public void setEstado(EstadoVisita estado) { this.estado = estado; }
}
