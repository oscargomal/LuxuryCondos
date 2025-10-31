// 1️⃣ Cargar variables de entorno
require('dotenv').config();

// 2️⃣ Importar librerías necesarias
const express = require('express');
const fs = require('fs').promises; // para leer/escribir reservas.json
const path = require('path');
const Stripe = require('stripe');

// 3️⃣ Inicializar Stripe con la clave secreta desde las variables de entorno
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;
const RESERVAS_FILE = path.join(__dirname, 'reservas.json');

// 4️⃣ Middleware para parsear JSON y servir archivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Directorio público para el frontend
app.use('/admin', express.static(path.join(__dirname, 'admin'))); // Directorio para el panel de administración

// ------------------------------
// 5️⃣ Endpoints
// ------------------------------

// 5.1 Endpoint para obtener la clave pública de Stripe
app.get('/api/stripe-key', (req, res) => {
  res.json({ publicKey: process.env.STRIPE_PUBLIC_KEY });
});

// 5.2 Endpoint para obtener todas las reservas (panel admin)
app.get('/api/reservas', async (req, res) => {
  try {
    const data = await fs.readFile(RESERVAS_FILE, 'utf8');
    const reservas = JSON.parse(data);
    res.json(reservas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error leyendo reservas' });
  }
});

// 5.3 Endpoint para crear una nueva reserva y sesión de pago en Stripe
app.post('/api/reservas', async (req, res) => {
  const { nombre, email, habitacion, fechaInicio, fechaFin, total } = req.body;

  if (!nombre || !email || !habitacion || !fechaInicio || !fechaFin || !total) {
    return res.status(400).json({ message: 'Faltan datos de la reserva' });
  }

  try {
    // Crear sesión de pago en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Reserva ${habitacion} - Luxury Condos`,
            },
            unit_amount: total * 100, // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cancel.html`,
      customer_email: email,
    });

    // Guardar reserva en JSON con estado "pendiente"
    let reservas = [];
    try {
      const data = await fs.readFile(RESERVAS_FILE, 'utf8');
      reservas = JSON.parse(data);
    } catch (err) {
      reservas = []; // Si el archivo no existe aún, empezamos con un arreglo vacío
    }

    const nuevaReserva = {
      id: Date.now(), // id simple basado en timestamp
      nombre,
      email,
      habitacion,
      fechaInicio,
      fechaFin,
      total,
      estado: 'pendiente',
      stripeSessionId: session.id,
    };

    reservas.push(nuevaReserva);
    await fs.writeFile(RESERVAS_FILE, JSON.stringify(reservas, null, 2));

    res.json({ url: session.url }); // Devolver URL de Stripe para el checkout
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creando la reserva' });
  }
});

// 5.4 Endpoint para actualizar estado de reserva (panel admin)
app.patch('/api/reservas/:id', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!estado) return res.status(400).json({ message: 'Falta el estado' });

  try {
    const data = await fs.readFile(RESERVAS_FILE, 'utf8');
    let reservas = JSON.parse(data);

    const index = reservas.findIndex(r => r.id == id);
    if (index === -1) return res.status(404).json({ message: 'Reserva no encontrada' });

    reservas[index].estado = estado;
    await fs.writeFile(RESERVAS_FILE, JSON.stringify(reservas, null, 2));

    res.json({ message: 'Estado actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error actualizando reserva' });
  }
});

// 6️⃣ Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
