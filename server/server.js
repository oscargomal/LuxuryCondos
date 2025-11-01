const express = require('express');
const path = require('path');
const Stripe = require('stripe');

// Inicializar Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));  // Servir archivos estáticos de la carpeta 'public'

// Ruta para la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));  // Servir 'index.html' desde 'public'
});

// Otras rutas de backend (reservas, Stripe, etc.)

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
