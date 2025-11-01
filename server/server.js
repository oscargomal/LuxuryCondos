// Importar librerías necesarias
const express = require('express');
const path = require('path');

// Crear una instancia de Express
const app = express();

// Configuración del puerto (por defecto es 3000)
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde la carpeta 'public' (para index.html)
app.use(express.static(path.join(__dirname, '../public')));

// Servir archivos estáticos desde la carpeta 'admin' (para admin.html)
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Ruta principal (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Ruta para el panel de administrador (admin.html)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/admin.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
