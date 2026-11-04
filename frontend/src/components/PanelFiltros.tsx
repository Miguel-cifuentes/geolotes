import { useState } from 'react';
import { ESTADOS } from '../config/estados';
import { TODOS_LOS_ESTADOS } from '../utils/filtros';
import { formatoPesos } from '../utils/formato';
import type { EstadoLote } from '../types/lote';
import type { Filtros, Rangos } from '../types/filtros';

interface Props {
    filtros: Filtros;
    rangos: Rangos;
    visibles: number;
    total: number;
    onCambiar: (filtros: Filtros) => void;
    onLimpiar: () => void;
}

export default function PanelFiltros({ filtros, rangos, visibles, total, onCambiar, onLimpiar }: Props) {
    // En celular empieza cerrado para no tapar el mapa
    const [abierto, setAbierto] = useState(() => window.innerWidth > 640);

    function alternarEstado(estado: EstadoLote) {
        const estados = filtros.estados.includes(estado)
            ? filtros.estados.filter((e) => e !== estado)
            : [...filtros.estados, estado];
        onCambiar({ ...filtros, estados });
    }

    const hayFiltros =
        filtros.estados.length < TODOS_LOS_ESTADOS.length ||
        filtros.precioMax < rangos.precioMax ||
        filtros.areaMin > rangos.areaMin;

    return (
        <section className="filtros" aria-label="Filtros de lotes">
            <button
                className="filtros-cabecera"
                onClick={() => setAbierto(!abierto)}
                aria-expanded={abierto}
            >
                <span>Filtros</span>
                <span className="filtros-contador">{visibles} de {total} lotes</span>
                <span aria-hidden="true">{abierto ? '▲' : '▼'}</span>
            </button>

            {abierto && (
                <div className="filtros-cuerpo">
                    <fieldset className="filtro">
                        <legend>Estado</legend>
                        <div className="filtro-estados">
                            {TODOS_LOS_ESTADOS.map((estado) => {
                                const activo = filtros.estados.includes(estado);
                                return (
                                    <button
                                        key={estado}
                                        className={`chip-estado ${activo ? 'activo' : ''}`}
                                        aria-pressed={activo}
                                        onClick={() => alternarEstado(estado)}
                                    >
                                        <span className="chip-color" style={{ background: ESTADOS[estado].color }} />
                                        {ESTADOS[estado].etiqueta}
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>

                    <label className="filtro">
            <span className="filtro-titulo">
              Precio máximo <b>{formatoPesos.format(filtros.precioMax)}</b>
            </span>
                        <input
                            type="range"
                            min={rangos.precioMin}
                            max={rangos.precioMax}
                            step={1_000_000}
                            value={filtros.precioMax}
                            onChange={(e) => onCambiar({ ...filtros, precioMax: Number(e.target.value) })}
                        />
                    </label>

                    {rangos.areaMin === rangos.areaMax ? (
                        <p className="filtro-nota">Todos los lotes miden {rangos.areaMin} m².</p>
                    ) : (
                        <label className="filtro">
              <span className="filtro-titulo">
                Área mínima <b>{filtros.areaMin} m²</b>
              </span>
                            <input
                                type="range"
                                min={rangos.areaMin}
                                max={rangos.areaMax}
                                step={1}
                                value={filtros.areaMin}
                                onChange={(e) => onCambiar({ ...filtros, areaMin: Number(e.target.value) })}
                            />
                        </label>
                    )}

                    {visibles === 0 && <p className="filtro-vacio">Ningún lote cumple estos filtros.</p>}

                    {hayFiltros && (
                        <button className="btn-secundario filtros-limpiar" onClick={onLimpiar}>
                            Limpiar filtros
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}