import { useSearchParams } from 'react-router-dom';
import Hero from '../components/sections/Hero.jsx';
import Mapa from '../components/sections/Mapa.jsx';
import Paisaje from '../components/sections/Paisaje.jsx';
import Arandano from '../components/sections/Arandano.jsx';
import Empresa from '../components/sections/Empresa.jsx';
import BuscadorLote from '../components/ui/BuscadorLote.jsx';
import { LOTES, buscarLote, buscarPorClamshell } from '../data/lotes.js';
import { useAnimeScope } from '../hooks/useAnimeScope.js';
import BarraSeccion from '../components/ui/BarraSeccion.jsx';
import './Home.css';

/*
  Clases disponibles en Home.css: .busqueda, .busqueda__inner
*/
export default function Home() {
  const [params] = useSearchParams();

  /* El QR de la tarrina llega como /?clamshell=CL-0412-08871. Se acepta
     tambien ?lote= para entrar por el codigo de caja. Sin ninguno de los
     dos (visita directa a "/") la portada muestra el lote de ejemplo, que
     es lo unico que hay mientras los datos sean mock. */
  const lote =
    buscarPorClamshell(params.get('clamshell')) ?? buscarLote(params.get('lote')) ?? LOTES[0];

  const root = useAnimeScope(() => {
    // aqui van las animaciones del bloque de busqueda
  });

  return (
    <>
      <Hero lote={lote} />
      <Mapa />
      <Arandano lote={lote} />
          {/* El valle vuelve sobre el origen despues del relato del fruto.
            No lleva nodo en el riel: sigue siendo parte del paso de recoleccion. */}
        <Paisaje />
      {/* Ultimo paso del riel (#exportacion) y final del relato: el riel
          enciende su tercer nodo con el progreso de la pagina entera, asi que
          esta seccion tiene que ser la ultima del recorrido. Lo que va debajo
          (el buscador) ya no es narracion, es una herramienta.

          Metricas y Cadena estaban aqui en medio y se han sacado: hasta que
          tengan contenido solo aportaban el padding de `.section`, o sea un
          hueco en blanco entre #quimicos y el cierre. Los componentes siguen
          existiendo; cuando haya que escribirlos, se vuelven a montar. */}
      <Empresa lote={lote} />

      <section className="section busqueda con-barra" id="buscar" ref={root}>
        {/* Ayuda de depuracion: quitar junto con BarraSeccion. */}
        <BarraSeccion nombre="Buscador · #buscar" color="var(--c-ink-soft)" />

        <div className="container busqueda__inner">
          <BuscadorLote />
        </div>
      </section>
    </>
  );
}
