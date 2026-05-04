const crypto = require("crypto");

// ── CONFIGURACIÓN ──
const ML_SECRET = process.env.ML_SECRET;
const ML_APP_ID = process.env.ML_APP_ID;

const ALLOWED_METHODS = ["POST", "GET"];

// ── VALIDAR FIRMA DE MERCADO LIBRE ──
function validateSignature(req, body) {
  const signature = req.headers["x-signature"];
  const requestId = req.headers["x-request-id"];

  if (!signature) return false;

  const parts = {};
  signature.split(",").forEach((part) => {
    const [key, value] = part.split("=");
    parts[key] = value;
  });

  if (!parts.ts || !parts.v1) return false;

  const message = `x-request-id:${requestId};x-date-created:${parts.ts};${body}`;

  const expectedHash = crypto
    .createHmac("sha256", ML_SECRET)
    .update(message)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(parts.v1),
      Buffer.from(expectedHash)
    );
  } catch (e) {
    return false;
  }
}

// ── HANDLER PRINCIPAL ──
module.exports = async function handler(req, res) {

  // 1. Solo métodos permitidos
  if (!ALLOWED_METHODS.includes(req.method)) {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // 2. Challenge de verificación de ML
  if (req.method === "GET") {
    const { challenge } = req.query;
    if (challenge) {
      return res.status(200).send(challenge);
    }
    return res.status(200).json({ status: "ok" });
  }

  // 3. POST
  if (req.method === "POST") {

    const rawBody = JSON.stringify(req.body);

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Body vacío" });
    }

    // 4. Validar firma (solo si ML_SECRET está configurado)
    if (ML_SECRET) {
      const isValid = validateSignature(req, rawBody);
      if (!isValid) {
        console.warn("Firma inválida");
        return res.status(401).json({ error: "Firma inválida" });
      }
    }

    // 5. Validar estructura del payload
    const { resource, user_id, topic } = req.body;

    if (!resource || !user_id || !topic) {
      return res.status(400).json({ error: "Payload inválido" });
    }

    console.log(`Notificación ML | topic: ${topic} | resource: ${resource}`);

    try {
      switch (topic) {
        case "orders_v2":
          await handleOrder(resource, user_id);
          break;
        case "items":
          await handleItem(resource, user_id);
          break;
        default:
          console.log(`Topic no manejado: ${topic}`);
      }

      return res.status(200).json({ status: "recibido", topic });

    } catch (error) {
      console.error("Error:", error);
      return res.status(200).json({ status: "error_interno_logueado" });
    }
  }
};

// ── HANDLERS ──
async function handleOrder(resource, userId) {
  const orderId = resource.split("/").pop();
  console.log(`Nueva orden: ${orderId} | vendedor: ${userId}`);
}

async function handleItem(resource, userId) {
  const itemId = resource.split("/").pop();
  console.log(`Item actualizado: ${itemId}`);
        }
      
