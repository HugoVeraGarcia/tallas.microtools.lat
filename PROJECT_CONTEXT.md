# TallaFácil — Contexto del proyecto

> Documento de traspaso para retomar este proyecto sin el historial de conversación previo. Si eres una instancia de Claude leyendo esto por primera vez: aquí está todo lo que necesitas saber antes de tocar código.

## 1. Qué es esto y por qué existe

**TallaFácil** es un comparador visual de tallas de calzado (US ↔ tallas locales), pensado como "micro-herramienta" rentable: sitio 100% estático, sin backend, sin base de datos, monetizado con afiliados y (más adelante) display ads. Es parte de una red de proyectos del usuario bajo el dominio `microtools.lat`, y vive en un subdominio propio.

El modelo de negocio se validó **antes** de escribir código: keyword research real en Google Keyword Planner, revisión de SERP para ver competencia, y verificación de programas de afiliados disponibles. No es una idea especulativa — cada decisión de abajo tiene un motivo basado en datos.

## 2. Validación previa (resumen de lo encontrado)

Se investigó el patrón de búsqueda en 6 países (España, México, Colombia, Argentina, Chile, Perú) vía Google Keyword Planner:

- **Hallazgo clave que cambió el diseño**: la frase "talla ropa [país] a estados unidos" (el patrón que se iba a usar originalmente) casi no tiene volumen de búsqueda real en ningún país. Lo que sí tiene volumen fuerte es el patrón **"talla [número] us en [país]"** y **"tallas us a [país]"**, centrado casi enteramente en **calzado/zapatillas**, no en ropa general.
- **España**: el patrón país-a-país no funciona ahí; el hueco de mercado tampoco existe — un competidor real, **QueTalla.es**, ya construyó exactamente esa arquitectura (conversor + páginas programáticas por país×categoría×tienda).
- **Colombia**: volumen fuerte (top ~5.000 búsquedas/mes), SERP abierto (solo blogs y guías de marca, sin comparador dedicado).
- **Argentina**: volumen fuerte pero concentrado en zapatillas deportivas, SERP ya competido (3 conversores dedicados + blog de MercadoLibre con mucha autoridad).
- **Chile**: el mercado más fuerte y granular de todos — múltiples términos individuales en 5.000/mes (por cada talla específica: "talla 7 us en chile", "talla 8 us en chile", etc.), SERP abierto (solo guías de marca, sin comparador universal). **Elegido como mercado piloto.**
- **Perú**: fuerte y granular también, SERP abierto. Segundo mercado a construir.
- **México**: el volumen bruto más alto de todos, pero SERP ya competido — QueTalla.es tiene página específica ahí, más un comparador dedicado (calculoseguro.mx) y el blog de MercadoLibre.
- **Decisión de lanzamiento**: Chile → Perú → Colombia como mercados principales. México y Argentina quedan como expansión secundaria (tienen volumen pero más fricción de competencia). España necesitaría un patrón de keyword distinto (por número de talla específico, no por frase país-a-país) si se retoma.

## 3. Stack técnico

