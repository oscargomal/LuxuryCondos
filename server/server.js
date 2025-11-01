const express = require('express');
const path = require('path');
const Stripe = require('stripe');

// Inicializar Stripe con la clave secreta
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;
const RESERVAS_FILE = path.join(__dirname, 'reservas.json');

// Middleware para servir archivos estáticos desde 'public' y 'admin'
app.use(express.static(path.join(__dirname, 'public'))); // Archivos públicos (index.html, assets, etc.)
app.use('/admin', express.static(path.join(__dirname, 'admin'))); // Archivos de administración (admin.html)

// Definir ruta para la página principal
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log('Ruta de index.html:', indexPath);  // Verificar la ruta de index.html
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error al servir el archivo:', err);
      res.status(500).send('Error al servir el archivo index.html');
    } else {
      console.log('Archivo index.html servido correctamente');
    }
  });
});

// Ruta para acceder al admin (por ejemplo, /admin/admin.html)
app.get('/admin', (req, res) => {
  const adminIndexPath = path.join(__dirname, 'admin', 'admin.html');
  console.log('Ruta de admin.html:', adminIndexPath);  // Verificar la ruta de admin.html
  res.sendFile(adminIndexPath, (err) => {
    if (err) {
      console.error('Error al servir el archivo admin.html:', err);
      res.status(500).send('Error al servir el archivo admin.html');
    } else {
      console.log('Archivo admin.html servido correctamente');
    }
  });
});

// Resto del código para las rutas de Stripe y reservas
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
