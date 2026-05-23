const { prisma } = require('../lib/prisma');

const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcrypt');
const { json } = require('express');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

exports.cadastrar = async (req, res) => {
    try {
        const formData = await req.body;
        console.log("Dados recebidos no backend:", await req);

        const tipoUsuario = formData.tipoUsuario;
        const nome = formData.nome;
        const email = formData.email;
        const senha = formData.senha;
        const tipoDoc = formData.tipoDoc;
        const documento = formData.documento;
        const cep = formData.cep;
        const rua = formData.rua;
        const numero = formData.numero;
        const bairro = formData.bairro;
        const cidade = formData.cidade;
        const estado = formData.estado;
        const tipoComprovante = formData.tipoComprovante;

        const file = req.file;

        if (!nome || !email || !senha || !tipoUsuario || !documento) {
            return res.json(
                { error: "Preencha todos os campos obrigatórios." },
                { status: 400 }
            );
        }

        const usuarioExistente = await prisma.acesso.findFirst({
            where: { login: email },
        });

        if (usuarioExistente) {
            return res.json(
                { error: "Este e-mail já está cadastrado." },
                { status: 400 }
            );
        }


        // Upload da imagem para o Cloudinary
        let urlDocumento = "";

        // No Multer, o arquivo vem em 'req.file' (ou a variável que você mapeou)


        if (file && file.size > 0) {
            // CORREÇÃO: O Multer já entrega o buffer pronto em file.buffer
            const buffer = file.buffer;

            const uploadResult = await new Promise((resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        { folder: "raiz-conecta/docs", resource_type: "auto" },
                        (error, result) => {
                            if (error || !result) return reject(error);
                            resolve(result);
                        }
                    )
                    .end(buffer); // Envia o buffer direto para o Cloudinary
            });

            urlDocumento = uploadResult.secure_url;
        }

        const hashSenha = await bcrypt.hash(senha, 10);

        const dadosComuns = {
            nomeFantasia: nome,
            email: email,
            status: "EM_ANALISE",
            documento: documento,
            cep: cep,
            rua: rua,
            numero: numero,
            bairro: bairro,
            cidade: cidade,
            estado: estado,
            urlDocumento: urlDocumento,
            Acessos: {
                create: {
                    login: email,
                    hash: hashSenha,
                    tipoUser: tipoUsuario === "produtor" ? "produtor" : "mercado",
                    status: "EM_ANALISE",
                },
            },
        };

        if (tipoUsuario === "produtor") {
            await prisma.vendedor.create({ data: dadosComuns });
        } else {
            await prisma.cliente.create({ data: dadosComuns });
        }

        try {
            await fetch("http://localhost:3001/api/email/boas-vindas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, nome, tipoUsuario }),
            });
        } catch (err) {
            console.error("Falha ao comunicar com o microsserviço de e-mail:", err);
        }

        return res.json(
            { message: "Cadastro realizado com sucesso!" },
            { status: 201 }
        );


    }
    catch (error) {
        console.error('Error processing form data:', error);
        return res.status(500).json({ error: 'Error processing form data' });
    }
};

exports.logar = async (req, res) => {

    try {
        console.log(await req);
        const { email, senha } = await req.body;

        // Procura o usuário no banco pelo e-mail (tabela de Acessos)
        const usuario = await prisma.acesso.findFirst({
            where: { login: email }
        });

        if (!usuario) {
            return res.json({ error: "E-mail não encontrado." }, { status: 404 });
        }

        // Verifica se a senha digitada bate com a criptografada no banco
        const senhaValida = await bcrypt.compare(senha, usuario.hash || "");

        if (!senhaValida) {
            return res.json({ error: "Senha incorreta." }, { status: 401 });
        }

        // Responde com sucesso e o tipo de usuário
        return res.json({
            message: "Login realizado com sucesso!",
            tipoUser: usuario.tipoUser
        }, { status: 200 });

    } catch (error) {
        console.error("Erro na API de Login:", error);
        return res.status(500).json({ error: "Erro interno no servidor." });
    }

};

exports.listar = async (req, res) => {

    try {
        const produtores = await prisma.vendedor.findMany({
            orderBy: { nomeFantasia: "asc" },
        });
        const mercados = await prisma.cliente.findMany({
            orderBy: { nomeFantasia: "asc" },
        });

        const todosUsuarios = [
            ...produtores.map((p) => ({ ...p, tipo: "produtor" })),
            ...mercados.map((m) => ({ ...m, tipo: "mercado" })),
        ];
        //sem usar o nextresponse
        //const jsonUsers = JSON.stringify(todosUsuarios);

        return res.json(todosUsuarios);
    } catch (error) {
        return res.status(500).json({ error: "Erro interno no servidor." });
    }


};

exports.atualizarStatus = async (req, res) => {
    try {
        const { email, tipo, novoStatus } = await req.body;

        if (!email || !tipo || !novoStatus) {
            return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
        }

        // Atualiza a Tabela Principal (Produtor ou Mercado)
        if (tipo === "produtor") {
            await prisma.vendedor.update({
                where: { email },
                data:
                    novoStatus === "REJEITADO"
                        ? { status: novoStatus, urlDocumento: null }
                        : { status: novoStatus },
            });
        } else if (tipo === "mercado") {
            await prisma.cliente.update({
                where: { email },
                data: { status: novoStatus },
            });
        }

        // Atualiza a Tabela de ACESSO (Para o login liberar ou bloquear)
        await prisma.acesso.updateMany({
            where: { login: email },
            data: { status: novoStatus },
        });

        // Integração com o microsserviço de e-mail (Apenas para Aprovação/Rejeição inicial)
        if (novoStatus === "APROVADO") {
            try {
                await fetch("http://localhost:3001/api/email/aprovacao", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, status: "aprovado" }),
                });
            } catch (e) {
                console.log("Aviso: Microsserviço de e-mail offline.");
            }
        } else if (novoStatus === "REJEITADO") {
            try {
                await fetch("http://localhost:3001/api/email/rejeicao", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, status: "rejeitado" }),
                });
            } catch (e) {
                console.log("Aviso: Microsserviço de e-mail offline.");
            }
        }

        return res.json(
            { message: `Status alterado para ${novoStatus}` },
            { status: 200 },
        );
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        return res.json({ error: "Erro ao atualizar" }, { status: 500 });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");
        const tipo = searchParams.get("tipo");

        if (!email || !tipo)
            return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

        if (tipo === "produtor") {
            await prisma.vendedor.delete({ where: { email } });
        } else {
            await prisma.cliente.delete({ where: { email } });
        }

        // Apaga também o login dele
        await prisma.acesso.deleteMany({ where: { login: email } });

        return res.json(
            { message: "Usuário excluído com sucesso" },
            { status: 200 },
        );
    } catch (error) {
        return res.json(
            { error: "Erro ao excluir. Pode haver pedidos vinculados." },
            { status: 500 },
        );
    }

};