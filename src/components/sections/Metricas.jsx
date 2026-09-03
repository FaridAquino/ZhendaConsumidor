import { useAnimeScope } from '../../hooks/useAnimeScope.js';
import './Metricas.css';

/*
  Clases disponibles en Metricas.css:
    .metricas__grid, .metrica, .metrica__valor, .metrica__etiqueta
*/
export default function Metricas() {
  const root = useAnimeScope(() => {
    // aqui van las animaciones de las metricas
  });

  return (
    <section className="section" ref={root}>
      <div className="container"></div>
    </section>
  );
}
