# Bot de WhatsApp + Bandeja – Combo de la Salud

Proyecto para Vercel (Node, sin framework).

## Archivos
- `api/webhook.js`  Recibe mensajes de WhatsApp Cloud API, responde con el bot y guarda el chat.
- `api/inbox.js`    API de la bandeja (lista, chat, enviar, pausar bot). Protegida con INBOX_KEY.
- `public/bandeja.html`  Pantalla de la bandeja (se abre en /bandeja).
- `lib/respuestas.js`  Textos, precios y reglas del bot (aquí editas las respuestas).
- `lib/wa.js`       Envío de mensajes por la API de Meta.
- `lib/store.js`    Guarda las conversaciones en Upstash Redis.
- `vercel.json`     Redirige /bandeja a bandeja.html.

## Variables de entorno (Vercel → Settings → Environment Variables)
- `VERIFY_TOKEN`    Texto que tú inventas; el mismo va en la configuración del webhook en Meta.
- `PHONE_NUMBER_ID` ID del número en WhatsApp Cloud API.
- `WHATSAPP_TOKEN`  Token permanente del usuario del sistema (secreto, no lo compartas).
- `OWNER_PHONE`     Tu celular con indicativo (ej. 573016561919) para los avisos.
- `INBOX_KEY`       Clave para entrar a /bandeja (mínimo 8 caracteres).
- `KV_REST_API_URL` y `KV_REST_API_TOKEN`  Los crea Vercel al conectar una base Upstash Redis (plan gratis) al proyecto en Storage.
- `APP_SECRET` (opcional)  Secreto de la app de Meta para validar la firma del webhook.

## Despliegue
1. `npm install`
2. `vercel --prod` (o sube la carpeta a un repositorio y conéctalo en Vercel).
3. En Meta → WhatsApp → Configuración: Webhook `https://TU-PROYECTO.vercel.app/api/webhook`
   con el VERIFY_TOKEN, y suscribe el campo `messages`.

Nota: cambia la URL `BANDEJA` en `api/webhook.js` si tu proyecto tiene otro dominio.
