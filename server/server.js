const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const Stripe = require('stripe');

// Inicializar Stripe con la clave secreta
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;  // Usa el puerto proporcionado por Render
const RESERVAS_FILE = path.join(__dirname, 'reservas.json');

// Middleware para servir archivos estáticos desde 'public' y 'admin'
app.use(express.static(path.join(__dirname, '..', 'public')));  // Archivos públicos (index.html, assets, etc.)
app.use('/admin', express.static(path.join(__dirname, '..', 'admin'))); // Archivos de administración (admin.html)

// Ruta para la página principal (index.html)
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'public', 'index.html');  // Ajusta la ruta al directorio correcto
  console.log('Ruta de index.html:', indexPath);  // Verifica la ruta de index.html
  fs.access(indexPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('Archivo index.html no encontrado:', err);
      res.status(500).send('Archivo index.html no encontrado');
    } else {
      console.log('Archivo index.html encontrado, sirviendo...');
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Error al servir el archivo index.html:', err);
          res.status(500).send('Error al servir el archivo index.html');
        } else {
          console.log('Archivo index.html servido correctamente');
        }
      });
    }
  });
});

// Ruta para la página de administración (admin.html)
app.get('/admin', (req, res) => {
  const adminIndexPath = path.join(__dirname, '..', 'admin', 'admin.html');  // Ajusta la ruta al directorio correcto
  console.log('Ruta de admin.html:', adminIndexPath);  // Verifica la ruta de admin.html
  fs.access(adminIndexPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error('Archivo admin.html no encontrado:', err);
      res.status(500).send('Archivo admin.html no encontrado');
    } else {
      console.log('Archivo admin.html encontrado, sirviendo...');
      res.sendFile(adminIndexPath, (err) => {
        if (err) {
          console.error('Error al servir el archivo admin.html:', err);
          res.status(500).send('Error al servir el archivo admin.html');
        } else {
          console.log('Archivo admin.html servido correctamente');
        }
      });
    }
  });
});

// Resto del código para las rutas de Stripe y reservas
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);  // Ahora está usando el puerto de Render
});
