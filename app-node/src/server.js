// 1. Importa as bibliotecas necessárias
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Carrega variáveis do arquivo .env

// 2. Importa as rotas que você criou
const usuarioRoutes = require('./routes/userRoutes');

// 3. Inicializa o aplicativo Express
const app = express();

// 4. Middlewares Globais
app.use(cors()); // Permite que o front-end acesse a API
app.use(express.json()); // Permite que a API receba dados em formato JSON

// 5. Definição das Rotas da API
// Toda rota de usuário agora começará com /api (ex: /api/usuarios)
app.use('/api', usuarioRoutes); 

// 6. Define a porta e liga o servidor
const PORTA = process.env.PORT || 3003;
app.listen(PORTA, () => {
    console.log(`🚀 Servidor rodando com sucesso na porta ${PORTA}`);
});
