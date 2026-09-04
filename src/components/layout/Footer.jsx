import { useAnimeScope } from '../../hooks/useAnimeScope.js';
import { parallax, revealOnScroll } from '../../animations/scroll.js';
import logoZhenda from '../../images/logo_zhenda.png';
import './Footer.css';

/*
  Pie general del sitio. Cierra la pagina despues del recorrido.

  Vive FUERA de <main id="contenido">, asi que el hueco del riel lateral se lo
  reserva el solo (ver Footer.css). Y como es lo ultimo de la pagina, es el que
  reserva el alto de la barra inferior en movil.

  Clases disponibles en Footer.css:
    .footer, .footer__marca-agua, .footer__inner, .footer__bloque,
    .footer__bloque--legal, .footer__marca, .footer__logo, .footer__nombre,
    .footer__frase, .footer__nota, .footer__nota--tenue
*/

/* La frase de cierre. Es la tesis del producto en una linea: la portada
   promete el recorrido y aqui se dice por que importa. */
const FRASE = 'Lo que no se puede rastrear, no se puede prometer.';

/* Avisos. No dependen del lote, asi que no vienen de los datos.
   OJO antes de publicar: el segundo es una atribucion de propiedad, no una
   licencia. Si el sitio sale a produccion hace falta el permiso escrito de
   Danper para usar su foto y su logotipo, y entonces esta linea cambia. */
const AVISOS = [
  'Los datos de cada lote proceden de los registros de campo, packing y cadena de frío, y se publican tal y como se registraron.',
  'Las fotografías y la identidad visual de Danper son propiedad de Danper, y se muestran para identificar a la empresa exportadora.',
];

export default function Footer() {
  const anio = new Date().getFullYear();

  const root = useAnimeScope(() => {
    revealOnScroll('.reveal');

    /* La marca de agua deriva con el scroll. Nunca completa el recorrido: el
       pie es lo ultimo de la pagina y no llega a salir por arriba, asi que el
       scrub se queda a media animacion y la marca acaba asentada. Es el efecto
       que se busca, no un descuido. */
    parallax('.footer__marca-agua', 20);
  });

  return (
    <footer className="footer" ref={root}>
      {/* Marca de agua. Decorativa y enorme: aria-hidden y alt vacio porque el
          nombre de la marca esta escrito debajo, en texto de verdad. */}
      <img
        className="footer__marca-agua"
        src={logoZhenda}
        alt=""
        aria-hidden="true"
        width="512"
        height="512"
        loading="lazy"
        decoding="async"
      />

      <div className="container footer__inner">
        <div className="footer__bloque reveal">
          <p className="footer__marca">
            <img
              className="footer__logo"
              src={logoZhenda}
              alt=""
              width="36"
              height="36"
              loading="lazy"
              decoding="async"
            />
            <span className="footer__nombre">Zhenda</span>
          </p>

          <p className="footer__frase">{FRASE}</p>
        </div>

        <div className="footer__bloque footer__bloque--legal reveal">
          {/* El año se calcula: una cifra escrita a mano en el pie envejece
              sola y nadie se acuerda de venir a cambiarla en enero. */}
          <p className="footer__nota">
            © {anio} Agrícola Zhenda S.A.C. · Trazabilidad de arándanos · Ica, Perú
          </p>

          {AVISOS.map((aviso) => (
            <p className="footer__nota footer__nota--tenue" key={aviso}>
              {aviso}
            </p>
          ))}
        </div>
      </div>
    </footer>
  );
}
