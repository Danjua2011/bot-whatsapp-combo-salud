// Almacenamiento de conversaciones en Upstash Redis (un JSON por chat + un resumen para la bandeja).
// La bandeja lee el resumen con una sola operación, así no se gasta una lectura por cada chat.
const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

const limpio = (id) => String(id).replace(/[^A-Za-z0-9._-]/g, "_");
const clave = (id) => `chat:${limpio(id)}`;
const RESUMEN = "chats:resumen";
const MAX_MSGS = 300;
const PAUSA_BOT_MS = 2 * 60 * 60 * 1000; // el bot calla 2 h tras responder una persona

const leer = async (id) => (await redis.get(clave(id))) || null;

function resumen(c) {
  const u = c.mensajes[c.mensajes.length - 1] || {};
  return {
    id: c.id,
    nombre: c.nombre,
    tel: c.tel,
    ts: c.ts || 0,
    noLeidos: c.noLeidos || 0,
    humanoHasta: c.humanoHasta || 0,
    ultimo: (u.texto || "").slice(0, 200),
    ultimoDe: u.de || "",
  };
}

async function guardar(c) {
  await redis
    .pipeline()
    .set(clave(c.id), c)
    .hset(RESUMEN, { [limpio(c.id)]: resumen(c) })
    .exec();
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
  const todos = (await redis.hgetall(RESUMEN)) || {};
  return Object.values(todos)
    .map(({ humanoHasta, ...r }) => ({ ...r, botPausado: (humanoHasta || 0) > Date.now() }))
    .sort((a, b) => b.ts - a.ts);
}

module.exports = { leer, guardar, registrar, resumenes, limpio };
