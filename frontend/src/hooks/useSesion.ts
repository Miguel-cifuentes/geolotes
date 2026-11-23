import { useEffect, useState } from 'react';
import { cerrarSesion, EVENTO_SESION, leerSesion } from '../services/sesion';
import type { Sesion } from '../services/sesion';

// Sesión actual del vendedor; se actualiza al entrar, al salir, al vencer y desde otras pestañas
export function useSesion(): Sesion | null {
    const [sesion, setSesion] = useState<Sesion | null>(leerSesion);

    useEffect(() => {
        const actualizar = () => setSesion(leerSesion());
        window.addEventListener(EVENTO_SESION, actualizar);
        window.addEventListener('storage', actualizar); // entró o salió en otra pestaña
        return () => {
            window.removeEventListener(EVENTO_SESION, actualizar);
            window.removeEventListener('storage', actualizar);
        };
    }, []);

    // Cierra la sesión sola cuando el token vence
    useEffect(() => {
        if (!sesion) return;
        const temporizador = window.setTimeout(cerrarSesion, Math.max(0, sesion.expiraEn - Date.now()));
        return () => window.clearTimeout(temporizador);
    }, [sesion]);

    return sesion;
}
