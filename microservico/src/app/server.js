require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Lê os templates HTML uma vez ao iniciar
const templates = {
    'boas-vindas': fs.readFileSync(path.join(__dirname, 'templates/boas-vindas.html'), 'utf8'),
    'aprovacao':   fs.readFileSync(path.join(__dirname, 'templates/aprovacao.html'),   'utf8'),
    'rejeicao':    fs.readFileSync(path.join(__dirname, 'templates/rejeicao.html'),    'utf8'),
    'sugestao':    fs.readFileSync(path.join(__dirname, 'templates/sugestao.html'),    'utf8'),
};

function preencherTemplate(template, variaveis) {
    return Object.entries(variaveis).reduce(
        (html, [chave, valor]) => html.replaceAll(`{{${chave}}}`, valor || ''),
        template
    );
}

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: Number(process.env.EMAIL_PORT) || 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ── Health check ──────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'microservico-email' }));

// ── ROTA 1: Boas-vindas ───────────────────────────────────────────────
app.post('/api/email/boas-vindas', async (req, res) => {
    const { email, nome, tipoUsuario } = req.body;
    try {
        const html = preencherTemplate(templates['boas-vindas'], {
            nome: nome || 'Usuário',
            tipo: tipoUsuario === 'produtor' ? 'Produtor Rural' : 'Mercado',
        });
        await transporter.sendMail({
            from: '"Equipe Raiz Conecta" <nao-responda@raizconecta.com.br>',
            to: email,
            subject: '🌱 Bem-vindo ao Raiz Conecta!',
            html,
        });
        console.log(`[E-mail] Boas-vindas → ${email}`);
        res.status(200).json({ message: 'E-mail enviado com sucesso.' });
    } catch (error) {
        console.error('[E-mail] Erro boas-vindas:', error.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

// ── ROTA 2: Aprovação ─────────────────────────────────────────────────
app.post('/api/email/aprovacao', async (req, res) => {
    const { email } = req.body;
    try {
        const html = preencherTemplate(templates['aprovacao'], { email });
        await transporter.sendMail({
            from: '"Equipe Raiz Conecta" <nao-responda@raizconecta.com.br>',
            to: email,
            subject: '🎉 Aprovado! Seu acesso foi liberado.',
            html,
        });
        console.log(`[E-mail] Aprovação → ${email}`);
        res.status(200).json({ message: 'E-mail de aprovação enviado.' });
    } catch (error) {
        console.error('[E-mail] Erro aprovação:', error.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

// ── ROTA 3: Rejeição ──────────────────────────────────────────────────
app.post('/api/email/rejeicao', async (req, res) => {
    const { email } = req.body;
    try {
        const html = preencherTemplate(templates['rejeicao'], { email });
        await transporter.sendMail({
            from: '"Equipe Raiz Conecta" <nao-responda@raizconecta.com.br>',
            to: email,
            subject: '⚠️ Atualização sobre sua documentação',
            html,
        });
        console.log(`[E-mail] Rejeição → ${email}`);
        res.status(200).json({ message: 'E-mail de rejeição enviado.' });
    } catch (error) {
        console.error('[E-mail] Erro rejeição:', error.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

// ── ROTA 4: Sugestão de produto ───────────────────────────────────────
app.post('/api/email/sugestao', async (req, res) => {
    const { emailProdutor, nomeProduto, descricao } = req.body;
    const emailAdmin = process.env.EMAIL_ADMIN || 'admin@raizconecta.com.br';
    try {
        const html = preencherTemplate(templates['sugestao'], {
            emailProdutor,
            nomeProduto,
            descricao: descricao || 'Nenhuma descrição fornecida.',
        });
        await transporter.sendMail({
            from: '"Equipe Raiz Conecta" <nao-responda@raizconecta.com.br>',
            to: emailAdmin,
            subject: `💡 Nova Sugestão: ${nomeProduto}`,
            html,
        });
        console.log(`[E-mail] Sugestão "${nomeProduto}" → ${emailAdmin}`);
        res.status(200).json({ message: 'E-mail de sugestão enviado.' });
    } catch (error) {
        console.error('[E-mail] Erro sugestão:', error.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`📧 Microsserviço de e-mail rodando na porta ${PORT}`));
