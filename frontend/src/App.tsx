import { useState } from 'react';
import VistaMapa from './components/VistaMapa';
import Encabezado from './components/Encabezado';
import { AvisoCopia, Cargando, ErrorCarga } from './components/EstadosCarga';
import InicioSesion from './components/InicioSesion';
import { useLotes } from './hooks/useLotes';
import { useSesion } from './hooks/useSesion';
import { cerrarSesion } from './services/sesion';

// ?vendedor en la dirección abre la vista del vendedor (así una recarga no lo devuelve a comprador)
const pideVendedor = () => new URLSearchParams(window.location.search).has('vendedor');

function marcarVendedorEnDireccion(activo: boolean) {
    const url = new URL(window.location.href);
    if (activo) url.searchParams.set('vendedor', '');
    else url.searchParams.delete('vendedor');
    window.history.replaceState(null, '', url.toString().replace('vendedor=', 'vendedor'));
}

export default function App() {
    const { estado, lotes, copiaDel, reintentar, actualizarLote, recargar } = useLotes();
    const sesion = useSesion();
    // Vista que eligió la persona. Las herramientas solo aparecen si además hay sesión.
    const [vistaVendedor, setVistaVendedor] = useState(pideVendedor);
    const modoVendedor = vistaVendedor && sesion !== null;

    function cambiarVista(vendedor: boolean) {
        setVistaVendedor(vendedor);
        marcarVendedorEnDireccion(vendedor);
    }

    // "Soy vendedor" siempre pide usuario y contraseña
    function entrarComoVendedor() {
        cerrarSesion();
        cambiarVista(true);
    }

    // "Volver a comprador" cierra la sesión: nadie queda con permisos en ese navegador
    function volverAComprador() {
        cerrarSesion();
        cambiarVista(false);
    }

    const total = lotes?.features.length ?? 0;
    const disponibles = lotes?.features.filter((f) => f.properties.estado === 'DISPONIBLE').length ?? 0;

    return (
        <div className="app">
            <Encabezado
                disponibles={disponibles}
                total={total}
                sesion={sesion}
                modoVendedor={modoVendedor}
                onSoyVendedor={entrarComoVendedor}
                onVolverAComprador={volverAComprador}
            />

            {/* Aviso entre la barra y el mapa: no tapa los filtros ni la ficha */}
            {lotes && copiaDel && (
                <AvisoCopia fecha={copiaDel} reintentando={estado === 'cargando'} onReintentar={reintentar} />
            )}

            <main className="contenido">
                {lotes ? (
                    // Con datos (nuevos o de la copia) el mapa siempre se muestra
                    <VistaMapa
                        lotes={lotes}
                        modoVendedor={modoVendedor}
                        onLoteActualizado={actualizarLote}
                        onRecargar={recargar}
                    />
                ) : estado === 'error' ? (
                    <ErrorCarga onReintentar={reintentar} />
                ) : (
                    <Cargando />
                )}
            </main>

            {/* "Soy vendedor" sin sesión pide el ingreso; si la sesión vence, la ventana vuelve a aparecer */}
            {vistaVendedor && !sesion && <InicioSesion onCerrar={() => cambiarVista(false)} />}
        </div>
    );
}
