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
    'boas-vindas':          fs.readFileSync(path.join(__dirname, 'templates/boas-vindas.html'), 'utf8'),
    'aprovacao':            fs.readFileSync(path.join(__dirname, 'templates/aprovacao.html'), 'utf8'),
    'rejeicao':             fs.readFileSync(path.join(__dirname, 'templates/rejeicao.html'), 'utf8'),
    'sugestao-admin':       fs.readFileSync(path.join(__dirname, 'templates/sugestao-admin.html'), 'utf8'),
    'confirmacao-sugestao': fs.readFileSync(path.join(__dirname, 'templates/confirmacao-sugestao.html'), 'utf8'),
    'suspensao':            fs.readFileSync(path.join(__dirname, 'templates/suspensao.html'), 'utf8'),
    'exclusao':             fs.readFileSync(path.join(__dirname, 'templates/exclusao.html'), 'utf8'),
};

function preencherTemplate(template, variaveis) {
    return Object.entries(variaveis).reduce(
        (html, [chave, valor]) => html.replaceAll(`{{${chave}}}`, valor ?? ''),
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

const FROM = '"Equipe Raiz Conecta" <' + (process.env.EMAIL_FROM || 'estoque@visioshop.com.br') + '>';

// ── Swagger via CDN ───────────────────────────────────────────────────
const swaggerSpec = {
    openapi: '3.0.0',
    info: {
        title: 'Raiz Conecta — Microsserviço de E-mail',
        version: '1.0.0',
        description: 'API responsável pelo envio de e-mails transacionais da plataforma Raiz Conecta.',
    },
    tags: [
        { name: 'Health', description: 'Status do serviço' },
        { name: 'E-mail', description: 'Envio de e-mails transacionais' },
    ],
    paths: {
        '/health': {
            get: {
                tags: ['Health'],
                summary: 'Verifica se o serviço está online',
                responses: {
                    200: { description: 'Serviço operacional', content: { 'application/json': { example: { status: 'ok', service: 'microservico-email' } } } },
                },
            },
        },
        '/api/email/boas-vindas': {
            post: {
                tags: ['E-mail'],
                summary: 'Envia e-mail de boas-vindas ao novo usuário',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'nome'],
                                properties: {
                                    email: { type: 'string', format: 'email', example: 'joao@email.com' },
                                    nome: { type: 'string', example: 'João da Silva' },
                                    tipoUsuario: { type: 'string', enum: ['produtor', 'mercado'], example: 'produtor' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'E-mail enviado com sucesso' },
                    500: { description: 'Erro ao enviar e-mail' },
                },
            },
        },
        '/api/email/aprovacao': {
            post: {
                tags: ['E-mail'],
                summary: 'Envia e-mail de aprovação de cadastro (Nível Raiz)',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: {
                                    email: { type: 'string', format: 'email', example: 'joao@email.com' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'E-mail de aprovação enviado' },
                    500: { description: 'Erro ao enviar e-mail' },
                },
            },
        },
        '/api/email/rejeicao': {
            post: {
                tags: ['E-mail'],
                summary: 'Envia e-mail de rejeição de documentação',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: {
                                    email: { type: 'string', format: 'email', example: 'joao@email.com' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'E-mail de rejeição enviado' },
                    500: { description: 'Erro ao enviar e-mail' },
                },
            },
        },
        '/api/email/sugestao': {
            post: {
                tags: ['E-mail'],
                summary: 'Envia e-mail de sugestão ao admin e confirmação ao produtor',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['emailProdutor', 'nomeProduto'],
                                properties: {
                                    emailProdutor: { type: 'string', format: 'email', example: 'produtor@email.com' },
                                    nomeProduto: { type: 'string', example: 'Mel de Abelha Nativa' },
                                    descricao: { type: 'string', example: 'Mel puro coletado artesanalmente.' },
                                    imagemUrl: { type: 'string', example: 'https://res.cloudinary.com/exemplo/image.jpg' },
                                    precoSugerido: { type: 'number', example: 35.90 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'E-mails de sugestão enviados' },
                    500: { description: 'Erro ao enviar e-mail' },
                },
            },
        },
        '/api/email/suspensao': {
            post: {
                tags: ['E-mail'],
                summary: 'Envia e-mail de suspensão de conta',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: {
                                    email: { type: 'string', format: 'email', example: 'joao@email.com' },
                                    motivo: { type: 'string', example: 'Violação dos termos de uso.' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'E-mail de suspensão enviado' },
                    500: { description: 'Erro ao enviar e-mail' },
                },
            },
        },
        '/api/email/exclusao': {
            post: {
                tags: ['E-mail'],
                summary: 'Envia e-mail de exclusão/desativação de conta',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email'],
                                properties: {
                                    email: { type: 'string', format: 'email', example: 'joao@email.com' },
                                    motivo: { type: 'string', example: 'Solicitação do próprio usuário.' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'E-mail de exclusão enviado' },
                    500: { description: 'Erro ao enviar e-mail' },
                },
            },
        },
    },
};

app.get('/api-docs/swagger.json', (req, res) => res.json(swaggerSpec));

app.get('/api-docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Raiz Conecta — API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api-docs/swagger.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
    });
  </script>
