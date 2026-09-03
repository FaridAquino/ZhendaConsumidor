import { useEffect, useRef } from 'react';
import { createScope } from 'animejs';

/**
 * Envuelve las animaciones de un componente en un `Scope` de anime.js.
 *
 * Por que: en React 19 + StrictMode los efectos se montan dos veces y las rutas
 * desmontan nodos en cualquier momento. `scope.revert()` mata animaciones y
 * scroll observers y restaura los estilos inline, evitando fugas y elementos
 * que se quedan a medio animar.
 *
 * Uso:
 *   const root = useAnimeScope((scope) => {
 *     revealOnScroll('.reveal');
 *   });
 *   return <section ref={root}>...</section>;
 *
 * El selector se resuelve SIEMPRE dentro de `root`, nunca en todo el documento.
 */
export function useAnimeScope(setup, deps = []) {
  const root = useRef(null);
  const scope = useRef(null);

  useEffect(() => {
    if (!root.current) return undefined;

    scope.current = createScope({ root }).add(setup);

    return () => {
      scope.current?.revert();
      scope.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return root;
}
