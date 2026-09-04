import { animate, stagger, text, utils } from 'animejs';
import { Link } from 'react-router-dom';
import { useAnimeScope } from '../../hooks/useAnimeScope.js';
import { DUR, EASE, RISE, prefersReducedMotion } from '../../animations/motion.js';
import { parallax } from '../../animations/scroll.js';
import { recurso } from '../../recursos.js';
import BarraSeccion from '../ui/BarraSeccion.jsx';
import './Hero.css';

/*
  Portada: lo primero que ve quien escanea el QR del envase.

  Muestra la marca, el numero de clamshell que la persona tiene delante y el
  lote al que pertenece. Ese par es el ancla de todo lo que viene despues:
  el resto de la pagina cuenta el recorrido de ESE lote.

  Alrededor de ese par, la ficha resume el lote: el indice Brix, quien lo
  recolecto y bajo que certificaciones. Son un resumen, no la explicacion:
  el Brix se cuenta despacio en #quimicos y ahi es donde se explica.

  Clases disponibles en Hero.css:
    .hero, .hero__fondo, .hero__blob, .hero__blob--secundario,
    .hero__contenido, .hero__marca, .hero__logo, .hero__nombre,
    .hero__titulo, .hero__identidad, .hero__datos, .hero__dato,
    .hero__dato--principal,
    .hero__dato-etiqueta, .hero__dato-valor, .hero__dato-unidad,
    .hero__dato-nota, .hero__recolector, .hero__recolector-icono,
    .hero__recolector-texto, .hero__recolector-nombre,
    .hero__recolector-detalle, .hero__certs, .hero__cert,
    .hero__acciones, .hero__scroll, .hero__scroll-linea, .char,
    .boton, .boton--primario, .boton--fantasma

  El ref `root` acota los selectores de anime.js a esta seccion.
*/

/* Persona. Mismo envoltorio que los iconos del riel: 24x24, trazo, sin
   relleno, `currentColor`. Decorativo: quien lo describe es el texto de al
   lado, asi que va aria-hidden. */
function IconoPersona() {
  return (
    <svg
      className="hero__recolector-icono"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 7a4 4 0 1 0 0 8a4 4 0 0 0 0 -8" />
      <path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
    </svg>
  );
}

/* --- Parametros de la entrada ---------------------------------------- */
const ENTRADA = {
  arranque: 120, // espera inicial: la portada no salta nada mas montar
  caracter: 24, // retardo entre letras del titulo
  bloque: 110, // retardo entre bloques (marca, texto, ficha, acciones)
  parallax: 60, // px que el fondo se desplaza a contramano del scroll
};
/* --------------------------------------------------------------------- */

