import type { FeatureCollection, Polygon } from 'geojson';
import { ESTADOS } from '../config/estados';
import { TODOS_LOS_ESTADOS } from '../utils/filtros';
import type { Lote } from '../types/lote';

interface Props {
    lotes: FeatureCollection<Polygon, Lote>;
}

// Leyenda del mapa con el conteo de lotes por estado
export default function Leyenda({ lotes }: Props) {
    return (
        <div className="leyenda tarjeta-flotante" aria-label="Estados de los lotes">
            {TODOS_LOS_ESTADOS.map((estado) => {
                const cantidad = lotes.features.filter((f) => f.properties.estado === estado).length;
                return (
                    <div key={estado} className="leyenda-item">
                        <span className="leyenda-color" style={{ background: ESTADOS[estado].color }} />
                        {ESTADOS[estado].etiqueta}
                        <b>{cantidad}</b>
                    </div>
                );
            })}
        </div>
    );
}
