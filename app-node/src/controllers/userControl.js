const { prisma } = require('../lib/prisma');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcrypt');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// URL do microsserviço de e-mail — vem do .env
// Se não configurado, os e-mails são silenciosamente ignorados
const MICROSERVICE_URL = process.env.MICROSERVICE_URL || '';

async function dispararEmail(rota, payload) {
    if (!MICROSERVICE_URL) return;
    try {
        await fetch(`${MICROSERVICE_URL}/api/email/${rota}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        console.error(`[app-node] Microsserviço de e-mail indisponível (${rota}):`, err.message);
    }
}

// ── POST /api/perfil/completar ────────────────────────────────────────
exports.cadastrar = async (req, res) => {
    try {
        const {
            tipoUsuario, nome, email, senha,
            tipoDoc, documento, cep, rua, numero,
            bairro, cidade, estado,
        } = req.body;

        if (!nome || !email || !senha || !tipoUsuario || !documento) {
            return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
        }

        const usuarioExistente = await prisma.acesso.findFirst({ where: { login: email } });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
        }

        // Upload para Cloudinary
        let urlDocumento = '';
        if (req.file && req.file.size > 0) {
            const resultado = await new Promise((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        { folder: 'raiz-conecta/docs', resource_type: 'auto' },
                        (error, result) => (error || !result ? reject(error) : resolve(result))
                    )
                    .end(req.file.buffer);
            });
            urlDocumento = resultado.secure_url;
        }

        const hashSenha = await bcrypt.hash(senha, 10);

        const dadosComuns = {
            nomeFantasia: nome,
            email,
            status: 'EM_ANALISE',
            tipoDoc,
            documento,
            cep, rua, numero, bairro, cidade, estado,
            urlDocumento,
            Acessos: {
                create: {
                    login: email,
                    hash: hashSenha,
                    tipoUser: tipoUsuario === 'produtor' ? 'produtor' : 'mercado',
                    status: 'EM_ANALISE',
                },
            },
        };

        if (tipoUsuario === 'produtor') {
            await prisma.vendedor.create({ data: dadosComuns });
        } else {
            await prisma.cliente.create({ data: dadosComuns });
        }

        await dispararEmail('boas-vindas', { email, nome, tipoUsuario });

        return res.status(201).json({ message: 'Cadastro realizado com sucesso!' });
    } catch (error) {
        console.error('[app-node] Erro no cadastro:', error);
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};

// ── POST /api/auth/login ──────────────────────────────────────────────
exports.logar = async (req, res) => {
    try {
        const { email, senha } = req.body;

        const usuario = await prisma.acesso.findFirst({ where: { login: email } });
        if (!usuario) {
            return res.status(404).json({ error: 'E-mail não encontrado.' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.hash || '');
        if (!senhaValida) {
            return res.status(401).json({ error: 'Senha incorreta.' });
        }

        return res.status(200).json({
            message: 'Login realizado com sucesso!',
            tipoUser: usuario.tipoUser,
            status: usuario.status,
        });
    } catch (error) {
        console.error('[app-node] Erro no login:', error);
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};

// ── GET /api/admin/usuarios ───────────────────────────────────────────
exports.listar = async (req, res) => {
    try {
        const produtores = await prisma.vendedor.findMany({ orderBy: { nomeFantasia: 'asc' } });
        const mercados   = await prisma.cliente.findMany({ orderBy: { nomeFantasia: 'asc' } });

        return res.status(200).json([
            ...produtores.map((p) => ({ ...p, tipo: 'produtor' })),
            ...mercados.map((m)   => ({ ...m, tipo: 'mercado' })),
        ]);
    } catch (error) {
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};

// ── PUT /api/admin/usuarios ───────────────────────────────────────────
exports.atualizarStatus = async (req, res) => {
    try {
        const { email, tipo, novoStatus } = req.body;

        if (!email || !tipo || !novoStatus) {
            return res.status(400).json({ error: 'Dados inválidos.' });
        }

        if (tipo === 'produtor') {
            await prisma.vendedor.update({
                where: { email },
                data: novoStatus === 'REJEITADO'
                    ? { status: novoStatus, urlDocumento: null }
                    : { status: novoStatus },
            });
        } else if (tipo === 'mercado') {
            await prisma.cliente.update({ where: { email }, data: { status: novoStatus } });
        }

        await prisma.acesso.updateMany({ where: { login: email }, data: { status: novoStatus } });

        if (novoStatus === 'APROVADO')  await dispararEmail('aprovacao', { email });
        if (novoStatus === 'REJEITADO') await dispararEmail('rejeicao',  { email });

        return res.status(200).json({ message: `Status alterado para ${novoStatus}` });
    } catch (error) {
        console.error('[app-node] Erro ao atualizar status:', error);
        return res.status(500).json({ error: 'Erro ao atualizar.' });
    }
};

// ── DELETE /api/admin/usuarios?email=x&tipo=y ─────────────────────────
exports.deleteUser = async (req, res) => {
    try {
        const { email, tipo } = req.query;  // CORREÇÃO: Express usa req.query, não URL API

        if (!email || !tipo) {
            return res.status(400).json({ error: 'Dados inválidos.' });
        }

        if (tipo === 'produtor') {
            await prisma.vendedor.delete({ where: { email } });
        } else {
            await prisma.cliente.delete({ where: { email } });
        }

        await prisma.acesso.deleteMany({ where: { login: email } });

        return res.status(200).json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao excluir. Pode haver pedidos vinculados.' });
    }
};
