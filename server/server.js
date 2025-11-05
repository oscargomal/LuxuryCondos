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

// Middleware para analizar JSON
app.use(express.json());

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Datos de ejemplo para autenticación (debes ajustar las contraseñas o roles)
const users = {
  admin: { password: 'adminAJijic', role: 'admin' },
  cris: { password: 'Ajijic2025', role: 'cris' }
};

// Ruta para el login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  // Verificar si el usuario existe y la contraseña es correcta
  if (!users[username] || users[username].password !== password) {
    return res.status(401).json({ error: 'Usuario o contraseña inválidos' });
  }
  
  // Si es correcto, responder con éxito
  res.json({ message: 'Login exitoso', role: users[username].role });
});

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