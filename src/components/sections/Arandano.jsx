import { animate, onScroll, utils } from 'animejs';
import { crearSecuencia } from '../../animations/secuencia.js';
import { useAnimeScope } from '../../hooks/useAnimeScope.js';
import { prefersReducedMotion } from '../../animations/motion.js';
import './Arandano.css';

/*
  Paso 2 del pipeline: el fruto y su analitica.

  La secuencia de 64 fotogramas se dibuja en un <canvas>: cambiar el `src` de
  un <img> 64 veces provoca parpadeo, y montar 64 <img> apilados dispara la
  memoria. El reproductor vive en animations/secuencia.js, que descarga,
  decodifica y pinta dentro de un Worker con OffscreenCanvas.

  Los fotogramas servidos viven en public/images/arandano: WebP 1280x720 sin
  canal alfa, ~33 KB por frame, 2,1 MB en total. public/images/arandanoImages
  es la carpeta fuente y hoy es una copia identica: sacarla de public/ ahorra
  ese peso duplicado en dist/.
*/

/* Para cambiar el numero de fotogramas basta con estas dos constantes y
   regenerar public/images/arandano. DIGITOS debe casar con el nombre de los
   archivos: 2 -> 01.webp .. 64.webp, 3 -> 001.webp .. 120.webp. */
const TOTAL_FRAMES = 64;
const DIGITOS = 2;
const ruta = (i) => `/images/arandano/${String(i + 1).padStart(DIGITOS, '0')}.webp`;

/* El lote trae los nombres de sus certificaciones; que significa cada una es
   texto editorial, igual para todos los lotes, asi que vive aqui y no en los
   datos. Un sello desconocido se muestra igual, solo que sin explicacion. */
const DETALLE_CERT = {
  'GlobalG.A.P.': 'Buenas prácticas agrícolas',
  HACCP: 'Control de peligros en packing',
  Grasp: 'Evaluación de riesgos sociales',
  'Orgánico UE': 'Producción ecológica certificada',
};

/* Lo que la marca dice en voz alta: el icono va aria-hidden, asi que sin
   este texto un lector de pantalla leeria la cifra del residuo sin saber si
   queda dentro o fuera del limite. */
const VEREDICTO = {
  ok: 'Dentro del límite',
  warn: 'Dentro del límite, cerca del máximo',
  alert: 'Por encima del límite',
};

/* Solo dia y mes: el ano ya lo da el codigo del lote y la fecha de cosecha. */
const FECHA_CORTA = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'short' });
const fechaCorta = (iso) => FECHA_CORTA.format(new Date(`${iso}T12:00:00`));

/* Marca de conformidad de cada fitosanitario.

   El trazo se dibuja solo con CSS: los <path> llevan pathLength="1", asi que
   su longitud es 1 sea cual sea la geometria y `stroke-dashoffset` puede ir
   de 1 a 0 sin medir nada en JS. Sin ese atributo habria que leer
   getTotalLength() de cada trazo y escribirlo en el estilo.

   Un residuo por ENCIMA del limite no puede llevar un check: ahi la marca es
   un aspa. Hoy ningun lote llega con estado 'alert'; la rama existe para que
   el dia que llegue no se cuele como conforme. */
function MarcaCumple({ estado }) {
  const conforme = estado !== 'alert';

  return (
    <svg
      className="arandano__marca"
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle className="arandano__marca-aro" cx="12" cy="12" r="10" pathLength="1" />
      {conforme ? (
        <path className="arandano__marca-trazo" d="M7.6 12.4l2.9 2.9l5.9 -5.9" pathLength="1" />
      ) : (
        <path className="arandano__marca-trazo" d="M9 9l6 6M15 9l-6 6" pathLength="1" />
      )}
    </svg>
  );
}

