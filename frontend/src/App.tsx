import VistaMapa from './components/VistaMapa';
import Encabezado from './components/Encabezado';
import { AvisoCopia, Cargando, ErrorCarga } from './components/EstadosCarga';
import { useState } from 'react';
import InicioSesion from './components/InicioSesion';
import { useLotes } from './hooks/useLotes';
import { useSesion } from './hooks/useSesion';
import { cerrarSesion } from './services/sesion';

// ?vendedor en la dirección abre el ingreso del vendedor (el enlace que él guarda en su celular)
const pideVendedor = () => new URLSearchParams(window.location.search).has('vendedor');

function quitarVendedorDeDireccion() {
    const url = new URL(window.location.href);
    url.searchParams.delete('vendedor');
    window.history.replaceState(null, '', url);
}

export default function App() {
    const { estado, lotes, copiaDel, reintentar, actualizarLote, recargar } = useLotes();
    const sesion = useSesion();
    const [pideAcceso, setPideAcceso] = useState(pideVendedor);

    function volverComoComprador() {
        setPideAcceso(false);
        quitarVendedorDeDireccion();
    }

    function salir() {
        cerrarSesion();
        volverComoComprador();
    }

    const total = lotes?.features.length ?? 0;
    const disponibles = lotes?.features.filter((f) => f.properties.estado === 'DISPONIBLE').length ?? 0;

    return (
        <div className="app">
            <Encabezado disponibles={disponibles} total={total} sesion={sesion} onSalir={salir} />

            {/* Aviso entre la barra y el mapa: no tapa los filtros ni la ficha */}
            {lotes && copiaDel && (
                <AvisoCopia fecha={copiaDel} reintentando={estado === 'cargando'} onReintentar={reintentar} />
            )}

            <main className="contenido">
                {lotes ? (
                    // Con datos (nuevos o de la copia) el mapa siempre se muestra
                    <VistaMapa
                        lotes={lotes}
                        modoVendedor={sesion !== null}
                        onLoteActualizado={actualizarLote}
                        onRecargar={recargar}
                    />
                ) : estado === 'error' ? (
                    <ErrorCarga onReintentar={reintentar} />
                ) : (
                    <Cargando />
                )}
            </main>

            {/* Si la sesión vence con ?vendedor en la dirección, la ventana vuelve a aparecer */}
            {pideAcceso && !sesion && <InicioSesion onCerrar={volverComoComprador} />}
        </div>
    );
}
