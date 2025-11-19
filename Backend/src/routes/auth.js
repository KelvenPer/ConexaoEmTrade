// backend/src/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

const router = express.Router();

// POST /api/auth/novoCadastro
router.post("/novoCadastro", async (req, res) => {
  try {
    const { name, email, login, password } = req.body;

    if (!name || !email || !password || !login) {
      return res
        .status(400)
        .json({ message: "Nome, login, e-mail e senha são obrigatórios." });
    }

    // verifica se já existe usuário com esse e-mail
    const existing = await prisma.TBLUSER.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({
        message: "Já existe um usuário cadastrado com esse e-mail.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.TBLUSER.create({
      data: {
        name,
        email,
        login,
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

    return res.status(201).json({
      message: "Usuário criado com sucesso.",
      user,
    });
  } catch (error) {
    console.error("Erro no novoCadastro:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { login, email, password, loginOrEmail } = req.body;

    // aceita login, email ou loginOrEmail
    const identifier = loginOrEmail || login || email;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Login/E-mail e senha são obrigatórios." });
    }

    const user = await prisma.TBLUSER.findFirst({
      where: {
        status: "ativo", // só usuários ativos podem logar
        OR: [{ login: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Usuário inativo ou credenciais inválidas.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      message: "Login realizado com sucesso.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
});

module.exports = router;
