import chile from "../data/chile/zapatos.json";
import peru from "../data/peru/zapatos.json";
import colombia from "../data/colombia/zapatos.json";
import type { Gender } from "../config";

export interface SizeRow {
  us: number;
  /** Talla que se usa en el país (en Chile y Perú coincide con la europea). */
  local: number;
  /** Numeración europea, la que viene en la etiqueta como EU. */
  eu: number;
  cm: number;
}

export interface Store {
  nombre: string;
  url: (gender: Gender, localSize: number) => string;
}

export interface Country {
  slug: string;
  nombre: string;
  /** "chilena", "peruana", "colombiana" */
  gentilicio: string;
  lang: string;
  ogLocale: string;
  /** true si la talla local es la europea (Chile, Perú). */
  localIsEU: boolean;
  source: string;
  men: SizeRow[];
  women: SizeRow[];
  stores: Store[];
  /** Párrafos propios del país para la guía de la landing (HTML simple no permitido: texto plano). */
  sistema: string[];
  /** Una frase corta sobre la numeración, para las páginas de talla. */
  sistemaCorto: string;
  /** Cómo aparece una talla en tiendas locales concretas (solo donde está verificado). */
  tiendasTalla?: (gender: Gender, row: SizeRow) => { tienda: string; talla: string; nota: string }[];
}

const GENDER_ES: Record<Gender, string> = { men: "hombre", women: "mujer" };

/** Talla con la numeración "CO" que muestra la guía de compra de Falabella (misma tabla en Perú y Colombia). */
function falabellaCO(gender: Gender, us: number): number | undefined {
  return (gender === "women" ? colombia.women : colombia.men).find((r) => r.us === us)?.local;
}

function falabella(domain: string, site: string): Store {
  return {
    nombre: "Falabella",
    url: (g, size) => `https://www.${domain}/${site}/search?${new URLSearchParams({ Ntt: `zapatillas ${GENDER_ES[g]} talla ${size}` })}`,
  };
}
function mercadoLibre(tld: string): Store {
  return {
    nombre: "MercadoLibre",
    url: (g, size) => `https://listado.mercadolibre.${tld}/zapatillas-${GENDER_ES[g]}-talla-${size}`,
  };
}

export const COUNTRIES: Country[] = [
  {
    slug: "chile",
    nombre: "Chile",
    gentilicio: "chilena",
    lang: "es-CL",
    ogLocale: "es_CL",
    localIsEU: true,
    source: chile.source,
    men: chile.men,
    women: chile.women,
    stores: [falabella("falabella.com", "falabella-cl"), mercadoLibre("cl")],
    sistema: [
      "En Chile las zapatillas se venden con la numeración europea (38, 39, 40…), la misma que aparece como EU en la etiqueta interior del calzado. Las marcas deportivas suelen usar también medias tallas, como 42.5.",
      "Por eso convertir desde Estados Unidos es directo: buscas tu talla US en la tabla de tu género y la columna de Chile te da el número europeo que verás en cualquier tienda chilena.",
    ],
    sistemaCorto: "En Chile se usa la numeración europea: es la que aparece como EU en la etiqueta.",
  },
  {
    slug: "peru",
    nombre: "Perú",
    gentilicio: "peruana",
    lang: "es-PE",
    ogLocale: "es_PE",
    localIsEU: true,
    source: peru.source,
    men: peru.men,
    women: peru.women,
    stores: [falabella("falabella.com.pe", "falabella-pe"), mercadoLibre("com.pe")],
    sistema: [
      "En Perú el calzado de adulto se vende con la numeración europea (38, 39, 40…): es la que usan las tiendas por departamento y la que aparece como EU en la etiqueta interior. Lo que en Perú se llama \"talla peruana\" en adultos es, en la práctica, la talla europea.",
      "Para convertir desde Estados Unidos, busca tu talla US en la tabla de tu género: la columna de Perú te da el número que pedirás en la tienda. En calzado de niños sí hay más variación entre tiendas, y este conversor cubre solo tallas de adulto.",
      "Dos detalles de las tiendas peruanas. La guía de tallas de Oechsle usa la numeración europea, igual que esta tabla, pero en hombre indica 1 cm más de largo por talla (28 cm para la 9 US, frente a los 27 cm de la guía de Nike): toma como referencia el largo de tu pie medido, no ese número. Y la guía de compra de zapatillas de Falabella Perú pone primero una columna rotulada CO, la numeración colombiana, que en hombre queda entre 1.5 y 4 números por debajo de la europea: si ves una zapatilla de hombre talla 40 que parece chica, probablemente es una 42.5 europea.",
    ],
    sistemaCorto: "En Perú el calzado de adulto usa la numeración europea: es la que aparece como EU en la etiqueta.",
    tiendasTalla: (g, row) => {
      const co = falabellaCO(g, row.us);
      return [
        {
          tienda: "Oechsle",
          talla: String(row.eu),
          nota: "Su guía de tallas usa la numeración europea como talla peruana.",
        },
        {
          tienda: "Falabella Perú",
          talla: co === undefined ? String(row.eu) : `${row.eu} o ${co}`,
          nota: "Su guía de compra de zapatillas pone primero una columna CO (numeración colombiana, más baja) y después la europea. Revisa cuál usa la ficha del producto.",
        },
      ];
    },
  },
  {
    slug: "colombia",
    nombre: "Colombia",
    gentilicio: "colombiana",
    lang: "es-CO",
    ogLocale: "es_CO",
    localIsEU: false,
    source: colombia.source,
    men: colombia.men,
    women: colombia.women,
    stores: [falabella("falabella.com.co", "falabella-co"), mercadoLibre("com.co")],
    sistema: [
      "Colombia es un caso especial: además de la numeración europea, muchas tiendas usan la talla colombiana (CO), que es más baja que la europea. En hombre, la talla colombiana queda entre 1.5 y 4 números por debajo de la europea, según la talla; en mujer, entre medio número y 2. Una 9 US de hombre, por ejemplo, es una 40 colombiana, pero una 42.5 europea.",
      "Por eso en Colombia es habitual que la etiqueta de unas zapatillas diga 42.5 y el vendedor te hable de talla 40: los dos tienen razón, cada uno con su tabla. Este conversor te da las dos, la colombiana (según la guía de tallas de Falabella Colombia) y la europea, para que sepas cuál pedir en cada tienda.",
    ],
    sistemaCorto:
      "En Colombia conviven la talla colombiana (CO) y la europea (EU): la colombiana es más baja, así que conviene saber cuál usa la tienda.",
  },
];

export function getCountry(slug: string): Country {
  const c = COUNTRIES.find((x) => x.slug === slug);
  if (!c) throw new Error(`País desconocido: ${slug}`);
  return c;
}
