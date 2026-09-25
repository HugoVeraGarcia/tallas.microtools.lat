import type { APIRoute } from "astro";
import { SITE, sizeSlug } from "../config";
import { allUsSizes } from "../lib/sizes";
import { COUNTRIES } from "../lib/countries";

// Sitemap generado de los mismos datos que las páginas: una talla nueva entra sola.
// Sin la 404 y sin redirecciones. Ninguna página del sitio lleva noindex.
export const GET: APIRoute = () => {
  const paths = [
    "/",
    ...COUNTRIES.flatMap((c) => [
      `/${c.slug}/zapatos/`,
      ...allUsSizes(c).map((us) => `/${c.slug}/zapatos/${sizeSlug(c.slug, us)}/`),
    ]),
    "/legal/aviso-legal/",
    "/legal/privacidad/",
    "/legal/cookies/",
  ];
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    paths.map((p) => `  <url><loc>${new URL(p, SITE.dominio).href}</loc></url>`).join("\n") +
    `\n</urlset>\n`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
