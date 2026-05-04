const fetch = require('node-fetch');

const ML_APP_ID = process.env.ML_APP_ID;
const ML_SECRET = process.env.ML_SECRET;
const REDIRECT_URI = 'https://checkfitapp.vercel.app/api/auth/callback';

module.exports = async function handler(req, res) {

  const { code, state, error } = req.query;

  // 1. ML rechazó la autorización
  if (error) {
    return res.redirect('/?ml_error=acceso_denegado');
  }

  // 2. Falta el código
  if (!code) {
    return res.redirect('/?ml_error=codigo_faltante');
  }

  try {
    // 3. Intercambiar código por access_token
    const tokenRes = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: ML_APP_ID,
        client_secret: ML_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Error obteniendo token:', tokenData);
      return res.redirect('/?ml_error=token_fallido');
    }

    // 4. Obtener datos del vendedor
    const userRes = await fetch('https://api.mercadolibre.com/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();

    // 5. Redirigir al vendedor con sus datos
    // En producción guardarías el token en una DB
    // Por ahora lo pasamos como query param para mostrarlo en el panel
    const params = new URLSearchParams({
      ml_connected: 'true',
      seller_id: userData.id,
      nickname: userData.nickname,
    });

    return res.redirect(`/?${params.toString()}`);

  } catch (err) {
    console.error('Error en callback:', err);
    return res.redirect('/?ml_error=error_interno');
  }
};
