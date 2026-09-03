# ZhendaConsumidor

Web de **trazabilidad de arándanos**: el consumidor ingresa el código de lote
impreso en la caja y reconstruye el recorrido del fruto, desde la cosecha en
campo hasta el punto de venta.

La interfaz cuenta ese recorrido con **animaciones ligadas al scroll**
(React + anime.js v4 + CSS plano).

## Requisitos

Node.js 20.19+ o 22.12+.

## Puesta en marcha

```bash
npm install
npm run dev
```

Abre <http://localhost:5173>.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Sirve el build de producción |
| `npm run lint` | oxlint |

## Rutas

| Ruta | Pantalla |
|---|---|
| `/` | Portada: hero, métricas, cadena de trazabilidad y buscador |
| `/lote/:codigo` | Ficha del lote y línea de tiempo de sus eventos |

Lotes de ejemplo: `ZH-2026-0412` y `ZH-2026-0388`.

## Stack

React 19 · Vite 8 · react-router-dom 7 · anime.js 4 · CSS plano (sin frameworks
de estilos). Los datos de `src/data/lotes.js` son de demostración.

Las convenciones del proyecto están en [CLAUDE.md](./CLAUDE.md).
