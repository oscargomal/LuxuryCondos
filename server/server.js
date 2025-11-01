const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const Stripe = require('stripe');

// Inicializar dotenv
dotenv.config();

// Inicializar Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Crear la aplicación Express
const app = express();

// Configurar el puerto
const PORT = process.env.PORT || 3000;

// Middleware para servir archivos estáticos desde la carpeta 'public' en la raíz
app.use(express.static(path.join(__dirname, '..', 'public')));

// Ruta para la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin', 'admin.html'));
});

// Configuración para Stripe y otras funcionalidades pueden ir aquí
// Por ejemplo: crear una ruta para las reservas, etc.

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
