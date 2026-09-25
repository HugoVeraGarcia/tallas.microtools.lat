// Los valores que cambian al poner este sitio en producción. Un solo lugar para cambiar IDs.
//
// El ads.txt NO vive aquí: Google lo busca en el dominio raíz (microtools.lat) y,
// al vender con el mismo ID de editor, cubre también este subdominio.

export const SITE = {
  /** Dominio de este sitio, sin barra final. También está en astro.config.mjs (`site`). */
  dominio: "https://tallas.microtools.lat",
  marca: "TallaFácil",
  portafolio: "https://microtools.lat/",
  correo: "soporte.microtools.lat@gmail.com",
};

export const ADSENSE = {
  cliente: "ca-pub-4794558545797945",
  /** ID de cada bloque. Vacío = el hueco se retira del DOM (no queda un espacio en blanco). */
  bloques: {
    top: "",
    mid: "",
    bottom: "",
  } as Record<string, string>,
};

/** Tracking ID de Amazon Associates para este proyecto. */
export const AMAZON_TAG = "tallafacil-20";

/** Texto de divulgación que exige el Acuerdo de Operación de Amazon Associates. */
export const AMAZON_DISCLOSURE =
  "En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.";

export type Gender = "men" | "women";

const GENDER_EN: Record<Gender, string> = { men: "men's", women: "women's" };
const GENDER_ES: Record<Gender, string> = { men: "hombre", women: "mujer" };

export function genderLabel(gender: Gender): string {
  return GENDER_ES[gender];
}

/** Búsqueda en amazon.com por talla US, en inglés (idioma del catálogo de amazon.com). */
export function amazonSearchUrl(gender: Gender, us: number): string {
  const params = new URLSearchParams({ k: `${GENDER_EN[gender]} sneakers size ${us}`, tag: AMAZON_TAG });
  return `https://www.amazon.com/s?${params}`;
}

/** "9.5" → "9-5", para las URL. */
export function slugFor(value: number): string {
  return String(value).replace(".", "-");
}

export function sizeUrl(country: string, us: number, gender?: Gender): string {
  const hash = gender === "women" ? "#mujer" : gender === "men" ? "#hombre" : "";
  return `/${country}/zapatos/${sizeSlug(country, us)}/${hash}`;
}

/** Segmento de URL de una página de talla: "talla-9-5-us-en-peru". */
export function sizeSlug(country: string, us: number): string {
  return `talla-${slugFor(us)}-us-en-${country}`;
}
