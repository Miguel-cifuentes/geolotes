package co.geolotes.lotes.dto;

import co.geolotes.lotes.model.EstadoLote;
import co.geolotes.lotes.model.Lote;

public record LoteResponse(
        String id,
        String manzana,
        Integer numero,
        Double areaM2,
        Long precio,
        EstadoLote estado,
        String descripcion
) {
    public static LoteResponse desde(Lote l) {
        return new LoteResponse(
                l.getId(), l.getManzana(), l.getNumero(), l.getAreaM2(),
                l.getPrecio(), l.getEstado(), l.getDescripcion()
        );
    }
}