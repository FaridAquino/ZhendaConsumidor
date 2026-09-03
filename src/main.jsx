import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Marca que JS esta activo: los estados iniciales de las animaciones
// (opacity: 0) solo se aplican bajo `.js` para no ocultar contenido si falla.
document.documentElement.classList.add('js');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
