import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import Home from './pages/Home.jsx';
import Lote from './pages/Lote.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    /* basename: la app vive en un subdirectorio (ver `base` en
       vite.config.js). Sin esto el router compararia la ruta completa
       /ZhendaConsumidor/ contra "/" y siempre caeria en NotFound. */
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Header />
      <main id="contenido">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lote/:codigo" element={<Lote />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
