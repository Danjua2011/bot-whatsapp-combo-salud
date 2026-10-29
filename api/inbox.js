// API de la bandeja compartida. Protegida con la clave INBOX_KEY (cookie de sesión).
const crypto = require("crypto");
const { texto } = require("../lib/wa");
const { TEXTOS } = require("../lib/respuestas");
const { leer, guardar, registrar, resumenes, limpio } = require("../lib/store");

const sha = (s) => crypto.createHash("sha256").update(String(s)).digest();
const igual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
const sesion = () => crypto.createHmac("sha256", process.env.INBOX_KEY).update("bandeja-v1").digest("hex");
const cookie = (req) => (req.headers.cookie || "").split(/;\s*/).find((x) => x.startsWith("ib="))?.slice(3) || "";
const json = (res, code, obj) => res.status(code).setHeader("Cache-Control", "no-store").json(obj);

module.exports = async (req, res) => {
  const KEY = process.env.INBOX_KEY;
  if (!KEY || KEY.length < 8) return json(res, 503, { error: "sin_clave" });

  const q = req.method === "GET" ? req.query : req.body || {};
  const a = q.a;

  if (a === "login") {
    if (!q.clave || !igual(q.clave, KEY)) {
      await new Promise((r) => setTimeout(r, 800));
      return json(res, 401, { error: "clave_incorrecta" });
    }
    res.setHeader("Set-Cookie", `ib=${sesion()}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`);
    return json(res, 200, { ok: true });
  }
  if (a === "salir") {
    res.setHeader("Set-Cookie", "ib=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
    return json(res, 200, { ok: true });
  }
  if (!igual(cookie(req), sesion())) return json(res, 401, { error: "no_autorizado" });

  try {
    if (a === "lista") return json(res, 200, { chats: await resumenes() });

    if (a === "rapidas")
      return json(res, 200, {
        rapidas: [
          { t: "Precio", v: TEXTOS.precio },
          { t: "Qué incluye", v: TEXTOS.combo },
          { t: "Datos del pedido", v: TEXTOS.pedir },
          { t: "Envíos", v: TEXTOS.envios },
          { t: "Gracias", v: "¡Con mucho gusto! 💚 Quedo atento a lo que necesites." },
        ],
      });

    const id = q.id && limpio(q.id) === q.id ? q.id : null;
    if (!id) return json(res, 400, { error: "id" });

    if (a === "chat") {
      const c = await leer(id);
      if (!c) return json(res, 404, { error: "no_existe" });
      if (c.noLeidos) {
        c.noLeidos = 0;
        await guardar(c);
      }
      return json(res, 200, { chat: c, botPausado: (c.humanoHasta || 0) > Date.now() });
    }

    if (a === "enviar") {
      const t = String(q.texto || "").trim();
      if (!t) return json(res, 400, { error: "vacio" });
      const c = await leer(id);
      if (!c) return json(res, 404, { error: "no_existe" });
      const e = await texto(id, t.slice(0, 4000));
      if (!e.ok) {
        const ventana = e.codigo === 131047;
        return json(res, 502, {
          error: ventana ? "ventana" : "envio",
          detalle: ventana
            ? "Pasaron más de 24 horas desde el último mensaje del cliente. WhatsApp solo permite responder si el cliente escribe primero."
            : e.error,
        });
      }
      const r = await registrar(id, null, { de: "asesor", texto: t, ts: Date.now(), wid: e.id });
      return json(res, 200, { ok: true, chat: r.conv });
    }

    if (a === "bot") {
      const c = await leer(id);
      if (!c) return json(res, 404, { error: "no_existe" });
      c.humanoHasta = q.activo ? 0 : Date.now() + 2 * 60 * 60 * 1000;
      await guardar(c);
      return json(res, 200, { ok: true });
    }
    return json(res, 400, { error: "accion" });
  } catch (e) {
    console.error(e);
    return json(res, 500, { error: "servidor", detalle: e.message });
  }
};
