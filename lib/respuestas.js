// Textos y reglas del bot. Edita aquí precios, nombres y respuestas.
const NEGOCIO = {
  nombre: "Combo Natural de la Salud",
  precio: "$159.900 COP",
  whatsapp: "301 656 1919",
  fundacion: "Fundación Amigos de la Salud Familiar (ASUFAMI)",
};

const AVISO = "_Producto natural. No es un medicamento y no reemplaza el tratamiento médico._";
const PIE = "Escribe *MENÚ* cuando quieras ver las opciones 💚";

const PRODUCTOS = {
  purgante: "🌿 *Purgante natural*\nElaborado a base de *sen, boldo, acacias y sal de Epsom*. Es de uso tradicional como apoyo para la limpieza y depuración de todo el organismo.",
  gastrid: "🌿 *Gastrid*\nProducto natural de uso tradicional como apoyo para el colon y el estómago, y para el bienestar digestivo en molestias como la gastritis y la pirosis (acidez).",
  cienplantas: "🌿 *Cien Plantas*\nMezcla de plantas de uso tradicional que acompaña:\n• Las defensas del cuerpo\n• El bienestar de los riñones y las vías urinarias\n• La depuración de la sangre\n• El cuidado del hígado",
  torovital: "🌿 *Torovital*\nProducto natural de uso tradicional como apoyo ante el cansancio, la debilidad, el agotamiento y los dolores de cabeza, para acompañar tu fortalecimiento y energía diaria.",
};

const TEXTOS = {
  saludo: (n) => `¡Hola${n ? " " + n : ""}! 👋 Qué gusto saludarte.\n\nSoy el asistente virtual del *${NEGOCIO.nombre}*, con el respaldo de la ${NEGOCIO.fundacion}.\n\nToca *Ver opciones* o escríbeme tu pregunta con tus palabras. Estoy para ayudarte 💚`,
  combo: `🌿 *${NEGOCIO.nombre}*\n\nIncluye 4 productos naturales de uso tradicional:\n• *Purgante natural*: apoyo para la limpieza del organismo\n• *Gastrid*: apoyo para el colon y el estómago\n• *Cien Plantas*: apoyo para defensas, riñones, sangre e hígado\n• *Torovital*: apoyo ante el cansancio y la debilidad\n\nCuentan con el respaldo de la ${NEGOCIO.fundacion}.\n\n${AVISO}\n\n¿Quieres saber el precio? Escribe *PRECIO* 😊`,
  precio: `💰 El combo completo cuesta *${NEGOCIO.precio}*.\n\n🚚 Enviamos a *todo el país*.\n⏳ Los cupos de la promoción son limitados.\n\nSi quieres separar el tuyo, escribe *PEDIR* y te ayudo ahora mismo.`,
  envios: "🚚 Enviamos a *todo el país*.\n\nCuéntame tu *ciudad y departamento* escribiendo *PEDIR*, y un asesor te confirma el tiempo de entrega y la forma de pago disponible.",
  pedir: "¡Qué bueno! 🙌 Con gusto te ayudo con tu pedido.\n\nEscríbeme en *un solo mensaje*:\n\n1️⃣ Nombre completo\n2️⃣ Cédula\n3️⃣ Ciudad y departamento\n4️⃣ Dirección completa\n5️⃣ Celular\n\nUn asesor lo revisará y te confirmará en breve 💚",
  asesor: `Claro que sí 😊 Ya le avisé a un asesor y te escribirá personalmente en un momento.\n\nMientras tanto, si quieres, cuéntame tu pregunta. También puedes escribirnos al ${NEGOCIO.whatsapp}.`,
  medico: `Gracias por contármelo 🙏 Tu bienestar es lo primero.\n\nComo son productos naturales y *no son un medicamento*, si estás embarazada, en lactancia, tomas medicamentos o tienes una condición de salud, lo mejor es *consultarlo primero con tu médico*.\n\nSi quieres, un asesor puede darte más información del producto: escribe *ASESOR*.\n\n${AVISO}`,
  efectos: `Son productos naturales, pero cada organismo es diferente 💚\n\nTe recomendamos seguir las indicaciones del empaque y consultar a tu médico si tienes dudas, una condición de salud, estás embarazada o tomas medicamentos.\n\n${AVISO}`,
  fallback: "Te leo, pero no estoy seguro de haberte entendido bien 🤔\n\nPuedes elegir una opción del menú (escribe *MENÚ*) o escribir *ASESOR* para que una persona te atienda.",
  gracias: `¡Con mucho gusto! 💚 Gracias por escribirnos.\n\n${PIE}`,
  noTexto: "Por ahora solo puedo leer mensajes de texto 😊 Escribe *MENÚ* para ver las opciones o *ASESOR* para hablar con una persona.",
};

