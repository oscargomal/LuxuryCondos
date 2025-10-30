// 1️⃣ Cargar variables de entorno
require('dotenv').config();

// 2️⃣ Importar librerías necesarias
const express = require('express');
const fs = require('fs').promises; // para leer/escribir reservas.json
const path = require('path');
const Stripe = require('stripe');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET);

const PORT = process.env.PORT || 3000;
const RESERVAS_FILE = path.join(__dirname, 'reservas.json');

// 3️⃣ Middleware para parsear JSON y servir archivos estáticos
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'))); // frontend público
app.use('/admin', express.static(path.join(__dirname, '../admin'))); // backend/admin

// ------------------------------
// 4️⃣ Endpoints
// ------------------------------

// 4.1 Endpoint para obtener la clave pública de Stripe
app.get('/api/stripe-key', (req, res) => {
  res.json({ publicKey: process.env.STRIPE_PUBLIC });
});

// 4.2 Endpoint para obtener todas las reservas (panel admin)
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

// 4.3 Endpoint para crear una nueva reserva y sesión de pago en Stripe
app.post('/api/reservas', async (req, res) => {
  const { nombre, email, habitacion, fechaInicio, fechaFin, total } = req.body;

  if (!nombre || !email || !habitacion || !fechaInicio || !fechaFin || !total) {
    return res.status(400).json({ message: 'Faltan datos de la reserva' });
  }

  try {
    // 1️⃣ Crear sesión de pago en Stripe
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

    // 2️⃣ Guardar reserva en JSON con estado "pendiente"
    let reservas = [];
    try {
      const data = await fs.readFile(RESERVAS_FILE, 'utf8');
      reservas = JSON.parse(data);
    } catch (err) {
      // Si el archivo no existe aún, iniciamos arreglo vacío
      reservas = [];
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

    res.json({ url: session.url }); // enviar URL de checkout al frontend
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creando la reserva' });
  }
});

// 4.4 Endpoint para actualizar estado de reserva (panel admin)
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

// ------------------------------
// 5️⃣ Iniciar servidor
// ------------------------------
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
