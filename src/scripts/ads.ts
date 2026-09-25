/* Carga de la publicidad (mismo contrato que los otros sitios de microtools).
 *
 *  - El script de AdSense ya viene en el <head> del HTML generado, para que el robot
 *    de verificación lo vea sin ejecutar JavaScript. Aquí no se vuelve a cargar.
 *  - Cada hueco reserva su altura por CSS antes de que llegue el anuncio (sin CLS).
 *  - Un bloque se rellena una sola vez. No hay refresco por temporizador.
 *  - Si el bloque no tiene ID configurado, el hueco se retira del DOM.
 */
import { ADSENSE } from "../config";

const rellenados = new WeakSet<Element>();

function montarBloque(hueco: HTMLElement) {
  if (rellenados.has(hueco)) return;
  const idBloque = ADSENSE.bloques[hueco.dataset.slot ?? ""];
  if (!ADSENSE.cliente || !idBloque) {
    hueco.remove();
    return;
  }
  rellenados.add(hueco);

  const ins = document.createElement("ins");
  ins.className = "adsbygoogle";
  ins.style.display = "block";
  ins.dataset.adClient = ADSENSE.cliente;
  ins.dataset.adSlot = idBloque;
  if (hueco.dataset.slot === "mid") {
    ins.dataset.adFormat = "fluid";
    ins.dataset.adLayout = "in-article";
  } else {
    ins.dataset.adFormat = "auto";
    ins.dataset.fullWidthResponsive = "true";
  }
  hueco.appendChild(ins);
  try {
    const w = window as unknown as { adsbygoogle: unknown[] };
    (w.adsbygoogle = w.adsbygoogle || []).push({});
  } catch {
    hueco.remove();
  }
}

function montarBloques() {
  for (const hueco of document.querySelectorAll<HTMLElement>(".ad-slot")) montarBloque(hueco);
}

if (document.readyState === "complete") setTimeout(montarBloques, 0);
else window.addEventListener("load", montarBloques, { once: true });
