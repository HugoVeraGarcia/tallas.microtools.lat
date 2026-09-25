// Revisa el HTML de dist/ tal como lo verá el robot de Google (sin ejecutar JavaScript).
// Uso: npm run build && node scripts/check-build.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const DIST = new URL("../dist/", import.meta.url).pathname;
const SITE = "https://tallas.microtools.lat";
const ADS_CLIENT = "ca-pub-4794558545797945";
const AMAZON_TAG = "tallafacil-20";
const MIN_WORDS_TOOL = 500; // portada, landing y páginas de talla
const MIN_WORDS_LEGAL = 200;

const errors = [];
const warnings = [];
const fail = (page, msg) => errors.push(`${page}: ${msg}`);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const htmlFiles = walk(DIST).filter((f) => f.endsWith(".html"));
const urlPath = (file) => "/" + relative(DIST, file).split(sep).join("/").replace(/index\.html$/, "");

function visibleWords(html) {
  const body = html
    .replace(/<head[\s\S]*?<\/head>/i, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ");
  return body.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

const titles = new Map();
const descriptions = new Map();
const pages = [];

for (const file of htmlFiles) {
  const path = urlPath(file);
  const is404 = path === "/404.html";
  const html = readFileSync(file, "utf8");
  const head = (html.match(/<head>([\s\S]*?)<\/head>/i) || [])[1] || "";
  pages.push(path);

  const lang = (html.match(/<html lang="([^"]+)"/) || [])[1];
  const expectedLang = path.startsWith("/chile/") ? "es-CL" : path.startsWith("/peru/") ? "es-PE" : path.startsWith("/colombia/") ? "es-CO" : "es";
  if (lang !== expectedLang) fail(path, `lang="${lang}", se esperaba "${expectedLang}"`);
  if (/noindex/i.test(html)) fail(path, "tiene noindex");

  const title = (head.match(/<title>([^<]*)<\/title>/) || [])[1];
  const desc = (head.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!title) fail(path, "sin <title>");
  if (!desc) fail(path, "sin meta description");
  if (title && titles.has(title)) fail(path, `title repetido con ${titles.get(title)}`);
  if (desc && descriptions.has(desc)) fail(path, `description repetida con ${descriptions.get(desc)}`);
  titles.set(title, path);
  descriptions.set(desc, path);
  if (title && title.length > 70) warnings.push(`${path}: title de ${title.length} caracteres`);

  if (!is404) {
    const canonical = (head.match(/<link rel="canonical" href="([^"]*)"/) || [])[1];
    if (canonical !== SITE + path) fail(path, `canonical ${canonical} ≠ ${SITE + path}`);
  }

  // AdSense: meta y script en el <head>, una sola vez cada uno.
  const metaCount = (head.match(new RegExp(`<meta name="google-adsense-account" content="${ADS_CLIENT}"`, "g")) || []).length;
  const scriptCount = (html.match(/adsbygoogle\.js\?client=/g) || []).length;
  const scriptInHead = (head.match(new RegExp(`adsbygoogle\\.js\\?client=${ADS_CLIENT}`, "g")) || []).length;
  if (metaCount !== 1) fail(path, `meta de AdSense x${metaCount}`);
  if (scriptCount !== 1 || scriptInHead !== 1) fail(path, `script de AdSense: ${scriptCount} en total, ${scriptInHead} en el head`);

  // JSON-LD válido.
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch {
      fail(path, "JSON-LD inválido");
    }
  }
  if (path.includes("/zapatos/talla-") && !/"@type":"FAQPage"/.test(html)) fail(path, "sin FAQPage");

  // Enlaces a tiendas.
  for (const m of html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)) {
    const tag = m[0];
    const href = m[1].replace(/&amp;/g, "&");
    const sponsored = /rel="[^"]*sponsored/.test(tag);
    if (href.includes("amazon.com/s?")) {
      if (!href.includes(`tag=${AMAZON_TAG}`)) fail(path, `enlace de Amazon sin tag ${AMAZON_TAG}`);
      if (!sponsored) fail(path, "enlace de Amazon sin rel=sponsored");
    } else if (sponsored) {
      fail(path, `rel=sponsored en un enlace que no es de afiliado: ${href}`);
    }
    // Enlaces internos: deben existir.
    if (href.startsWith("/") && !href.startsWith("//")) {
      const clean = href.split("#")[0].split("?")[0];
      const target = clean.endsWith("/") ? join(DIST, clean, "index.html") : join(DIST, clean);
      if (!existsSync(target) && !/^\/(chile|peru|colombia)\/?$/.test(clean)) fail(path, `enlace interno roto: ${href}`);
    }
  }

  if (path.includes("/talla-") && !html.includes("En calidad de Afiliado de Amazon")) fail(path, "sin divulgación de Amazon");

  const words = visibleWords(html);
  const min = path.startsWith("/legal/") ? MIN_WORDS_LEGAL : is404 ? 0 : MIN_WORDS_TOOL;
  if (words < min) fail(path, `solo ${words} palabras visibles (mínimo ${min})`);
  console.log(`${String(words).padStart(5)} palabras  ${path}`);
}

// Sitemap: todas las páginas públicas, y nada que no exista.
const sitemap = readFileSync(join(DIST, "sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, ""));
for (const p of pages.filter((p) => p !== "/404.html")) if (!locs.includes(p)) fail("sitemap.xml", `falta ${p}`);
for (const l of locs) if (!pages.includes(l)) fail("sitemap.xml", `lista ${l}, que no existe`);

const robots = readFileSync(join(DIST, "robots.txt"), "utf8");
if (!robots.includes(`Sitemap: ${SITE}/sitemap.xml`)) fail("robots.txt", "no apunta al sitemap");
if (/Disallow:\s*\/\S/.test(robots)) fail("robots.txt", "bloquea rutas");

for (const w of warnings) console.warn("AVISO", w);
if (errors.length) {
  console.error(`\n${errors.length} error(es):`);
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
console.log(`\nOK: ${pages.length} páginas revisadas, ${locs.length} URL en el sitemap.`);
