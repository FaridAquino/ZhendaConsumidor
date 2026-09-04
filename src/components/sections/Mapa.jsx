import { animate, onScroll, utils } from 'animejs';
import { REGIONES, VISTA_ICA, VISTA_PERU } from '../../data/peru.js';
import { useAnimeScope } from '../../hooks/useAnimeScope.js';
import { prefersReducedMotion } from '../../animations/motion.js';
import './Mapa.css';

/*
  Paso 1 del pipeline: donde se recolecto el fruto.

  La seccion mide varias pantallas de alto y dentro lleva un viewport `sticky`:
  mientras ese bloque queda anclado, el scroll hace de barra de progreso del
  zoom. El mapa entero se ve al entrar y termina enfocado en Ica.

  El zoom NO toca el atributo `viewBox` (obliga a revectorizar el SVG en cada
  frame). Se anima un `transform` sobre el <g>, que el navegador puede componer.
*/

const REGION_FOCO = 'ica';

/* Datos de ejemplo: reemplazar por los reales antes de publicar. */
const CARACTERISTICAS = [
  { dato: 'Costa sur', detalle: 'Valles de Ica, Pisco y Villacurí' },
  { dato: '400 msnm', detalle: 'Altitud media de los fundos' },
  { dato: 'Ago — Mar', detalle: 'Ventana de cosecha del arándano' },
];

/* --- Parametros del enfoque ------------------------------------------ */
const ENFOQUE = {
  margen: 0.55, // aire alrededor de Ica al final del zoom (0 = pegado)
  destaca: 0.35, // progreso al que Ica se enciende
  ficha: 0.6, // progreso al que aparece el texto
  suavizado: 0.35, // 0 = pegado al scroll, mas alto = mas inercia
};
/* --------------------------------------------------------------------- */

/* Del recuadro de Ica al transform que lo lleva al centro de la vista.
   Un punto p del mapa acaba en escala * p + desplazamiento. */
function calcularEnfoque(vista) {
  const escala = VISTA_PERU.ancho / vista.ancho;
  return {
    escala,
    x: VISTA_PERU.ancho / 2 - escala * (vista.x + vista.ancho / 2),
    y: VISTA_PERU.alto / 2 - escala * (vista.y + vista.alto / 2),
  };
}

export default function Mapa() {
  const root = useAnimeScope((scope) => {
    const grupo = utils.$('.mapa__grupo')[0];
    // OJO: la seccion es la RAIZ del scope, no un descendiente. Los selectores
    // se resuelven con `scope.root.querySelectorAll()`, que nunca devuelve la
    // propia raiz; `utils.$('.mapa')` daria una lista vacia.
    const seccion = scope.root;
    if (!grupo || !seccion) return;

    const destino = calcularEnfoque(VISTA_ICA);

    // Los estados discretos (Ica encendida, ficha visible) son clases: CSS los
    // transiciona. anime.js solo mueve el mapa, sin pisarse con el.
    const marcar = (progreso) => {
      seccion.classList.toggle('mapa--destacado', progreso >= ENFOQUE.destaca);
      seccion.classList.toggle('mapa--con-ficha', progreso >= ENFOQUE.ficha);
    };

    if (prefersReducedMotion()) {
      utils.set(grupo, { scale: destino.escala, x: destino.x, y: destino.y });
      marcar(1);
      return;
    }

    animate(grupo, {
      scale: [1, destino.escala],
      x: [0, destino.x],
      y: [0, destino.y],
      ease: 'linear',
      onUpdate: (anim) => marcar(anim.progress),
      autoplay: onScroll({
        // El viewport es `sticky`: el progreso va de que la seccion toca el
        // borde superior a que su final alcanza el borde inferior.
        target: seccion,
        enter: 'start start',
        leave: 'end end',
        sync: ENFOQUE.suavizado,
      }),
    });
  });

  return (
    <section className="mapa sangrado" ref={root} id="recoleccion">

      <div className="mapa__viewport">
        <svg
          className="mapa__svg"
          viewBox={`${VISTA_PERU.x} ${VISTA_PERU.y} ${VISTA_PERU.ancho} ${VISTA_PERU.alto}`}
          role="img"
          aria-label="Mapa del Perú con la región de Ica destacada"
        >
          <g className="mapa__grupo">
            {REGIONES.map((region) => (
              <path
                key={region.id}
                className={
                  region.id === REGION_FOCO ? 'mapa__region mapa__region--foco' : 'mapa__region'
                }
                d={region.d}
              />
            ))}
          </g>
        </svg>

        <aside className="mapa__ficha">
          <p className="eyebrow">Recolección</p>
          <h2 className="mapa__titulo">Ica</h2>
          <p className="mapa__lead">
            Desierto costero al sur de Lima. Sin lluvia, con sol constante y riego medido: la
            combinación que da al arándano su calibre y sus grados brix.
          </p>
          <ul className="mapa__datos">
            {CARACTERISTICAS.map(({ dato, detalle }) => (
              <li className="mapa__dato" key={dato}>
                <strong className="mapa__dato-valor">{dato}</strong>
                <span className="mapa__dato-detalle">{detalle}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
