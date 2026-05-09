// api/auth/verify.js
// ── Middleware para verificar que una request viene de una tienda autenticada ──
// Usalo en cualquier endpoint que necesite saber qué tienda está haciendo la request

const crypto = require("crypto");

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;

/**
 * Verifica el HMAC de una request de Shopify.
 * Usalo así en otros endpoints:
 *
 *   const { verifyShopifyRequest } = require("./auth/verify");
 *
 *   module.exports = async function handler(req, res) {
 *     if (!verifyShopifyRequest(req)) {
 *       return res.status(401).json({ error: "No autorizado" });
 *     }
 *     // tu lógica acá
 *   };
 */
function verifyShopifyRequest(req) {
  const { hmac, ...params } = req.query;
  if (!hmac) return false;

  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join("&");

  const expectedHmac = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac,         "hex"),
      Buffer.from(expectedHmac, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Verifica webhooks entrantes de Shopify (usan el header x-shopify-hmac-sha256)
 */
function verifyShopifyWebhook(req, rawBody) {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"];
  if (!hmacHeader) return false;

  const hash = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(rawBody, "utf8")
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmacHeader, "base64"),
      Buffer.from(hash,       "base64")
    );
  } catch {
    return false;
  }
}

module.exports = { verifyShopifyRequest, verifyShopifyWebhook };
