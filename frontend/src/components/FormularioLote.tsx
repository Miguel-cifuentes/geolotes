import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import type { EstadoLote, Lote, Punto } from '../types/lote';
import { ESTADOS } from '../config/estados';
import {
    actualizarLote, crearLote, ErrorApi, quitarFoto360, quitarVideo, subirFoto360, subirVideo, TAMANO_MAXIMO_VIDEO,
    urlFoto360, urlVideo,
} from '../services/lotesApi';
import { errorFoto360, esProporcion360, medirImagen } from '../utils/foto360';
import { areaAproximada } from '../utils/geo';
import { IconoAlerta, IconoCerrar, IconoFoto360, IconoVideo } from './Iconos';

// Crear un lote recién dibujado, o editar los datos y el video de uno existente
export type ModoFormulario = { tipo: 'crear'; puntos: Punto[] } | { tipo: 'editar'; lote: Lote };

interface Props {
    modo: ModoFormulario;
    onCerrar: () => void;
    onGuardado: (lote: Lote) => void;      // todo salió bien: cierra el formulario
    onCambioParcial: (lote: Lote) => void; // el lote se guardó pero el video falló: refresca el mapa
}

interface Campos {
    manzana: string;
    numero: string;
    precio: string;
    estado: EstadoLote;
    descripcion: string;
}

type Errores = Partial<Record<keyof Campos | 'video', string>>;

const formatoNumero = new Intl.NumberFormat('es-CO');
const MB = 1024 * 1024;

function validar(c: Campos, creando: boolean, archivo: File | null): Errores {
    const e: Errores = {};
    if (creando) {
        if (!/^[A-Za-z0-9]{1,5}$/.test(c.manzana.trim())) e.manzana = 'Letras o números, máximo 5 (ej. A, B2).';
        const numero = Number(c.numero);
        if (!Number.isInteger(numero) || numero < 1 || numero > 9999) e.numero = 'Número entero entre 1 y 9999.';
    }
    const precio = Number(c.precio);
    if (c.precio.trim() === '' || !Number.isFinite(precio) || precio < 0) e.precio = 'Escribe el precio en pesos.';
    if (c.descripcion.length > 1000) e.descripcion = 'Máximo 1000 caracteres.';
    if (archivo) {
        const nombre = archivo.name.toLowerCase();
        if (!nombre.endsWith('.mp4') && !nombre.endsWith('.webm')) e.video = 'Sube el video en MP4 o WebM.';
        else if (archivo.size > TAMANO_MAXIMO_VIDEO) e.video = 'El video supera 300 MB. Recórtalo o comprímelo.';
    }
    return e;
}

