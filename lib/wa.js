// Envío por WhatsApp Cloud API.
const GRAPH = "https://graph.facebook.com/v21.0";
const esUserId = (x) => /^[A-Z]{2}\./.test(String(x));

async function enviar(to, body) {
  const destino = esUserId(to) ? { recipient: to } : { to };
  const r = await fetch(`${GRAPH}/${process.env.PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...destino, ...body }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error("Error enviando:", r.status, JSON.stringify(j));
    return { ok: false, codigo: j.error?.code, error: j.error?.message || "Error al enviar" };
  }
  return { ok: true, id: j.messages?.[0]?.id };
}

const texto = (to, t) => enviar(to, { type: "text", text: { body: t, preview_url: false } });

module.exports = { enviar, texto, esUserId };
