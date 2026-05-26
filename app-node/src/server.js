const express = require('express');
const cors = require('cors');
require('dotenv').config();

const usuarioRoutes = require('./routes/userRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', usuarioRoutes);

// Health check para Railway/Render
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'app-node' }));

const PORTA = process.env.PORT || 3003;
app.listen(PORTA, () => console.log(`🚀 app-node rodando na porta ${PORTA}`));
