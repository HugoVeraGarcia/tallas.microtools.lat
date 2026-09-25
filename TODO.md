# TallaFácil — TODO

Actualizado el 24-09-2026. P0, P1, P2, P4, Perú y Colombia están hechos; el sitio está listo para subir.
Detalle de lo hecho en `PROJECT_CONTEXT.md` (sección 8).

## Hecho

- [x] **P0** — Hombre y mujer en la misma página, Amazon en inglés con `tallafacil-20`, tabla verificada contra Nike,
      Falabella/MercadoLibre por talla chilena y sin `sponsored`.
- [x] **Conversor** — silueta a escala real (regla de 0 a 35 cm); al cambiar de género salta a la talla más cercana.
- [x] **P1** — `site`, sitemap, robots, canonical, Open Graph, `lang="es-CL"`, AdSense en el `<head>`, huecos de anuncio,
      legales (aviso legal, privacidad, cookies) con correo por JS, enlace al portafolio, `NODE_VERSION`,
      carpeta `miniApps\tallas`, tarjeta en `microtools-home`.
- [x] **P2** — Tabla por marca (Nike, Adidas, New Balance, Puma), cálculo por largo de pie, texto propio por talla
      (vecinas, entre dos tallas, marcas), FAQ con JSON-LD, landing de ~1.300 palabras, mínimo de palabras en el build.
- [x] **Perú y Colombia** — rutas `/{pais}/zapatos/…`, talla colombiana (CO) con la europea al lado, tiendas de cada país, 59 páginas.
- [x] **P4** — `scripts/check-build.mjs`, `scripts/test-data.mjs`, `scripts/e2e.mjs` (Playwright), capturas móvil.

## Para publicar (tú)

- [ ] `git init` en `miniApps\tallas`, primer commit y push a un repo nuevo `miniApps-tallas`.
- [ ] Commit y push de los cambios en `miniApps\microtools-home` (tarjeta de TallaFácil).
- [ ] Netlify: "Add new site" → importar `miniApps-tallas`. Build y publish ya vienen en `netlify.toml`.
- [ ] Netlify → Domain management → agregar `tallas.microtools.lat`.
- [ ] Namecheap → DNS de `microtools.lat` → CNAME `tallas` → `<nombre-del-sitio>.netlify.app`.
- [ ] Esperar el certificado HTTPS (si se queda en el comodín, botón *Verify DNS configuration*).
- [ ] Search Console (propiedad de dominio ya verificada) → Sitemaps → `https://tallas.microtools.lat/sitemap.xml`.
- [ ] Amazon Associates → "Edita la lista de tu sitio web" → agregar `https://tallas.microtools.lat/` (el mismo día).
- [ ] Amazon Associates → completar el cuestionario fiscal de EE. UU. (W-8BEN).

## Después

- [ ] AdSense aprobado → crear bloques top / mid / bottom y poner sus IDs en `src/config.ts` (`ADSENSE.bloques`).
- [ ] GA4 (opcional): el resto de microtools tampoco lo tiene configurado todavía.
- [ ] A los 3–4 meses: medir el total del subdominio en Search Console. Criterio propuesto para replicar a Perú:
      ≥ 3.000 visitas orgánicas/mes por país antes de invertir más en él.
- [ ] Revisar consultas reales en Search Console antes de crear páginas nuevas.
- [x] Contenido propio de Perú: tabla por tienda (Oechsle, Falabella Perú) y sección de compras en EE. UU. con las reglas de SUNAT.
- [ ] Confirmar cómo marcan la talla Ripley y Platanitos (etiqueta o cartel en tienda) para sumarlas a la tabla de Perú.
- [ ] Revisar cada tanto la regla de SUNAT de US$ 200 (anunció que evalúa cambios) y actualizar `PeruCompras.astro`.
- [ ] España: requiere cuenta de afiliado de amazon.es y otro patrón de palabras clave.
- [ ] Afiliación local: Falabella Creators F (Chile), f.partners (Perú), MercadoLibre Afiliados (confirmar país por país).
- [ ] Categoría "Ropa": investigación de palabras clave antes de construir nada.
- [ ] Tallas de niños (validar volumen).