export default function FormularioLote({ modo, onCerrar, onGuardado, onCambioParcial }: Props) {
    // Si el lote se crea pero el video falla, el formulario sigue abierto en modo edición
    const [loteGuardado, setLoteGuardado] = useState<Lote | null>(modo.tipo === 'editar' ? modo.lote : null);
    const creando = loteGuardado === null;

    const [campos, setCampos] = useState<Campos>(() =>
        modo.tipo === 'editar'
            ? {
                manzana: modo.lote.manzana,
                numero: String(modo.lote.numero),
                precio: String(modo.lote.precio),
                estado: modo.lote.estado,
                descripcion: modo.lote.descripcion ?? '',
            }
            : { manzana: '', numero: '', precio: '', estado: 'DISPONIBLE', descripcion: '' },
    );
    const [archivo, setArchivo] = useState<File | null>(null);
    const [quitar, setQuitar] = useState(false);
    const [errores, setErrores] = useState<Errores>({});
    const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [progreso, setProgreso] = useState<number | null>(null);
    const [subiendo, setSubiendo] = useState<'video' | 'foto 360°'>('video');
    // Foto 360° (va aparte del video: un lote puede tener uno, otro o los dos)
    const [foto, setFoto] = useState<File | null>(null);
    const [quitarFoto, setQuitarFoto] = useState(false);
    const [errorFoto, setErrorFoto] = useState<string | null>(null);
    const [avisoFoto, setAvisoFoto] = useState<string | null>(null);

    const area = loteGuardado ? loteGuardado.areaM2 : modo.tipo === 'crear' ? areaAproximada(modo.puntos) : 0;
    const tieneVideo = Boolean(loteGuardado?.video) && !quitar;
    const tieneFoto = Boolean(loteGuardado?.foto360) && !quitarFoto;

    function actualizar<K extends keyof Campos>(campo: K, valor: Campos[K]) {
        setCampos((anterior) => ({ ...anterior, [campo]: valor }));
    }

    function elegirArchivo(e: ChangeEvent<HTMLInputElement>) {
        setArchivo(e.target.files?.[0] ?? null);
        setQuitar(false);
        setErrores((anteriores) => ({ ...anteriores, video: undefined }));
    }

    async function elegirFoto(e: ChangeEvent<HTMLInputElement>) {
        const elegida = e.target.files?.[0] ?? null;
        setFoto(elegida);
        setQuitarFoto(false);
        setAvisoFoto(null);
        setErrorFoto(elegida ? errorFoto360(elegida) : null);
        if (!elegida || errorFoto360(elegida)) return;
        try {
            const { ancho, alto } = await medirImagen(elegida);
            if (!esProporcion360(ancho, alto)) {
                setAvisoFoto(`La foto mide ${ancho} × ${alto}. Una foto 360° completa mide el doble de ancho que de alto; esta puede verse deformada.`);
            }
        } catch {
            setErrorFoto('No se pudo leer la imagen. Prueba exportarla de nuevo desde 360 Photo Cam.');
        }
    }

    async function guardar(e: FormEvent) {
        e.preventDefault();
        const nuevos = validar(campos, creando, archivo);
        setErrores(nuevos);
        setErrorGeneral(null);
        if (Object.keys(nuevos).length > 0 || errorFoto) return;

        setGuardando(true);
        let lote = loteGuardado;
        try {
            // 1. Datos y forma del lote
            const datos = {
                precio: Number(campos.precio),
                estado: campos.estado,
                descripcion: campos.descripcion.trim(),
            };
            if (lote === null && modo.tipo === 'crear') {
                lote = await crearLote(
                    { ...datos, manzana: campos.manzana.trim().toUpperCase(), numero: Number(campos.numero) },
                    modo.puntos,
                );
                setLoteGuardado(lote);
            } else if (lote !== null) {
                lote = await actualizarLote(lote.id, datos);
                setLoteGuardado(lote);
            }
        } catch (error) {
            mostrarError(error);
            setGuardando(false);
            return;
        }
        if (lote === null) return;

        // 2. Video y foto 360° (van aparte: si fallan, el lote ya quedó guardado)
        let paso: 'el video' | 'la foto 360°' = 'el video';
        try {
            if (archivo) {
                setSubiendo('video');
                setProgreso(0);
                lote = await subirVideo(lote.id, archivo, setProgreso);
                setArchivo(null);
            } else if (quitar && lote.video) {
                lote = await quitarVideo(lote.id);
            }
            paso = 'la foto 360°';
            if (foto) {
                setSubiendo('foto 360°');
                setProgreso(0);
                lote = await subirFoto360(lote.id, foto, setProgreso);
            } else if (quitarFoto && lote.foto360) {
                lote = await quitarFoto360(lote.id);
            }
            onGuardado(lote);
        } catch (error) {
            setLoteGuardado(lote);
            onCambioParcial(lote);
            const detalle = error instanceof ErrorApi ? error.message : 'Intenta de nuevo.';
            setErrorGeneral(`El lote quedó guardado, pero ${paso} no se pudo subir: ${detalle}`);
            setGuardando(false);
            setProgreso(null);
        }
    }

    function mostrarError(error: unknown) {
        if (error instanceof ErrorApi) {
            setErrores(error.errores as Errores);
            setErrorGeneral(error.message);
        } else {
            setErrorGeneral('No se pudo guardar. Revisa la conexión e intenta de nuevo.');
        }
    }

    const titulo = creando ? 'Nuevo lote' : `Lote ${loteGuardado?.numero} · Manzana ${loteGuardado?.manzana}`;

    return createPortal(
        <div className="modal-fondo" onClick={guardando ? undefined : onCerrar}>
            <div
                className="modal modal-lote"
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-lote"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="btn-icono modal-cerrar" onClick={onCerrar} aria-label="Cerrar" disabled={guardando}>
                    <IconoCerrar />
                </button>

                <form onSubmit={guardar} noValidate>
                    <div className="modal-cabecera">
                        <p className="panel-sub">Panel del vendedor · {creando ? 'Segmentación' : 'Editar lote'}</p>
                        <h2 id="titulo-lote">{titulo}</h2>
                        <p className="modal-nota">
                            Área {creando ? 'aproximada' : ''} <b>{formatoNumero.format(area)} m²</b>
                            {creando ? ' · la cifra exacta la calcula el sistema al guardar.' : ' · calculada a partir de la forma dibujada.'}
                        </p>
                    </div>

                    <div className="fila">
                        <label className="campo">
                            Manzana *
                            <input
                                value={campos.manzana}
                                onChange={(e) => actualizar('manzana', e.target.value)}
                                disabled={!creando}
                                maxLength={5}
                                placeholder="A"
                                aria-invalid={Boolean(errores.manzana)}
                            />
                            {errores.manzana && <span className="error">{errores.manzana}</span>}
                        </label>
                        <label className="campo">
                            Número de lote *
                            <input
                                type="number"
                                inputMode="numeric"
                                min={1}
                                value={campos.numero}
                                onChange={(e) => actualizar('numero', e.target.value)}
                                disabled={!creando}
                                placeholder="1"
                                aria-invalid={Boolean(errores.numero)}
                            />
                            {errores.numero && <span className="error">{errores.numero}</span>}
                        </label>
                    </div>
                    {!creando && (
                        <p className="campo-nota">La manzana y el número identifican el lote. Para cambiarlos, elimínalo y vuelve a dibujarlo.</p>
                    )}

                    <div className="fila">
                        <label className="campo">
                            Precio (COP) *
                            <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                step={1000000}
                                value={campos.precio}
                                onChange={(e) => actualizar('precio', e.target.value)}
                                placeholder="85000000"
                                aria-invalid={Boolean(errores.precio)}
                            />
                            {campos.precio && !errores.precio && (
                                <span className="campo-ayuda">$ {formatoNumero.format(Number(campos.precio) || 0)}</span>
                            )}
                            {errores.precio && <span className="error">{errores.precio}</span>}
                        </label>
                        <label className="campo">
                            Estado *
                            <select value={campos.estado} onChange={(e) => actualizar('estado', e.target.value as EstadoLote)}>
                                {(Object.keys(ESTADOS) as EstadoLote[]).map((e) => (
                                    <option key={e} value={e}>{ESTADOS[e].etiqueta}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <label className="campo">
                        Descripción
                        <textarea
                            rows={3}
                            value={campos.descripcion}
                            onChange={(e) => actualizar('descripcion', e.target.value)}
                            placeholder="Ej.: Lote esquinero, plano, con acceso por vía interna y servicios en la vía."
                            aria-invalid={Boolean(errores.descripcion)}
                        />
                        {errores.descripcion && <span className="error">{errores.descripcion}</span>}
                    </label>

                    <fieldset className="campo-video">
                        <legend>Video del lote</legend>
                        {tieneVideo && loteGuardado && !archivo && (
                            <div className="video-actual">
                                <video src={urlVideo(loteGuardado)} preload="metadata" muted playsInline />
                                <div>
                                    <p>Este lote ya tiene video.</p>
                                    <button type="button" className="btn-fantasma" onClick={() => setQuitar(true)} disabled={guardando}>
                                        Quitar video
                                    </button>
                                </div>
                            </div>
                        )}
                        {quitar && <p className="campo-nota">El video se quitará al guardar.</p>}
                        <label className="selector-video">
                            <IconoVideo width={20} height={20} />
                            <span>
                                {archivo
                                    ? `${archivo.name} · ${(archivo.size / MB).toFixed(1)} MB`
                                    : tieneVideo ? 'Reemplazar por otro video' : 'Elegir video (MP4 o WebM, máx. 300 MB)'}
                            </span>
                            <input type="file" accept="video/mp4,video/webm,.mp4,.webm" onChange={elegirArchivo} disabled={guardando} />
                        </label>
                        {errores.video && <span className="error">{errores.video}</span>}
                    </fieldset>

                    <fieldset className="campo-video">
                        <legend>Foto 360° del lote</legend>
                        {tieneFoto && loteGuardado && !foto && (
                            <div className="video-actual">
                                <img src={urlFoto360(loteGuardado)} alt="Foto 360° actual del lote" loading="lazy" />
                                <div>
                                    <p>Este lote ya tiene foto 360°.</p>
                                    <button type="button" className="btn-fantasma" onClick={() => setQuitarFoto(true)} disabled={guardando}>
                                        Quitar foto 360°
                                    </button>
                                </div>
                            </div>
                        )}
                        {quitarFoto && <p className="campo-nota">La foto 360° se quitará al guardar.</p>}
                        <label className="selector-video">
                            <IconoFoto360 width={20} height={20} />
                            <span>
                                {foto
                                    ? `${foto.name} · ${(foto.size / MB).toFixed(1)} MB`
                                    : tieneFoto ? 'Reemplazar por otra foto 360°' : 'Elegir foto 360° (JPG de 360 Photo Cam, máx. 40 MB)'}
                            </span>
                            <input type="file" accept="image/jpeg,.jpg,.jpeg" onChange={elegirFoto} disabled={guardando} />
                        </label>
                        {errorFoto && <span className="error">{errorFoto}</span>}
                        {avisoFoto && <p className="campo-nota">{avisoFoto}</p>}
                    </fieldset>

                    {progreso !== null && (
                        <div className="progreso" role="progressbar" aria-valuenow={Math.round(progreso * 100)} aria-valuemin={0} aria-valuemax={100}>
                            <div className="progreso-barra" style={{ width: `${Math.round(progreso * 100)}%` }} />
                            <span>{progreso < 1 ? `Subiendo ${subiendo}… ${Math.round(progreso * 100)} %` : `Procesando ${subiendo}…`}</span>
                        </div>
                    )}

                    {errorGeneral && (
                        <p className="alerta-error" role="alert">
                            <IconoAlerta width={18} height={18} />
                            {errorGeneral}
                        </p>
                    )}

                    <button type="submit" className="btn-primario" disabled={guardando}>
                        {guardando ? 'Guardando…' : creando ? 'Guardar lote' : 'Guardar cambios'}
                    </button>
                </form>
            </div>
        </div>,
        document.body,
    );
}
