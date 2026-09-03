import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section container">
      <p className="eyebrow">Error 404</p>
      <h1>Esta página no existe.</h1>
      <Link className="boton boton--primario" to="/">
        Ir al inicio
      </Link>
    </section>
  );
}
