module.exports = async (req, res) => {
  if (req.method === "POST") {
    // TODO: Insertar en Supabase. Variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
    res.status(501).json({ error: "Supabase no configurado" });
    return;
  }

  if (req.method === "GET") {
    // TODO: Consultar reservaciones desde Supabase.
    res.status(501).json({ error: "Supabase no configurado" });
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
