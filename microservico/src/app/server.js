require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── Templates inline ──────────────────────────────────────────────────
const templates = {
  'boas-vindas': `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #15803d; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🌱 Raiz Conecta</h1>
    </div>
    <div style="padding: 30px; color: #374151; line-height: 1.6;">
        <h2 style="color: #15803d; margin-top: 0;">Olá, {{nome}}!</h2>
        <p>Que alegria ter você com a gente! Você acaba de dar o seu primeiro passo e agora faz parte do <strong>Nível Semente</strong>.</p>
        <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0;">
            <p style="margin: 0;"><strong>Próximo passo:</strong> Acesse o sistema e envie uma foto do seu documento de identificação.</p>
        </div>
        <p style="margin-bottom: 0; margin-top: 30px;">Um abraço,<br><strong>Equipe Raiz Conecta</strong></p>
    </div>
</div>`,

  'aprovacao': `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #15803d; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🌳 Raiz Conecta</h1>
    </div>
    <div style="padding: 30px; color: #374151; line-height: 1.6;">
        <h2 style="color: #16a34a; margin-top: 0;">Parabéns! Você agora é Nível Raiz 🎉</h2>
        <p>Sua documentação foi verificada e aprovada com sucesso! Seu acesso total foi liberado.</p>
        <p style="margin-bottom: 0; margin-top: 30px;">Boas vendas!<br><strong>Equipe Raiz Conecta</strong></p>
    </div>
</div>`,

  'rejeicao': `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #b91c1c; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ Atenção com seu Cadastro</h1>
    </div>
    <div style="padding: 30px; color: #374151; line-height: 1.6;">
        <h2 style="color: #b91c1c; margin-top: 0;">Houve um problema com sua documentação.</h2>
        <p>Acesse seu painel e envie uma nova foto seguindo as dicas: boa iluminação, sem flash, documento inteiro visível.</p>
        <p style="margin-bottom: 0; margin-top: 30px;">Atenciosamente,<br><strong>Equipe de Suporte Raiz Conecta</strong></p>
    </div>
</div>`,

  'sugestao': `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #d97706; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">💡 Sugestão Recebida!</h1>
    </div>
    <div style="padding: 30px; color: #374151; line-height: 1.6;">
        <h2 style="color: #b45309; margin-top: 0;">Nova sugestão de produto.</h2>
        <p>O produtor <strong>{{emailProdutor}}</strong> sugeriu: <strong>{{nomeProduto}}</strong></p>
        <p style="font-style: italic; color: #78350f;">"{{descricao}}"</p>
        <p>Acesse o painel de Administração para avaliar e cadastrar este produto.</p>
        <p style="margin-bottom: 0; margin-top: 30px;">Atenciosamente,<br><strong>Equipe Raiz Conecta</strong></p>
    </div>
</div>`,
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

// ── Swagger via CDN ───────────────────────────────────────────────────
const swaggerSpec = JSON.stringify({
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
          200: {
            description: 'Serviço operacional',
            content: { 'application/json': { example: { status: 'ok', service: 'microservico-email' } } },
          },
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
        summary: 'Envia e-mail de sugestão de novo produto ao admin',
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
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'E-mail de sugestão enviado' },
          500: { description: 'Erro ao enviar e-mail' },
        },
      },
    },
  },
});

app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

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
    const html = preencherTemplate(templates['boas-vindas'], { nome: nome || 'Usuário', tipo: tipoUsuario === 'produtor' ? 'Produtor Rural' : 'Mercado' });
    await transporter.sendMail({ from: '"Equipe Raiz Conecta" <nao-responda@raizconecta.com.br>', to: email, subject: '🌱 Bem-vindo ao Raiz Conecta!', html });
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
    await transporter.sendMail({ from: '"Equipe Raiz Conecta" <nao-responda@raizconecta.com.br>', to: email, subject: '🎉 Aprovado! Seu acesso foi liberado.', html });
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
    await transporter.sendMail({ from: '"Equipe Raiz Conecta" <nao-responda@raizconecta.com.br>', to: email, subject: '⚠️ Atualização sobre sua documentação', html });
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
    const html = preencherTemplate(templates['sugestao'], { emailProdutor, nomeProduto, descricao: descricao || 'Nenhuma descrição fornecida.' });
    await transporter.sendMail({ from: '"Equipe Raiz Conecta" <nao-responda@raizconecta.com.br>', to: emailAdmin, subject: `💡 Nova Sugestão: ${nomeProduto}`, html });
    console.log(`[E-mail] Sugestão "${nomeProduto}" → ${emailAdmin}`);
    res.status(200).json({ message: 'E-mail de sugestão enviado.' });
  } catch (error) {
    console.error('[E-mail] Erro sugestão:', error.message);
    res.status(500).json({ error: 'Erro ao enviar e-mail.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`📧 Microsserviço rodando na porta ${PORT}`));