// Palabras que activan la derivación por tema de salud (no damos consejo médico).
const MEDICO = /(embaraz|lactan|medicament|enfermedad|diabet|hipertens|presion|cancer|c[aá]ncer|tratamiento medico|operad|cirug|ni[nñ]o|beb[eé]|alergi|renal|ri[nñ][oó]n|hepat|insuficiencia|cura|curar|sana|sanar)/i;

const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

// Respuestas por número (el cliente puede escribir 1, 2, 3...).
const NUMEROS = { 1: "combo", 2: "precio", 3: "envios", 4: "pedir", 5: "asesor" };

// Devuelve { texto, menu, notificar }.
function responder(mensaje, nombre) {
  let t = norm(mensaje);
  if (NUMEROS[t]) t = NUMEROS[t];
  const n = (nombre || "").trim().split(/\s+/)[0];
  if (!t) return { texto: TEXTOS.fallback, menu: true };
  if (MEDICO.test(t)) return { texto: TEXTOS.medico, notificar: false };
  if (/^(menu|inicio|opciones|ayuda)$/.test(t) || /^(hola|holi|buenas|buenos dias|buenas tardes|buenas noches|hey|ey|info|informacion)/.test(t))
    return { texto: TEXTOS.saludo(n), menu: true };
  if (/(asesor|humano|persona|agente|llamar|llamen)/.test(t)) return { texto: TEXTOS.asesor, notificar: true };
  if (/(pedir|comprar|quiero|lo compro|pedido|ordenar|adquirir)/.test(t)) return { texto: TEXTOS.pedir, notificar: true };
  if (/(precio|costo|cuanto|valor|vale|cuesta|\$)/.test(t)) return { texto: TEXTOS.precio };
  if (/(envio|domicilio|entrega|despach|llega|ciudad|contraentrega|pago)/.test(t)) return { texto: TEXTOS.envios };
  if (/(efecto|secundario|contraindic|riesgo|seguro|dosis|como se toma|como lo tomo|cuanto tomar)/.test(t)) return { texto: TEXTOS.efectos };
  if (/purgante|sen\b|boldo|epsom/.test(t)) return { texto: `${PRODUCTOS.purgante}\n\n${AVISO}\n\n${PIE}` };
  if (/gastrid|gastritis|colon|estomago|digest/.test(t)) return { texto: `${PRODUCTOS.gastrid}\n\n${AVISO}\n\n${PIE}` };
  if (/cien ?plantas|100 ?plantas/.test(t)) return { texto: `${PRODUCTOS.cienplantas}\n\n${AVISO}\n\n${PIE}` };
  if (/torovital|energia|cansancio|agotamiento/.test(t)) return { texto: `${PRODUCTOS.torovital}\n\n${AVISO}\n\n${PIE}` };
  if (/(combo|producto|productos|que incluye|que trae|que es)/.test(t)) return { texto: TEXTOS.combo };
  if (/(gracias|ok|listo|perfecto|vale|chao|adios)$/.test(t)) return { texto: TEXTOS.gracias };
  return { texto: TEXTOS.fallback, menu: true };
}

// Menú tipo lista de WhatsApp.
const MENU = {
  boton: "Ver opciones",
  secciones: [
    {
      title: "Conoce el combo",
      rows: [
        { id: "combo", title: "¿Qué incluye?", description: "Los 4 productos del combo" },
        { id: "purgante", title: "Purgante natural" },
        { id: "gastrid", title: "Gastrid" },
        { id: "cienplantas", title: "Cien Plantas" },
        { id: "torovital", title: "Torovital" },
      ],
    },
    {
      title: "Compra y atención",
      rows: [
        { id: "precio", title: "Precio y envíos", description: "Promoción y cobertura" },
        { id: "pedir", title: "Quiero hacer mi pedido" },
        { id: "asesor", title: "Hablar con un asesor", description: "Te atiende una persona" },
      ],
    },
  ],
};

module.exports = { responder, MENU, NEGOCIO, TEXTOS };
