// backend/src/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { AccessChannel, UserRole } = require("@prisma/client");
const prisma = require("../prisma");
const { buildJwtPayload } = require("../auth/jwtPayload");
const { normalizeChannel } = require("../auth/multiTenantFilter");
const { resolveTenantContext } = require("../auth/tenantContext");
const { getUserFromRequest } = require("../auth/token");

const router = express.Router();

function formatUserResponse(user, token, tenant, supplier, retail, channel) {
  return {
    access_token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessChannel: channel || user.accessChannel,
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            type: tenant.type,
          }
        : null,
      supplier: supplier
        ? {
            id: supplier.id,
            name: supplier.name,
          }
        : null,
      retail: retail
        ? {
            id: retail.id,
            name: retail.name,
          }
        : null,
    },
  };
}

// POST /api/auth/novoCadastro
router.post("/novoCadastro", async (req, res) => {
  try {
    const {
      name,
      email,
      login,
      password,
      accessChannel,
      supplierId,
      retailId,
      tenantId,
    } = req.body;

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

    let tenantContext;
    try {
      tenantContext = await resolveTenantContext({
        tenantId,
        supplierId,
        retailId,
      });
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    const channel = normalizeChannel(
      accessChannel || (tenantContext.retailId ? AccessChannel.varejo : AccessChannel.industria)
    );

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.TBLUSER.create({
      data: {
        name,
        email,
        login,
        passwordHash,
        accessChannel: channel,
        tenantId: tenantContext.tenantId,
        supplierId: tenantContext.supplierId || null,
        retailId: tenantContext.retailId || null,
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
        tenantId: true,
        supplierId: true,
        retailId: true,
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
    const { login, email, password, loginOrEmail, identifier, accessChannel } = req.body;

    // aceita login, email ou loginOrEmail/identifier (formato mais claro para o front)
    const credential = (identifier || loginOrEmail || login || email || "").trim();
    const channel = normalizeChannel(accessChannel);

    if (!credential || !password) {
      return res
        .status(400)
        .json({ message: "Login/Email e senha sao obrigatorios." });
    }

    const user = await prisma.TBLUSER.findFirst({
      where: {
        status: "ativo", // so usuarios ativos podem logar
        OR: [
          { login: { equals: credential, mode: "insensitive" } },
          { email: { equals: credential, mode: "insensitive" } },
        ],
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
        retailId: true,
        tenantId: true,
        passwordHash: true,
        tenant: true,
        supplier: true,
        retail: true,
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

    const effectiveChannel = normalizeChannel(user.accessChannel || channel);

    const payload = buildJwtPayload({
      ...user,
      accessChannel: effectiveChannel,
    });

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });

    const response = formatUserResponse(
      { ...user, accessChannel: effectiveChannel },
      token,
      user.tenant,
      user.supplier,
      user.retail,
      effectiveChannel
    );

    return res.json(response);
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
});

// POST /api/auth/switch-tenant (apenas PLATFORM_ADMIN)
router.post("/switch-tenant", async (req, res) => {
  try {
    const authUser = getUserFromRequest(req);
    if (!authUser) {
      return res.status(401).json({ message: "Token ausente ou invalido." });
    }

    if (authUser.role !== UserRole.PLATFORM_ADMIN) {
      return res.status(403).json({ message: "Apenas admin da plataforma pode trocar de tenant." });
    }

    const { tenantId, supplierId, retailId } = req.body || {};
    if (!tenantId) {
      return res.status(400).json({ message: "tenantId obrigatorio." });
    }

    const tenant = await prisma.TBLTENANT.findUnique({ where: { id: Number(tenantId) } });
    if (!tenant) {
      return res.status(404).json({ message: "Tenant nao encontrado." });
    }

    let supplier = null;
    let retail = null;

    if (supplierId) {
      supplier = await prisma.TBLFORN.findUnique({ where: { id: Number(supplierId) } });
      if (!supplier || supplier.tenantId !== tenant.id) {
        return res.status(400).json({ message: "Fornecedor nao encontrado ou nao pertence ao tenant." });
      }
    }

    if (retailId) {
      retail = await prisma.TBLRETAIL.findUnique({ where: { id: Number(retailId) } });
      if (!retail || retail.tenantId !== tenant.id) {
        return res.status(400).json({ message: "Varejo nao encontrado ou nao pertence ao tenant." });
      }
    }

    let derivedChannel = AccessChannel.interno;
    if (supplier) derivedChannel = AccessChannel.industria;
    else if (retail) derivedChannel = AccessChannel.varejo;

    const userRecord = await prisma.TBLUSER.findUnique({
      where: { id: authUser.sub || authUser.id },
    });

    if (!userRecord) {
      return res.status(404).json({ message: "Usuario nao encontrado." });
    }

    const payload = buildJwtPayload({
      ...authUser,
      tenantId: tenant.id,
      supplierId: supplier ? supplier.id : null,
      retailId: retail ? retail.id : null,
      accessChannel: derivedChannel,
    });

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });

    const response = formatUserResponse(
      {
        ...userRecord,
        role: userRecord.role,
        accessChannel: derivedChannel,
      },
      token,
      tenant,
      supplier,
      retail,
      derivedChannel
    );

    return res.json(response);
  } catch (error) {
    console.error("Erro no switch-tenant:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
});

module.exports = router;
