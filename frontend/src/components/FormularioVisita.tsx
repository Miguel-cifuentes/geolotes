import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Lote } from '../types/lote';
import type { SolicitudVisita } from '../types/visita';
import { enviarSolicitudVisita } from '../services/visitasApi';

type Errores = Partial<Record<keyof SolicitudVisita, string>>;
type EstadoEnvio = 'editando' | 'enviando' | 'exito' | 'error';

// La visita más pronta posible es mañana. 'en-CA' da el formato YYYY-MM-DD que usa <input type="date">
function fechaDeManana(): string {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return manana.toLocaleDateString('en-CA');
}

function validar(datos: SolicitudVisita): Errores {
    const errores: Errores = {};
    if (datos.nombre.trim().length < 3) {
        errores.nombre = 'Escribe tu nombre completo.';
    }
    if (!/^3\d{9}$/.test(datos.telefono)) {
        errores.telefono = 'Celular colombiano de 10 dígitos, empezando por 3.';
    }
    if (datos.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo)) {
        errores.correo = 'Correo no válido.';
    }
    if (!datos.fechaPreferida || datos.fechaPreferida < fechaDeManana()) {
        errores.fechaPreferida = 'Elige una fecha a partir de mañana.';
    }
    if (!datos.aceptaTratamientoDatos) {
        errores.aceptaTratamientoDatos = 'Debes autorizar el tratamiento de tus datos.';
    }
    return errores;
}

interface Props {
    lote: Lote;
    onCerrar: () => void;
}

export default function FormularioVisita({ lote, onCerrar }: Props) {
    const [datos, setDatos] = useState<SolicitudVisita>({
        loteId: lote.id,
        nombre: '',
        telefono: '',
        correo: '',
        fechaPreferida: '',
        franja: 'MANANA',
        mensaje: '',
        aceptaTratamientoDatos: false,
    });
    const [errores, setErrores] = useState<Errores>({});
    const [estado, setEstado] = useState<EstadoEnvio>('editando');

    // Actualiza un solo campo, manteniendo el resto
    function actualizar<K extends keyof SolicitudVisita>(campo: K, valor: SolicitudVisita[K]) {
        setDatos((anterior) => ({ ...anterior, [campo]: valor }));
    }

    async function enviar(e: FormEvent) {
        e.preventDefault(); // evita que el navegador recargue la página
        const nuevosErrores = validar(datos);
        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) return;

        setEstado('enviando');
        try {
            await enviarSolicitudVisita(datos);
            setEstado('exito');
        } catch {
            setEstado('error');
        }
    }

    return (
        <div className="modal-fondo" onClick={onCerrar}>
            {/* stopPropagation: un clic dentro del formulario no debe cerrarlo */}
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <button className="panel-cerrar" onClick={onCerrar} aria-label="Cerrar">×</button>

                {estado === 'exito' ? (
                    <div className="exito">
                        <h2>¡Solicitud enviada!</h2>
                        <p>
                            El vendedor te contactará al <b>{datos.telefono}</b> para confirmar tu visita al
                            Lote {lote.numero} de la Manzana {lote.manzana}.
                        </p>
                        <button className="btn-primario" onClick={onCerrar}>Volver al mapa</button>
                    </div>
                ) : (
                    <form onSubmit={enviar} noValidate>
                        <p className="panel-sub">Manzana {lote.manzana} · Lote {lote.numero}</p>
                        <h2>Agendar visita</h2>

                        <label className="campo">
                            Nombre completo *
                            <input
                                value={datos.nombre}
                                onChange={(e) => actualizar('nombre', e.target.value)}
                                autoComplete="name"
                            />
                            {errores.nombre && <span className="error">{errores.nombre}</span>}
                        </label>

                        <label className="campo">
                            Celular *
                            <input
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="3001234567"
                                value={datos.telefono}
                                // Solo deja escribir números
                                onChange={(e) => actualizar('telefono', e.target.value.replace(/\D/g, ''))}
                                autoComplete="tel"
                            />
                            {errores.telefono && <span className="error">{errores.telefono}</span>}
                        </label>

                        <label className="campo">
                            Correo (opcional)
                            <input
                                type="email"
                                value={datos.correo}
                                onChange={(e) => actualizar('correo', e.target.value)}
                                autoComplete="email"
                            />
                            {errores.correo && <span className="error">{errores.correo}</span>}
                        </label>

                        <div className="fila">
                            <label className="campo">
                                Fecha preferida *
                                <input
                                    type="date"
                                    min={fechaDeManana()}
                                    value={datos.fechaPreferida}
                                    onChange={(e) => actualizar('fechaPreferida', e.target.value)}
                                />
                                {errores.fechaPreferida && <span className="error">{errores.fechaPreferida}</span>}
                            </label>

                            <label className="campo">
                                Horario
                                <select
                                    value={datos.franja}
                                    onChange={(e) => actualizar('franja', e.target.value as SolicitudVisita['franja'])}
                                >
                                    <option value="MANANA">Mañana</option>
                                    <option value="TARDE">Tarde</option>
                                </select>
                            </label>
                        </div>

                        <label className="campo">
                            Mensaje (opcional)
                            <textarea
                                rows={3}
                                placeholder="¿Alguna pregunta sobre el lote?"
                                value={datos.mensaje}
                                onChange={(e) => actualizar('mensaje', e.target.value)}
                            />
                        </label>

                        <label className="check">
                            <input
                                type="checkbox"
                                checked={datos.aceptaTratamientoDatos}
                                onChange={(e) => actualizar('aceptaTratamientoDatos', e.target.checked)}
                            />
                            <span>
                Autorizo el tratamiento de mis datos personales para ser contactado sobre este lote,
                conforme a la Ley 1581 de 2012.
              </span>
                        </label>
                        {errores.aceptaTratamientoDatos && (
                            <span className="error">{errores.aceptaTratamientoDatos}</span>
                        )}

                        {estado === 'error' && (
                            <p className="error">No pudimos enviar la solicitud. Intenta de nuevo.</p>
                        )}

                        <button type="submit" className="btn-primario" disabled={estado === 'enviando'}>
                            {estado === 'enviando' ? 'Enviando…' : 'Solicitar visita'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}