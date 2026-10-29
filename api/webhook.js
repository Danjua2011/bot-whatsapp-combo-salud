// Webhook de WhatsApp Cloud API: responde con el bot y guarda cada mensaje en la bandeja.
const crypto = require("crypto");
const { responder, MENU, TEXTOS } = require("../lib/respuestas");
const { enviar, texto } = require("../lib/wa");
const { registrar } = require("../lib/store");

const BANDEJA = "https://bot-whatsapp-combo-salud.vercel.app/bandeja";
const menu = (to, t) =>
  enviar(to, {
    type: "interactive",
    interactive: { type: "list", body: { text: t }, action: { button: MENU.boton, sections: MENU.secciones } },
  });

const guardar = (id, perfil, msg) => registrar(id, perfil, msg).catch((e) => (console.error("store:", e.message), null));

module.exports = async (req, res) => {
  if (req.method === "GET") {
    const { "hub.mode": mode, "hub.verify_token": token, "hub.challenge": challenge } = req.query;
    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) return res.status(200).send(challenge);
    return res.status(403).send("Token inválido");
  }
  if (req.method !== "POST") return res.status(405).end();

  if (process.env.APP_SECRET) {
    const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    const firma = (req.headers["x-hub-signature-256"] || "").replace("sha256=", "");
    const esperada = crypto.createHmac("sha256", process.env.APP_SECRET).update(raw).digest("hex");
    if (firma !== esperada) return res.status(401).send("Firma inválida");
  }

  try {
    const cambios = (req.body?.entry || []).flatMap((e) => e.changes || []);
    for (const c of cambios) {
      const contactos = c.value?.contacts || [];
      for (const m of c.value?.messages || []) {
        const to = m.from || m.from_user_id;
        if (!to) continue;
        const ct = contactos.find((x) => x.wa_id === m.from) || contactos[0] || {};
        const perfil = {
          nombre: ct.profile?.name || "",
          tel: m.from ? "+" + m.from : ct.profile?.username ? "@" + ct.profile.username : "",
        };

        let entrada = "";
        let visible = "";
        if (m.type === "text") entrada = visible = m.text.body;
        else if (m.type === "interactive") {
          const o = m.interactive?.list_reply || m.interactive?.button_reply || {};
          entrada = o.id || "";
          visible = o.title || entrada;
        } else {
          visible = `[${m.type}]` + (m[m.type]?.caption ? " " + m[m.type].caption : "");
        }

        const ts = Number(m.timestamp) * 1000 || Date.now();
        const reg = await guardar(to, perfil, { de: "cliente", texto: visible, ts, wid: m.id });
        if (reg?.dup) continue; // mensaje repetido por Meta
        if (reg?.conv && (reg.conv.humanoHasta || 0) > Date.now()) continue; // una persona está atendiendo

        if (m.type !== "text" && m.type !== "interactive") {
          const e = await texto(to, TEXTOS.noTexto);
          await guardar(to, perfil, { de: "bot", texto: TEXTOS.noTexto, ts: Date.now(), wid: e.id });
          continue;
        }

        const r = responder(entrada, perfil.nombre);
        const e = r.menu ? await menu(to, r.texto) : await texto(to, r.texto);
        await guardar(to, perfil, { de: "bot", texto: r.texto + (r.menu ? "\n[Menú de opciones]" : ""), ts: Date.now(), wid: e.id });

        if (r.notificar && process.env.OWNER_PHONE) {
          const quien = perfil.nombre || "Cliente";
          await texto(
            process.env.OWNER_PHONE,
            `🔔 ${quien} (${perfil.tel}) quiere pedir o hablar con un asesor.\nÚltimo mensaje: "${visible}"\n\nResponde aquí: ${BANDEJA}`
          );
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
  res.status(200).send("ok");
};
