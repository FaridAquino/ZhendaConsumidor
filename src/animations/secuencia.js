/*
  Reproductor de secuencias de fotogramas ligado al scroll.

  Ruta rapida: OffscreenCanvas + Worker. La descarga, la decodificacion y el
  pintado ocurren fuera del hilo principal; aqui solo se envia el indice.

  Ruta de respaldo (navegadores sin `transferControlToOffscreen`): mismo
  trabajo en el hilo principal, pero precargando a ImageBitmap con
  `createImageBitmap`, que decodifica en un hilo aparte. Lo unico que queda en
  el principal es el `drawImage`, que ya es una copia de pixeles.

  El <canvas> lo crea este modulo dentro del contenedor que se le pasa, y lo
  destruye al limpiar. Es deliberado: `transferControlToOffscreen()` solo puede
  llamarse UNA vez por elemento, y en React 19 + StrictMode el efecto se monta
  dos veces sobre el mismo nodo. Con un canvas nuevo por montaje, la segunda
  pasada no revienta con InvalidStateError.

  Uso:
    const sec = crearSecuencia({ contenedor, rutas, onListo });
    sec.mostrar(12);
    sec.destruir();          // imprescindible al desmontar

  Con `diagnostico: true` se recibe por `onDiagnostico` un recuento de
  fotogramas pintados y de fotogramas pedidos que aun no estaban descargados.
*/

const DPR_MAX = 1.5; // ampliar mas alla de esto no aporta nitidez y cuesta relleno
/* Techo del buffer = ancho real de los fotogramas. Cada frame nuevo es una
   subida de textura a la GPU: a 1600x900 son ~5,8 MB por imagen, y como la
   fuente solo tiene 1280px de ancho, todo lo que pase de ahi es textura vacia
   que se sube y se descarta. Bajarlo a 1280 recorta ~36% de subida sin perder
   un solo pixel de detalle. */
const ANCHO_MAX = 1280;

function soportaOffscreen() {
  return (
    typeof Worker === 'function' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    'transferControlToOffscreen' in HTMLCanvasElement.prototype
  );
}

/* Pixeles reales del buffer del canvas.
   Dos topes: el DPR y un ancho maximo. Pedir 2560px de buffer para una fuente
   de 1280px no anade un solo detalle y duplica el relleno que hay que pintar
   en cada frame; es de lo que mas cuesta en portatiles modestos. */
function medir(lienzo) {
  const dpr = Math.min(window.devicePixelRatio || 1, DPR_MAX);
  const anchoCss = lienzo.clientWidth || 1;
  const altoCss = lienzo.clientHeight || 1;
  const factor = Math.min(dpr, ANCHO_MAX / anchoCss);
  return {
    ancho: Math.max(1, Math.round(anchoCss * factor)),
    alto: Math.max(1, Math.round(altoCss * factor)),
  };
}

function conWorker(lienzo, opciones) {
  const { rutas, onProgreso, onListo, onDiagnostico, diagnostico } = opciones;
  const worker = new Worker(new URL('./secuencia.worker.js', import.meta.url), { type: 'module' });
  const offscreen = lienzo.transferControlToOffscreen();
  const { ancho, alto } = medir(lienzo);
  offscreen.width = ancho;
  offscreen.height = alto;

  worker.onmessage = (evento) => {
    const datos = evento.data;
    if (datos.tipo === 'progreso') onProgreso?.(datos.cargados / datos.total);
    if (datos.tipo === 'listo') onListo?.();
    if (datos.tipo === 'diagnostico') onDiagnostico?.(datos);
  };
  // El ancho de decodificacion es el del buffer del canvas: decodificar mas
  // grande solo gasta memoria, porque igualmente habria que reducirlo al
  // dibujar. Ver la nota larga en secuencia.worker.js.
  worker.postMessage(
    { tipo: 'init', lienzo: offscreen, rutas, diagnostico, anchoDecodificacion: ancho },
    [offscreen],
  );

  return {
    mostrar: (indice) => worker.postMessage({ tipo: 'frame', indice }),
    redimensionar: () => {
      const medida = medir(lienzo);
      worker.postMessage({ tipo: 'tamano', ...medida });
    },
    destruir: () => worker.terminate(),
  };
}

function enHiloPrincipal(lienzo, opciones) {
  const { rutas, onProgreso, onListo, onDiagnostico, diagnostico } = opciones;
  const ctx = lienzo.getContext('2d', { alpha: false });
  const bitmaps = new Array(rutas.length);
  let ultimo = 0;
  let vivo = true;

  // Mismo recuento que en el worker: ver secuencia.worker.js.
  let cargada = false;
  let pintados = 0;
  let saltados = 0;
  let ultimoAviso = 0;
  const avisar = (forzar) => {
    if (!diagnostico) return;
    const ahora = Date.now();
    if (!forzar && ahora - ultimoAviso < 1000) return;
    ultimoAviso = ahora;
    onDiagnostico?.({ pintados, saltados, cargada });
  };

  const pintar = (indice) => {
    const bitmap = bitmaps[indice];
    if (!bitmap) {
      // Ver la nota equivalente en secuencia.worker.js.
      if (bitmaps[0]) saltados++;
      avisar(false);
      return;
    }
    pintados++;
    avisar(false);
    ultimo = indice;
    const escala = Math.max(lienzo.width / bitmap.width, lienzo.height / bitmap.height);
    const w = bitmap.width * escala;
    const h = bitmap.height * escala;
    ctx.drawImage(bitmap, (lienzo.width - w) / 2, (lienzo.height - h) / 2, w, h);
  };

  const ajustar = () => {
    const { ancho, alto } = medir(lienzo);
    if (lienzo.width !== ancho || lienzo.height !== alto) {
      lienzo.width = ancho;
      lienzo.height = alto;
    }
  };

  ajustar();

  // Misma politica que el worker: el frame 0 primero, el resto en tandas.
  const CONCURRENCIA = 8;
  // Mismo ahorro de memoria que en el worker.
  const anchoDecodificacion = medir(lienzo).ancho;
  const cargar = async (i) => {
    const respuesta = await fetch(rutas[i]);
    const blob = await respuesta.blob();
    bitmaps[i] = await createImageBitmap(blob, {
      resizeWidth: anchoDecodificacion,
      resizeQuality: 'high',
    });
  };

  (async () => {
    await cargar(0);
    pintar(0);
    let hechos = 1;
    let siguiente = 1;
    const trabajador = async () => {
      while (siguiente < rutas.length && vivo) {
        const i = siguiente++;
        await cargar(i);
        onProgreso?.(++hechos / rutas.length);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCIA }, trabajador));
    if (!vivo) return;
    cargada = true;
    avisar(true);
    onListo?.();
  })();

  return {
    mostrar: pintar,
    redimensionar: () => {
      ajustar();
      pintar(ultimo);
    },
    destruir: () => {
      vivo = false;
      bitmaps.forEach((bitmap) => bitmap?.close?.());
    },
  };
}

export function crearSecuencia(opciones) {
  const { contenedor } = opciones;
  const lienzo = document.createElement('canvas');
  lienzo.className = 'secuencia__canvas';
  contenedor.appendChild(lienzo);

  const motor = soportaOffscreen()
    ? conWorker(lienzo, opciones)
    : enHiloPrincipal(lienzo, opciones);

  return {
    ...motor,
    destruir: () => {
      motor.destruir();
      lienzo.remove();
    },
  };
}
