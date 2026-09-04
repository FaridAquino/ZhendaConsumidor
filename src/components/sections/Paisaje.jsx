import { revealOnScroll } from '../../animations/scroll.js';
import { useAnimeScope } from '../../hooks/useAnimeScope.js';
import AccordionGallery from '../ui/AccordionGallery.jsx';
import { recurso } from '../../recursos.js';
import './Paisaje.css';

/*
  Apartado visual de #recoleccion: despues del fruto, la historia vuelve a Ica.

  Va en su propia seccion y no dentro de Mapa porque aquella mide varias
  pantallas de alto con un viewport `sticky` dentro: cualquier cosa que se
  anada despues del sticky queda tapada por el.
*/

/* Contenido editorial, como EMPRESA en Empresa.jsx: no sale del lote. El
   orden cuenta un acercamiento — el fundo entero, el valle, la mata — asi que
   si se anaden fotos conviene mantener ese sentido.

   Las rutas pasan por recurso() y SIN barra inicial: el sitio se sirve en
   /ZhendaConsumidor/ y Vite no reescribe las cadenas de JavaScript. */
const VISTAS = [
  {
    image: recurso('images/ica/ICA-1.jpeg'),
    label: 'El fundo desde el aire',
    alt: 'Vista aérea de las parcelas de cultivo abriéndose entre los cerros de arena del desierto de Ica.',
  },
  {
    image: recurso('images/ica/ICA-3.jpeg'),
    label: 'El valle al caer la tarde',
    alt: 'Atardecer sobre el valle de Ica, con los campos de cultivo en primer plano y un cerro al fondo.',
  },
  {
    image: recurso('images/ica/ICA-7.jpeg'),
    label: 'Mata a mata',
    alt: 'Hilera de plantas de arándano en maceta, cargadas de fruto en distintos puntos de maduración.',
  },
];

/* --- Parametros de la galeria ----------------------------------------
   Se quedan aqui, junto a las fotos, porque son decisiones de esta seccion y
   no del componente: el componente sirve para cualquier galeria. */
const GALERIA = {
  abiertaAlCargar: 1, // el atardecer: la foto que mejor entra en frio
  reparto: 0.5, // fraccion de la fila que ocupa la abierta
  alto: 520,
  hueco: 12, // = var(--space-3), pero el prop pide un numero
  radio: 24, // = var(--radius-lg)
  inclinacion: 6, // grados de las cerradas; el original trae 8 y se pasa
  duracion: 0.7, // = var(--dur-slow)
};
/* --------------------------------------------------------------------- */

export default function Paisaje() {
  const root = useAnimeScope(() => {
    // Bloque compacto: entra en cascada, que es la excepcion para la que
    // existe `group` (ver la nota de revealOnScroll sobre los observers).
    revealOnScroll('.reveal', { group: true, each: 120 });
  });

  return (
    <section className="section paisaje" ref={root} id="paisaje">

      <div className="container">
        <div className="paisaje__cabecera reveal">
          <p className="eyebrow">El valle</p>
          <h2 className="paisaje__titulo">Donde crece</h2>
          <p className="lead paisaje__lead">
            Tres vistas del mismo sitio: el fundo entero desde el aire, el valle al caer la tarde y
            la mata cargada de fruto. Pasa por encima de cada una para abrirla.
          </p>
        </div>

        <div className="paisaje__galeria reveal">
          <AccordionGallery
            items={VISTAS}
            defaultIndex={GALERIA.abiertaAlCargar}
            expandRatio={GALERIA.reparto}
            height={GALERIA.alto}
            gap={GALERIA.hueco}
            radius={GALERIA.radio}
            tilt={GALERIA.inclinacion}
            duration={GALERIA.duracion}
            trigger="hover"
          />
        </div>
      </div>
    </section>
  );
}
