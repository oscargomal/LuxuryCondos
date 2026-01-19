module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // TODO: Crear sesion de Stripe aqui y devolver checkoutUrl.
  // Usa variables de entorno: STRIPE_SECRET_KEY, STRIPE_PRICE_ID, SITE_URL.
  res.status(501).json({ error: "Stripe checkout no configurado" });
};