- **Framework**: [Astro](https://astro.build) — genera HTML 100% estático, sin servidor, ideal para SEO programático a gran escala.
- **Lenguaje**: TypeScript (config `strict`).
- **Hosting**: **Netlify** (decisión del usuario — no Cloudflare Pages, que fue mi sugerencia inicial y quedó descartada).
- **Dominio**: **`tallas.microtools.lat`** (confirmado 24-09-2026). Está en `astro.config.mjs` (`site`), `src/config.ts` (`SITE.dominio`), `public/robots.txt` y `scripts/check-build.mjs`.
- **Carpeta local**: `miniApps\tallas` (junto a `generador-qr`, `calculadora-liquidacion` y `microtools-home`). Repo sugerido: `miniApps-tallas`. La carpeta vieja `calculadora finiquito\proy 1` queda obsoleta.
- **Deploy**: Git + GitHub → Netlify (continuous deployment). El usuario dijo explícitamente que maneja git manualmente — **no ejecutar comandos git de escritura (commit/push) sin que él lo pida**. La carpeta `miniApps\tallas` se creó sin `.git`: el usuario hace `git init`, el primer commit y el push.
- **`netlify.toml`**: `npm run build` → `dist`, `NODE_VERSION = "22"` (Astro exige Node ≥ 22.12), caché larga para `/_astro/*` y cabeceras de seguridad como en los otros sitios.
- **`public/_redirects`**: `/{pais}/` → `/{pais}/zapatos/` (301) para chile, peru y colombia: los países no tienen página propia mientras solo exista la categoría zapatos.

## 4. Arquitectura del sitio

```
src/
  config.ts                 # dominio, AdSense (cliente + IDs de bloque), tag de Amazon, URLs de tiendas
  data/
    chile/zapatos.json      # US → local/EU/cm (local = EU; guía oficial de Nike)
    peru/zapatos.json       # igual que Chile (Perú usa numeración europea)
    colombia/zapatos.json   # local = talla colombiana CO (guía de Falabella Colombia); EU y cm de Nike
    marcas/zapatos.json     # US → EU por marca: Nike, Adidas, New Balance, Puma
  lib/countries.ts          # países: nombre, gentilicio, lang, tiendas (Falabella/MercadoLibre por país), textos propios
  lib/sizes.ts              # acceso a los datos y frases generadas (vecinas, grupos por marca)
  scripts/ads.ts            # monta los huecos de AdSense; sin ID de bloque, retira el hueco
  layouts/Layout.astro      # head (canonical, OG, AdSense, JSON-LD), cabecera microtools / TallaFácil, pie legal
  components/
    SizeConverter.astro     # conversor visual (sección 6)
    FootMeasure.astro       # "calcula tu talla por el largo del pie"
    BrandTable.astro        # tabla por marca (una talla o completa)
    AdSlot.astro            # hueco de anuncio con altura reservada
  pages/
    index.astro                         # portada TallaFácil
    [pais]/zapatos/index.astro          # landing por país: conversor, cálculo por pie, tablas, guía, FAQ
    [pais]/zapatos/[talla].astro        # 17 páginas por país: /peru/zapatos/talla-9-us-en-peru/
    legal/{aviso-legal,privacidad,cookies}/index.astro
    404.astro
    sitemap.xml.ts                      # sitemap generado de los mismos datos
public/  favicon.svg, robots.txt, _redirects
scripts/ check-build.mjs, test-data.mjs, e2e.mjs
```

**Patrón de URL**: `/{pais}/zapatos/talla-9-us-en-{pais}/` (chile, peru, colombia) — coincide literalmente con el patrón de búsqueda validado ("talla 9 us en chile"). El H1 y el `<title>` de cada página siguen el mismo patrón, no una frase genérica inventada.

**Hombre y mujer en la misma URL (decidido 24-09-2026)**: la búsqueda validada ("talla 7 us en chile") no dice género, así que cada página de talla responde **ambas** equivalencias arriba, en dos tarjetas con ancla `#hombre` y `#mujer`. Separar en URLs por género duplicaría páginas casi idénticas sin volumen propio probado. Los enlaces por género (índice y chips) apuntan al ancla, y el conversor lee el ancla para arrancar en ese género. Las tallas que existen en una sola tabla (US 5–5.5 solo mujer; US 11.5–14 solo hombre) muestran una tarjeta y una nota. `<title>` y meta description llevan las dos equivalencias.

**Por qué existe el nivel `/zapatos/`**: el sitio nació sin distinguir categorías (todo asumía implícitamente "zapatos"). Se corrigió a pedido del usuario para que "zapatos" y "ropa" sean categorías explícitas desde la arquitectura. "Ropa" no tiene datos ni páginas (se quitó la tarjeta "próximamente" y la página `/chile/`, que eran contenido vacío) — el patrón de búsqueda para ropa es distinto (algo como "talla NN equivale a", no país-a-país) y requiere su propio diseño de keyword research antes de construirse.

**Países (24-09-2026): Chile, Perú y Colombia.** Para agregar otro: un `src/data/{pais}/zapatos.json` con las mismas tallas US y una entrada en `lib/countries.ts` (tiendas, textos `sistema` y `sistemaCorto`, `localIsEU`). Páginas, sitemap y enlaces entre países salen solos.
- **Perú** usa la numeración europea en adultos (guía de tallas de Oechsle): mismos números que Chile. Contenido propio de Perú (24-09-2026):
  - Tabla "La talla X US en tiendas de Perú" en cada página de talla (`tiendasTalla` en `lib/countries.ts`): Oechsle = EU; Falabella Perú = "EU o CO", porque su guía de compra de zapatillas muestra primero una columna CO (numeración colombiana). Ripley y Platanitos no se incluyeron: sus guías no se pudieron leer (PDF bloqueado / 403). Si Hugo confirma cómo marcan, se agregan.
  - Nota de que la guía de Oechsle da 1 cm más de largo en hombre que Nike (28 cm para la 9 US).
  - Sección "Comprar zapatillas en Estados Unidos desde Perú" en la landing (`components/PeruCompras.astro`): límite de SUNAT de US$ 200 FOB exonerado; de 200 a 2.000, 4 % ad valorem + 18 % IGV sobre CIF, con ejemplo calculado; tope con DNI de 3 envíos al año de hasta US$ 1.000; envío directo vs casillero; devoluciones. Fuente: asistente aduanero de SUNAT. SUNAT anunció que evalúa cambios: revisar la regla cada tanto.
- **Colombia** usa la **talla colombiana (CO)**, más baja que la europea (hombre: CO = US + 31; mujer: CO = US + 30, según Falabella Colombia). Las páginas de Colombia muestran CO como respuesta principal y EU al lado; la tabla por marca se rotula como numeración europea. Otras fuentes colombianas (p. ej. nisastore.co) dan hasta un número menos en mujer: la tabla de Falabella es la de referencia porque es la de la tienda más grande.
- **España**: descartado por ahora (patrón de búsqueda distinto, QueTalla.es ya ocupa el hueco, y habría que usar amazon.es con otra cuenta de afiliado).
- **Riesgo conocido**: las páginas de Chile y Perú tienen los mismos números; se diferencian en tiendas, textos del país y lang. Si Search Console muestra una de las dos como duplicada, reforzar el contenido local de Perú.

## 5. Modelo de datos

`src/data/chile/zapatos.json`:
```json
{
  "category": "zapatos",
  "categoryLabel": "Zapatos y zapatillas",
  "country": "Chile",
  "countrySlug": "chile",
  "sizeSystem": "EU/Paris Point",
  "men": [{ "us": 9, "cl": 42.5, "cm": 27 }, ...],
  "women": [{ "us": 9, "cl": 40.5, "cm": 26 }, ...]
}
```
- Valores **verificados el 24-09-2026 contra la guía oficial de tallas de Nike** (nike.com/size-fit, hombre y mujer). La versión anterior tenía la tabla de mujer desfasada media talla desde US 6.5 y el US 14 de hombre mal (48.5/32 → 49/32.5). Otras marcas: `src/data/marcas/zapatos.json`, tomadas de la guía de tallas de cada marca (Adidas en tercios: 42⅔). `scripts/test-data.mjs` exige que Nike en ese archivo coincida con la tabla principal.
- Chile usa la numeración EU/Paris Point (igual que España y la mayoría de Europa).

## 6. El comparador visual (`SizeConverter.astro`)

Esto es el corazón del producto — lo que lo diferencia de un simple selector+tabla (que es lo que hace QueTalla.es, el competidor de referencia). Componentes:

- Selects de género y talla US (pobla dinámicamente según género elegido).
- Badges grandes mostrando "US {n}" = "{País} {n}".
- **Comparador gráfico real**: una silueta SVG cuyo largo es **proporcional al largo de pie** sobre una regla de **0 a 35 cm** (desde el talón). La versión anterior usaba una regla de 20 a 34 con un ancho mínimo del 32 % y marcaba ~2 cm de más; la e2e comprueba ahora que 25 cm ocupan 25/35 de la regla.
- Al cambiar de género mantiene la talla US si existe; si no, salta a la más cercana. Lee `#hombre` / `#mujer` de la URL para arrancar en ese género.
- Las transiciones se activan después del primer dibujo (clase `ready`), para que al cargar no se vea el zapato "creciendo".

**Bug real encontrado y corregido**: los tick marks de la regla se crean dinámicamente con `document.createElement` dentro del `<script>` del cliente. Astro aplica su atributo de scoping (`data-astro-cid-*`) a los elementos del HTML renderizado en build time, pero **no** a elementos creados después por JavaScript en el navegador — así que las reglas CSS scoped (`.tick { ... }`) se ignoraban silenciosamente. Solución: usar `:global()` para cualquier selector que apunte a elementos creados dinámicamente. Si se agregan más componentes interactivos que generen DOM por JS, hay que recordar este patrón.

## 7. Monetización

- **Fuente principal: AdSense** (misma cuenta y editor que el resto de microtools, `ca-pub-4794558545797945`). Amazon es secundario: comisión baja en calzado y cookie de 24 h.
- **Botón de compra — Amazon Associates**: el usuario ya tiene cuenta activa (tracking ID propio de este proyecto: **`tallafacil-20`**, creado el 24-09-2026; el ID principal de la cuenta es `microtools0f-20`. El tag vive **solo** en `src/config.ts` → `AMAZON_TAG`). El link **se construye dinámicamente en cada página**, no es un link estático:
  ```
  https://www.amazon.com/s?k={men's|women's}+sneakers+size+{us}&tag=<AMAZON_TAG>
  ```
  Esto es importante: cada una de las 17 páginas busca su propia talla exacta, no una búsqueda genérica repetida. Amazon Associates tiene la ventaja de ser **una sola cuenta que cubre todos los países** (a diferencia de los afiliados locales), y encaja con el caso de uso real (la gente busca "talla US" porque va a comprar en Amazon.com).
- La búsqueda va **en inglés**: el catálogo de amazon.com está en inglés y una búsqueda en español da malos resultados.
- **Enlaces secundarios — Falabella y MercadoLibre**: buscan por género + **talla chilena** de esa tarjeta (`zapatillas hombre talla 42.5`). Sin afiliación todavía, así que llevan `rel="noopener"` y **no** `sponsored`. Se generan en `src/config.ts`.
- **Hallazgo importante que corrigió una recomendación anterior**: **Dafiti cerró operaciones en Chile en febrero 2025** (14 años operando, se retiró por baja participación de mercado frente a MercadoLibre/Falabella). Ya no es opción de afiliación para Chile. Sigue activo en Colombia y Brasil.
- **MercadoLibre Afiliados no está confirmado como disponible en Perú** — para Perú puede haber que usar Linio (tiene programa propio, pero el tracking solo funciona en desktop, no mobile — limitación real) o el programa propio de Falabella Perú ("f.partners", distinto de "Creators F" de Chile).
- Cada país requiere cuentas de afiliado separadas porque son negocios locales distintos — excepto Amazon Associates, que es global.

## 8. Estado actual (24-09-2026)

**Hecho — listo para subir:**
- 59 páginas: portada, 3 landings de país (Chile, Perú, Colombia), 51 páginas de talla, 3 legales, 404 (+ sitemap.xml con 58 URL).
- Hombre y mujer en la misma página de talla, con tabla por marca, tallas vecinas, cómo medir, FAQ con JSON-LD `FAQPage` y `BreadcrumbList`.
- Cálculo de talla por largo de pie (acepta coma o punto).
- AdSense: meta + script en el `<head>` del HTML (no inyectado por JS), huecos top/mid/bottom que se retiran si no hay ID de bloque. `ads.txt` lo cubre la raíz.
- Legales con correo inyectado por JS y divulgación de Amazon Associates (en el pie de todas las páginas y junto a los botones).
- Cabecera "microtools / TallaFácil" y enlaces "Más herramientas" al portafolio.
- `microtools-home`: tarjeta nueva de TallaFácil en `data/sitio.json` + icono `zapato` en `build/generar.mjs`, regenerado.
- Pruebas en verde: `npm run check` (build + `check-build.mjs` + `test-data.mjs`) y `npm run e2e` (36 comprobaciones en Chromium).

**Pendiente:**
1. Usuario: `git init`, primer commit y push de `miniApps\tallas` (repo `miniApps-tallas`) y de los cambios de `microtools-home`.
2. Netlify: sitio nuevo desde el repo; dominio `tallas.microtools.lat`; CNAME `tallas` en Namecheap al sitio de Netlify.
3. Search Console: la propiedad de dominio ya cubre el subdominio → enviar `https://tallas.microtools.lat/sitemap.xml`.
4. Amazon Associates: registrar `https://tallas.microtools.lat/` en la lista de sitios el mismo día que quede en línea; completar el W-8BEN.
5. AdSense: cuando aprueben la cuenta, crear los bloques y poner sus IDs en `src/config.ts` → `ADSENSE.bloques`.
6. Medir 3–4 meses por país en Search Console antes de invertir más en uno (España, ropa, niños).
7. Afiliación local (Falabella Creators F, MercadoLibre) y categoría "Ropa": más adelante.

## 9. Preferencias y restricciones del usuario a respetar

- **No tocar git para escritura (commit/push) sin que lo pida explícitamente** — lo hace él manualmente.
- Ya tiene cuenta de Amazon Associates activa; quiere un tracking ID distinto por proyecto.
- Dominio propio ya existente: `microtools.lat` (home actual ahí); este proyecto es un subdominio nuevo.
- Host elegido: Netlify (no Cloudflare Pages).
- Prefiere que se verifique visualmente cada cambio de UI (screenshot o navegador) antes de darlo por terminado, no solo que el build compile.