/* --- Parametros de la secuencia -------------------------------------- */
const SECUENCIA = {
  /* Cuanto persigue el fotograma a la posicion del scroll. OJO: va al reves
     de lo que sugiere el nombre. En scroll.js:843 anime hace

       p = lerp(actual, objetivo, lerp(.01, .2, suavizado))

     asi que el numero ES el factor del lerp reescalado: mas BAJO = avance mas
     lento por tick = mas inercia. Y como el gesto se reparte en mas tiempo
     con los mismos fotogramas, bajarlo hunde las imagenes/s:

       0.25 -> factor 0.0575 -> ~280 ms por gesto -> 25 img/s (habia judder)
       0.5  -> factor 0.105  -> ~150 ms por gesto -> ~50 img/s
       1    -> sin suavizado, pegado al scroll (el lerp ni se aplica)

     Es el mando que mas barato sale: subirlo dobla la fluidez sin tocar una
     sola imagen. Lo que se paga es inercia, no calidad. */
  suavizado: 0.5,
  margenPrecarga: '150%', // a que distancia de la seccion arranca la descarga
  fpsMax: 60, // techo de repintados/s. Por debajo de 60 se TIRAN fotogramas
  //             legitimos: la guarda por indice ya filtra los ticks repetidos.
  brixHasta: 0.55, // progreso al que el contador ya marca el valor final
  certDesde: 0.3, // progreso al que aparece la primera certificacion
  certCada: 0.08, // separacion entre certificaciones
  pestDesde: 0.58, // progreso al que aparece el primer fitosanitario
  pestCada: 0.08, // separacion entre fitosanitarios
};
/* --------------------------------------------------------------------- */

/* Ponlo a false cuando ya no haga falta medir. Con true, el reproductor
   cuenta cuantos fotogramas ha pintado y cuantos se le pidieron antes de
   estar descargados, y lo escribe en consola una vez por segundo. */
const DIAGNOSTICO = true;

