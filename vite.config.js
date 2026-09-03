import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  /* GitHub Pages sirve el sitio en https://faridaquino.github.io/ZhendaConsumidor/,
     no en la raiz del dominio. Sin esto el index.html construido pediria
     /assets/index-xxx.js, que ahi es la raiz de github.io: 404 y pantalla en
     blanco.

     Va sin condicionar al comando a proposito. Asi `npm run dev` tambien sirve
     bajo /ZhendaConsumidor/ y desarrollas contra la misma ruta que produccion:
     un fallo de rutas se ve en el momento, no al desplegar. Vite imprime la URL
     completa al arrancar. */
  base: '/ZhendaConsumidor/',
  plugins: [react()],
})
