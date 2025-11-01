const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const Stripe = require('stripe');

// Inicializar Stripe directamente con las variables de entorno en Render
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;
const RESERVAS_FILE = path.join(__dirname, 'reservas.json');

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Definir ruta para la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ejemplo de ruta de administración
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Resto del código para las rutas de Stripe y reservas
// Por ejemplo, si tienes rutas para la gestión de reservas:

app.get('/api/reservas', async (req, res) => {
  try {
    const data = await fs.readFile(RESERVAS_FILE, 'utf8');
    const reservas = JSON.parse(data);
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ message: 'Error leyendo reservas' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
