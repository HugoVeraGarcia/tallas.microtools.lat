/* servidor.mjs — Sirve la carpeta dist/ en tu computadora para ver el sitio.
 *
 *   node servidor.mjs --abrir
 *
 * Sin dependencias: solo Node. No compila: muestra el último build que haya en dist/.
 * Para ver cambios nuevos del código hay que compilar antes (npm run build), cosa que
 * ver-sitio.bat intenta hacer sola si las dependencias están instaladas.
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const RAIZ = join(resolve(dirname(fileURLToPath(import.meta.url))), "dist");
const PUERTO = Number(process.env.PUERTO) || 4330;
const ABRIR = process.argv.includes("--abrir");

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

// Las mismas redirecciones que public/_redirects hace Netlify.
const REDIRECCIONES = { "/chile": "/chile/zapatos/", "/peru": "/peru/zapatos/", "/colombia": "/colombia/zapatos/" };

const servidor = createServer(async (req, res) => {
  const ruta = decodeURIComponent(req.url.split("?")[0]);
  const destino = REDIRECCIONES[ruta.replace(/\/$/, "")];
  if (destino) {
    res.writeHead(301, { location: destino }).end();
    return;
  }
  let archivo = join(RAIZ, normalize(ruta).replace(/^(\.\.[/\\])+/, ""));
  if (!archivo.startsWith(RAIZ)) {
    res.writeHead(403).end("403");
    return;
  }
  try {
    const info = await stat(archivo).catch(() => null);
    if (!info || info.isDirectory()) archivo = join(archivo, "index.html");
    const datos = await readFile(archivo);
    res.writeHead(200, { "content-type": TIPOS[extname(archivo)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(datos);
  } catch {
    const pagina404 = await readFile(join(RAIZ, "404.html")).catch(() => "404");
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(pagina404);
  }
});

function abrirNavegador(url) {
  const orden =
    process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  try {
    spawn(orden[0], orden[1], { detached: true, stdio: "ignore" }).unref();
  } catch {
    /* si no se puede abrir, el enlace ya está impreso en pantalla */
  }
}

servidor.on("listening", () => {
  const url = `http://127.0.0.1:${servidor.address().port}/`;
  console.log(`\n  TallaFácil servido en  ${url}`);
  console.log(`    ${url}peru/zapatos/`);
  console.log(`    ${url}colombia/zapatos/talla-9-us-en-colombia/`);
  console.log("\n  Deja esta ventana abierta. Ciérrala para apagarlo.\n");
  if (ABRIR) abrirNavegador(url);
});

function arrancar(puerto, intentos = 12) {
  servidor.once("error", (e) => {
    if (e.code === "EADDRINUSE" && intentos > 0) {
      arrancar(puerto + 1, intentos - 1);
      return;
    }
    console.error("\n  No se ha podido arrancar el servidor:", e.message, "\n");
    process.exit(1);
  });
  servidor.listen(puerto, "127.0.0.1");
}

readFile(join(RAIZ, "index.html"))
  .then(() => arrancar(PUERTO))
  .catch(() => {
    console.error("\n  No hay sitio compilado en la carpeta dist. Ejecuta primero: npm install y npm run build\n");
    process.exit(1);
  });
