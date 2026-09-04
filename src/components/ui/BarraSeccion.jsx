import './BarraSeccion.css';

/*
  AYUDA DE DEPURACION — no es parte del producto.

  Una linea horizontal de lado a lado en el borde superior de cada seccion,
  con su nombre colgando a la derecha.

  Las secciones van PEGADAS: entre una y otra hay 0px, y todo el aire que se
  ve es padding de dentro de alguna de las dos. Por eso el borde superior de
  una seccion es exactamente la costura con la anterior, y la linea marca ese
  corte: lo que quede de blanco por encima pertenece a la seccion de arriba y
  lo que quede por debajo, a la de abajo. Eso es lo que hace medible a ojo si
  el aire sobra y, sobre todo, de quien es.

  Se apaga entera desde MOSTRAR, aqui abajo, sin tocar ninguna seccion. El dia
  que sobre, se borran los seis `<BarraSeccion />` y estos dos archivos.
*/
const MOSTRAR = true;

export default function BarraSeccion({ nombre, color = 'var(--c-berry-500)' }) {
  if (!MOSTRAR) return null;

  return (
    <div className="barra-seccion" style={{ '--barra-color': color }} aria-hidden="true">
      <span className="barra-seccion__etiqueta">{nombre}</span>
    </div>
  );
}
