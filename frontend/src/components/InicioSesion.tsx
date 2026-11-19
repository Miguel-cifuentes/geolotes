import { useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { iniciarSesion } from '../services/sesion';
import { IconoAlerta, IconoCandado, IconoCerrar, IconoOjo } from './Iconos';

interface Props {
    onCerrar: () => void; // vuelve al mapa como comprador
}

// Ventana de ingreso del vendedor. Al entrar, App la cierra sola porque ya hay sesión.
export default function InicioSesion({ onCerrar }: Props) {
    const [usuario, setUsuario] = useState('');
    const [clave, setClave] = useState('');
    const [verClave, setVerClave] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function enviar(e: FormEvent) {
        e.preventDefault();
        if (!usuario.trim() || !clave) {
            setError('Escribe tu usuario y tu contraseña.');
            return;
        }
        setEnviando(true);
        setError(null);
        try {
            await iniciarSesion(usuario.trim(), clave);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
            setClave('');
            setEnviando(false);
        }
    }

    return createPortal(
        <div className="modal-fondo" onClick={enviando ? undefined : onCerrar}>
            <form
                className="modal modal-sesion"
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-sesion"
                onClick={(e) => e.stopPropagation()}
                onSubmit={enviar}
                noValidate
            >
                <button type="button" className="btn-icono modal-cerrar" onClick={onCerrar} aria-label="Cerrar" disabled={enviando}>
                    <IconoCerrar />
                </button>

                <div className="modal-cabecera">
                    <span className="sesion-icono"><IconoCandado width={22} height={22} /></span>
                    <h2 id="titulo-sesion">Acceso del vendedor</h2>
                    <p className="modal-nota">Ingresa para segmentar lotes, cambiar estados y subir videos.</p>
                </div>

                <label className="campo">
                    Usuario
                    <input
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        autoFocus
                        maxLength={40}
                        disabled={enviando}
                    />
                </label>

                <label className="campo">
                    Contraseña
                    <span className="campo-clave">
                        <input
                            type={verClave ? 'text' : 'password'}
                            value={clave}
                            onChange={(e) => setClave(e.target.value)}
                            autoComplete="current-password"
                            maxLength={100}
                            disabled={enviando}
                        />
                        <button
                            type="button"
                            className="btn-icono"
                            onClick={() => setVerClave((v) => !v)}
                            aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            aria-pressed={verClave}
                        >
                            <IconoOjo tachado={verClave} />
                        </button>
                    </span>
                </label>

                {error && (
                    <p className="alerta-error" role="alert">
                        <IconoAlerta width={16} height={16} />
                        {error}
                    </p>
                )}

                <button type="submit" className="btn-primario" disabled={enviando}>
                    {enviando ? 'Ingresando…' : 'Ingresar'}
                </button>
            </form>
        </div>,
        document.body,
    );
}