</body>
</html>`);
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
        await transporter.sendMail({ from: FROM, to: email, subject: '🌱 Bem-vindo ao Raiz Conecta!', html });
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
        await transporter.sendMail({ from: FROM, to: email, subject: '🎉 Aprovado! Seu acesso foi liberado.', html });
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
        await transporter.sendMail({ from: FROM, to: email, subject: '⚠️ Atualização sobre sua documentação', html });
        console.log(`[E-mail] Rejeição → ${email}`);
        res.status(200).json({ message: 'E-mail de rejeição enviado.' });
    } catch (error) {
        console.error('[E-mail] Erro rejeição:', error.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

// ── ROTA 4: Sugestão — envia ao admin E confirmação ao produtor ───────
app.post('/api/email/sugestao', async (req, res) => {
    const { emailProdutor, nomeProduto, descricao, imagemUrl, precoSugerido } = req.body;
    const emailAdmin = process.env.EMAIL_ADMIN || 'estoque@visioshop.com.br';

    const precoFormatado = precoSugerido
        ? `R$ ${Number(precoSugerido).toFixed(2)}`
        : 'Não informado';

    const imagemHtml = imagemUrl
        ? `<img src="${imagemUrl}" alt="Imagem da Sugestão" style="max-width:100%;height:auto;max-height:260px;border-radius:8px;border:2px solid #fde68a;margin-bottom:12px;">`
        : '';

    try {
        const htmlAdmin = preencherTemplate(templates['sugestao-admin'], {
            emailProdutor,
            nomeProduto,
            descricao: descricao || 'Nenhuma descrição fornecida.',
            precoFormatado,
            imagemHtml,
        });
        await transporter.sendMail({ from: FROM, to: emailAdmin, subject: `💡 Nova Sugestão de Produto: ${nomeProduto}`, html: htmlAdmin });
        console.log(`[E-mail] Sugestão (admin) "${nomeProduto}" → ${emailAdmin}`);

        const htmlProdutor = preencherTemplate(templates['confirmacao-sugestao'], {
            emailProdutor,
            nomeProduto,
            descricao: descricao || 'Nenhuma descrição fornecida.',
            imagemHtml,
        });
        await transporter.sendMail({ from: FROM, to: emailProdutor, subject: `✅ Recebemos sua sugestão: ${nomeProduto}`, html: htmlProdutor });
        console.log(`[E-mail] Confirmação sugestão → ${emailProdutor}`);

        res.status(200).json({ message: 'E-mails de sugestão enviados.' });
    } catch (error) {
        console.error('[E-mail] Erro sugestão:', error.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

// ── ROTA 5: Suspensão de conta ────────────────────────────────────────
app.post('/api/email/suspensao', async (req, res) => {
    const { email, motivo } = req.body;
    try {
        const html = preencherTemplate(templates['suspensao'], { email, motivo: motivo || 'Não especificado.' });
        await transporter.sendMail({ from: FROM, to: email, subject: '⚠️ Sua conta foi suspensa — Raiz Conecta', html });
        console.log(`[E-mail] Suspensão → ${email}`);
        res.status(200).json({ message: 'E-mail de suspensão enviado.' });
    } catch (error) {
        console.error('[E-mail] Erro suspensão:', error.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

// ── ROTA 6: Exclusão/desativação de conta ────────────────────────────
app.post('/api/email/exclusao', async (req, res) => {
    const { email, motivo } = req.body;
    try {
        const html = preencherTemplate(templates['exclusao'], { email, motivo: motivo || 'Não especificado.' });
        await transporter.sendMail({ from: FROM, to: email, subject: '🔴 Sua conta foi removida — Raiz Conecta', html });
        console.log(`[E-mail] Exclusão → ${email}`);
        res.status(200).json({ message: 'E-mail de exclusão enviado.' });
    } catch (error) {
        console.error('[E-mail] Erro exclusão:', error.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`📧 Microsserviço de e-mail rodando na porta ${PORT}`));