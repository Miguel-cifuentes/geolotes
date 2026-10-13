import { useState } from 'react';
import MapaLotes from './components/MapaLotes';
import PanelLote from './components/PanelLote';
import Leyenda from './components/Leyenda';
import type { Lote } from './types/lote';

export default function App() {
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);

  return (
      <div className="app">
        <header className="barra">
          <span className="marca">Geo<b>Lotes</b></span>
          <span className="eslogan">Tu próximo lote está aquí</span>
        </header>

        <main className="contenido">
          <MapaLotes
              loteSeleccionadoId={loteSeleccionado?.id ?? null}
              onSeleccionar={setLoteSeleccionado}
          />
          <Leyenda />
          {loteSeleccionado && (
              <PanelLote lote={loteSeleccionado} onCerrar={() => setLoteSeleccionado(null)} />
          )}
        </main>
      </div>
  );
}
