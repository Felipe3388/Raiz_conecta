require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(cors());
app.use(express.json());

// ── Swagger ────────────────────────────────────────────────────────────
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Microsserviço de E-mail — Raiz Conecta',
            version: '1.0.0',
            description: 'API para envio de e-mails transacionais da plataforma Raiz Conecta.',
        },
        servers: [{ url: process.env.BASE_URL || 'http://localhost:3001' }],
        components: {
            schemas: {
                Sucesso: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'E-mail enviado com sucesso.' },
                    },
                },
                Erro: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Erro ao enviar e-mail.' },
                    },
                },
            },
        },
    },
    apis: [__filename], // lê os comentários JSDoc deste próprio arquivo
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Templates ──────────────────────────────────────────────────────────
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

// ── Health check ───────────────────────────────────────────────────────
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Verifica se o serviço está no ar
 *     tags: [Saúde]
 *     responses:
 *       200:
 *         description: Serviço operacional
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: microservico-email
 */
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'microservico-email' }));

// ── ROTA 1: Boas-vindas ────────────────────────────────────────────────
/**
 * @openapi
 * /api/email/boas-vindas:
 *   post:
 *     summary: Envia e-mail de boas-vindas ao novo usuário
 *     tags: [E-mails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@email.com
 *               nome:
 *                 type: string
 *                 example: João Silva
 *               tipoUsuario:
 *                 type: string
 *                 enum: [produtor, mercado]
 *                 example: produtor
 *     responses:
 *       200:
 *         description: E-mail enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucesso'
 *       500:
 *         description: Falha no envio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
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

// ── ROTA 2: Aprovação ──────────────────────────────────────────────────
/**
 * @openapi
 * /api/email/aprovacao:
 *   post:
 *     summary: Notifica o usuário que sua conta foi aprovada
 *     tags: [E-mails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@email.com
 *     responses:
 *       200:
 *         description: E-mail de aprovação enviado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucesso'
 *       500:
 *         description: Falha no envio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
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

// ── ROTA 3: Rejeição ───────────────────────────────────────────────────
/**
 * @openapi
 * /api/email/rejeicao:
 *   post:
 *     summary: Notifica o usuário que sua documentação foi rejeitada
 *     tags: [E-mails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@email.com
 *     responses:
 *       200:
 *         description: E-mail de rejeição enviado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucesso'
 *       500:
 *         description: Falha no envio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
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

// ── ROTA 4: Sugestão ──────────────────────────────────────────────────
/**
 * @openapi
 * /api/email/sugestao:
 *   post:
 *     summary: Envia sugestão de produto ao admin e confirmação ao produtor
 *     tags: [E-mails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emailProdutor, nomeProduto]
 *             properties:
 *               emailProdutor:
 *                 type: string
 *                 format: email
 *                 example: produtor@email.com
 *               nomeProduto:
 *                 type: string
 *                 example: Mel Silvestre 500g
 *               descricao:
 *                 type: string
 *                 example: Mel puro extraído de abelhas nativas.
 *               imagemUrl:
 *                 type: string
 *                 format: uri
 *                 example: https://exemplo.com/imagem.jpg
 *               precoSugerido:
 *                 type: number
 *                 format: float
 *                 example: 29.90
 *     responses:
 *       200:
 *         description: E-mails de sugestão enviados (admin + produtor)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucesso'
 *       500:
 *         description: Falha no envio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
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
            emailProdutor, nomeProduto,
            descricao: descricao || 'Nenhuma descrição fornecida.',
            precoFormatado, imagemHtml,
        });
        await transporter.sendMail({ from: FROM, to: emailAdmin, subject: `💡 Nova Sugestão de Produto: ${nomeProduto}`, html: htmlAdmin });
        console.log(`[E-mail] Sugestão (admin) "${nomeProduto}" → ${emailAdmin}`);

        const htmlProdutor = preencherTemplate(templates['confirmacao-sugestao'], {
            emailProdutor, nomeProduto,
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

// ── ROTA 5: Suspensão ─────────────────────────────────────────────────
/**
 * @openapi
 * /api/email/suspensao:
 *   post:
 *     summary: Notifica o usuário que sua conta foi suspensa
 *     tags: [E-mails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@email.com
 *               motivo:
 *                 type: string
 *                 example: Documentação inválida enviada repetidamente.
 *     responses:
 *       200:
 *         description: E-mail de suspensão enviado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucesso'
 *       500:
 *         description: Falha no envio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
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

// ── ROTA 6: Exclusão ──────────────────────────────────────────────────
/**
 * @openapi
 * /api/email/exclusao:
 *   post:
 *     summary: Notifica o usuário que sua conta foi removida
 *     tags: [E-mails]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: usuario@email.com
 *               motivo:
 *                 type: string
 *                 example: Violação dos termos de uso.
 *     responses:
 *       200:
 *         description: E-mail de exclusão enviado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sucesso'
 *       500:
 *         description: Falha no envio
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Erro'
 */
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
app.listen(PORT, () => {
    console.log(`📧 Microsserviço de e-mail rodando na porta ${PORT}`);
    console.log(`📖 Swagger UI disponível em http://localhost:${PORT}/api-docs`);
});