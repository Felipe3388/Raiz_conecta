require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(cors());
app.use(express.json());

// ── Templates inline (sem fs.readFileSync — compatível com Vercel) ────
const templates = {
  'boas-vindas': `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #15803d; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🌱 Raiz Conecta</h1>
    </div>
    <div style="padding: 30px; color: #374151; line-height: 1.6;">
        <h2 style="color: #15803d; margin-top: 0;">Olá, {{nome}}!</h2>
        <p>Que alegria ter você com a gente! Você acaba de dar o seu primeiro passo e agora faz parte do <strong>Nível Semente</strong>.</p>
        <p>Para começar a vender seus produtos e colher os frutos dessa parceria, precisamos apenas conhecer você melhor.</p>
        <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0;">
            <p style="margin: 0;"><strong>Próximo passo:</strong> Acesse o sistema e envie uma foto bem nítida do seu documento de identificação (RG ou CNH).</p>
        </div>
        <p>Estamos ansiosos para ver seus produtos em nossa vitrine oficial!</p>
        <p style="margin-bottom: 0; margin-top: 30px;">Um abraço,<br><strong>Equipe Raiz Conecta</strong></p>
    </div>
</div>`,

  'aprovacao': `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #15803d; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🌳 Raiz Conecta</h1>
    </div>
    <div style="padding: 30px; color: #374151; line-height: 1.6;">
        <h2 style="color: #16a34a; margin-top: 0;">Parabéns! Você agora é Nível Raiz 🎉</h2>
        <p>Temos o prazer de informar que sua documentação foi verificada e aprovada com sucesso!</p>
        <ul style="background-color: #f0fdf4; padding: 20px 20px 20px 40px; border-radius: 8px; border: 1px solid #bbf7d0; color: #166534;">
            <li style="margin-bottom: 10px;"><strong>📦 Vitrine Virtual:</strong> Cadastre seus produtos com fotos, descrições e preços.</li>
            <li style="margin-bottom: 10px;"><strong>🏪 Gestão de Estoque:</strong> Controle o que você tem disponível para venda em tempo real.</li>
            <li style="margin-bottom: 10px;"><strong>💬 Contato Direto:</strong> Receba propostas e feche negócios com os compradores.</li>
            <li><strong>📊 Histórico:</strong> Acompanhe seus resultados para planejar a próxima safra.</li>
        </ul>
        <p>Acesse seu painel agora mesmo e comece a cadastrar sua produção.</p>
        <p style="margin-bottom: 0; margin-top: 30px;">Boas vendas!<br><strong>Equipe Raiz Conecta</strong></p>
    </div>
</div>`,

  'rejeicao': `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #b91c1c; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⚠️ Atenção com seu Cadastro</h1>
    </div>
    <div style="padding: 30px; color: #374151; line-height: 1.6;">
        <h2 style="color: #b91c1c; margin-top: 0;">Houve um problema com sua documentação.</h2>
        <p>Infelizmente, nossa equipe não conseguiu validar a foto do documento enviada. Mas não se preocupe, isso é fácil de resolver!</p>
        <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #991b1b; margin-top: 0; font-size: 16px;">🔍 Possíveis Erros e Soluções:</h3>
            <ul style="padding-left: 20px; margin-bottom: 0; color: #7f1d1d; font-size: 14px; line-height: 1.8;">
                <li><strong>Imagem embaçada:</strong> Vá para um local bem iluminado e segure o celular firme.</li>
                <li><strong>Reflexo do Flash:</strong> Evite usar flash em documentos plastificados.</li>
                <li><strong>Documento cortado:</strong> As quatro bordas precisam aparecer inteiras na foto.</li>
                <li><strong>Documento inválido:</strong> Envie apenas RG ou CNH originais (não aceitamos cópias).</li>
            </ul>
        </div>
        <p>Acesse seu painel e envie uma nova foto seguindo as dicas acima.</p>
        <p style="margin-bottom: 0; margin-top: 30px;">Atenciosamente,<br><strong>Equipe de Suporte Raiz Conecta</strong></p>
    </div>
</div>`,

  'sugestao': `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #d97706; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">💡 Sugestão Recebida!</h1>
    </div>
    <div style="padding: 30px; color: #374151; line-height: 1.6;">
        <h2 style="color: #b45309; margin-top: 0;">Olá! Recebemos uma nova sugestão de produto.</h2>
        <p>O produtor <strong>{{emailProdutor}}</strong> sugeriu a adição de um novo produto ao catálogo.</p>
        <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
            <p style="font-size: 20px; margin: 0; color: #1f2937;"><strong>{{nomeProduto}}</strong></p>
            <p style="color: #78350f; font-size: 15px; margin-top: 10px; font-style: italic;">"{{descricao}}"</p>
        </div>
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

// ── Swagger ───────────────────────────────────────────────────────────
const swaggerDocument = {
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
            content: {
              'application/json': {
                example: { status: 'ok', service: 'microservico-email' },
              },
            },
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
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

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