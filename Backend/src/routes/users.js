// backend/src/routes/users.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

const router = express.Router();

/**
 * GET /api/usuarios
 * Lista todos os usuarios
 */
router.get("/", async (_req, res) => {
  try {
    const usuarios = await prisma.TBLUSER.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        login: true,
        email: true,
        role: true,
        status: true,
        photoUrl: true,
        accessChannel: true,
        supplierId: true,
        createdAt: true,
      },
    });

    res.json(usuarios);
  } catch (error) {
    console.error("Erro ao listar usuarios:", error);
    res.status(500).json({ message: "Erro ao listar usuarios." });
  }
});

/**
 * GET /api/usuarios/me
 * Dados do usuario logado
 */
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token ausente." });
    }
    const token = auth.replace("Bearer ", "");

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Token invalido." });
    }

    const usuario = await prisma.TBLUSER.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        login: true,
        email: true,
        role: true,
        status: true,
        photoUrl: true,
        accessChannel: true,
        supplierId: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    res.json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuario logado:", error);
    res.status(500).json({ message: "Erro ao buscar usuario logado." });
  }
});

/**
 * GET /api/usuarios/:id
 * Busca um usuario pelo ID
 */
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }

    const usuario = await prisma.TBLUSER.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        login: true,
        email: true,
        role: true,
        status: true,
        photoUrl: true,
        createdAt: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    res.json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuario:", error);
    res.status(500).json({ message: "Erro ao buscar usuario." });
  }
});

/**
 * POST /api/usuarios
 * Cria um novo usuario
 */
router.post("/", async (req, res) => {
  try {
    const {
      name,
      email,
      login,
      password,
      role,
      status,
      photoUrl,
      accessChannel,
      supplierId,
    } = req.body;

    if (!name || !email || !login || !password) {
      return res.status(400).json({
        message: "Nome, login, e-mail e senha sao obrigatorios.",
      });
    }

    const emailExistente = await prisma.TBLUSER.findUnique({
      where: { email },
    });
    if (emailExistente) {
      return res
        .status(409)
        .json({ message: "Ja existe um usuario com este e-mail." });
    }

    const loginExistente = await prisma.TBLUSER.findFirst({
      where: { login },
    });
    if (loginExistente) {
      return res
        .status(409)
        .json({ message: "Ja existe um usuario com este login." });
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
        status: status || "ativo",
        photoUrl: photoUrl || null,
        accessChannel: accessChannel === "varejo" ? "varejo" : "industria",
        supplierId: Number.isInteger(supplierId) ? supplierId : null,
      },
      select: {
        id: true,
        name: true,
        login: true,
        email: true,
        role: true,
        status: true,
        photoUrl: true,
        accessChannel: true,
        supplierId: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      message: "Usuario criado com sucesso.",
      usuario,
    });
  } catch (error) {
    console.error("Erro ao criar usuario:", error);
    res.status(500).json({ message: "Erro ao criar usuario." });
  }
});

/**
 * PUT /api/usuarios/:id
 * Atualiza dados do usuario
 */
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }
    const {
      name,
      email,
      login,
      password,
      role,
      status,
      photoUrl,
      accessChannel,
      supplierId,
    } = req.body;

    const usuarioAtual = await prisma.TBLUSER.findUnique({
      where: { id },
    });

    if (!usuarioAtual) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    if (email && email !== usuarioAtual.email) {
      const emailExistente = await prisma.TBLUSER.findUnique({
        where: { email },
      });
      if (emailExistente) {
        return res
          .status(409)
          .json({ message: "Ja existe um usuario com este e-mail." });
      }
    }

    if (login && login !== usuarioAtual.login) {
      const loginExistente = await prisma.TBLUSER.findFirst({
        where: {
          login,
          NOT: { id },
        },
      });
      if (loginExistente) {
        return res
          .status(409)
          .json({ message: "Ja existe um usuario com este login." });
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
        status: status ?? usuarioAtual.status,
        photoUrl: photoUrl ?? usuarioAtual.photoUrl,
        accessChannel:
          accessChannel ??
          usuarioAtual.accessChannel ??
          "industria",
        supplierId: Number.isInteger(supplierId)
          ? supplierId
          : usuarioAtual.supplierId,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        login: true,
        email: true,
        role: true,
        status: true,
        photoUrl: true,
        accessChannel: true,
        supplierId: true,
        createdAt: true,
      },
    });

    res.json({
      message: "Usuario atualizado com sucesso.",
      usuario: usuarioAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar usuario:", error);
    res.status(500).json({ message: "Erro ao atualizar usuario." });
  }
});

/**
 * DELETE /api/usuarios/:id
 * Remove um usuario
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }

    const usuario = await prisma.TBLUSER.findUnique({
      where: { id },
    });

    if (!usuario) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    await prisma.TBLUSER.delete({
      where: { id },
    });

    res.json({ message: "Usuario deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar usuario:", error);
    res.status(500).json({ message: "Erro ao deletar usuario." });
  }
});

module.exports = router;
