import { useEffect, useRef, useState } from 'react';
import './AccordionGallery.css';

/*
  AccordionGallery — port del componente de reactbits.dev.

  Que se ha cambiado respecto al original, y por que:

  1. NO usa GSAP. El proyecto tiene una sola libreria de animacion (anime.js
     v4) y CLAUDE.md lo dice explicitamente. Pero es que ademas aqui GSAP no
     hacia falta: todo lo que animaba el original son ESTADOS DISCRETOS (un
     panel esta abierto o no lo esta), que es justo el caso que resuelven las
     transiciones de CSS. Es el mismo contrato que ya usan .arandano__cert y
     .mapa--destacado: el JS decide el estado, el CSS lo transiciona.

     La consecuencia practica es que no hay ni un calculo por fotograma: el
     original montaba una timeline de GSAP con 3 tweens por panel en cada
     cambio de panel activo. Aqui solo cambian unas custom properties.

  2. anime.js entra por la puerta de siempre: la galeria APARECE con el scroll
     desde la seccion que la monta (ver Paisaje.jsx), no desde aqui.

  3. Las rutas de las imagenes pasan por recurso() en el sitio donde se
     declaran los items, nunca aqui dentro (el sitio se sirve en /ZhendaConsumidor/).

  4. Los colores por defecto salen de los tokens. Como los props se inyectan
     como valores de custom properties, un `var(--c-berry-900)` funciona igual
     que un hex, y asi el componente no escribe un solo color literal.

  El API (nombres y significado de los props) se mantiene igual que en
  reactbits para que la tabla de la documentacion original siga valiendo y se
  pueda comparar con la version de upstream el dia que cambie.
*/

const ITEMS_POR_DEFECTO = [
  { image: 'https://picsum.photos/id/1015/900/1200', label: 'Canyon' },
  { image: 'https://picsum.photos/id/1018/900/1200', label: 'Ridgeline' },
  { image: 'https://picsum.photos/id/1039/900/1200', label: 'Falls' },
  { image: 'https://picsum.photos/id/1043/900/1200', label: 'Harbour' },
  { image: 'https://picsum.photos/id/1044/900/1200', label: 'Skyline' },
];

/* Cuanto se desplaza la imagen dentro de su panel, y cuanto mas ancha es la
   imagen que el hueco que ocupa. Son los dos numeros magicos del original;
   quedan con nombre para que se vea que uno depende del otro: si la imagen no
   fuera mas ancha que el panel, la deriva del parallax dejaria bordes vacios. */
const DERIVA = 0.06;
const HOLGURA_IMAGEN = 1.22;

