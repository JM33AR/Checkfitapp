// api/auth/shopify.js
// ── Inicia el flujo OAuth con Shopify ──

const SHOPIFY_API_KEY    = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const APP_URL            = process.env.APP_URL; // ej: https://checkfitapp.vercel.app

// Permisos que necesita FitCheck en la tienda
const SCOPES = "read_products,write_products";

module.exports = async function handler(req, res) {
  const { shop } = req.query;

  // 1. Validar que venga el parámetro shop
  if (!shop) {
    return res.status(400).json({ error: "Falta el parámetro shop" });
  }

  // 2. Validar formato del dominio de Shopify
  if (!isValidShopDomain(shop)) {
    return res.status(400).json({ error: "Dominio de tienda inválido" });
  }

  // 3. Construir la URL de autorización y redirigir
  const redirectUri  = `${APP_URL}/api/auth/callback`;
  const authUrl = `https://${shop}/admin/oauth/authorize` +
    `?client_id=${SHOPIFY_API_KEY}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return res.redirect(authUrl);
};

function isValidShopDomain(shop) {
  return /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop);
}
