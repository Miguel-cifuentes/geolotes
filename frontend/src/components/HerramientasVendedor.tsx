import type { Dibujo } from './MapaLotes';
import { areaAproximada } from '../utils/geo';
import { IconoAlerta, IconoDeshacer, IconoLlave, IconoMas } from './Iconos';

interface Props {
    dibujo: Dibujo | null;
    loteEnEdicion: string | null;     // id del lote cuya forma se ajusta
    guardando: boolean;
    error: string | null;
    onNuevo: () => void;
    onDeshacer: () => void;
    onCancelar: () => void;
    onTerminar: () => void;           // lote nuevo: pasa al formulario de datos
    onGuardarForma: () => void;       // lote existente: guarda la forma ajustada
}

const formatoArea = new Intl.NumberFormat('es-CO');

// Barra superior del modo vendedor: segmentar lotes nuevos y ajustar formas
export default function HerramientasVendedor({
    dibujo, loteEnEdicion, guardando, error, onNuevo, onDeshacer, onCancelar, onTerminar, onGuardarForma,
}: Props) {
    if (!dibujo) {
        return (
            <div className="herramientas tarjeta-flotante" role="toolbar" aria-label="Herramientas del vendedor">
                <span className="herramientas-titulo">
                    <IconoLlave width={16} height={16} />
                    Modo vendedor
                </span>
                <span className="herramientas-ayuda">Toca un lote para editarlo, o</span>
                <button className="btn-primario btn-pequeno" onClick={onNuevo}>
                    <IconoMas width={16} height={16} />
                    Segmentar lote nuevo
                </button>
            </div>
        );
    }

    const puntos = dibujo.puntos.length;
    const area = areaAproximada(dibujo.puntos);
    const nuevo = dibujo.modo === 'nuevo';

    return (
        <div className="herramientas herramientas-activa tarjeta-flotante" role="toolbar" aria-label="Segmentación del lote">
            <div className="herramientas-texto">
                <strong>
                    {nuevo
                        ? puntos < 3 ? 'Haz clic en cada esquina del lote' : 'Sigue marcando esquinas o continúa'
                        : `Ajusta la forma del lote ${loteEnEdicion ?? ''}`}
                </strong>
                <span>
                    {nuevo ? `${puntos} ${puntos === 1 ? 'esquina' : 'esquinas'}` : 'Arrastra los puntos blancos'}
                    {area > 0 && ` · ≈ ${formatoArea.format(area)} m²`}
                </span>
            </div>
            <div className="herramientas-botones">
                {nuevo && (
                    <button className="btn-fantasma" onClick={onDeshacer} disabled={puntos === 0 || guardando}>
                        <IconoDeshacer width={15} height={15} />
                        Deshacer
                    </button>
                )}
                <button className="btn-secundario btn-pequeno" onClick={onCancelar} disabled={guardando}>
                    Cancelar
                </button>
                {nuevo ? (
                    <button className="btn-primario btn-pequeno" onClick={onTerminar} disabled={puntos < 3}>
                        Continuar
                    </button>
                ) : (
                    <button className="btn-primario btn-pequeno" onClick={onGuardarForma} disabled={guardando}>
                        {guardando ? 'Guardando…' : 'Guardar forma'}
                    </button>
                )}
            </div>
            {error && (
                <p className="herramientas-error" role="alert">
                    <IconoAlerta width={16} height={16} />
                    {error}
                </p>
            )}
        </div>
    );
}
