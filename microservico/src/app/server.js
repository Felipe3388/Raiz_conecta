require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');
const fs         = require('fs');
const path       = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ── Templates HTML (lidos uma vez ao iniciar) ─────────────────────────
const templates = {
    'boas-vindas':          fs.readFileSync(path.join(__dirname, 'templates/boas-vindas.html'),          'utf8'),
    'aprovacao':            fs.readFileSync(path.join(__dirname, 'templates/aprovacao.html'),            'utf8'),
    'rejeicao':             fs.readFileSync(path.join(__dirname, 'templates/rejeicao.html'),             'utf8'),
    'sugestao-admin':       fs.readFileSync(path.join(__dirname, 'templates/sugestao-admin.html'),       'utf8'),
    'confirmacao-sugestao': fs.readFileSync(path.join(__dirname, 'templates/confirmacao-sugestao.html'), 'utf8'),
    'suspensao':            fs.readFileSync(path.join(__dirname, 'templates/suspensao.html'),            'utf8'),
    'exclusao':             fs.readFileSync(path.join(__dirname, 'templates/exclusao.html'),             'utf8'),
};

function preencherTemplate(template, variaveis) {
    return Object.entries(variaveis).reduce(
        (html, [chave, valor]) => html.replaceAll(`{{${chave}}}`, valor ?? ''),
        template
    );
}

// ── Transporter Nodemailer ────────────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
    port: Number(process.env.EMAIL_PORT) || 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const FROM       = `"Equipe Raiz Conecta" <${process.env.EMAIL_FROM}>`;
const EMAIL_ADMIN = process.env.EMAIL_ADMIN;

// ── Swagger ───────────────────────────────────────────────────────────
const swaggerSpec = {
    openapi: '3.0.0',
    info: {
        title:       'Raiz Conecta — Microsserviço de E-mail',
        version:     '1.0.0',
        description: 'API responsável pelo envio de e-mails transacionais da plataforma Raiz Conecta.',
    },
    tags: [
        { name: 'Health',  description: 'Status do serviço'              },
        { name: 'E-mail',  description: 'Envio de e-mails transacionais' },
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
                                    email:        { type: 'string', format: 'email' },
                                    nome:         { type: 'string' },
                                    tipoUsuario:  { type: 'string', enum: ['produtor', 'mercado'] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'E-mail enviado com sucesso' },
                    500: { description: 'Erro ao enviar e-mail'      },
                },
            },
        },
        '/api/email/aprovacao': {
            post: {
                tags: ['E-mail'],
                summary: 'Envia e-mail de aprovação de cadastro',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'nome'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    nome:  { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'E-mail de aprovação enviado' },
                    500: { description: 'Erro ao enviar e-mail'       },
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
                                required: ['email', 'nome'],
                                properties: {
                                    email: { type: 'string', format: 'email' },
                                    nome:  { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'E-mail de rejeição enviado' },
                    500: { description: 'Erro ao enviar e-mail'      },
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
                                    emailProdutor:  { type: 'string', format: 'email' },
                                    nomeProdutor:   { type: 'string' },
                                    nomeProduto:    { type: 'string' },
                                    descricao:      { type: 'string' },
                                    imagemUrl:      { type: 'string' },
                                    precoSugerido:  { type: 'number' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'E-mails de sugestão enviados' },
                    500: { description: 'Erro ao enviar e-mail'        },
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
                                required: ['email', 'nome'],
                                properties: {
                                    email:  { type: 'string', format: 'email' },
                                    nome:   { type: 'string' },
                                    motivo: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'E-mail de suspensão enviado' },
                    500: { description: 'Erro ao enviar e-mail'       },
                },
            },
        },
        '/api/email/exclusao': {
            post: {
                tags: ['E-mail'],
                summary: 'Envia e-mail de exclusão de conta',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['email', 'nome'],
                                properties: {
                                    email:  { type: 'string', format: 'email' },
                                    nome:   { type: 'string' },
                                    motivo: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: 'E-mail de exclusão enviado' },
                    500: { description: 'Erro ao enviar e-mail'      },
                },
            },
        },
    },
};

app.get('/api-docs/swagger.json', (_req, res) => res.json(swaggerSpec));

app.get('/api-docs', (_req, res) => {
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
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'microservico-email' }));

