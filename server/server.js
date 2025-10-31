require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const Stripe = require('stripe');

// Inicializar Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;
const RESERVAS_FILE = path.join(__dirname, 'reservas.json');

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Definir ruta para la página principal
app.get('/', (req, res) => {
  res.send('Bienvenido a Luxury Condos');
});

// Resto del código para las rutas de Stripe y reservas

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
