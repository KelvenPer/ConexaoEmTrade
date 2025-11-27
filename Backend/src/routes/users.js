// backend/src/routes/users.js
const express = require("express");
const bcrypt = require("bcryptjs");
const { AccessChannel, UserRole } = require("@prisma/client");
const prisma = require("../prisma");
const { resolveTenantContext } = require("../auth/tenantContext");
const { normalizeChannel, buildMultiTenantWhere } = require("../auth/multiTenantFilter");
const { getUserFromRequest } = require("../auth/token");

const router = express.Router();

function requireAuth(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ message: "Token ausente ou invalido." });
    return null;
  }
  return user;
}

function assertCanManageUsers(currentUser) {
  if (
    currentUser.role !== UserRole.PLATFORM_ADMIN &&
    currentUser.role !== UserRole.TENANT_ADMIN
  ) {
    throw new Error("Apenas PLATFORM_ADMIN ou TENANT_ADMIN podem gerenciar usuarios.");
  }
}

/**
 * GET /api/usuarios
 * Lista todos os usuarios
 */
router.get("/", async (_req, res) => {
  try {
    const user = requireAuth(_req, res);
    if (!user) return;

    const where = buildMultiTenantWhere(user, {});

    const usuarios = await prisma.TBLUSER.findMany({
      where,
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
        retailId: true,
        tenantId: true,
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
    const decoded = requireAuth(req, res);
    if (!decoded) return;

    const userId = decoded.sub || decoded.id;
    const usuario = await prisma.TBLUSER.findUnique({
      where: { id: userId },
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
    const currentUser = requireAuth(req, res);
    if (!currentUser) return;

    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }

    const usuario = await prisma.TBLUSER.findFirst({
      where: buildMultiTenantWhere(currentUser, { id }),
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
    const currentUser = requireAuth(req, res);
    if (!currentUser) return;
    assertCanManageUsers(currentUser);

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
      retailId,
      tenantId,
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

    // Regras de tenant: PLATFORM_ADMIN cria qualquer tenant; TENANT_ADMIN apenas no seu tenant/canal.
    const targetTenant = tenantId || currentUser.tenantId;
    const channel = normalizeChannel(
      accessChannel || (retailId ? AccessChannel.varejo : AccessChannel.industria)
    );

    if (currentUser.role === UserRole.TENANT_ADMIN) {
      if (Number(targetTenant) !== Number(currentUser.tenantId)) {
        return res.status(403).json({ message: "Tenant invalido para este admin." });
      }
      if (channel === AccessChannel.industria && currentUser.supplierId) {
        if (supplierId && Number(supplierId) !== Number(currentUser.supplierId)) {
          return res.status(403).json({ message: "supplierId diferente do admin atual." });
        }
      }
      if (channel === AccessChannel.varejo && currentUser.retailId) {
        if (retailId && Number(retailId) !== Number(currentUser.retailId)) {
          return res.status(403).json({ message: "retailId diferente do admin atual." });
        }
      }
    }

    let tenantContext;
    try {
      tenantContext = await resolveTenantContext({
        tenantId: targetTenant,
        supplierId,
        retailId,
      });
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const usuario = await prisma.TBLUSER.create({
      data: {
        name,
        email,
        login,
        passwordHash,
        role: role || "USER",
        status: status || "ativo",
        photoUrl: photoUrl || null,
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
        supplierId: true,
        retailId: true,
        tenantId: true,
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
    const currentUser = requireAuth(req, res);
    if (!currentUser) return;
    assertCanManageUsers(currentUser);

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
      retailId,
      tenantId,
    } = req.body;

    const usuarioAtual = await prisma.TBLUSER.findFirst({
      where: buildMultiTenantWhere(currentUser, { id }),
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

    const targetTenant = tenantId ?? usuarioAtual.tenantId;
    const channel = normalizeChannel(
      accessChannel ?? usuarioAtual.accessChannel ?? AccessChannel.industria
    );

    if (currentUser.role === UserRole.TENANT_ADMIN) {
      if (Number(targetTenant) !== Number(currentUser.tenantId)) {
        return res.status(403).json({ message: "Tenant invalido para este admin." });
      }
      if (channel === AccessChannel.industria && currentUser.supplierId) {
        if (supplierId && Number(supplierId) !== Number(currentUser.supplierId)) {
          return res.status(403).json({ message: "supplierId diferente do admin atual." });
        }
      }
      if (channel === AccessChannel.varejo && currentUser.retailId) {
        if (retailId && Number(retailId) !== Number(currentUser.retailId)) {
          return res.status(403).json({ message: "retailId diferente do admin atual." });
        }
      }
    }

    let tenantContext;
    try {
      tenantContext = await resolveTenantContext({
        tenantId: targetTenant,
        supplierId: supplierId ?? usuarioAtual.supplierId,
        retailId: retailId ?? usuarioAtual.retailId,
      });
    } catch (e) {
      return res.status(400).json({ message: e.message });
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
        accessChannel: channel,
        tenantId: tenantContext.tenantId,
        supplierId:
          supplierId !== undefined ? tenantContext.supplierId : usuarioAtual.supplierId,
        retailId:
          retailId !== undefined ? tenantContext.retailId : usuarioAtual.retailId,
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
        retailId: true,
        tenantId: true,
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
    const currentUser = requireAuth(req, res);
    if (!currentUser) return;
    assertCanManageUsers(currentUser);

    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }

    const usuario = await prisma.TBLUSER.findFirst({
      where: buildMultiTenantWhere(currentUser, { id }),
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