// ── Utilitário de envio com log centralizado ──────────────────────────
async function enviar({ to, subject, html, rotaLabel }) {
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[E-mail] ${rotaLabel} → ${to}`);
}

// ── ROTA 1: Boas-vindas ───────────────────────────────────────────────
app.post('/api/email/boas-vindas', async (req, res) => {
    const { email, nome, tipoUsuario } = req.body;
    try {
        const html = preencherTemplate(templates['boas-vindas'], {
            nome: nome || 'Usuário',
            tipo: tipoUsuario === 'produtor' ? 'Produtor Rural' : 'Mercado',
        });
        await enviar({ to: email, subject: '🌱 Bem-vindo ao Raiz Conecta!', html, rotaLabel: 'Boas-vindas' });
        res.json({ message: 'E-mail enviado com sucesso.' });
    } catch (err) {
        console.error('[E-mail] Erro boas-vindas:', err.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

// ── ROTA 2: Aprovação ─────────────────────────────────────────────────
app.post('/api/email/aprovacao', async (req, res) => {
    const { email, nome } = req.body;
    try {
        const html = preencherTemplate(templates['aprovacao'], {
            email,
            nome: nome || 'Usuário',
        });
        await enviar({ to: email, subject: '🎉 Aprovado! Seu acesso foi liberado.', html, rotaLabel: 'Aprovação' });
        res.json({ message: 'E-mail de aprovação enviado.' });
    } catch (err) {
        console.error('[E-mail] Erro aprovação:', err.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

// ── ROTA 3: Rejeição ──────────────────────────────────────────────────
app.post('/api/email/rejeicao', async (req, res) => {
    const { email, nome } = req.body;
    try {
        const html = preencherTemplate(templates['rejeicao'], {
            email,
            nome: nome || 'Usuário',
        });
        await enviar({ to: email, subject: '⚠️ Atualização sobre sua documentação', html, rotaLabel: 'Rejeição' });
        res.json({ message: 'E-mail de rejeição enviado.' });
    } catch (err) {
        console.error('[E-mail] Erro rejeição:', err.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

// ── ROTA 4: Sugestão ──────────────────────────────────────────────────
app.post('/api/email/sugestao', async (req, res) => {
    const { emailProdutor, nomeProdutor, nomeProduto, descricao, imagemUrl, precoSugerido } = req.body;

    const precoFormatado = precoSugerido
        ? `R$ ${Number(precoSugerido).toFixed(2)}`
        : 'Não informado';

    const imagemHtml = imagemUrl
        ? `<img src="${imagemUrl}" alt="Imagem da Sugestão" style="max-width:100%;height:auto;max-height:260px;border-radius:8px;border:2px solid #fde68a;margin-bottom:12px;">`
        : '';

    try {
        // E-mail para o admin
        const htmlAdmin = preencherTemplate(templates['sugestao-admin'], {
            emailProdutor,
            nomeProdutor:   nomeProdutor || 'Produtor',
            nomeProduto,
            descricao:      descricao || 'Nenhuma descrição fornecida.',
            precoFormatado,
            imagemHtml,
        });
        await enviar({ to: EMAIL_ADMIN, subject: `💡 Nova Sugestão de Produto: ${nomeProduto}`, html: htmlAdmin, rotaLabel: 'Sugestão (admin)' });

        // Confirmação para o produtor
        const htmlProdutor = preencherTemplate(templates['confirmacao-sugestao'], {
            emailProdutor,
            nomeProdutor:   nomeProdutor || 'Produtor',
            nomeProduto,
            descricao:      descricao || 'Nenhuma descrição fornecida.',
            imagemHtml,
        });
        await enviar({ to: emailProdutor, subject: `✅ Recebemos sua sugestão: ${nomeProduto}`, html: htmlProdutor, rotaLabel: 'Sugestão (produtor)' });

        res.json({ message: 'E-mails de sugestão enviados.' });
    } catch (err) {
        console.error('[E-mail] Erro sugestão:', err.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

// ── ROTA 5: Suspensão ─────────────────────────────────────────────────
app.post('/api/email/suspensao', async (req, res) => {
    const { email, nome, motivo } = req.body;
    try {
        const html = preencherTemplate(templates['suspensao'], {
            email,
            nome:   nome   || 'Usuário',
            motivo: motivo || 'Não especificado.',
        });
        await enviar({ to: email, subject: '⚠️ Sua conta foi suspensa — Raiz Conecta', html, rotaLabel: 'Suspensão' });
        res.json({ message: 'E-mail de suspensão enviado.' });
    } catch (err) {
        console.error('[E-mail] Erro suspensão:', err.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

// ── ROTA 6: Exclusão ──────────────────────────────────────────────────
app.post('/api/email/exclusao', async (req, res) => {
    const { email, nome, motivo } = req.body;
    try {
        const html = preencherTemplate(templates['exclusao'], {
            email,
            nome:   nome   || 'Usuário',
            motivo: motivo || 'Não especificado.',
        });
        await enviar({ to: email, subject: '🔴 Sua conta foi removida — Raiz Conecta', html, rotaLabel: 'Exclusão' });
        res.json({ message: 'E-mail de exclusão enviado.' });
    } catch (err) {
        console.error('[E-mail] Erro exclusão:', err.message);
        res.status(500).json({ error: 'Erro ao enviar e-mail.' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`📧 Microsserviço de e-mail rodando na porta ${PORT}`));
