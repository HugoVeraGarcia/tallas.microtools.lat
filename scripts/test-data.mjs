// Coherencia de las tablas de tallas. Uso: node scripts/test-data.mjs
import { readFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const countries = ["chile", "peru", "colombia"].map((c) => [c, read(`../src/data/${c}/zapatos.json`)]);
const marcas = read("../src/data/marcas/zapatos.json").marcas;
const nike = marcas.find((m) => m.id === "nike");
const errors = [];
const toNum = (v) => parseFloat(v) + (v.includes("⅓") ? 1 / 3 : v.includes("⅔") ? 2 / 3 : 0);

for (const [slug, t] of countries) {
  for (const g of ["men", "women"]) {
    const rows = t[g];
    if (!rows.length) errors.push(`${slug} ${g}: tabla vacía`);
    for (let i = 1; i < rows.length; i++) {
      const [a, b] = [rows[i - 1], rows[i]];
      for (const k of ["us", "local", "eu", "cm"]) if (!(b[k] > a[k])) errors.push(`${slug} ${g}: ${k} no crece en US ${a.us} → ${b.us}`);
    }
    for (const r of rows) {
      if (r.cm < 20 || r.cm > 34) errors.push(`${slug} ${g}: US ${r.us} con ${r.cm} cm fuera de rango`);
      // La numeración europea y los cm son los de Nike en todos los países.
      if (nike[g][String(r.us)] !== String(r.eu)) errors.push(`${slug} ${g} US ${r.us}: EU ${r.eu} ≠ Nike ${nike[g][String(r.us)]}`);
      // Donde la talla local es la europea, deben coincidir.
      if (t.sizeSystem === "EU" && r.local !== r.eu) errors.push(`${slug} ${g} US ${r.us}: local ${r.local} ≠ EU ${r.eu}`);
      if (t.sizeSystem === "CO" && !(r.local <= r.eu)) errors.push(`${slug} ${g} US ${r.us}: talla CO ${r.local} mayor que EU ${r.eu}`);
    }
  }
  // Todos los países deben tener las mismas tallas US (las páginas "otro país" se enlazan entre sí).
  const key = (x) => JSON.stringify([x.men.map((r) => r.us), x.women.map((r) => r.us)]);
  if (key(t) !== key(countries[0][1])) errors.push(`${slug}: las tallas US no coinciden con ${countries[0][0]}`);
}

for (const g of ["men", "women"]) {
  for (const m of marcas) {
    const present = countries[0][1][g].map((r) => [r.us, m[g][String(r.us)]]);
    for (const [us, v] of present) if (v === undefined) errors.push(`${m.nombre} ${g}: falta la US ${us}`);
    const vals = present.filter(([, v]) => v != null).map(([us, v]) => [us, toNum(v)]);
    for (let i = 1; i < vals.length; i++)
      if (!(vals[i][1] > vals[i - 1][1])) errors.push(`${m.nombre} ${g}: no crece en US ${vals[i - 1][0]} → ${vals[i][0]}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: tablas coherentes (${countries.length} países, ${marcas.length} marcas).`);
