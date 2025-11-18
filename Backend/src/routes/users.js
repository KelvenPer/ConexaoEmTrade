// backend/src/routes/users.js
const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../prisma");

const router = express.Router();

/**
 * GET /api/usuarios
 * Lista todos os usuários
 */
router.get("/", async (req, res) => {
  try {
    const usuarios = await prisma.TBLUSER.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        login: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(usuarios);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    res.status(500).json({ message: "Erro ao listar usuários." });
  }
});

/**
 * GET /api/usuarios/:id
 * Busca um usuário pelo ID
 */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const usuario = await prisma.TBLUSER.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        login: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    res.json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ message: "Erro ao buscar usuário." });
  }
});

/**
 * POST /api/usuarios
 * Cria um novo usuário (CRUD administrativo)
 * Obs: /api/auth/novoCadastro continua existindo para fluxo de cadastro normal.
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, login, password, role } = req.body;

    if (!name || !email || !login || !password) {
      return res.status(400).json({
        message: "Nome, login, e-mail e senha são obrigatórios.",
      });
    }

    // Verifica e-mail duplicado
    const emailExistente = await prisma.TBLUSER.findUnique({
      where: { email },
    });
    if (emailExistente) {
      return res
        .status(409)
        .json({ message: "Já existe um usuário com este e-mail." });
    }

    // Verifica login duplicado
    const loginExistente = await prisma.TBLUSER.findFirst({
      where: { login },
    });
    if (loginExistente) {
      return res
        .status(409)
        .json({ message: "Já existe um usuário com este login." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const usuario = await prisma.TBLUSER.create({
      data: {
        name,
        email,
        login,
        passwordHash,
        role: role || "user",
      },
      select: {
        id: true,
        name: true,
        login: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "Usuário criado com sucesso.",
      usuario,
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ message: "Erro ao criar usuário." });
  }
});

/**
 * PUT /api/usuarios/:id
 * Atualiza dados do usuário
 * Se for passado password, atualiza também a senha (re-hash).
 */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, login, password, role } = req.body;

    const usuarioAtual = await prisma.TBLUSER.findUnique({
      where: { id },
    });

    if (!usuarioAtual) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Se email for enviado e mudar, checa se já existe outro com esse e-mail
    if (email && email !== usuarioAtual.email) {
      const emailExistente = await prisma.TBLUSER.findUnique({
        where: { email },
      });
      if (emailExistente) {
        return res
          .status(409)
          .json({ message: "Já existe um usuário com este e-mail." });
      }
    }

    // Se login for enviado e mudar, checa se já existe outro com esse login
    if (login && login !== usuarioAtual.login) {
      const loginExistente = await prisma.TBLUSER.findFirst({
        where: {
          login,
          NOT: { id }, // ignora o próprio usuário
        },
      });
      if (loginExistente) {
        return res
          .status(409)
          .json({ message: "Já existe um usuário com este login." });
      }
    }

    let passwordHash = usuarioAtual.passwordHash;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      passwordHash = await bcrypt.hash(password, salt);
    }

    const usuarioAtualizado = await prisma.TBLUSER.update({
      where: { id },
      data: {
        name: name ?? usuarioAtual.name,
        email: email ?? usuarioAtual.email,
        login: login ?? usuarioAtual.login,
        role: role ?? usuarioAtual.role,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        login: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({
      message: "Usuário atualizado com sucesso.",
      usuario: usuarioAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ message: "Erro ao atualizar usuário." });
  }
});

/**
 * DELETE /api/usuarios/:id
 * Remove um usuário
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const usuario = await prisma.TBLUSER.findUnique({
      where: { id },
    });

    if (!usuario) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    await prisma.TBLUSER.delete({
      where: { id },
    });

    res.json({ message: "Usuário deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ message: "Erro ao deletar usuário." });
  }
});

module.exports = router;
