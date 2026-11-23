import { useEffect, useMemo, useState } from 'react';
import type { FeatureCollection, Polygon } from 'geojson';
import MapaLotes from './MapaLotes';
import type { Dibujo } from './MapaLotes';
import PanelLote from './PanelLote';
import Leyenda from './Leyenda';
import PanelFiltros from './PanelFiltros';
import HerramientasVendedor from './HerramientasVendedor';
import FormularioLote from './FormularioLote';
import type { ModoFormulario } from './FormularioLote';
import { calcularRangos, cumpleFiltros, filtrosIniciales } from '../utils/filtros';
import { esquinasLote } from '../utils/geo';
import { alTocarLote } from '../utils/seleccion';
import { actualizarForma, ErrorApi } from '../services/lotesApi';
import type { Lote, Punto } from '../types/lote';
import type { Filtros } from '../types/filtros';

type Coleccion = FeatureCollection<Polygon, Lote>;

interface Props {
    lotes: Coleccion;
    modoVendedor: boolean; // hay sesión del vendedor
    onLoteActualizado: (lote: Lote) => void;
    onRecargar: () => Promise<Coleccion>;
}

// Lo que el vendedor está dibujando: un lote nuevo, o la forma de uno existente (loteId)
type Edicion = Dibujo & { loteId?: string };

