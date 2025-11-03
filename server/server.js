const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');

// Inicializar dotenv
dotenv.config();

// Inicializar Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Crear la aplicación Express
const app = express();

// Configurar el puerto
const PORT = process.env.PORT || 3000;

// Middleware para analizar JSON
app.use(express.json());

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Datos de ejemplo para autenticación
const users = [
  { username: 'admin', password: 'adminAJijic', role: 'admin' },
  { username: 'cris', password: 'Ajijic2025', role: 'cris' }
];

// Ruta para el login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Usuario o contraseña inválidos' });
  }

  // Crear el token JWT
  const token = jwt.sign({ username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Ruta para las reservas (solo accesible con token)
app.get('/api/reservas', verifyToken, (req, res) => {
  // Aquí deberías tener la lógica para obtener las reservas desde la base de datos
  const reservas = [
    { id: 1, customer: { name: 'Juan Pérez' }, room: '101', checkin: '2025-12-01', checkout: '2025-12-05', total: '$100', status: 'pendiente' },
    { id: 2, customer: { name: 'Ana López' }, room: '102', checkin: '2025-12-02', checkout: '2025-12-06', total: '$120', status: 'pagado' },
  ];
  res.json(reservas);
});

// Ruta para actualizar el estado de una reserva (solo accesible con token)
app.patch('/api/reservas/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Aquí deberías tener la lógica para actualizar el estado de la reserva en la base de datos
  res.json({ id, status });
});

// Middleware para verificar el token JWT
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ error: 'No se proporcionó el token' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    req.user = decoded;
    next();
  });
}

// Ruta para la página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'admin.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
