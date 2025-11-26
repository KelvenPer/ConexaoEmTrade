// backend/src/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../prisma");

const router = express.Router();

// POST /api/auth/novoCadastro
router.post("/novoCadastro", async (req, res) => {
  try {
    const { name, email, login, password, accessChannel, supplierId } = req.body;

    if (!name || !email || !password || !login) {
      return res
        .status(400)
        .json({ message: "Nome, login, e-mail e senha sao obrigatorios." });
    }

    // verifica se ja existe usuario com esse e-mail
    const existing = await prisma.TBLUSER.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(409).json({
        message: "Ja existe um usuario cadastrado com esse e-mail.",
      });
    }

    const channel = accessChannel === "varejo" ? "varejo" : "industria";
    const supplierRelation =
      supplierId && Number.isInteger(supplierId) ? { supplierId } : {};

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.TBLUSER.create({
      data: {
        name,
        email,
        login,
        passwordHash,
        accessChannel: channel,
        ...supplierRelation,
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

    return res.status(201).json({
      message: "Usuario criado com sucesso.",
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
    const { login, email, password, loginOrEmail, identifier, accessChannel } =
      req.body;

    // aceita login, email ou loginOrEmail/identifier (formato mais claro para o front)
    const credential = (identifier || loginOrEmail || login || email || "").trim();
    const channel = accessChannel === "varejo" ? "varejo" : "industria";

    if (!credential || !password) {
      return res
        .status(400)
        .json({ message: "Login/Email e senha sao obrigatorios." });
    }

    const user = await prisma.TBLUSER.findFirst({
      where: {
        status: "ativo", // so usuarios ativos podem logar
        OR: [{ login: credential }, { email: credential }],
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
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Usuario inativo ou credenciais invalidas.",
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ message: "Credenciais invalidas." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Credenciais invalidas." });
    }

    const effectiveChannel = user.accessChannel || channel;

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        accessChannel: effectiveChannel,
        supplierId: user.supplierId ?? null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      message: `Login realizado com sucesso (${effectiveChannel}).`,
      token,
      user: {
        ...user,
        photoUrl: user.photoUrl || null,
        passwordHash: undefined,
        accessChannel: effectiveChannel,
      },
      context: {
        accessChannel: effectiveChannel,
        identifier: credential,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
});

module.exports = router;
