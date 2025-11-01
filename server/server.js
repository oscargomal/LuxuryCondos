const express = require('express');
const path = require('path');
const Stripe = require('stripe');

// Inicializar Stripe
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;

console.log('Servidor iniciado en el puerto:', PORT);

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));  // Servir archivos estáticos desde 'public'

// Ruta para la página principal
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log('Ruta de index.html:', indexPath);  // Muestra la ruta completa al archivo index.html

  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error al servir el archivo:', err);
      res.status(500).send('Error al servir el archivo index.html');
    } else {
      console.log('Archivo index.html servido correctamente');
    }
  });
});

// Resto del código para las rutas de Stripe y reservas
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
