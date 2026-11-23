import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { cambiarEstadoVisita, listarVisitas } from '../services/visitasApi';
import type { Lote } from '../types/lote';
import type { EstadoVisita, Visita } from '../types/visita';
import { IconoAlerta, IconoCalendario, IconoCerrar, IconoMensaje, IconoRecargar, IconoTelefono } from './Iconos';

interface Props {
    lotes: Lote[];                          // para mostrar "Manzana A · Lote 3" en lugar del id
    onCerrar: () => void;
    onPendientes: (cantidad: number) => void; // mantiene al día el número del botón "Visitas"
}

type Pestana = EstadoVisita | 'TODAS';

const PESTANAS: { valor: Pestana; etiqueta: string }[] = [
    { valor: 'PENDIENTE', etiqueta: 'Pendientes' },
    { valor: 'CONFIRMADA', etiqueta: 'Confirmadas' },
    { valor: 'REALIZADA', etiqueta: 'Realizadas' },
    { valor: 'CANCELADA', etiqueta: 'Canceladas' },
    { valor: 'TODAS', etiqueta: 'Todas' },
];

const ETIQUETA_ESTADO: Record<EstadoVisita, string> = {
    PENDIENTE: 'Pendiente',
    CONFIRMADA: 'Confirmada',
    REALIZADA: 'Realizada',
    CANCELADA: 'Cancelada',
};

// Qué puede hacer el vendedor según el estado (visitas-service acepta cualquiera; aquí solo los que tienen sentido)
const ACCIONES: Record<EstadoVisita, { estado: EstadoVisita; etiqueta: string; tipo: 'principal' | 'secundaria' }[]> = {
    PENDIENTE: [
        { estado: 'CONFIRMADA', etiqueta: 'Confirmar', tipo: 'principal' },
        { estado: 'CANCELADA', etiqueta: 'Cancelar', tipo: 'secundaria' },
    ],
    CONFIRMADA: [
        { estado: 'REALIZADA', etiqueta: 'Marcar realizada', tipo: 'principal' },
        { estado: 'CANCELADA', etiqueta: 'Cancelar', tipo: 'secundaria' },
    ],
    REALIZADA: [],
    CANCELADA: [],
};

function fechaVisita(iso: string): string {
    const [anio, mes, dia] = iso.split('-').map(Number);
    const texto = new Date(anio, mes - 1, dia).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
    return texto.charAt(0).toUpperCase() + texto.slice(1); // «Mié, 25 de nov.»
}

function yaPaso(iso: string): boolean {
    const [anio, mes, dia] = iso.split('-').map(Number);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return new Date(anio, mes - 1, dia) < hoy;
}

function enlaceWhatsApp(visita: Visita, nombreLote: string): string {
    const texto = `Hola ${visita.nombre.split(' ')[0]}, te escribo de GeoLotes por tu visita al ${nombreLote} el ${fechaVisita(visita.fechaPreferida)}.`;
    return `https://wa.me/57${visita.telefono}?text=${encodeURIComponent(texto)}`;
}

