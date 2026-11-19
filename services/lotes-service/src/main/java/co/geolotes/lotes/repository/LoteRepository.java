package co.geolotes.lotes.repository;

import co.geolotes.lotes.model.Lote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

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
                            'descripcion', descripcion,
                            'video', video
                        )
                    ) ORDER BY manzana, numero
                ), CAST('[]' AS json))
            ) AS text)
            FROM lotes
            """, nativeQuery = true)
    String obtenerGeoJson();

    /*
     * Segmentación manual del vendedor.
     * La forma llega como GeoJSON (texto) y PostGIS la convierte en polígono con ST_GeomFromGeoJSON.
     * El área NO la escribe nadie a mano: PostGIS la calcula en m² reales (geography).
     */

    // ¿Es un polígono simple (no se cruza consigo mismo) y de al menos 1 m²?
    @Query(value = """
            SELECT ST_IsValid(x.g)
                   AND ST_GeometryType(x.g) = 'ST_Polygon'
                   AND ST_Area(CAST(x.g AS geography)) >= 1
            FROM (SELECT ST_SetSRID(ST_GeomFromGeoJSON(CAST(:geojson AS text)), 4326) AS g) AS x
            """, nativeQuery = true)
    Boolean esPoligonoValido(@Param("geojson") String geojson);

    // Lotes que se montan sobre la forma nueva (más de 1 m² en común; compartir un borde sí se permite)
    @Query(value = """
            SELECT l.id
            FROM lotes l,
                 (SELECT ST_SetSRID(ST_GeomFromGeoJSON(CAST(:geojson AS text)), 4326) AS g) AS x
            WHERE l.id <> :excluirId
              AND ST_Intersects(l.geom, x.g)
              AND ST_Area(CAST(ST_Intersection(l.geom, x.g) AS geography)) > 1
            ORDER BY l.id
            """, nativeQuery = true)
    List<String> lotesQueSeCruzan(@Param("geojson") String geojson, @Param("excluirId") String excluirId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO lotes (id, manzana, numero, area_m2, precio, estado, descripcion, geom, version, actualizado_en)
            SELECT :id, :manzana, :numero, ROUND(ST_Area(CAST(x.g AS geography))),
                   :precio, :estado, CAST(:descripcion AS text), x.g, 0, now()
            FROM (SELECT ST_SetSRID(ST_GeomFromGeoJSON(CAST(:geojson AS text)), 4326) AS g) AS x
            """, nativeQuery = true)
    int insertar(@Param("id") String id,
                 @Param("manzana") String manzana,
                 @Param("numero") Integer numero,
                 @Param("precio") Long precio,
                 @Param("estado") String estado,
                 @Param("descripcion") String descripcion,
                 @Param("geojson") String geojson);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            UPDATE lotes
            SET geom = x.g,
                area_m2 = ROUND(ST_Area(CAST(x.g AS geography))),
                version = lotes.version + 1,
                actualizado_en = now()
            FROM (SELECT ST_SetSRID(ST_GeomFromGeoJSON(CAST(:geojson AS text)), 4326) AS g) AS x
            WHERE lotes.id = :id
            """, nativeQuery = true)
    int actualizarGeometria(@Param("id") String id, @Param("geojson") String geojson);
}
