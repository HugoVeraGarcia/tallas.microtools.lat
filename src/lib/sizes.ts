import brandData from "../data/marcas/zapatos.json";
import type { Gender } from "../config";
import type { Country, SizeRow } from "./countries";

export type { SizeRow };

export interface Brand {
  id: string;
  nombre: string;
  fuente: string;
  men: Record<string, string | null>;
  women: Record<string, string | null>;
}

export const brands = brandData.marcas as Brand[];

export const GENDER_TITLE: Record<Gender, string> = { men: "Hombre", women: "Mujer" };

export function rowsFor(country: Country, gender: Gender): SizeRow[] {
  return gender === "women" ? country.women : country.men;
}

export function rowFor(country: Country, gender: Gender, us: number): SizeRow | undefined {
  return rowsFor(country, gender).find((r) => r.us === us);
}

/** Todas las tallas US que tienen página en un país, ordenadas. */
export function allUsSizes(country: Country): number[] {
  const set = new Set<number>([...country.men.map((r) => r.us), ...country.women.map((r) => r.us)]);
  return [...set].sort((a, b) => a - b);
}

export function neighbors(country: Country, gender: Gender, us: number): { prev?: SizeRow; next?: SizeRow } {
  const rows = rowsFor(country, gender);
  const i = rows.findIndex((r) => r.us === us);
  return { prev: i > 0 ? rows[i - 1] : undefined, next: i >= 0 && i < rows.length - 1 ? rows[i + 1] : undefined };
}

/** Valor de una marca (numeración europea) para una talla US; null si no la publica. */
export function brandValue(brand: Brand, gender: Gender, us: number): string | null {
  return brand[gender][String(us)] ?? null;
}

/** Agrupa las marcas que coinciden en el mismo valor: "Nike y New Balance: 42.5; Adidas: 42⅔". */
export function brandGroups(gender: Gender, us: number): { value: string; names: string[] }[] {
  const groups: { value: string; names: string[] }[] = [];
  for (const b of brands) {
    const v = brandValue(b, gender, us);
    if (v === null) continue;
    const g = groups.find((x) => x.value === v);
    if (g) g.names.push(b.nombre);
    else groups.push({ value: v, names: [b.nombre] });
  }
  return groups;
}

/** "A", "A y B", "A, B y C" */
export function joinEs(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

/** Talla del otro género con el mismo largo de pie, si existe en la tabla. */
export function sameLengthIn(country: Country, gender: Gender, cm: number): SizeRow | undefined {
  return rowsFor(country, gender).find((r) => r.cm === cm);
}

export function isWhole(n: number): boolean {
  return Math.round(n) === n;
}
