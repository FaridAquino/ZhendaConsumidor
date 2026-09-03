import { animate, onScroll, utils } from 'animejs';
import { useAnimeScope } from '../../hooks/useAnimeScope.js';
import { prefersReducedMotion } from '../../animations/motion.js';
import './Header.css';

/*
  Riel lateral fijo: la marca arriba y debajo el pipeline de trazabilidad.
  Vive fuera del flujo (`position: fixed`), asi que no empuja nada; el hueco
  que ocupa lo reserva `#contenido` en base.css con --riel-ancho.

  Al hacer scroll, la tuberia se va pintando de arriba abajo y cada paso se
  enciende cuando la pintura lo alcanza.

  Clases disponibles en Header.css:
    .header, .header__burbuja, .header__marca, .header__pipeline,
    .header__linea, .header__relleno, .header__pasos, .header__paso,
    .header__paso--activo, .header__nodo, .header__icono, .header__etiqueta
*/

/* Envoltorio comun de los iconos: 24x24, trazo, sin relleno. */
function Icono({ children }) {
  return (
    <svg
      className="header__icono"
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* Paso 1: el mapa. Es el que vamos a animar. */
function IconoMapa() {
  return (
    <Icono>
      <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
      <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0" />
    </Icono>
  );
}

/* Paso 2: gota, para los quimicos aplicados. */
function IconoGota() {
  return (
    <Icono>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M7 15h10v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-4" />
      <path d="M12 9a6 6 0 0 0 -6 -6h-3v2a6 6 0 0 0 6 6h3" />
      <path d="M12 11a6 6 0 0 1 6 -6h3v1a6 6 0 0 1 -6 6h-3" />
      <path d="M12 15l0 -6" />
    </Icono>
  );
}

/* Paso 3: caja, para la empresa exportadora. */
function IconoCaja() {
  return (
    <Icono>
      <path d="M12 3l9 4.5v9l-9 4.5l-9 -4.5v-9z" />
      <path d="M3 7.5l9 4.5l9 -4.5" />
      <path d="M12 12v9" />
    </Icono>
  );
}

/* --- Pasos del pipeline ---------------------------------------------
   Por ahora solo etiquetas: el contenido de cada paso llega despues. */
const PASOS = [
  { id: 'recoleccion', etiqueta: 'Recolección', Icono: IconoMapa },
  { id: 'quimicos', etiqueta: 'Químicos', Icono: IconoGota },
  { id: 'exportacion', etiqueta: 'Exportación', Icono: IconoCaja },
];

/* --- Parametros del pintado ------------------------------------------ */
const PINTADO = {
  inicio: 'start start', // arranca cuando el contenido toca el borde superior
  fin: 'end end', // termina al llegar al final de la pagina
  suavizado: 0.35, // 0 = pegado al scroll, mas alto = mas inercia
};
/* --------------------------------------------------------------------- */

export default function Header() {
  const root = useAnimeScope(() => {
    const relleno = utils.$('.header__relleno')[0];
    const pasos = utils.$('.header__paso');
    if (!relleno || !pasos.length) return;

    // Cada paso se enciende cuando la pintura pasa por su nodo. La linea va
    // del centro del primer nodo al centro del ultimo, asi que el paso i esta
    // en la fraccion i / (total - 1) del recorrido.
    const encender = (progreso) => {
      const ultimo = pasos.length - 1;
      pasos.forEach((paso, i) => {
        paso.classList.toggle('header__paso--activo', progreso >= (ultimo ? i / ultimo : 0));
      });
    };

    /* El avance se publica como variable CSS, no como `scaleY`.
       Motivo: en escritorio la tuberia es vertical y en movil horizontal, y
       si el JS escribiera el transform tendria que saber en que disposicion
       esta y volver a decidirlo en cada cambio de tamano. Escribiendo solo
       el numero, la media query de Header.css elige el eje (scaleY o scaleX)
       y el JS no se entera de que existe el movil. */
    const pintar = (valor) => relleno.style.setProperty('--pintado', valor);

    if (prefersReducedMotion()) {
      pintar(1);
      encender(1);
      return;
    }

    // El observer NO puede mirar al riel: al ser `fixed` nunca se mueve
    // respecto al viewport y jamas dispararia. Observa el contenido.
    const estado = { avance: 0 };
    animate(estado, {
      avance: 1,
      ease: 'linear',
      onUpdate: (anim) => {
        pintar(estado.avance);
        encender(anim.progress);
      },
      autoplay: onScroll({
        target: document.getElementById('contenido'),
        enter: PINTADO.inicio,
        leave: PINTADO.fin,
        sync: PINTADO.suavizado,
      }),
    });
  });

  return (
    /* --pasos lo necesita Header.css para colocar la tuberia horizontal:
       en movil va del centro del primer nodo al del ultimo, que con pasos de
       igual ancho cae en 50%/n. Se pasa desde aqui para que no haya que
       acordarse de tocar la CSS al anadir un paso. */
    <header className="header" ref={root} style={{ '--pasos': PASOS.length }}>
      <div className="header__burbuja">
        <span className="header__marca">Zhenda</span>

        <div className="header__pipeline">
          <span className="header__linea" aria-hidden="true">
            <span className="header__relleno" />
          </span>

          <ol className="header__pasos">
            {PASOS.map(({ id, etiqueta, Icono: IconoPaso }) => (
              <li className="header__paso" key={id} data-paso={id}>
                <span className="header__nodo">
                  <IconoPaso />
                </span>
                <span className="header__etiqueta">{etiqueta}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </header>
  );
}
