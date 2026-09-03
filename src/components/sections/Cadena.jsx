import { useAnimeScope } from '../../hooks/useAnimeScope.js';
import './Cadena.css';

/*
  Clases disponibles en Cadena.css:
    .cadena, .cadena__intro, .cadena__pista, .cadena__linea,
    .cadena__lista, .cadena__etapa, .cadena__punto,
    .cadena__indice, .cadena__tarjeta
*/
export default function Cadena() {
  const root = useAnimeScope(() => {
    // aqui van las animaciones de la cadena de trazabilidad
  });

  return (
    <section className="section cadena" id="cadena" ref={root}>
      <div className="container"></div>
    </section>
  );
}
