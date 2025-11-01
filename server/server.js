const express = require('express');
const path = require('path');
const Stripe = require('stripe');

// Inicializar Stripe con la clave secreta
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3000;  // Usa el puerto proporcionado por Render
const RESERVAS_FILE = path.join(__dirname, 'reservas.json');

// Middleware para servir archivos estáticos desde 'public' y 'admin'
app.use(express.static(path.join(__dirname, 'public')));  // Archivos públicos (index.html, assets, etc.)
app.use('/admin', express.static(path.join(__dirname, 'admin'))); // Archivos de administración (admin.html)

// Ruta para la página principal (index.html)
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  console.log('Ruta de index.html:', indexPath);  // Verifica la ruta de index.html
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error al servir el archivo index.html:', err);  // Verifica si hay error
      res.status(500).send('Error al servir el archivo index.html');
    } else {
      console.log('Archivo index.html servido correctamente');
    }
  });
});

// Ruta para la página de administración (admin.html)
app.get('/admin', (req, res) => {
  const adminIndexPath = path.join(__dirname, 'admin', 'admin.html');
  console.log('Ruta de admin.html:', adminIndexPath);  // Verifica la ruta de admin.html
  res.sendFile(adminIndexPath, (err) => {
    if (err) {
      console.error('Error al servir el archivo admin.html:', err);  // Verifica si hay error
      res.status(500).send('Error al servir el archivo admin.html');
    } else {
      console.log('Archivo admin.html servido correctamente');
    }
  });
});

// Resto del código para las rutas de Stripe y reservas (si lo necesitas)
// Ejemplo de ruta de API para obtener las reservas
app.get('/api/reservas', async (req, res) => {
  try {
    const data = await fs.readFile(RESERVAS_FILE, 'utf8');
    const reservas = JSON.parse(data);
    res.json(reservas);
  } catch (error) {
    res.status(500).json({ message: 'Error leyendo reservas' });
  }
});

// Configurar el servidor para que escuche en el puerto proporcionado por Render o 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