export default function AccordionGallery({
  items = ITEMS_POR_DEFECTO,
  defaultIndex = 2,
  accentColor = 'var(--c-paper)',
  overlayColor = 'var(--c-berry-900)',
  textColor = 'var(--c-paper)',
  height = 460,
  gap = 10,
  radius = 16,
  expandRatio = 0.52,
  orientation = 'horizontal',
  duration = 0.6,
  /* Antes era un ease de GSAP ('power3.out'). Ahora es una funcion de
     temporizacion de CSS, asi que por defecto vale el token del sitio. */
  ease = 'var(--ease-out)',
  parallax = 0.5,
  tilt = 8,
  stagger = 0.06,
  trigger = 'hover',
  showLabels = true,
  grayscale = true,
  className = '',
}) {
  const raiz = useRef(null);
  const vertical = orientation === 'vertical';
  const total = items.length;

  const [activo, setActivo] = useState(() => Math.min(Math.max(defaultIndex, 0), total - 1));
  /* Ancho (o alto) de la imagen dentro del panel. Lo mide un ResizeObserver
     porque depende del tamano real de la galeria, no del de la ventana: la
     galeria vive dentro de un contenedor que ya tiene sus propios margenes. */
  const [medida, setMedida] = useState(320);

  const ratio = Math.min(Math.max(expandRatio, 0.2), 0.9);
  /* flex-grow del panel abierto para que ocupe exactamente `ratio` de la fila:
     si el abierto crece G y los otros (n-1) crecen 1, su parte es
     G / (G + n - 1) = ratio  ->  G = ratio * (n - 1) / (1 - ratio). */
  const crecimiento = total > 1 ? (ratio * (total - 1)) / (1 - ratio) : 1;

  useEffect(() => {
    const el = raiz.current;
    if (!el) return undefined;

    const medir = () => {
      const caja = el.getBoundingClientRect();
      const largo = vertical ? caja.height : caja.width;
      const util = Math.max(largo - gap * (total - 1), 120);
      setMedida(Math.max(140, util * ratio * HOLGURA_IMAGEN));
    };

    medir();
    // Observa la galeria, no la ventana: asi tambien reacciona cuando lo que
    // cambia de tamano es el contenedor (riel lateral, barra del movil).
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    return () => observador.disconnect();
  }, [vertical, gap, total, ratio]);

  const alEntrar = (i) => {
    if (trigger === 'hover') setActivo(i);
  };

  const alPulsar = (i, evento) => {
    // Un panel cerrado se abre; solo el que ya esta abierto deja pasar el clic
    // a su enlace, si lo tiene. Asi el primer toque en movil nunca navega.
    if (i !== activo) {
      evento.preventDefault();
      setActivo(i);
    }
  };

  const alTeclear = (i, evento) => {
    if (evento.key === 'ArrowRight' || evento.key === 'ArrowDown') {
      evento.preventDefault();
      setActivo((i + 1) % total);
    } else if (evento.key === 'ArrowLeft' || evento.key === 'ArrowUp') {
      evento.preventDefault();
      setActivo((i - 1 + total) % total);
    }
  };

  return (
    <div
      ref={raiz}
      className={`accordion-gallery${vertical ? ' accordion-gallery--vertical' : ''}${
        className ? ` ${className}` : ''
      }`}
      style={{
        '--ag-accent': accentColor,
        '--ag-overlay': overlayColor,
        '--ag-text': textColor,
        '--ag-gap': `${gap}px`,
        '--ag-radius': `${radius}px`,
        '--ag-dur': `${duration}s`,
        '--ag-ease': ease,
        '--ag-stagger': `${stagger}s`,
        '--ag-media': `${medida}px`,
        height: vertical ? `${Math.round(height * 1.6)}px` : `${height}px`,
      }}
      role="list"
      aria-label="Galería de imágenes"
    >
      {items.map((item, i) => {
        const abierto = i === activo;
        const Etiqueta = item.link ? 'a' : 'div';

        /* Los cerrados se inclinan hacia el abierto: los de su izquierda en un
           sentido y los de su derecha en el otro, de modo que el conjunto se
           lee como un libro que se abre por el panel activo. */
        const giro = abierto ? 0 : i < activo ? tilt : -tilt;
        /* La imagen del panel cerrado se desplaza hacia el abierto. Se limita
           a 1,5 paneles de distancia: mas alla el desplazamiento sacaria la
           imagen de su hueco. */
        const distancia = Math.max(-1.5, Math.min(1.5, activo - i));
        const desvio = abierto ? 0 : distancia * parallax * medida * DERIVA;

        return (
          <Etiqueta
            key={item.image}
            className={`ag-panel${abierto ? ' ag-panel--activo' : ''}`}
            style={{
              flexGrow: abierto ? crecimiento : 1,
              '--ag-giro': `${giro}deg`,
              '--ag-desvio': `${desvio}px`,
              '--ag-gris': grayscale && !abierto ? 1 : 0,
              '--ag-tinte': abierto ? 0 : 0.35,
            }}
            href={item.link || undefined}
            onClick={(evento) => alPulsar(i, evento)}
            onMouseEnter={() => alEntrar(i)}
            onFocus={() => setActivo(i)}
            onKeyDown={(evento) => alTeclear(i, evento)}
            role="listitem"
            tabIndex={0}
            aria-current={abierto ? 'true' : undefined}
            aria-label={item.label}
          >
            <span className="ag-panel__marco">
              <span className="ag-panel__media">
                <img src={item.image} alt={item.alt || item.label || ''} draggable="false" />
              </span>
              <span className="ag-panel__velo" aria-hidden="true" />
            </span>

            {showLabels && (
              <span className="ag-panel__pie" aria-hidden="true">
                <span className="ag-panel__barra" />
                <span className="ag-panel__texto">{item.label}</span>
              </span>
            )}
          </Etiqueta>
        );
      })}
    </div>
  );
}
