// Almacenamiento de conversaciones en Vercel Blob (un JSON por chat).
const { put, get, list } = require("@vercel/blob");

const limpio = (id) => String(id).replace(/[^A-Za-z0-9._-]/g, "_");
const ruta = (id) => `chats/${limpio(id)}.json`;
const MAX_MSGS = 300;
const PAUSA_BOT_MS = 2 * 60 * 60 * 1000; // el bot calla 2 h tras responder una persona

async function leerRuta(p) {
  const r = await get(p, { access: "private", useCache: false });
  if (!r || r.statusCode !== 200) return null;
  return JSON.parse(await new Response(r.stream).text());
}
const leer = (id) => leerRuta(ruta(id));

async function guardar(c) {
  await put(ruta(c.id), JSON.stringify(c), {
    access: "private",
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

// Agrega un mensaje a la conversación (la crea si no existe). Devuelve { conv, dup }.
async function registrar(id, perfil, msg) {
  let c = (await leer(id)) || { id, nombre: "", tel: "", noLeidos: 0, humanoHasta: 0, mensajes: [] };
  if (msg.wid && c.mensajes.some((m) => m.wid === msg.wid)) return { conv: c, dup: true };
  if (perfil?.nombre) c.nombre = perfil.nombre;
  if (perfil?.tel) c.tel = perfil.tel;
  c.mensajes.push(msg);
  if (c.mensajes.length > MAX_MSGS) c.mensajes = c.mensajes.slice(-MAX_MSGS);
  c.ts = msg.ts;
  if (msg.de === "cliente") c.noLeidos = (c.noLeidos || 0) + 1;
  if (msg.de === "asesor") {
    c.noLeidos = 0;
    c.humanoHasta = Date.now() + PAUSA_BOT_MS;
  }
  await guardar(c);
  return { conv: c, dup: false };
}

async function resumenes() {
  const rutas = [];
  let cursor;
  do {
    const r = await list({ prefix: "chats/", cursor });
    rutas.push(...r.blobs.map((b) => b.pathname));
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor && rutas.length < 400);
  const chats = (await Promise.all(rutas.map((p) => leerRuta(p).catch(() => null)))).filter(Boolean);
  return chats
    .map((c) => {
      const u = c.mensajes[c.mensajes.length - 1] || {};
      return {
        id: c.id,
        nombre: c.nombre,
        tel: c.tel,
        ts: c.ts || 0,
        noLeidos: c.noLeidos || 0,
        botPausado: (c.humanoHasta || 0) > Date.now(),
        ultimo: u.texto || "",
        ultimoDe: u.de || "",
      };
    })
    .sort((a, b) => b.ts - a.ts);
}

module.exports = { leer, guardar, registrar, resumenes, limpio };
