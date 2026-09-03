import { animate, onScroll, stagger, utils } from 'animejs';
import { DUR, EASE, RISE, prefersReducedMotion } from './motion.js';

/**
 * Umbrales de scroll usados en todo el sitio.
 * Sintaxis anime.js v4: '<posicion en el contenedor> <posicion en el target>'.
 * 'end start'  -> el borde inferior del viewport toca el borde superior del target.
 */
export const THRESHOLD = {
  enterSoon: 'end-=8% start',
  enterLate: 'end-=25% start',
  leaveLate: 'start end',
};

/**
 * Revela uno o varios elementos al entrar en pantalla.
 * Los targets deben llevar la clase `reveal` (opacity: 0 inicial en base.css).
 *
 * Importante: un `onScroll()` observa SOLO el primer target de su animacion.
 * Por eso, por defecto se crea un observer por elemento; asi una lista larga
 * no se anima entera cuando aparece su primera tarjeta.
 * Usa `group: true` para bloques compactos que deben entrar juntos en cascada
 * (ahi `each` aplica el stagger). En modo individual `each` se ignora: cada
 * elemento se anima cuando le toca entrar, sin acumular retardo.
 *
 * @returns {Array} animaciones creadas (vacio si reduced-motion)
 */
export function revealOnScroll(targets, options = {}) {
  const {
    distance = RISE,
    delay = 0,
    each = 90,
    duration = DUR.base,
    group = false,
    enter = THRESHOLD.enterSoon,
    ...rest
  } = options;

  const nodes = utils.$(targets);
  if (!nodes.length) return [];

  if (prefersReducedMotion()) {
    utils.set(nodes, { opacity: 1, y: 0 });
    return [];
  }

  const base = {
    opacity: [0, 1],
    y: [distance, 0],
    duration,
    ease: EASE.out,
  };

  if (group) {
    return [
      animate(nodes, {
        ...base,
        delay: stagger(each, { start: delay }),
        autoplay: onScroll({ enter, repeat: false }),
        ...rest,
      }),
    ];
  }

  return nodes.map((node) =>
    animate(node, {
      ...base,
      delay,
      autoplay: onScroll({ enter, repeat: false }),
      ...rest,
    }),
  );
}

/**
 * Anima ligada al scroll (scrub): el progreso lo marca la posicion, no el tiempo.
 * `sync` numerico = suavizado; `true` = 1:1 con el scroll.
 *
 * Pensado para UN elemento: el observer se ancla al primer target. Si necesitas
 * el efecto en varios elementos repartidos por la pagina, llama una vez por cada uno.
 */
export function scrubOnScroll(targets, keyframes, options = {}) {
  const { sync = 0.5, enter = 'end start', leave = 'start end', ...rest } = options;

  if (prefersReducedMotion()) return null;

  return animate(targets, {
    ...keyframes,
    ease: 'linear',
    autoplay: onScroll({ sync, enter, leave }),
    ...rest,
  });
}

/**
 * Parallax vertical sencillo. `depth` negativo sube, positivo baja.
 */
export function parallax(targets, depth = 80, options = {}) {
  return scrubOnScroll(targets, { y: [-depth, depth] }, options);
}

/**
 * Contador numerico que corre una sola vez al aparecer.
 */
export function countUpOnScroll(target, to, options = {}) {
  const { decimals = 0, duration = DUR.slow, ...rest } = options;
  const node = typeof target === 'string' ? document.querySelector(target) : target;
  if (!node) return null;

  if (prefersReducedMotion()) {
    node.textContent = to.toFixed(decimals);
    return null;
  }

  const state = { value: 0 };
  return animate(state, {
    value: to,
    duration,
    ease: EASE.inOut,
    onUpdate: () => {
      node.textContent = state.value.toFixed(decimals);
    },
    autoplay: onScroll({ enter: THRESHOLD.enterSoon, repeat: false }),
    ...rest,
  });
}

/**
 * Dibuja un trazo SVG (la linea de la cadena de trazabilidad) al hacer scroll.
 * Requiere un <path> con `createDrawable` aplicado por el llamador.
 */
export function drawLineOnScroll(drawable, options = {}) {
  return scrubOnScroll(drawable, { draw: ['0 0', '0 1'] }, options);
}
