import crypto from "crypto";

// ── CONFIGURACIÓN ──
// En Vercel: Settings → Environment Variables → agregar estas dos
const ML_SECRET = process.env.ML_SECRET;       // tu secret key de ML
const ML_APP_ID = process.env.ML_APP_ID;       // tu app ID de ML

// ── MÉTODOS PERMITIDOS ──
const ALLOWED_METHODS = ["POST", "GET"];

// ── VALIDAR FIRMA DE MERCADO LIBRE ──
// ML envía el header x-signature con este formato:
// ts=1234567890,v1=abc123...
function validateSignature(req, body) {
  const signature = req.headers["x-signature"];
  const requestId = req.headers["x-request-id"];

  if (!signature) return false;

  // Extraer ts y v1 del header
  const parts = {};
  signature.split(",").forEach((part) => {
    const [key, value] = part.split("=");
    parts[key] = value;
  });

  if (!parts.ts || !parts.v1) return false;

  // Construir el mensaje a hashear según la doc de ML:
  // "x-request-id:{requestId};x-date-created:{ts};{body}"
  const message = `x-request-id:${requestId};x-date-created:${parts.ts};${body}`;

  // Calcular HMAC-SHA256 con tu ML_SECRET
  const expectedHash = crypto
    .createHmac("sha256", ML_SECRET)
    .update(message)
    .digest("hex");

  // Comparación segura (evita timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(parts.v1),
    Buffer.from(expectedHash)
  );
}

// ── HANDLER PRINCIPAL ──
export default async function handler(req, res) {

  // 1. Solo métodos permitidos
  if (!ALLOWED_METHODS.includes(req.method)) {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // 2. Challenge de verificación de ML (GET con ?challenge=...)
  if (req.method === "GET") {
    const { challenge } = req.query;
    if (challenge) {
      return res.status(200).send(challenge);
    }
    return res.status(200).json({ status: "ok" });
  }

  // 3. A partir de acá solo POST
  if (req.method === "POST") {

    // 4. Verificar que hay body
    const rawBody = JSON.stringify(req.body);
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ error: "Body vacío" });
    }

    // 5. Validar firma (solo en producción, si ML_SECRET está configurado)
    if (ML_SECRET) {
      const isValid = validateSignature(req, rawBody);
      if (!isValid) {
        console.warn("⚠️ Firma inválida — posible request no autorizado");
        return res.status(401).json({ error: "Firma inválida" });
      }
    }

    // 6. Validar estructura básica del payload de ML
    const { resource, user_id, topic } = req.body;

    if (!resource || !user_id || !topic) {
      return res.status(400).json({ error: "Payload inválido" });
    }

    // 7. Verificar que el user_id corresponde a tu app
    if (ML_APP_ID && String(user_id) !== String(ML_APP_ID)) {
      console.warn(`⚠️ user_id inesperado: ${user_id}`);
      // No rechazamos — ML puede notificar por compradores también
      // pero lo logueamos para auditoría
    }

    // 8. Procesar según el topic
    console.log(`📦 Notificación ML | topic: ${topic} | resource: ${resource}`);

    try {
      switch (topic) {
        case "orders_v2":
          // Orden nueva o actualizada
          await handleOrder(resource, user_id);
          break;

        case "items":
          // Producto actualizado (útil para sync de tallas)
          await handleItem(resource, user_id);
          break;

        case "questions":
          // Pregunta de comprador
          console.log("Pregunta recibida:", resource);
          break;

        default:
          console.log(`Topic no manejado: ${topic}`);
      }

      return res.status(200).json({ status: "recibido", topic });

    } catch (error) {
      console.error("Error procesando notificación:", error);
      // Devolvemos 200 igual — si devolvés 500, ML reintenta infinitamente
      return res.status(200).json({ status: "error_interno_logueado" });
    }
  }
}

// ── HANDLERS POR TOPIC ──

async function handleOrder(resource, userId) {
  // resource es algo como /orders/123456789
  const orderId = resource.split("/").pop();
  console.log(`🛒 Nueva orden: ${orderId} del vendedor: ${userId}`);

  // Acá podés llamar a la API de ML para obtener los detalles:
  // GET https://api.mercadolibre.com/orders/{orderId}
  // con el access_token del vendedor guardado en tu DB
}

async function handleItem(resource, userId) {
  // resource es algo como /items/MLM123456
  const itemId = resource.split("/").pop();
  console.log(`👗 Item actualizado: ${itemId}`);

  // Útil para FitCheck: cuando el vendedor actualiza medidas en ML,
  // podés sincronizar automáticamente con tu DB de tallas
        }
