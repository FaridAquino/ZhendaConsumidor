/**
 * Constantes compartidas por todas las animaciones.
 * Mantener aqui las duraciones/eases evita que cada componente invente las suyas
 * y que el sitio se sienta inconsistente al hacer scroll.
 */
export const DUR = {
  fast: 240,
  base: 520,
  slow: 900,
  scrub: 1000,
};

export const EASE = {
  out: 'out(3)',
  inOut: 'inOut(2)',
  spring: 'outElastic(1, 0.6)',
};

/** Distancia por defecto (px) del desplazamiento de entrada. */
export const RISE = 36;

/**
 * anime.js no respeta `prefers-reduced-motion` por si mismo:
 * cada helper debe consultarlo y devolver el estado final sin animar.
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
