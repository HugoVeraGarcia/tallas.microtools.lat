// Pruebas en navegador real sobre el build. Uso:
//   npm run build && npx astro preview --port 4321 &   (en otra terminal)
//   node scripts/e2e.mjs
// CHROMIUM_PATH permite usar un Chromium ya instalado; si no, usa el de Playwright.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:4321";
const SHOTS = new URL("../test-results/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];
const check = (cond, msg) => { if (!cond) errors.push(msg); else console.log("ok  ", msg); };

async function newPage(width = 390) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  // Sin salida a internet en pruebas: se responde con un script vacío a AdSense en vez de dejarlo fallar.
  await page.route(/googlesyndication\.com/, (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  page.on("pageerror", (e) => errors.push(`error JS en ${page.url()}: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    if (page.url().includes("/no-existe/") && m.text().includes("404")) return; // esperado: es la prueba de la 404
    errors.push(`consola en ${page.url()}: ${m.text()}`);
  });
  return page;
}
const text = (page, sel) => page.locator(sel).first().textContent();

// --- Página de talla con hombre y mujer ---
let p = await newPage();
await p.goto(`${BASE}/chile/zapatos/talla-7-us-en-chile/`);
check((await p.title()).startsWith("Talla 7 US en Chile: 40 hombre, 38 mujer"), "talla 7: title con ambas equivalencias");
check((await p.locator(".answer").count()) === 2, "talla 7: dos tarjetas (hombre y mujer)");
check((await text(p, "#hombre .answer-cl")) === "40" && (await text(p, "#mujer .answer-cl")) === "38", "talla 7: 40 hombre / 38 mujer");
const amazon = await p.locator("#mujer .cta-btn").getAttribute("href");
check(amazon.includes("tag=tallafacil-20") && amazon.includes("women%27s+sneakers+size+7"), "talla 7: Amazon mujer en inglés y con tag");
check((await p.inputValue(".c-gender")) === "men" && (await text(p, ".c-out-cl")) === "40", "conversor arranca en hombre 7 = 40");

// La silueta es proporcional al largo real: 25 cm sobre una regla de 35.
await p.waitForTimeout(400);
const [shoe, ruler] = await Promise.all([p.locator(".shoe").boundingBox(), p.locator(".c-ruler").boundingBox()]);
check(Math.abs(shoe.width / ruler.width - 25 / 35) < 0.01, `silueta a escala (${(shoe.width / ruler.width).toFixed(3)} vs ${(25 / 35).toFixed(3)})`);
check((await text(p, ".c-tip")) === "25 cm", "globo del conversor muestra 25 cm");
check((await p.locator(".ad-slot").count()) === 0, "huecos de anuncio sin ID retirados del DOM");
await p.screenshot({ path: SHOTS + "talla-7-movil.png", fullPage: true });

// Ancla #mujer
await p.goto(`${BASE}/chile/zapatos/talla-7-us-en-chile/#mujer`);
await p.reload();
check((await p.inputValue(".c-gender")) === "women" && (await text(p, ".c-out-cl")) === "38", "#mujer: conversor arranca en mujer 7 = 38");

// Cambio de género a una talla que no existe en la otra tabla → la más cercana.
await p.goto(`${BASE}/chile/zapatos/talla-13-us-en-chile/`);
await p.selectOption(".c-gender", "women");
check((await p.inputValue(".c-us")) === "11", "US 13 hombre → mujer salta a la más cercana (11)");
await p.selectOption(".c-us", "9");
await p.selectOption(".c-gender", "men");
check((await p.inputValue(".c-us")) === "9" && (await text(p, ".c-out-cl")) === "42.5", "mujer 9 → hombre mantiene 9 = 42.5");

// Página de talla solo de mujer
await p.goto(`${BASE}/chile/zapatos/talla-5-us-en-chile/`);
check((await p.locator(".answer").count()) === 1 && (await p.locator("#mujer").count()) === 1, "talla 5: solo tarjeta de mujer");
check((await p.inputValue(".c-gender")) === "women", "talla 5: conversor en mujer");

// --- Perú: numeración europea, tiendas peruanas ---
await p.goto(`${BASE}/peru/zapatos/talla-9-us-en-peru/`);
check((await p.getAttribute("html", "lang")) === "es-PE", "Perú: lang es-PE");
check((await text(p, "#hombre .answer-cl")) === "42.5" && (await text(p, "#mujer .answer-cl")) === "40.5", "Perú: 9 US = 42.5 hombre / 40.5 mujer");
const pe = await p.locator("#hombre .stores a").evaluateAll((as) => as.map((a) => a.href));
check(pe[0].startsWith("https://www.falabella.com.pe/falabella-pe/search") && pe[1].startsWith("https://listado.mercadolibre.com.pe/"), "Perú: Falabella y MercadoLibre de Perú");

const peStores = await p.locator("h2:has-text('en tiendas de Perú') + p + .table-scroll td").allTextContents();
check(peStores.join("|") === "Oechsle|42.5|40.5|Falabella Perú|42.5 o 40|40.5 o 39", `Perú: tabla por tienda (${peStores.join("|")})`);
await p.goto(`${BASE}/peru/zapatos/`);
check((await p.locator("text=exoneradas de impuestos si el valor del producto no supera los 200 dólares").count()) === 1, "Perú: sección de compras en EE. UU. con el límite de SUNAT");
await p.goto(`${BASE}/chile/zapatos/`);
check((await p.locator("text=límite de 200 dólares").count()) === 0, "Chile: sin la sección de Perú");

// --- Colombia: talla colombiana distinta de la europea ---
await p.goto(`${BASE}/colombia/zapatos/talla-9-us-en-colombia/`);
check((await p.getAttribute("html", "lang")) === "es-CO", "Colombia: lang es-CO");
check((await text(p, "#hombre .answer-cl")) === "40" && (await text(p, "#mujer .answer-cl")) === "39", "Colombia: 9 US = 40 hombre / 39 mujer (talla CO)");
check((await text(p, "#hombre .answer-cm")).includes("europea 42.5"), "Colombia: tarjeta muestra también la europea");
check((await text(p, ".c-out-cl")) === "40" && (await text(p, ".c-out-eu")) === "42.5", "Colombia: conversor muestra CO 40 y EU 42.5");
const co = await p.locator("#mujer .stores a").first().getAttribute("href");
check(co.includes("falabella.com.co") && co.includes("talla+39"), "Colombia: Falabella CO busca por talla colombiana");
await p.screenshot({ path: SHOTS + "colombia-9-movil.png", fullPage: false });

// --- Landing: cálculo por largo de pie ---
await p.goto(`${BASE}/chile/zapatos/`);
await p.fill(".m-cm", "26,3");
check((await text(p, ".m-out")).includes("US 8.5 = 42 chilena"), "pie de 26,3 cm (hombre) → US 8.5 = 42");
await p.selectOption(".m-gender", "women");
await p.fill(".m-cm", "24");
check((await text(p, ".m-out")).includes("US 7 = 38 chilena"), "pie de 24 cm (mujer) → US 7 = 38");
check((await p.locator(".m-out a").getAttribute("href")) === "/chile/zapatos/talla-7-us-en-chile/#mujer", "enlace del resultado a la talla con #mujer");
await p.fill(".m-cm", "40");
check((await text(p, ".m-out")).includes("Revisa la medida"), "medida fuera de rango avisa");
await p.screenshot({ path: SHOTS + "landing-movil.png", fullPage: true });

// --- Sin scroll horizontal en móvil ---
for (const path of ["/", "/chile/zapatos/", "/chile/zapatos/talla-9-5-us-en-chile/", "/colombia/zapatos/", "/peru/zapatos/talla-7-us-en-peru/", "/legal/privacidad/", "/no-existe/"]) {
  const q = await newPage(360);
  await q.goto(BASE + path);
  const overflow = await q.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 0, `sin scroll horizontal a 360 px: ${path}`);
  if (path === "/") await q.screenshot({ path: SHOTS + "portada-movil.png", fullPage: true });
  await q.close();
}

// El correo de contacto se escribe con JS.
await p.goto(`${BASE}/legal/aviso-legal/`);
check((await text(p, "[data-correo]")) === "soporte.microtools.lat@gmail.com", "correo inyectado en el aviso legal");

// Escritorio
const d = await newPage(1280);
await d.goto(`${BASE}/chile/zapatos/talla-9-us-en-chile/`);
await d.screenshot({ path: SHOTS + "talla-9-escritorio.png", fullPage: false });

await browser.close();
if (errors.length) {
  console.error(`\n${errors.length} fallo(s):`);
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
console.log("\nOK: todas las pruebas en navegador pasaron.");
