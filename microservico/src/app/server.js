require('dotenv').config({ path: '../../.env' });
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Configuração do Mailtrap (O "Correio" do nosso sistema)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io",
    port: process.env.EMAIL_PORT || 587,
    auth: {
        user: process.env.EMAIL_USER, // Pega do arquivo .env do microsserviço
        pass: process.env.EMAIL_PASS  // Pega do arquivo .env do microsserviço
    }
});

// ROTA 1: Boas-vindas (Ao criar a conta)

app.post('/api/email/boas-vindas', async (req, res) => {
    const { email, nome } = req.body;
    try {
        await transporter.sendMail({
            from: '"Equipe Raiz Conecta" <nao-responda@raizconecta.com.br>',
            to: email,
            subject: "🌱 Bem-vindo ao Raiz Conecta!",
            html: `
        <h2>Olá, ${nome || 'Produtor'}!</h2>
        <p>Que alegria ter você com a gente na plataforma <b>Raiz Conecta</b>.</p>
        <p>Você acabou de dar o primeiro passo (Nível Semente). Para começar a vender, acesse o sistema e envie a foto do seu documento de identificação.</p>
        <p>Estamos ansiosos para ver seus produtos!</p>
      `
        });
        console.log(`[E-mail Enviado] Boas-vindas para: ${email}`);
        res.status(200).json({ message: "E-mail enviado com sucesso" });
    } catch (error) {
        console.error("Erro ao enviar e-mail:", error);
        res.status(500).json({ error: "Erro ao enviar e-mail" });
    }
});

// 📧 ROTA 2: Aprovação (Nível Raiz)

app.post('/api/email/aprovacao', async (req, res) => {
    const { email } = req.body;
    try {
        await transporter.sendMail({
            from: '"Equipe Raiz Conecta" <nao-responda@raizconecta.com.br>',
            to: email,
            subject: "🎉 Aprovado! Você agora é um Produtor Raiz!",
            html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #16a34a;">Parabéns! Sua documentação foi aprovada. 🌳</h2>
          <p>Temos o prazer de informar que você atingiu o <b>Nível Raiz</b> na plataforma Raiz Conecta.</p>
          <p>Seu acesso total foi liberado. A partir de agora, você já pode acessar seu painel e começar a cadastrar seus produtos para venda.</p>
          <br/>
          <p>Boas vendas!</p>
        </div>
      `
        });
        console.log(`[E-mail Enviado] Aprovação para: ${email}`);
        res.status(200).json({ message: "E-mail de aprovação enviado" });
    } catch (error) {
        console.error("Erro ao enviar aprovação:", error);
        res.status(500).json({ error: "Erro ao enviar e-mail" });
    }
});

// ROTA 3: Rejeição (Documento Inválido)

app.post('/api/email/rejeicao', async (req, res) => {
    const { email } = req.body;
    try {
        await transporter.sendMail({
            from: '"Equipe Raiz Conecta" <nao-responda@raizconecta.com.br>',
            to: email,
            subject: "⚠️ Atualização sobre sua documentação",
            html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #dc2626;">Houve um problema com seu documento.</h2>
          <p>Infelizmente nossa equipe não conseguiu validar a foto do documento enviada em seu cadastro.</p>
          <p>Isso geralmente ocorre por imagens embaçadas, cortadas ou envio do documento errado.</p>
          <p><b>Não se preocupe!</b> Acesse seu painel na plataforma Raiz Conecta e anexe uma nova foto nítida para tentarmos novamente.</p>
        </div>
      `
        });
        console.log(`[E-mail Enviado] Rejeição para: ${email}`);
        res.status(200).json({ message: "E-mail de rejeição enviado" });
    } catch (error) {
        console.error("Erro ao enviar rejeição:", error);
        res.status(500).json({ error: "Erro ao enviar e-mail" });
    }
});

// INICIAR O SERVIDOR

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Microsserviço de E-mail rodando na porta ${PORT}`);
});