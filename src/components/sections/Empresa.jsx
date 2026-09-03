import { animate, onScroll, utils } from 'animejs';
import { useAnimeScope } from '../../hooks/useAnimeScope.js';
import { prefersReducedMotion } from '../../animations/motion.js';
import { recurso } from '../../recursos.js';
import './Empresa.css';

/*
  Paso 3 del pipeline: quien empaca y exporta. Cierra el recorrido.

  Misma forma que #recoleccion y #quimicos: la seccion mide mas de una pantalla
  y dentro lleva un viewport `sticky`. Mientras ese bloque queda anclado, el
  scroll hace de barra de progreso: la foto se va asentando y el recuadro con
  los datos entra por partes.

  Clases disponibles en Empresa.css:
    .empresa, .empresa__viewport, .empresa__escena, .empresa__marco,
    .empresa__foto, .empresa__sello, .empresa__panel, .empresa__titulo,
    .empresa__lead, .empresa__datos, .empresa__dato, .empresa__dato--visible,
    .empresa__dato-etiqueta, .empresa__dato-valor,
    .empresa__dato-valor--codigo, .empresa__pie, .empresa__claim
    Estados en la raiz: .empresa--con-panel, .empresa--con-sello
*/

/* Contenido editorial de la empresa: igual para todos los lotes, asi que no
   viene de los datos. Las imagenes son las de public/images/Danper.

   La foto original mide 628x488. El marco tiene tope de 52rem (--marco-ancho
   en la CSS) y proporcion 4/3, que es casi la del original: asi se amplia
   ~1,4x y se recorta poco. Estirarla mas se nota en las caras. */
const EMPRESA = {
  nombre: 'Danper',
  claim: 'Compromiso sostenible',
  sello: recurso('images/Danper/LogoImagen.jpg'),
  foto: recurso('images/Danper/PersonasDanper.jpg'),
  fotoAlt:
    'Dos trabajadores de Danper con uniforme y gorra de la empresa en una línea de packing',
  pieFoto: 'Equipo de planta de Danper.',
};

/* --- Parametros del cierre --------------------------------------------
   Los progresos van de 0 (la seccion toca el borde superior) a 1 (su final
   alcanza el borde inferior). */
const CIERRE = {
  zoomDesde: 1.08, // escala inicial de la foto; termina en 1
  deriva: 14, // px que la foto sube mientras se asienta
  giroSello: 16, // grados que gira el sello de un extremo a otro
  panel: 0.22, // progreso al que entra el recuadro
  datoDesde: 0.4, // progreso al que entra el primer dato
  datoCada: 0.12, // separacion entre datos
  sello: 0.52, // progreso al que aparece el sello
  suavizado: 0.35, // 0 = pegado al scroll, mas alto = mas inercia
};
/* --------------------------------------------------------------------- */

