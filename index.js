const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Mensaje de bienvenida
app.get('/', (req, res) => {
  res.send('🤖 Bot Dengy Toys - Activo ✅');
});

// Webhook simple para pedidos de Dengy Toys
app.post('/webhook', (req, res) => {
  console.log('Pedido recibido:', req.body);
  res.json({ status: 'ok', message: 'Pedido recibido en Dengy Toys' });
});

// Ruta de salud para Railway
app.get('/health', (req, res) => {
  res.json({ status: 'up', service: 'dengy-bot' });
});

app.listen(PORT, () => {
  console.log(`Dengy Bot corriendo en puerto ${PORT}`);
});
