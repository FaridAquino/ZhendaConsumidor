import { useParams } from 'react-router-dom';
import { useAnimeScope } from '../hooks/useAnimeScope.js';
import './Lote.css';

/*
  Clases disponibles en Lote.css:
    .lote__cabecera, .ficha, .ficha__dato,
    .recorrido__pista, .recorrido__riel, .recorrido__progreso,
    .recorrido__lista, .evento, .evento__meta, .evento__pie,
    .evento__estado, .evento__estado--ok/--warn/--alert

  Los datos y el contrato de objetos estan en src/data/lotes.js (buscarLote).
*/
export default function Lote() {
  const { codigo } = useParams();
  const root = useAnimeScope(() => {
    // aqui van las animaciones del recorrido del lote
  }, [codigo]);

  return (
    <section className="section" ref={root}>
      <div className="container"></div>
    </section>
  );
}
