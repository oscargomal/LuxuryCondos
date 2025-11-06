import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());

// Ruta ejemplo de prueba
app.get("/", (req, res) => {
  res.send("Servidor activo en Render 🚀");
});

// Ejemplo de integración Stripe
app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: req.body.items,
      success_url: "https://tu-dominio.com/success",
      cancel_url: "https://tu-dominio.com/cancel",
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