export default function PanelVisitas({ lotes, onCerrar, onPendientes }: Props) {
    const [visitas, setVisitas] = useState<Visita[] | null>(null);
    const [pestana, setPestana] = useState<Pestana>('PENDIENTE');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState<string | null>(null); // id de la visita que se está cambiando

    const nombreDe = useMemo(() => {
        const porId = new Map(lotes.map((l) => [l.id, `Lote ${l.numero} · Manzana ${l.manzana}`]));
        return (id: string) => porId.get(id) ?? `Lote ${id}`;
    }, [lotes]);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            setVisitas(await listarVisitas());
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudieron cargar las visitas.');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        void cargar();
    }, [cargar]);

    useEffect(() => {
        if (visitas) onPendientes(visitas.filter((v) => v.estado === 'PENDIENTE').length);
    }, [visitas, onPendientes]);

    useEffect(() => {
        const alTeclado = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
        window.addEventListener('keydown', alTeclado);
        return () => window.removeEventListener('keydown', alTeclado);
    }, [onCerrar]);

    async function cambiar(visita: Visita, estado: EstadoVisita) {
        setGuardando(visita.id);
        setError(null);
        try {
            const actualizada = await cambiarEstadoVisita(visita.id, estado);
            setVisitas((lista) => lista?.map((v) => (v.id === actualizada.id ? actualizada : v)) ?? null);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado.');
        } finally {
            setGuardando(null);
        }
    }

    const cuenta = (p: Pestana) => (visitas ?? []).filter((v) => p === 'TODAS' || v.estado === p).length;
    const visibles = (visitas ?? []).filter((v) => pestana === 'TODAS' || v.estado === pestana);

    return createPortal(
        <div className="modal-fondo" onClick={onCerrar}>
            <section
                className="modal modal-visitas"
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-visitas"
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" className="btn-icono modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
                    <IconoCerrar />
                </button>

                <div className="modal-cabecera">
                    <p className="panel-sub">Panel del vendedor</p>
                    <h2 id="titulo-visitas">Visitas agendadas</h2>
                    <p className="modal-nota">Las solicitudes que dejaron los compradores desde la ficha de cada lote.</p>
                </div>

                <div className="visitas-barra">
                    <div className="visitas-pestanas" role="tablist" aria-label="Filtrar por estado">
                        {PESTANAS.map((p) => (
                            <button
                                key={p.valor}
                                type="button"
                                role="tab"
                                aria-selected={pestana === p.valor}
                                className={`visitas-pestana${pestana === p.valor ? ' activa' : ''}`}
                                onClick={() => setPestana(p.valor)}
                            >
                                {p.etiqueta}
                                {visitas && <span className="visitas-cuenta">{cuenta(p.valor)}</span>}
                            </button>
                        ))}
                    </div>
                    <button type="button" className="btn-fantasma" onClick={() => void cargar()} disabled={cargando} aria-label="Actualizar la lista">
                        <IconoRecargar width={16} height={16} />
                        Actualizar
                    </button>
                </div>

                {error && (
                    <p className="alerta-error" role="alert">
                        <IconoAlerta width={16} height={16} />
                        {error}
                    </p>
                )}

                {cargando && !visitas ? (
                    <p className="visitas-vacio">Cargando visitas…</p>
                ) : visibles.length === 0 ? (
                    <p className="visitas-vacio">
                        {pestana === 'PENDIENTE' ? 'No hay visitas pendientes por confirmar.' : 'No hay visitas en este estado.'}
                    </p>
                ) : (
                    <ul className="visitas-lista">
                        {visibles.map((v) => {
                            const lote = nombreDe(v.loteId);
                            const pasada = yaPaso(v.fechaPreferida) && (v.estado === 'PENDIENTE' || v.estado === 'CONFIRMADA');
                            return (
                                <li key={v.id} className="visita">
                                    <div className="visita-cabecera">
                                        <div>
                                            <h3>{v.nombre}</h3>
                                            <p className="visita-lote">{lote}</p>
                                        </div>
                                        <span className={`visita-estado estado-${v.estado.toLowerCase()}`}>{ETIQUETA_ESTADO[v.estado]}</span>
                                    </div>

                                    <p className="visita-fecha">
                                        <IconoCalendario width={15} height={15} />
                                        {fechaVisita(v.fechaPreferida)} · {v.franja === 'MANANA' ? 'Mañana' : 'Tarde'}
                                        {pasada && <span className="visita-pasada">Fecha pasada</span>}
                                    </p>

                                    {v.mensaje && <p className="visita-mensaje">«{v.mensaje}»</p>}

                                    <div className="visita-pie">
                                        <div className="visita-contacto">
                                            <a href={`tel:+57${v.telefono}`} className="btn-fantasma">
                                                <IconoTelefono width={15} height={15} />
                                                {v.telefono}
                                            </a>
                                            <a href={enlaceWhatsApp(v, lote)} target="_blank" rel="noreferrer" className="btn-fantasma">
                                                <IconoMensaje width={15} height={15} />
                                                WhatsApp
                                            </a>
                                            {v.correo && <span className="visita-correo">{v.correo}</span>}
                                        </div>
                                        <div className="visita-acciones">
                                            {ACCIONES[v.estado].map((a) => (
                                                <button
                                                    key={a.estado}
                                                    type="button"
                                                    className={a.tipo === 'principal' ? 'btn-primario btn-pequeno' : 'btn-secundario btn-pequeno'}
                                                    onClick={() => void cambiar(v, a.estado)}
                                                    disabled={guardando === v.id}
                                                >
                                                    {guardando === v.id ? 'Guardando…' : a.etiqueta}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>,
        document.body,
    );
}
