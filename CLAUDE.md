# CLAUDE.md

Guía para trabajar en este repositorio. Léela antes de tocar código.

## Qué es

**Zhenda Consumidor**: web pública de **trazabilidad de arándanos**. El
consumidor ingresa el código de lote impreso en la caja (o llega por QR) y ve el
recorrido completo del fruto: cosecha en campo, acopio, packing, cadena de frío,
transporte y destino.

Es una web **orientada a la narrativa visual**: el recorrido se cuenta con
**animaciones ligadas al scroll**. Ese es el eje del producto, no un adorno.

## Stack

| Pieza | Elección | Nota |
|---|---|---|
| Build | Vite 8 | `vite.config.js`, plugin de React |
| UI | React 19 | **JavaScript, sin TypeScript** |
| Rutas | react-router-dom 7 | `BrowserRouter` en `src/App.jsx` |
| Animación | **anime.js v4** | única librería de animación |
| Estilos | **CSS plano** | sin Tailwind, sin CSS-in-JS, sin preprocesadores |
| Lint | oxlint | `.oxlintrc.json` |

Decisiones deliberadas: **CSS y JS a mano**. No introduzcas Tailwind, styled-
components, Framer Motion, GSAP ni utilidades de animación alternativas.
Si algo hace falta en anime.js, se escribe un helper en `src/animations/`.

## Comandos

```bash
npm run dev       # servidor de desarrollo
npm run build     # build de producción a dist/
npm run preview   # sirve el build
npm run lint      # oxlint
```

## Estructura

```
src/
  animations/     helpers de anime.js reutilizables (la capa de movimiento)
    motion.js     DUR, EASE, RISE, prefersReducedMotion()
    scroll.js     revealOnScroll, scrubOnScroll, parallax, countUpOnScroll, drawLineOnScroll
  hooks/
    useAnimeScope.js   monta/desmonta un Scope de anime.js por componente
  components/
    layout/       Header (riel del pipeline), Footer (pie general)
    sections/     bloques de página, en orden de scroll:
                  Hero (portada) · Mapa (#recoleccion) ·
                  Arandano (#quimicos) · Empresa (#exportacion)
                  Metricas y Cadena existen pero NO se montan en Home:
                  vacíos solo aportaban el padding de `.section`
    ui/           piezas reutilizables (BuscadorLote)
  pages/          Home, Lote (/lote/:codigo), NotFound
  data/           lotes.js — datos mock + contrato de datos
  styles/         tokens.css (design tokens), base.css (reset y utilidades)
```

Cada componente con estilos propios tiene su `.css` hermano, importado desde el
`.jsx`. Nada de estilos globales nuevos fuera de `src/styles/`.

## Reglas de animación (anime.js v4)

La API v4 **no es la de v3**. No uses `anime({targets: ...})` ni `anime.timeline()`.
Se importa por nombre: `import { animate, onScroll, stagger, utils } from 'animejs'`.

### 1. Toda animación vive dentro de un Scope

Usa siempre `useAnimeScope`:

```jsx
const root = useAnimeScope(() => {
  revealOnScroll('.tarjeta');       // el selector se resuelve dentro de root
});
return <section ref={root}>…</section>;
```

Por qué importa: React 19 en StrictMode monta los efectos dos veces y las rutas
desmontan nodos en cualquier momento. `scope.revert()` (que el hook llama al
desmontar) destruye animaciones **y scroll observers**, y restaura los estilos
inline. Sin scope quedan observers huérfanos y elementos congelados a medio animar.

### 2. Un `onScroll()` observa **solo el primer target** de su animación

Si pasas 6 tarjetas a un único `animate(..., { autoplay: onScroll(...) })`, el
observer mira la posición de la primera y las otras cinco se animan fuera de
pantalla. Por eso `revealOnScroll` crea **un observer por elemento** por defecto;
`group: true` es la excepción para bloques compactos que sí deben entrar en cascada.
Cuando uses `scrubOnScroll` sobre varios elementos, llama una vez por cada uno.

### 3. Sintaxis de los umbrales: `'<contenedor> <target>'`