export default function Arandano({ lote }) {
  /* El lote da los nombres; el detalle lo pone la tabla de arriba. */
  const certificaciones = lote.certificaciones.map((nombre) => ({
    nombre,
    detalle: DETALLE_CERT[nombre] ?? '',
  }));

  const root = useAnimeScope((scope) => {
    const seccion = scope.root; // la raiz no es descendiente: no vale utils.$
    const contenedor = utils.$('.arandano__lienzo')[0];
    const contador = utils.$('.arandano__brix-valor')[0];
    const certificados = utils.$('.arandano__cert');
    const fitosanitarios = utils.$('.arandano__pesticida');
    if (!contenedor || !contador) return undefined;

    // Se resuelve mas abajo: repinta el frame que toque en cuanto la precarga
    // termina, por si el usuario ya habia hecho scroll mientras cargaba.
    let alTerminarCarga = () => {};

    // La secuencia no se crea al montar la pagina, sino cuando la seccion se
    // acerca. Arrancar el worker y disparar 64 descargas es un pico de trabajo:
    // hacerlo durante la carga inicial compite con el render de la portada y
    // deja una tarea larga justo al principio de la traza.
    let secuencia = null;
    let frameDeseado = 0;

    const arrancar = () => {
      if (secuencia) return;
      const inicioCarga = performance.now();
      secuencia = crearSecuencia({
        contenedor,
        rutas: Array.from({ length: TOTAL_FRAMES }, (_, i) => ruta(i)),
        onProgreso: (fraccion) => {
          seccion.style.setProperty('--carga', fraccion.toFixed(3));
        },
        onListo: () => {
          seccion.classList.add('arandano--listo');
          alTerminarCarga();
          if (DIAGNOSTICO) {
            console.info(
              '[arandano] secuencia lista:',
              TOTAL_FRAMES,
              'fotogramas en',
              Math.round(performance.now() - inicioCarga),
              'ms',
            );
          }
        },
        diagnostico: DIAGNOSTICO,
        onDiagnostico: ({ pintados, saltados, cargada }) => {
          console.info(
            '[arandano]',
            cargada ? 'ya cargada' : 'cargando',
            '| pintados:',
            pintados,
            '| descartados por no estar cargados:',
            saltados,
          );
        },
      });
      secuencia.mostrar(frameDeseado);
    };

    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((entrada) => entrada.isIntersecting)) return;
        observador.disconnect();
        arrancar();
      },
      { rootMargin: `${SECUENCIA.margenPrecarga} 0px` },
    );
    observador.observe(seccion);

    /* --- Traza de fotogramas (solo con DIAGNOSTICO) --------------------
       Un console.log por fotograma seria contraproducente: a ~36 img/s la
       propia consola introduce tirones y acabariamos midiendo el medidor.
       Se acumulan los indices y se vuelcan cuando el scroll lleva 400 ms
       parado. Cada volcado es un "tramo": lo que ha dado de si un gesto.

       Que mirar, por orden de utilidad:
         img/s       ritmo real DENTRO del tramo. Por encima de ~50 sobran
                     fotogramas; por debajo de ~25 el ojo separa las
                     imagenes y ahi si hace falta subir TOTAL_FRAMES.
         mayor hueco milisegundos entre dos fotogramas consecutivos. Un
                     hueco grande en medio de un tramo es un enganchon real
                     del navegador. Si el hueco es pequeno y aun asi se ve a
                     tirones, lo discontinuo es el scroll, no la secuencia.
         saltos      el indice se salta fotogramas (10 -> 13). Faltan
                     fotogramas para el recorrido que hay.
         sentido     los cambios de direccion DENTRO de un tramo. Un tramo
                     entero descendente es scroll hacia arriba, normal. */
    let traza = [];
    let tiempos = [];
    let anteriorTraza = -1;
    let sentido = 0;
    let reversiones = 0;
    let saltos = 0;
    let repetidos = 0;
    let volcado = 0;

    const reiniciar = () => {
      traza = [];
      tiempos = [];
      anteriorTraza = -1;
      sentido = 0;
      reversiones = 0;
      saltos = 0;
      repetidos = 0;
    };

    const volcar = () => {
      if (traza.length < 2) return reiniciar();

      const duracion = tiempos[tiempos.length - 1] - tiempos[0];
      let hueco = 0;
      for (let i = 1; i < tiempos.length; i++) {
        hueco = Math.max(hueco, tiempos[i] - tiempos[i - 1]);
      }
      const ritmo = duracion > 0 ? Math.round(((traza.length - 1) * 1000) / duracion) : 0;

      console.info(
        '[arandano] tramo de ' + traza.length + ' fotogramas: ' + traza[0] + ' -> ' + traza[traza.length - 1] +
          '\n  ' + traza.join(' ') +
          '\n  duracion: ' + Math.round(duracion) + ' ms  ->  ' + ritmo + ' img/s' +
          '\n  mayor hueco entre fotogramas: ' + Math.round(hueco) + ' ms' +
          '\n  cambios de sentido: ' + reversiones + ' | saltos de mas de 1: ' + saltos +
          ' | repetidos: ' + repetidos,
      );
      reiniciar();
    };

    const anotar = (indice) => {
      if (anteriorTraza >= 0) {
        const paso = indice - anteriorTraza;
        if (paso === 0) repetidos++;
        else if (Math.abs(paso) > 1) saltos++;
        // Un tramo entero hacia atras es scroll hacia arriba y es legitimo.
        // Lo sospechoso es cambiar de sentido sin soltar el scroll.
        const nuevo = Math.sign(paso);
        if (nuevo !== 0) {
          if (sentido !== 0 && nuevo !== sentido) reversiones++;
          sentido = nuevo;
        }
      }
      traza.push(indice);
      tiempos.push(performance.now());
      anteriorTraza = indice;
      clearTimeout(volcado);
      volcado = setTimeout(volcar, 400);
    };

    // Pedir un fotograma antes de que exista el reproductor solo anota cual es.
    const mostrar = (indice) => {
      frameDeseado = indice;
      if (DIAGNOSTICO) anotar(indice);
      secuencia?.mostrar(indice);
    };

    // Los datos son estados discretos: los mueve CSS via clases, no anime.js.
    // Solo se escribe en el DOM cuando el valor mostrado cambia de verdad; a
    // 60 fps y una decima de resolucion, eso son ~134 escrituras en todo el
    // recorrido en vez de varios miles.
    let brixMostrado = '';
    const marcar = (progreso) => {
      const avance = Math.min(1, progreso / SECUENCIA.brixHasta);
      const texto = (lote.brix * avance).toFixed(1);
      if (texto !== brixMostrado) {
        brixMostrado = texto;
        contador.textContent = texto;
      }
      certificados.forEach((cert, i) => {
        cert.classList.toggle(
          'arandano__cert--visible',
          progreso >= SECUENCIA.certDesde + i * SECUENCIA.certCada,
        );
      });
      // Los fitosanitarios entran despues de los sellos: primero bajo que
      // normas se cultivo, y solo entonces que se aplico.
      fitosanitarios.forEach((fito, i) => {
        fito.classList.toggle(
          'arandano__pesticida--visible',
          progreso >= SECUENCIA.pestDesde + i * SECUENCIA.pestCada,
        );
      });
    };

    /* Redimensionar espaciado. En movil el evento `resize` no llega solo al
       girar el telefono: tambien al plegarse la barra del navegador y al
       abrirse el teclado. Cada uno rehace el buffer del canvas, que es de lo
       mas caro que hace esta seccion. Con svh en la CSS el alto ya no cambia
       al hacer scroll, pero el espaciado cubre el resto de casos. */
    let esperaResize = 0;
    const alRedimensionar = () => {
      clearTimeout(esperaResize);
      esperaResize = setTimeout(() => secuencia?.redimensionar(), 200);
    };
    window.addEventListener('resize', alRedimensionar);

    if (prefersReducedMotion()) {
      // Sin recorrido: ultimo frame y datos completos.
      alTerminarCarga = () => mostrar(TOTAL_FRAMES - 1);
      mostrar(TOTAL_FRAMES - 1);
      marcar(1);
      return () => {
        observador.disconnect();
        clearTimeout(volcado);
        clearTimeout(esperaResize);
        window.removeEventListener('resize', alRedimensionar);
        secuencia?.destruir();
      };
    }

    // Limitador de calculos. El freno que hace el trabajo es el primero: si el
    // fotograma redondeado no ha cambiado, no hay nada que pintar, y con 64
    // frames el scroll dispara muchos mas ticks que fotogramas hay.
    // El segundo (reloj) es un tope de seguridad; bajarlo de 60 no ahorra nada
    // porque el trabajo ya esta filtrado, y en cambio descarta cambios reales
    // de fotograma cuando se hace scroll rapido, que se ve como tiron.
    const intervaloMin = 1000 / SECUENCIA.fpsMax;
    let frameMostrado = -1;
    let ultimoPintado = 0;

    alTerminarCarga = () => mostrar(Math.max(frameMostrado, 0));

    const estado = { frame: 0 };
    animate(estado, {
      frame: TOTAL_FRAMES - 1,
      ease: 'linear',
      onUpdate: (anim) => {
        const indice = Math.round(estado.frame);
        const ahora = Date.now();
        if (indice !== frameMostrado && ahora - ultimoPintado >= intervaloMin) {
          frameMostrado = indice;
          ultimoPintado = ahora;
          mostrar(indice);
        }
        marcar(anim.progress);
      },
      autoplay: onScroll({
        target: seccion,
        enter: 'start start',
        leave: 'end end',
        sync: SECUENCIA.suavizado,
      }),
    });

    // anime.js registra esto como limpieza del scope y lo llama en revert().
    return () => {
      observador.disconnect();
      clearTimeout(volcado);
      clearTimeout(esperaResize);
      window.removeEventListener('resize', alRedimensionar);
      secuencia?.destruir();
    };
  }, [lote.codigo]);

  return (
    <section className="arandano sangrado" ref={root} id="quimicos">
      <div className="arandano__viewport">
        <div
          className="arandano__lienzo"
          role="img"
          aria-label="Secuencia de un arándano recién cosechado"
        />

        <span className="arandano__carga" aria-hidden="true" />

        <div className="arandano__panel">
          <p className="eyebrow">Análisis en planta</p>

          <p className="arandano__brix">
            <span className="arandano__brix-valor">0.0</span>
            <span className="arandano__brix-unidad">°Bx</span>
          </p>
          <p className="arandano__brix-pie">
            Índice Brix: azúcares disueltos en el fruto. Por encima de 12 el arándano llega dulce al
            consumidor tras la cadena de frío.
          </p>

          <ul className="arandano__certs">
            {certificaciones.map(({ nombre, detalle }) => (
              <li className="arandano__cert" key={nombre}>
                <strong className="arandano__cert-nombre">{nombre}</strong>
                <span className="arandano__cert-detalle">{detalle}</span>
              </li>
            ))}
          </ul>

          {/* Fitosanitarios aplicados al lote. No es letra pequena escondida:
              es la respuesta a la pregunta que trae aqui a mucha gente, asi
              que va con nombre, para que se aplico y que residuo quedo. */}
          <div className="arandano__quimicos">
            <p className="arandano__subtitulo">Fitosanitarios aplicados</p>

            <ul className="arandano__pesticidas">
              {lote.pesticidas.map((pesticida) => (
                <li
                  className={`arandano__pesticida arandano__pesticida--${pesticida.estado}`}
                  key={pesticida.id}
                >
                  <MarcaCumple estado={pesticida.estado} />
                  <span className="visually-hidden">{VEREDICTO[pesticida.estado]}</span>

                  <span className="arandano__pesticida-texto">
                    <span className="arandano__pesticida-fila">
                      <strong className="arandano__pesticida-nombre">{pesticida.nombre}</strong>
                      <span className="arandano__pesticida-residuo">{pesticida.residuo}</span>
                    </span>
                    <span className="arandano__pesticida-detalle">
                      {pesticida.tipo} · {pesticida.objetivo} · aplicado el{' '}
                      {fechaCorta(pesticida.aplicacion)} · carencia {pesticida.carenciaDias} d
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <p className="arandano__pie">
              Cada marca es un residuo medido por debajo del límite máximo (LMR). En ámbar, el
              más próximo a ese límite: dentro, pero con menos margen.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
