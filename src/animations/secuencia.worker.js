/*
  Worker de la secuencia de fotogramas.

  Hace dos cosas fuera del hilo principal:
    1. Descarga y DECODIFICA los frames a ImageBitmap. La decodificacion es lo
       que atasca el scroll: un WebP de 1280x720 tarda milisegundos en pasar a
       bitmap, y `drawImage` sobre un <img> sin decodificar lo hace en sincrono.
       Un ImageBitmap ya esta listo: dibujarlo es una copia de pixeles.
    2. Pinta sobre un OffscreenCanvas, asi que ni el pintado ni el escalado
       bloquean la interfaz.
*/

let lienzo = null;
let ctx = null;
let bitmaps = [];
let ultimo = 0;

/* --- Diagnostico (lo activa el mensaje init) --------------------------
   Solo cuenta, no cambia el comportamiento. Un "saltado" es una peticion de
   fotograma que llego antes de que ese fotograma estuviera descargado: el
   canvas se queda con el anterior, y eso se ve exactamente como un tiron.

   Como leerlo: si al recorrer la seccion hay saltados > 0, el problema es la
   carga. Si son 0 y aun asi va a saltos, el problema esta en otro sitio
   (numero de fotogramas, inercia del sync, o presentacion en pantalla). */
let diagnostico = false;
let cargada = false;
let pintados = 0;
let saltados = 0;
let ultimoAviso = 0;

function avisar(forzar) {
  if (!diagnostico) return;
  const ahora = Date.now();
  if (!forzar && ahora - ultimoAviso < 1000) return;
  ultimoAviso = ahora;
  self.postMessage({ tipo: 'diagnostico', pintados, saltados, cargada });
}

/* Ancho al que se DECODIFICAN los fotogramas. Es la cifra que decide si la
   pagina sobrevive en un movil: un ImageBitmap guarda pixeles crudos, no el
   WebP comprimido, asi que a 1280x720 son 3,5 MB por fotograma. Con 64
   fotogramas eso son ~225 MB de RAM residente, y en un movil de gama media
   el navegador empieza a descartar la pestana.

   Decodificando al ancho real del canvas (en un movil de 390px con DPR
   limitado a 1.5, unos 585px) cada bitmap baja a ~0,77 MB: ~49 MB en total.
   Y no se pierde nada, porque de todas formas habria que reducirlos al
   dibujarlos.

   `resizeWidth` no lo soportan todos los navegadores; los que lo ignoran
   decodifican a tamano completo y siguen funcionando, solo que sin el
   ahorro. Por eso no hay rama alternativa. */
let anchoDecodificacion = 0;

async function cargar(ruta) {
  const respuesta = await fetch(ruta);
  const blob = await respuesta.blob();
  return anchoDecodificacion
    ? createImageBitmap(blob, { resizeWidth: anchoDecodificacion, resizeQuality: 'high' })
    : createImageBitmap(blob);
}

/* Descarga con concurrencia limitada. En serie son 64 viajes encadenados; sin
   limite, 64 peticiones simultaneas compiten entre si y el primer frame llega
   tarde. Con una tanda pequena se aprovecha HTTP/2 sin ahogar la conexion. */
async function cargarTodo(rutas, guardar, avanzar) {
  const CONCURRENCIA = 8;
  let siguiente = 0;
  let hechos = 0;

  const trabajador = async () => {
    while (siguiente < rutas.length) {
      const i = siguiente++;
      guardar(i, await cargar(rutas[i]));
      hechos++;
      avanzar(hechos, rutas.length);
    }
  };

  // El primero aparte: pinta cuanto antes, sin esperar al resto.
  guardar(0, await cargar(rutas[0]));
  hechos++;
  avanzar(hechos, rutas.length);
  siguiente = 1;

  await Promise.all(Array.from({ length: CONCURRENCIA }, trabajador));
}

/* Encaje tipo `object-fit: cover`, en pixeles de dispositivo. */
function pintar(indice) {
  if (!ctx) return;

  const bitmap = bitmaps[indice];
  if (!bitmap) {
    // Antes de que llegue el primer bitmap no hay nada que descartar: la
    // peticion inicial de arrancar() llega siempre con el array vacio y
    // contarla dejaria un saltados=1 fijo que no significa nada.
    if (bitmaps[0]) saltados++;
    avisar(false);
    return;
  }
  pintados++;
  avisar(false);
  ultimo = indice;

  const { width: ancho, height: alto } = lienzo;
  const escala = Math.max(ancho / bitmap.width, alto / bitmap.height);
  const w = bitmap.width * escala;
  const h = bitmap.height * escala;
  ctx.drawImage(bitmap, (ancho - w) / 2, (alto - h) / 2, w, h);
}

self.onmessage = async (evento) => {
  const datos = evento.data;

  if (datos.tipo === 'init') {
    lienzo = datos.lienzo;
    diagnostico = Boolean(datos.diagnostico);
    anchoDecodificacion = datos.anchoDecodificacion || 0;
    // `alpha: false` evita componer transparencia: los frames son opacos.
    ctx = lienzo.getContext('2d', { alpha: false });

    bitmaps = new Array(datos.rutas.length);
    await cargarTodo(
      datos.rutas,
      (i, bitmap) => {
        bitmaps[i] = bitmap;
        if (i === 0) pintar(0);
      },
      (cargados, total) => self.postMessage({ tipo: 'progreso', cargados, total }),
    );
    cargada = true;
    avisar(true);
    self.postMessage({ tipo: 'listo' });
    return;
  }

  if (datos.tipo === 'frame') {
    pintar(datos.indice);
    return;
  }

  if (datos.tipo === 'tamano' && lienzo) {
    lienzo.width = datos.ancho;
    lienzo.height = datos.alto;
    pintar(ultimo);
  }
};
