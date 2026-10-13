import { ESTADOS } from '../config/estados';

export default function Leyenda() {
    return (
        <div className="leyenda">
            {Object.values(ESTADOS).map((estado) => (
                <div key={estado.etiqueta} className="leyenda-item">
                    <span className="leyenda-color" style={{ background: estado.color }} />
                    {estado.etiqueta}
                </div>
            ))}
        </div>
    );
}