export default function Empresa({ lote }) {
  const datos = [
    { id: 'sale', etiqueta: 'Sale de', valor: lote.ubicacion },
    { id: 'llega', etiqueta: 'Llega a', valor: lote.destino },
    { id: 'lote', etiqueta: 'Lote', valor: lote.codigo, codigo: true },
  ];

  const root = useAnimeScope(
    (scope) => {
      // OJO: la seccion es la RAIZ del scope, no un descendiente. `utils.$`
      // resuelve con root.querySelectorAll(), que nunca devuelve la propia raiz.
      const seccion = scope.root;
      const foto = utils.$('.empresa__foto')[0];
      const sello = utils.$('.empresa__sello')[0];
      const fichas = utils.$('.empresa__dato');
      if (!foto || !seccion) return;

      // Estados discretos (recuadro dentro, cada dato dentro, sello dentro):
      // clases que transiciona el CSS. anime.js solo mueve lo continuo, que
      // aqui es la foto y el giro del sello.
      const marcar = (progreso) => {
        seccion.classList.toggle('empresa--con-panel', progreso >= CIERRE.panel);
        seccion.classList.toggle('empresa--con-sello', progreso >= CIERRE.sello);
        fichas.forEach((ficha, i) => {
          ficha.classList.toggle(
            'empresa__dato--visible',
            progreso >= CIERRE.datoDesde + i * CIERRE.datoCada,
          );
        });
      };

      if (prefersReducedMotion()) {
        utils.set(foto, { scale: 1, y: 0 });
        marcar(1);
        return;
      }

      /* Escala y deriva en UNA sola animacion, no en dos. Las dos escriben el
         `transform` del mismo nodo: separadas se pisarian y ganaria la ultima.
         El margen que necesita la deriva lo da --sobrante, en la CSS. */
      animate(foto, {
        scale: [CIERRE.zoomDesde, 1],
        y: [CIERRE.deriva, -CIERRE.deriva],
        ease: 'linear',
        onUpdate: (anim) => marcar(anim.progress),
        autoplay: onScroll({
          target: seccion,
          enter: 'start start',
          leave: 'end end',
          sync: CIERRE.suavizado,
        }),
      });

      /* El sello es un circulo con el texto escrito en el borde: girarlo
         despacio con el scroll aprovecha la forma que ya tiene. Va en su propia
         animacion porque es otro nodo.

         Su entrada (opacidad y tamano) la hace el CSS con las propiedades
         independientes `opacity` y `scale`, NO con `transform`: asi no le
         disputa a anime.js el transform donde escribe el giro. */
      if (sello) {
        animate(sello, {
          rotate: [-CIERRE.giroSello, CIERRE.giroSello],
          ease: 'linear',
          autoplay: onScroll({
            target: seccion,
            enter: 'start start',
            leave: 'end end',
            sync: CIERRE.suavizado,
          }),
        });
      }
    },
    [lote.codigo],
  );

  return (
    <section className="empresa sangrado" ref={root} id="exportacion">
      <div className="empresa__viewport">
        {/* La escena da la caja comun a foto y recuadro: asi el recuadro se
            ancla a la esquina de la foto y no al borde de la ventana, que es
            por donde pasa el riel lateral. */}
        <div className="empresa__escena">
          <figure className="empresa__marco">
            <img
              className="empresa__foto"
              src={EMPRESA.foto}
              alt={EMPRESA.fotoAlt}
              width="628"
              height="488"
              loading="lazy"
              decoding="async"
            />

            {/* alt vacio: el sello dice "Danper" y "compromiso sostenible", y
                las dos cosas estan escritas al lado en texto de verdad. */}
            <img
              className="empresa__sello"
              src={EMPRESA.sello}
              alt=""
              width="447"
              height="447"
              loading="lazy"
              decoding="async"
            />
          </figure>

          {/* Mismo papel que .mapa__ficha y .arandano__panel: el texto va en un
              recuadro que flota sobre la escena, no suelto sobre la foto. */}
          <aside className="empresa__panel">
            <p className="eyebrow">Exportación</p>
            <h2 className="empresa__titulo">{EMPRESA.nombre}</h2>

            <p className="lead empresa__lead">
              El envase se selló en planta y desde aquí el lote viaja refrigerado hasta{' '}
              {lote.destino}.
            </p>

            {/* Un <dl>: cada dato es un par etiqueta-valor, no una frase. Cada
                par va en su propio recuadro, como los sellos de #quimicos. */}
            <dl className="empresa__datos">
              {datos.map(({ id, etiqueta, valor, codigo }) => (
                <div className="empresa__dato" key={id}>
                  <dt className="empresa__dato-etiqueta">{etiqueta}</dt>
                  <dd
                    className={
                      codigo
                        ? 'empresa__dato-valor empresa__dato-valor--codigo'
                        : 'empresa__dato-valor'
                    }
                  >
                    {valor}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="empresa__pie">
              {EMPRESA.pieFoto} Empacado y exportado bajo las certificaciones del lote.{' '}
              <span className="empresa__claim">{EMPRESA.claim}</span>
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
