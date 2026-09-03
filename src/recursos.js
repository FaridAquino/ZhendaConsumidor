/**
 * Rutas a los archivos de public/.
 *
 * Por que hace falta: el sitio se sirve en un subdirectorio
 * (/ZhendaConsumidor/ en GitHub Pages). Vite reescribe `base` en el HTML y en
 * la CSS, pero NO dentro de las cadenas de JavaScript. Un `src="/images/x.png"`
 * escrito a mano en un componente se resuelve contra la raiz del dominio y da
 * 404, sin avisar: el build pasa, la pagina carga y la imagen no esta.
 *
 * `import.meta.env.BASE_URL` ya trae la barra final, asi que la ruta se pasa
 * SIN barra inicial:  recurso('images/logo.png')
 *
 * En desarrollo BASE_URL vale lo mismo que `base`, de modo que esto no cambia
 * nada de lo que ya se veia.
 */
export function recurso(ruta) {
  return `${import.meta.env.BASE_URL}${ruta}`;
}
