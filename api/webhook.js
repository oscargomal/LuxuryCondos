module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // TODO: Verificar firma de Stripe con STRIPE_WEBHOOK_SECRET.
  // TODO: Actualizar reservacion en Supabase a "Confirmada".
  res.status(501).json({ error: "Webhook no configurado" });
};
