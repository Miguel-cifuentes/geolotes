package co.geolotes.lotes.repository;

import co.geolotes.lotes.model.Lote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LoteRepository extends JpaRepository<Lote, String> {

    /*
     * PostGIS arma el GeoJSON completo (FeatureCollection) directamente en la base de datos.
     * El resultado tiene exactamente el formato que el mapa de Mapbox del frontend espera.
     */
    @Query(value = """
            SELECT CAST(json_build_object(
                'type', 'FeatureCollection',
                'features', COALESCE(json_agg(
                    json_build_object(
                        'type', 'Feature',
                        'geometry', CAST(ST_AsGeoJSON(geom) AS json),
                        'properties', json_build_object(
                            'id', id,
                            'manzana', manzana,
                            'numero', numero,
                            'areaM2', area_m2,
                            'precio', precio,
                            'estado', estado,
                            'descripcion', descripcion
                        )
                    ) ORDER BY manzana, numero
                ), CAST('[]' AS json))
            ) AS text)
            FROM lotes
            """, nativeQuery = true)
    String obtenerGeoJson();
}