export default function VistaMapa({ lotes, modoVendedor, onLoteActualizado, onRecargar }: Props) {
    const rangos = useMemo(() => calcularRangos(lotes), [lotes]);
    const [filtros, setFiltros] = useState<Filtros>(() => filtrosIniciales(rangos));

    // Se guarda solo el id: el lote siempre se lee de los datos más recientes
    // Si la dirección trae ?lote=A-3, ese lote arranca seleccionado
    const [seleccionId, setSeleccionId] = useState<string | null>(
        () => new URLSearchParams(window.location.search).get('lote')?.toUpperCase() ?? null,
    );
    const loteSeleccionado = lotes.features.find((f) => f.properties.id === seleccionId)?.properties ?? null;

    const [edicion, setEdicion] = useState<Edicion | null>(null);
    const [formulario, setFormulario] = useState<ModoFormulario | null>(null);
    const [guardandoForma, setGuardandoForma] = useState(false);
    const [errorEdicion, setErrorEdicion] = useState<string | null>(null);
    const [aviso, setAviso] = useState<string | null>(null);

    // El aviso (por ejemplo, «Ese lote ya está vendido») se borra solo a los 3 segundos
    useEffect(() => {
        if (!aviso) return;
        const temporizador = setTimeout(() => setAviso(null), 3000);
        return () => clearTimeout(temporizador);
    }, [aviso]);

    // Mantener la dirección al día sin recargar la página
    useEffect(() => {
        const url = new URL(window.location.href);
        if (loteSeleccionado) url.searchParams.set('lote', loteSeleccionado.id);
        else url.searchParams.delete('lote');
        window.history.replaceState(null, '', url);
    }, [loteSeleccionado]);

    // Si la sesión se cierra o vence a mitad de un dibujo, se descarta lo que estaba abierto
    useEffect(() => {
        if (modoVendedor) return;
        setEdicion(null);
        setFormulario(null);
        setErrorEdicion(null);
    }, [modoVendedor]);

    const visibles = lotes.features.filter((f) => cumpleFiltros(f.properties, filtros)).length;

    // Tras crear, ajustar o eliminar: datos nuevos y filtros reiniciados (el precio máximo pudo cambiar)
    async function recargarTodo(seleccionar: string | null) {
        try {
            const datos = await onRecargar();
            setFiltros(filtrosIniciales(calcularRangos(datos)));
        } catch {
            // Si la recarga falla, el mapa sigue con los datos anteriores
        }
        setSeleccionId(seleccionar);
    }

    // HU-02 c3: el comprador no abre la ficha de un lote vendido; se le avisa
    function tocarLote(id: string) {
        const lote = lotes.features.find((f) => f.properties.id === id)?.properties;
        if (!lote) return;
        const resultado = alTocarLote(lote, modoVendedor);
        setAviso(resultado.aviso);
        if (resultado.abrirFicha) setSeleccionId(id);
    }

    // ---------- Segmentación ----------

    function iniciarLoteNuevo() {
        setSeleccionId(null);
        setErrorEdicion(null);
        setEdicion({ modo: 'nuevo', puntos: [] });
    }

    function iniciarAjusteForma(lote: Lote) {
        const feature = lotes.features.find((f) => f.properties.id === lote.id);
        if (!feature) return;
        setErrorEdicion(null);
        setEdicion({ modo: 'forma', loteId: lote.id, puntos: esquinasLote(feature) });
    }

    function agregarPunto(punto: Punto) {
        setEdicion((actual) => (actual && actual.modo === 'nuevo' ? { ...actual, puntos: [...actual.puntos, punto] } : actual));
    }

    function moverPunto(indice: number, punto: Punto) {
        setErrorEdicion(null);
        setEdicion((actual) =>
            actual ? { ...actual, puntos: actual.puntos.map((p, i) => (i === indice ? punto : p)) } : actual,
        );
    }

    function deshacerPunto() {
        setEdicion((actual) => (actual ? { ...actual, puntos: actual.puntos.slice(0, -1) } : actual));
    }

    function cancelarEdicion() {
        const loteId = edicion?.loteId ?? null;
        setEdicion(null);
        setErrorEdicion(null);
        setSeleccionId(loteId); // al cancelar un ajuste, vuelve a la ficha de ese lote
    }

    async function guardarForma() {
        if (!edicion?.loteId) return;
        setGuardandoForma(true);
        setErrorEdicion(null);
        try {
            await actualizarForma(edicion.loteId, edicion.puntos);
            const id = edicion.loteId;
            setEdicion(null);
            await recargarTodo(id);
        } catch (e) {
            setErrorEdicion(e instanceof ErrorApi ? e.message : 'No se pudo guardar la forma.');
        } finally {
            setGuardandoForma(false);
        }
    }

    async function loteGuardado(lote: Lote) {
        setFormulario(null);
        setEdicion(null);
        await recargarTodo(lote.id);
    }

    async function loteEliminado() {
        await recargarTodo(null);
    }

    return (
        <>
            <MapaLotes
                lotes={lotes}
                filtros={filtros}
                loteSeleccionadoId={loteSeleccionado?.id ?? null}
                onSeleccionar={tocarLote}
                dibujo={edicion}
                onAgregarPunto={agregarPunto}
                onMoverPunto={moverPunto}
            />
            <PanelFiltros
                filtros={filtros}
                rangos={rangos}
                visibles={visibles}
                total={lotes.features.length}
                onCambiar={setFiltros}
                onLimpiar={() => setFiltros(filtrosIniciales(rangos))}
            />
            <Leyenda lotes={lotes} />

            {aviso && (
                <div className="aviso-mapa tarjeta-flotante" role="status">
                    {aviso}
                </div>
            )}

            {modoVendedor && (
                <HerramientasVendedor
                    dibujo={edicion}
                    loteEnEdicion={edicion?.loteId ?? null}
                    guardando={guardandoForma}
                    error={errorEdicion}
                    onNuevo={iniciarLoteNuevo}
                    onDeshacer={deshacerPunto}
                    onCancelar={cancelarEdicion}
                    onTerminar={() => edicion && setFormulario({ tipo: 'crear', puntos: edicion.puntos })}
                    onGuardarForma={guardarForma}
                />
            )}

            {/* Mientras se dibuja, la ficha se oculta para dejar libre el mapa */}
            {loteSeleccionado && !edicion && (
                <PanelLote
                    lote={loteSeleccionado}
                    modoVendedor={modoVendedor}
                    onEstadoCambiado={onLoteActualizado}
                    onEditarDatos={() => setFormulario({ tipo: 'editar', lote: loteSeleccionado })}
                    onEditarForma={() => iniciarAjusteForma(loteSeleccionado)}
                    onEliminado={loteEliminado}
                    onCerrar={() => setSeleccionId(null)}
                />
            )}

            {formulario && (
                <FormularioLote
                    modo={formulario}
                    onCerrar={() => setFormulario(null)} // un lote nuevo vuelve al dibujo para seguir ajustándolo
                    onGuardado={loteGuardado}
                    onCambioParcial={(lote) => {
                        setEdicion(null);
                        void recargarTodo(lote.id);
                    }}
                />
            )}
        </>
    );
}