`enter: 'end start'` = el borde **inferior del viewport** alcanza el borde
**superior del target**. Palabras válidas: `start`/`top`, `center`, `end`/`bottom`,
`min`, `max`; admiten operadores (`'end-=20% start'`). Valores centralizados en
`THRESHOLD` (`src/animations/scroll.js`).

### 4. `repeat: false`, no `once`

`onScroll()` no acepta `once`. Para animar una sola vez: `repeat: false`.

### 5. `prefers-reduced-motion` se respeta a mano

anime.js no lo consulta solo. Todo helper llama a `prefersReducedMotion()` y,
si está activo, aplica el estado final con `utils.set()` sin animar. Cualquier
helper nuevo debe hacer lo mismo.

### 6. Contrato de la clase `.reveal`

Un elemento que va a aparecer con scroll lleva `className="reveal"`. En
`base.css`, `.js .reveal { opacity: 0 }` — con el prefijo `.js` que añade
`main.jsx`. Así, si el JS falla, el contenido sigue visible; y bajo
reduced-motion la media query lo devuelve a `opacity: 1`.
**Nunca pongas `opacity: 0` suelto en un CSS de componente.**

### 7. `text.split()` no genera clases por defecto

Solo añade `data-char`. Para poder estilar los caracteres hay que pedir la clase:
`text.split(el, { chars: { class: 'char' } })`.

### 8. Scrub vs. tiempo

- Entrada de contenido (aparecer, subir) → animación por **tiempo**, disparada por scroll.
- Progreso, parallax, dibujo de líneas → **scrub** (`sync`), el scroll marca el progreso.
  `sync: 0.3` suaviza; `sync: true` va 1:1.

## Estilos

- Todo color, espacio, radio, sombra y duración sale de `src/styles/tokens.css`.
  **Ningún componente escribe un color literal.**
- Nomenclatura tipo BEM: `.cadena__etapa`, `.boton--primario`.
- Clases y nombres en español, igual que el resto del código.
- Anima preferentemente `transform` y `opacity`. Evita animar `width`, `height`,
  `top`/`left` o `box-shadow` en scroll: provocan layout y tiran los FPS.

## Datos

`src/data/lotes.js` es **mock**, pero define el contrato que consume toda la UI:

```
Lote      { codigo, clamshell, variedad, productor, fundo, ubicacion,
            hectareas, fechaCosecha, calibre, brix, certificaciones[],
            cosechador, pesticidas[], destino, eventos[] }
Evento    { id, etapa, titulo, fecha, lugar, responsable, detalle, tempC, estado }
            estado: 'ok' | 'warn' | 'alert'   etapa: id de ETAPAS
Cosechador{ nombre, cuadrilla, campanas }
Pesticida { id, nombre, tipo, objetivo, aplicacion, carenciaDias, residuo, estado }
            estado: el mismo vocabulario, aplicado al residuo medido frente al LMR
```

`clamshell` es el numero impreso en el envase que el consumidor tiene delante;
`codigo` es el lote al que pertenece. La portada muestra los dos. La llegada
por QR entra como `/?clamshell=...` (tambien se acepta `/?lote=...`), y sin
parametros Home cae al primer lote de ejemplo — ver `buscarPorClamshell()`.

`certificaciones` son solo nombres. Que significa cada sello es texto
editorial, igual para todos los lotes, y vive en `DETALLE_CERT` dentro de
`Arandano.jsx`: un sello que no este en esa tabla se muestra igual, sin
explicacion. No metas esos textos en los datos.

`pesticidas` van **tres por lote**: es lo que cabe en el panel de `#quimicos`
sin que el viewport lo recorte. Cada uno se pinta como una marca de
conformidad que se dibuja sola — `estado` 'ok' y 'warn' dan un check (verde y
ambar), 'alert' da un aspa, porque un residuo por encima del LMR no puede
llevar un check. El texto que lee un lector de pantalla sale de `VEREDICTO`,
en `Arandano.jsx`.

