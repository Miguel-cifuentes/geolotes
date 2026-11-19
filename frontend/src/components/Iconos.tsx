import type { ReactNode, SVGProps } from 'react';

// Íconos lineales con el mismo grosor en toda la app (manual de marca, sección 07)
type Props = SVGProps<SVGSVGElement>;

function Icono({ children, ...props }: Props & { children: ReactNode }) {
    return (
        <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            {children}
        </svg>
    );
}

export function IconoCerrar(p: Props) {
    return <Icono {...p}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icono>;
}

export function IconoUbicacion(p: Props) {
    return (
        <Icono {...p}>
            <path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0" />
            <circle cx="12" cy="10" r="3" />
        </Icono>
    );
}

export function IconoTelefono(p: Props) {
    return (
        <Icono {...p}>
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
        </Icono>
    );
}

export function IconoMensaje(p: Props) {
    return <Icono {...p}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" /></Icono>;
}

export function IconoCalendario(p: Props) {
    return (
        <Icono {...p}>
            <path d="M8 2v4" /><path d="M16 2v4" />
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M3 10h18" />
        </Icono>
    );
}

export function IconoCompartir(p: Props) {
    return (
        <Icono {...p}>
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="m8.6 13.5 6.8 4" /><path d="m15.4 6.5-6.8 4" />
        </Icono>
    );
}

export function IconoArea(p: Props) {
    return (
        <Icono {...p}>
            <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
        </Icono>
    );
}

export function IconoGrafica(p: Props) {
    return <Icono {...p}><path d="M3 3v18h18" /><path d="M8 16v-3" /><path d="M13 16V9" /><path d="M18 16v-6" /></Icono>;
}

export function IconoFiltros(p: Props) {
    return (
        <Icono {...p}>
            <path d="M4 6h9" /><path d="M17 6h3" /><path d="M4 12h3" /><path d="M11 12h9" />
            <path d="M4 18h11" /><path d="M19 18h1" />
            <circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="18" r="2" />
        </Icono>
    );
}

export function IconoFlecha(p: Props) {
    return <Icono {...p}><path d="m6 9 6 6 6-6" /></Icono>;
}

export function IconoCheck(p: Props) {
    return <Icono {...p}><path d="M20 6 9 17l-5-5" /></Icono>;
}

export function IconoInfo(p: Props) {
    return <Icono {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></Icono>;
}

export function IconoAlerta(p: Props) {
    return (
        <Icono {...p}>
            <path d="m21.7 18-8-14a2 2 0 0 0-3.5 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
        </Icono>
    );
}

export function IconoRecargar(p: Props) {
    return <Icono {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></Icono>;
}

export function IconoLlave(p: Props) {
    return (
        <Icono {...p}>
            <circle cx="7.5" cy="15.5" r="5.5" />
            <path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" />
        </Icono>
    );
}
