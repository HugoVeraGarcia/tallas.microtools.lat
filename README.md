# TallaFácil — tallas.microtools.lat

Conversor de tallas de zapatillas de Estados Unidos (US) a talla chilena, peruana y colombiana, hombre y mujer. Sitio estático con Astro,
publicado en Netlify. Contexto completo del proyecto: `PROJECT_CONTEXT.md`. Pendientes: `TODO.md`.

## Verlo en tu computadora

Doble clic en `ver-sitio.bat`: abre `http://127.0.0.1:4330/` con el sitio ya compilado de `dist/` (solo necesita Node,
sin `npm install`). Si las dependencias están instaladas, antes recompila para mostrar los últimos cambios.
Deja la ventana negra abierta mientras lo uses; ciérrala para apagarlo.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor local en `http://localhost:4321` |
| `npm run build` | Genera el sitio en `dist/` |
| `npm run check` | Build + revisión del HTML (SEO, AdSense, enlaces, palabras) + coherencia de las tablas |
| `npm run e2e` | Pruebas en navegador (necesita `npm run preview` corriendo en otra terminal) |

## Dónde se cambia cada cosa

- Dominio, IDs de AdSense, tag de Amazon: `src/config.ts`
- Tablas por país: `src/data/{chile,peru,colombia}/zapatos.json` y `src/lib/countries.ts`
- Tablas por marca: `src/data/marcas/zapatos.json`
