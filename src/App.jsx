import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import Home from './pages/Home.jsx';
import Lote from './pages/Lote.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <BrowserRouter>
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
