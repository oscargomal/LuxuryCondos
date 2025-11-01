const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const Stripe = require('stripe');
const jwt = require('jsonwebtoken');

// Inicializar dotenv
dotenv.config();

// Inicializar Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Crear la aplicación Express
const app = express();

// Configurar el puerto
const PORT = process.env.PORT || 3000;

// Middleware para parsear el cuerpo de la solicitud
app.use(express.json());

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de autenticación
const users = {
  admin: { password: process.env.ADMIN_PASSWORD },
  cris: { password: process.env.CRIS_PASSWORD },
};

// Ruta para la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para la página de administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});

// Ruta para login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Verificar usuario y contraseña
  if (!users[username] || users[username].password !== password) {
    return res.status(401).json({ message: 'Usuario o contraseña inválidos' });
  }

  // Generar token JWT
  const token = jwt.sign({ username }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

  // Devolver el token
  res.json({ token });
});

// Ruta para las reservas
app.get('/api/reservas', (req, res) => {
  // Aquí debes agregar la lógica para obtener las reservas desde la base de datos
  // Simulamos una respuesta de ejemplo
  const reservas = [
    {
      id: 1,
      customer: { name: 'Juan Pérez' },
      room: '101',
      checkin: '2025-12-01',
      checkout: '2025-12-05',
      total: 200,
      status: 'pendiente'
    },
    {
      id: 2,
      customer: { name: 'María López' },
      room: '102',
      checkin: '2025-12-06',
      checkout: '2025-12-10',
      total: 250,
      status: 'pagado'
    }
  ];

  res.json(reservas);
});

// Ruta para actualizar el estado de la reserva
app.patch('/api/reservas/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Aquí puedes agregar lógica para actualizar la reserva en la base de datos
  // Por ahora, simplemente respondemos que la reserva fue actualizada
  res.json({ message: `Reserva ${id} actualizada a estado: ${status}` });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
