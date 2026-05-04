export default function handler(req, res) {
  const { challenge } = req.query;

  // Mercado Libre usa este método para verificar la URL la primera vez
  if (challenge) {
    return res.status(200).send(challenge);
  }

  // Aquí procesarás las órdenes y productos más adelante
  if (req.method === 'POST') {
    const body = req.body;
    console.log("Notificación recibida:", body);
    
    return res.status(200).json({ status: "recibido" });
  }

  return res.status(200).json({ message: "Hola desde Vercel" });
}