export default function Hero({ lote }) {
  const root = useAnimeScope(() => {
    const titulo = utils.$('.hero__titulo')[0];
    const entradas = utils.$('.hero__entrada');
    if (!titulo || !entradas.length) return;

    if (prefersReducedMotion()) {
      utils.set([titulo, ...entradas], { opacity: 1, y: 0 });
      return;
    }

    // Un <span> por caracter. Sin `chars.class` solo se anadiria data-char y
    // no habria nada que animar ni que estilar. El scope deshace el split.
    const partido = text.split(titulo, { chars: { class: 'char' } });
    // El h1 nace con opacity 0 (clase `reveal`) para que no se vea la frase
    // entera un frame antes de partirse; a partir de aqui mandan los chars.
    utils.set(titulo, { opacity: 1 });

    animate(partido.chars, {
      opacity: [0, 1],
      y: [RISE, 0],
      duration: DUR.base,
      ease: EASE.out,
      delay: stagger(ENTRADA.caracter, { start: ENTRADA.arranque }),
    });

    // Esto NO es una animacion de scroll: la portada ya esta en pantalla al
    // cargar, asi que corre por tiempo. El scroll llega en la seccion siguiente.
    animate(entradas, {
      opacity: [0, 1],
      y: [RISE, 0],
      duration: DUR.base,
      ease: EASE.out,
      delay: stagger(ENTRADA.bloque, { start: ENTRADA.arranque + DUR.fast }),
    });

    // El fondo si va ligado al scroll (scrub): se queda atras al bajar.
    parallax('.hero__fondo', ENTRADA.parallax);
  }, [lote.clamshell]);

  return (
    <section className="hero con-barra" ref={root}>
      {/* Ayuda de depuracion: quitar junto con BarraSeccion. */}
      <BarraSeccion nombre="Hero" color="var(--c-berry-800)" />

      {/* Capa decorativa aparte del contenido: si el parallax moviera el
          nodo que envuelve al texto, se llevaria el texto con el. */}
      <div className="hero__fondo" aria-hidden="true">
        <span className="hero__blob"></span>
        <span className="hero__blob hero__blob--secundario"></span>
      </div>

      <div className="container hero__contenido">
        {/* alt vacio a proposito: el logo no anade informacion que el
            nombre de al lado no diga ya, y repetirlo obliga al lector de
            pantalla a oir "Zhenda" dos veces. */}
        <div className="hero__marca hero__entrada reveal">
          <img className="hero__logo" src={recurso('images/logo.png')} alt="" width="48" height="48" />
          <span className="hero__nombre">Zhenda</span>
        </div>

        {/* Se escribe como una frase normal: los <span> por caracter los
            genera text.split() en tiempo de ejecucion, nunca a mano. */}
        <h1 className="hero__titulo reveal">Del arbusto a tu mesa, sin puntos ciegos.</h1>

        <p className="lead hero__entrada reveal">
          Los arándanos {lote.variedad} de este envase se cosecharon en {lote.fundo}.
        </p>

        {/* Ficha de identidad. Es un <dl>: cada dato es un par etiqueta-valor,
            no una lista de frases. La nota va fuera del <dl> porque dentro
            solo pueden vivir dt/dd (o divs que los envuelvan). */}
        <div className="hero__identidad hero__entrada reveal">
          <dl className="hero__datos">
            <div className="hero__dato hero__dato--principal">
              <dt className="hero__dato-etiqueta">Clamshell</dt>
              {/* El valor va en su propio nodo, sin texto alrededor: es el que
                  se copia, se lee en voz alta y el que animaremos si hace falta. */}
              <dd className="hero__dato-valor">{lote.clamshell}</dd>
            </div>

            <div className="hero__dato">
              <dt className="hero__dato-etiqueta">Lote</dt>
              <dd className="hero__dato-valor">{lote.codigo}</dd>
            </div>

            <div className="hero__dato">
              <dt className="hero__dato-etiqueta">Índice Brix</dt>
              {/* Aqui el valor SI lleva compania: la unidad es parte del dato
                  y nada la reescribe. La regla de "un nodo por valor" solo
                  aplica cuando el JS pisa el textContent, como en #quimicos. */}
              <dd className="hero__dato-valor">
                {lote.brix.toFixed(1)}
                <span className="hero__dato-unidad">°Bx</span>
              </dd>
            </div>
          </dl>

          {/* Quien recogio el fruto. Es la unica persona con nombre en toda
              la pagina: el resto son plantas, camaras y contenedores. */}
          <p className="hero__recolector">
            <IconoPersona />
            <span className="hero__recolector-texto">
              <strong className="hero__recolector-nombre">{lote.cosechador.nombre}</strong>
              <span className="hero__recolector-detalle">
                Recolectó este lote · {lote.cosechador.cuadrilla} · {lote.cosechador.campanas}{' '}
                campañas en el fundo
              </span>
            </span>
          </p>

          <ul className="hero__certs">
            {lote.certificaciones.map((certificacion) => (
              <li className="hero__cert" key={certificacion}>
                {certificacion}
              </li>
            ))}
          </ul>

          <p className="hero__dato-nota">
            Clamshell y lote van impresos en la etiqueta del envase. El resto sale del registro
            del lote.
          </p>
        </div>

        <div className="hero__acciones hero__entrada reveal">
          <Link className="boton boton--primario" to={`/lote/${lote.codigo}`}>
            Ver el recorrido
          </Link>
          <a className="boton boton--fantasma" href="#buscar">
            Rastrear otro lote
          </a>
        </div>
      </div>

      <div className="hero__scroll hero__entrada reveal" aria-hidden="true">
        <span>Desplaza</span>
        {/* La linea es forma pura: por eso es un span vacio */}
        <span className="hero__scroll-linea"></span>
      </div>
    </section>
  );
}