La empresa exportadora (Danper, `#exportacion`) es contenido **editorial**, no
del lote: nombre, claim e imágenes viven en la constante `EMPRESA` dentro de
`Empresa.jsx`. Del lote solo salen origen, destino y código. Sus imágenes
están en `public/images/Danper/`; la foto mide 628x488, así que el marco saca
su ancho del alto (`min(74svh, 34rem)`) con proporción 4/3 — casi la del
original — para ampliarla poco y no recortar las caras.

El recuadro de `#exportacion` **no flota dentro de la foto**, como en las otras
dos secciones: va en su propia columna y solo muerde el borde izquierdo de la
imagen. Las dos personas ocupan la franja central y cualquier tarjeta apoyada
encima les tapaba la cara. Por eso la sección apila (foto arriba, recuadro
abajo) por debajo de 1279px y no de los 860 habituales: es aritmética, 200 de
riel + 32 de aire + 1045 de escena.

Los dos lotes salen de **Ica**, que es la región que enfoca el mapa de
`#recoleccion`. Si añades un lote, su `ubicacion` tiene que seguir cuadrando
con `REGION_FOCO` en `Mapa.jsx`, o la página se contradice a sí misma.

Home resuelve el lote una vez y lo pasa como prop a las secciones que lo
necesitan (`Hero`, `Arandano`, `Empresa`). Ninguna seccion importa `LOTES` por
su cuenta: asi el dia que llegue la API solo cambia Home.

Cuando exista la API real, se reemplaza `buscarLote()` por el cliente HTTP
**manteniendo la forma de los objetos**; los componentes no deberían cambiar.

## Despliegue

El sitio se publica en **GitHub Pages**, en un subdirectorio:
`https://faridaquino.github.io/ZhendaConsumidor/`. De ahi salen tres reglas.

**1. `base` en `vite.config.js`** vale `/ZhendaConsumidor/`, sin condicionar al
comando. Desarrollo sirve en esa misma ruta a proposito: asi un fallo de rutas
se ve al momento y no al desplegar. `npm run dev` imprime la URL completa.

**2. Ninguna ruta a `public/` se escribe a mano en JS.** Va siempre por
`recurso()`, de `src/recursos.js`, y **sin barra inicial**:

```js
import { recurso } from '../../recursos.js';
<img src={recurso('images/logo.png')} />
```

Por que importa: Vite reescribe `base` en el HTML y en la CSS, pero **no dentro
de las cadenas de JavaScript**. Un `src="/images/x.png"` compila sin quejarse,
la pagina carga y la imagen no esta. Falla en silencio, que es lo peor que
puede hacer. Si anades una imagen y no aparece en produccion, mira esto
primero.

**3. `basename` en el router.** `<BrowserRouter basename={import.meta.env.BASE_URL}>`
en `App.jsx`. Sin el, el router compara `/ZhendaConsumidor/` contra `/` y todo
cae en NotFound.

**No cambies a `HashRouter`**, aunque sea el consejo habitual para Pages: con
hash, la location del router sale del `#`, y `useSearchParams` dejaria de leer
`?clamshell=...`. Eso es la entrada del QR, o sea el caso principal de la
pagina. En su lugar, el script `postbuild` copia `index.html` a `404.html`:
Pages sirve ese archivo ante cualquier ruta que no exista, la app arranca y el
router resuelve. Es lo que hace que funcione un enlace directo a
`/lote/:codigo`.

El gestor de paquetes es **npm** (`package-lock.json`). El workflow esta en
`.github/workflows/pages.yml` y usa `npm ci`. En Settings -> Pages, el origen
tiene que ser **GitHub Actions**, no una rama.

Comprobacion antes de desplegar, que reproduce la subcarpeta:

```bash
npm run build && npm run preview   # sirve en /ZhendaConsumidor/
```

## Idioma

- Interfaz, nombres de variables, funciones, clases CSS y comentarios: **español**.
- Los textos visibles llevan acentuación correcta (`arándanos`, `código`, `frío`).
  Los comentarios en código van sin acentos por consistencia con lo ya escrito.

## Antes de dar algo por terminado

1. `npm run build` sin errores.
2. `npm run lint` limpio.
3. Probar el scroll de verdad en el navegador: las animaciones no se verifican
   con un build. Comprobar también con reduced-motion activado en el SO.
