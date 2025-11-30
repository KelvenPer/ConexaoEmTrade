// backend/src/routes/produtos.js
const express = require("express");
const { UserRole } = require("@prisma/client");
const { Client: PgClient } = require("pg");
const prisma = require("../prisma");
const { requireAuthUser } = require("../auth/requireAuth");
const { resolveScope, applyScopeToWhere } = require("../auth/multiTenantFilter");

const router = express.Router();

const normalizeKey = (str) =>
  String(str || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const ALIASES = {
  code: ["code", "codigo"],
  description: ["description", "descricao"],
  complement: ["complement", "complemento"],
  brand: ["brand", "marca"],
  category: ["category", "categoria"],
  supplierId: ["supplierid", "idfornecedor"],
  supplierName: ["suppliername", "supplier", "fornecedor", "nomefornecedor"],
  status: ["status"],
};

async function requireAuth(req, res) {
  return requireAuthUser(req, res);
}

async function scopedWhere(user, baseWhere = {}) {
  const scope = await resolveScope(user);
  return applyScopeToWhere(baseWhere, scope, {
    tenantField: "tenantId",
    supplierField: "supplierId",
    retailField: null,
  });
}

function assertCanWrite(user) {
  if (
    user.role !== UserRole.PLATFORM_ADMIN &&
    user.role !== UserRole.TENANT_ADMIN &&
    user.role !== UserRole.SUPER_ADMIN
  ) {
    throw new Error("Apenas admin pode gerenciar produtos.");
  }
}

function normalizeProductPayload(body) {
  return {
    code: (body.code || "").trim(),
    description: (body.description || "").trim(),
    complement: body.complement?.trim() || null,
    brand: body.brand?.trim() || null,
    category: body.category?.trim() || null,
    status: body.status || "ativo",
    supplierId:
      body.supplierId !== undefined && body.supplierId !== null && body.supplierId !== ""
        ? Number(body.supplierId)
        : null,
  };
}

async function upsertProduct({ tenantId, supplierId, code, description, complement, brand, category, status }) {
  const existing = await prisma.TBLPROD.findFirst({
    where: { tenantId, code },
  });

  if (existing) {
    return prisma.TBLPROD.update({
      where: { id: existing.id },
      data: {
        supplierId,
        description: description || existing.description,
        complement: complement !== undefined ? complement : existing.complement,
        brand: brand !== undefined ? brand : existing.brand,
        category: category !== undefined ? category : existing.category,
        status: status || existing.status,
      },
    });
  }

  return prisma.TBLPROD.create({
    data: {
      tenantId,
      supplierId,
      code,
      description,
      complement: complement || null,
      brand: brand || null,
      category: category || null,
      status: status || "ativo",
    },
  });
}

async function validateSupplierAccess(user, supplierId) {
  const supplier = await prisma.TBLFORN.findUnique({ where: { id: supplierId } });
  if (!supplier) {
    throw new Error("Fornecedor nao encontrado.");
  }
  const whereScope = await scopedWhere(user, {
    tenantId: supplier.tenantId,
    supplierId: supplier.id,
  });
  if (whereScope.id === -1) {
    throw new Error("Acesso negado para este fornecedor.");
  }
  return supplier;
}

async function findSupplierByName(name) {
  if (!name) return null;
  const normalized = String(name).trim();
  if (!normalized) return null;
  const supplier = await prisma.TBLFORN.findFirst({
    where: {
      name: { equals: normalized, mode: "insensitive" },
    },
  });
  return supplier;
}

function indexFor(headerNorm, aliases) {
  for (const alias of aliases) {
    const idx = headerNorm.indexOf(normalizeKey(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

function rowMapFromObject(row) {
  const map = new Map();
  Object.keys(row || {}).forEach((key) => {
    map.set(normalizeKey(key), row[key]);
  });
  return map;
}

function getFromMap(map, aliases) {
  for (const alias of aliases) {
    const val = map.get(normalizeKey(alias));
    if (val !== undefined) return val;
  }
  return undefined;
}

function detectDelimiter(line) {
  const commas = (line.match(/,/g) || []).length;
  const semis = (line.match(/;/g) || []).length;
  if (semis > commas) return ";";
  return ",";
}

function splitLine(line, delimiter) {
  return line.split(delimiter).map((c) => c.trim());
}

// GET /api/produtos
router.get("/", async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const { supplierId, status, brand, category, search } = req.query;
    const baseWhere = {};

    if (supplierId) {
      const sid = Number(supplierId);
      if (!Number.isNaN(sid)) baseWhere.supplierId = sid;
    }
    if (status) baseWhere.status = status;
    if (brand) baseWhere.brand = brand;
    if (category) baseWhere.category = category;
    if (search) {
      baseWhere.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const where = await scopedWhere(user, baseWhere);
    if (where.id === -1) {
      return res.status(403).json({ message: "Acesso negado." });
    }

    const produtos = await prisma.TBLPROD.findMany({
      where,
      orderBy: [{ brand: "asc" }, { category: "asc" }, { description: "asc" }],
      include: { supplier: true },
    });

    res.json(produtos);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    res.status(500).json({ message: "Erro ao listar produtos." });
  }
});

// GET /api/produtos/:id
router.get("/:id", async (req, res) => {
  try {
    const user = await requireAuth(req, res);
    if (!user) return;

    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }

    const where = await scopedWhere(user, { id });
    if (where.id === -1) {
      return res.status(403).json({ message: "Acesso negado." });
    }

    const produto = await prisma.TBLPROD.findFirst({
      where,
      include: { supplier: true },
    });

    if (!produto) {
      return res.status(404).json({ message: "Produto nao encontrado." });
    }

    res.json(produto);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    res.status(500).json({ message: "Erro ao buscar produto." });
  }
});

// POST /api/produtos
router.post("/", async (req, res) => {
  try {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;
    assertCanWrite(currentUser);

    const payload = normalizeProductPayload(req.body || {});

    if (!payload.code || !payload.description || !payload.supplierId) {
      return res
        .status(400)
        .json({ message: "Codigo, descricao e fornecedor sao obrigatorios." });
    }

    const supplier = await prisma.TBLFORN.findUnique({
      where: { id: payload.supplierId },
    });

    if (!supplier) {
      return res.status(400).json({ message: "Fornecedor nao encontrado." });
    }

    const whereScope = await scopedWhere(currentUser, {
      tenantId: supplier.tenantId,
      supplierId: supplier.id,
    });
    if (whereScope.id === -1) {
      return res.status(403).json({ message: "Acesso negado para este fornecedor." });
    }

    const existsCode = await prisma.TBLPROD.findFirst({
      where: {
        tenantId: supplier.tenantId,
        code: payload.code,
      },
    });

    if (existsCode) {
      return res.status(409).json({ message: "Ja existe um produto com este codigo neste tenant." });
    }

    const produto = await prisma.TBLPROD.create({
      data: {
        tenantId: supplier.tenantId,
        supplierId: supplier.id,
        code: payload.code,
        description: payload.description,
        complement: payload.complement,
        brand: payload.brand,
        category: payload.category,
        status: payload.status || "ativo",
      },
      include: { supplier: true },
    });

    res.status(201).json({
      message: "Produto criado com sucesso.",
      produto,
    });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    res.status(500).json({ message: "Erro ao criar produto." });
  }
});

// PUT /api/produtos/:id
router.put("/:id", async (req, res) => {
  try {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;
    assertCanWrite(currentUser);

    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }

    const produtoAtual = await prisma.TBLPROD.findUnique({
      where: { id },
    });

    if (!produtoAtual) {
      return res.status(404).json({ message: "Produto nao encontrado." });
    }

    const whereScope = await scopedWhere(currentUser, { id });
    if (whereScope.id === -1) {
      return res.status(403).json({ message: "Acesso negado para este produto." });
    }

    const payload = normalizeProductPayload(req.body || {});
    const nextSupplierId = payload.supplierId || produtoAtual.supplierId;

    if (!nextSupplierId) {
      return res.status(400).json({ message: "Fornecedor e obrigatorio." });
    }

    const supplier = await prisma.TBLFORN.findUnique({
      where: { id: nextSupplierId },
    });

    if (!supplier) {
      return res.status(400).json({ message: "Fornecedor nao encontrado." });
    }

    const scopeToSupplier = await scopedWhere(currentUser, {
      tenantId: supplier.tenantId,
      supplierId: supplier.id,
    });
    if (scopeToSupplier.id === -1) {
      return res.status(403).json({ message: "Acesso negado para este fornecedor." });
    }

    if (payload.code && payload.code !== produtoAtual.code) {
      const duplicate = await prisma.TBLPROD.findFirst({
        where: {
          tenantId: supplier.tenantId,
          code: payload.code,
          NOT: { id },
        },
      });
      if (duplicate) {
        return res.status(409).json({ message: "Ja existe um produto com este codigo neste tenant." });
      }
    }

    const produtoAtualizado = await prisma.TBLPROD.update({
      where: { id },
      data: {
        tenantId: supplier.tenantId,
        supplierId: supplier.id,
        code: payload.code || produtoAtual.code,
        description: payload.description || produtoAtual.description,
        complement: payload.complement !== undefined ? payload.complement : produtoAtual.complement,
        brand: payload.brand !== undefined ? payload.brand : produtoAtual.brand,
        category: payload.category !== undefined ? payload.category : produtoAtual.category,
        status: payload.status || produtoAtual.status,
      },
      include: { supplier: true },
    });

    res.json({
      message: "Produto atualizado com sucesso.",
      produto: produtoAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    res.status(500).json({ message: "Erro ao atualizar produto." });
  }
});

// DELETE /api/produtos/:id
router.delete("/:id", async (req, res) => {
  try {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;
    assertCanWrite(currentUser);

    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "ID invalido." });
    }

    const produto = await prisma.TBLPROD.findUnique({ where: { id } });
    if (!produto) {
      return res.status(404).json({ message: "Produto nao encontrado." });
    }

    const whereScope = await scopedWhere(currentUser, { id });
    if (whereScope.id === -1) {
      return res.status(403).json({ message: "Acesso negado para este produto." });
    }

    // Checa se existe uso em JBP/Campanhas/Retail Media
    const [jbpCount, campCount, retailCount] = await Promise.all([
      prisma.TBLJBPITEM.count({ where: { productId: id } }),
      prisma.TBLCAMPANHAITEM.count({ where: { productId: id } }),
      prisma.TBLRETAILMEDIA_ITEM.count({ where: { productId: id } }),
    ]);

    if (jbpCount > 0 || campCount > 0 || retailCount > 0) {
      const [jbpItens, campanhaItens, retailItens] = await Promise.all([
        jbpCount
          ? prisma.TBLJBPITEM.findMany({
              where: { productId: id },
              select: { id: true, description: true, jbp: { select: { name: true } } },
              take: 5,
            })
          : [],
        campCount
          ? prisma.TBLCAMPANHAITEM.findMany({
              where: { productId: id },
              select: { id: true, title: true, campanha: { select: { name: true } } },
              take: 5,
            })
          : [],
        retailCount
          ? prisma.TBLRETAILMEDIA_ITEM.findMany({
              where: { productId: id },
              select: { id: true, notes: true, planoRetail: { select: { name: true } } },
              take: 5,
            })
          : [],
      ]);

      const conflicts = [];
      if (jbpCount) {
        conflicts.push({
          type: "jbpItens",
          label: "Itens de JBP",
          count: jbpCount,
          samples: jbpItens.map((i) => `${i.description || "Item"} (JBP ${i.jbp?.name || `#${i.id}`})`),
        });
      }
      if (campCount) {
        conflicts.push({
          type: "campanhaItens",
          label: "Itens de campanha",
          count: campCount,
          samples: campanhaItens.map((i) => `${i.title || "Peca"} (Campanha ${i.campanha?.name || `#${i.id}`})`),
        });
      }
      if (retailCount) {
        conflicts.push({
          type: "retailMediaItens",
          label: "Itens de retail media",
          count: retailCount,
          samples: retailItens.map((i) => `${i.notes || "Insercao"} (Plano ${i.planoRetail?.name || `#${i.id}`})`),
        });
      }

      return res.status(400).json({
        message: "Produto vinculado a planejamentos/campanhas. Inative-o ou remova os vinculos antes de excluir.",
        conflicts,
      });
    }

    await prisma.TBLPROD.delete({ where: { id } });

    res.json({ message: "Produto excluido com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    res.status(500).json({ message: "Erro ao excluir produto." });
  }
});

// POST /api/produtos/import-csv
router.post("/import-csv", async (req, res) => {
  try {
    const currentUser = await requireAuth(req, res);
    if (!currentUser) return;
    assertCanWrite(currentUser);

    const { csv: csvBody } = req.body || {};
    if (!csvBody || typeof csvBody !== "string") {
      return res.status(400).json({ message: "CSV obrigatorio no corpo." });
    }

    // Remove BOM (Byte Order Mark) if present, which can be added by some editors on Windows
    const csv = csvBody.charCodeAt(0) === 0xfeff ? csvBody.substring(1) : csvBody;

    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l !== "");
    if (lines.length < 2) {
      return res.status(400).json({ message: "CSV deve conter cabecalho e ao menos uma linha." });
    }

    const delimiter = detectDelimiter(lines[0]);
    const headerRaw = splitLine(lines[0], delimiter);
    const headerNorm = headerRaw.map((h) => normalizeKey(h));

    const codeIdx = indexFor(headerNorm, ALIASES.code);
    const descIdx = indexFor(headerNorm, ALIASES.description);
    const supplierIdIdx = indexFor(headerNorm, ALIASES.supplierId);
    const supplierNameIdx = indexFor(headerNorm, ALIASES.supplierName);
    const complementIdx = indexFor(headerNorm, ALIASES.complement);
    const brandIdx = indexFor(headerNorm, ALIASES.brand);
    const categoryIdx = indexFor(headerNorm, ALIASES.category);

    if (codeIdx === -1) {
      return res.status(400).json({ message: 'Cabecalho deve conter a coluna "code" (ou "codigo").' });
    }
    if (descIdx === -1) {
      return res.status(400).json({ message: 'Cabecalho deve conter a coluna "description" (ou "descricao").' });
    }

    const summary = { total: 0, imported: 0, errors: [] };

    for (let i = 1; i < lines.length; i++) {
      const row = splitLine(lines[i], delimiter);
      summary.total += 1;
      const code = row[codeIdx];
      const description = row[descIdx];
      const supplierIdValue =
        supplierIdIdx !== -1 && row[supplierIdIdx] ? Number(row[supplierIdIdx]) : null;
      const supplierNameValue =
        supplierNameIdx !== -1 && row[supplierNameIdx] ? row[supplierNameIdx] : null;

      if (!code || !description || (!supplierIdValue && !supplierNameValue)) {
        summary.errors.push({
          line: i + 1,
          message: "Campos obrigatorios faltando (code, description, supplierId ou supplierName/fornecedor).",
        });
        continue;
      }

      try {
        let supplier = null;
        if (supplierIdValue) {
          supplier = await validateSupplierAccess(currentUser, supplierIdValue);
        } else if (supplierNameValue) {
          const found = await findSupplierByName(supplierNameValue);
          if (!found) {
            throw new Error(`Fornecedor nao encontrado: ${supplierNameValue}`);
          }
          supplier = await validateSupplierAccess(currentUser, found.id);
        }
        if (!supplier) {
          throw new Error("Fornecedor nao encontrado.");
        }
        await upsertProduct({
          tenantId: supplier.tenantId,
          supplierId: supplier.id,
          code,
          description,
          complement: complementIdx !== -1 ? row[complementIdx] || null : null,
          brand: brandIdx !== -1 ? row[brandIdx] || null : null,
          category: categoryIdx !== -1 ? row[categoryIdx] || null : null,
          status: "ativo",
        });
        summary.imported += 1;
      } catch (err) {
        summary.errors.push({ line: i + 1, message: err.message || "Erro ao importar linha." });
      }
    }

    return res.json({
      message: `Importacao concluida: ${summary.imported}/${summary.total}`,
      summary,
    });
  } catch (error) {
    console.error("Erro na importacao CSV:", error);
    res.status(500).json({ message: "Erro na importacao CSV." });
  }
});

// POST /api/produtos/import-db
router.post("/import-db", async (req, res) => {
  const currentUser = await requireAuth(req, res);
  if (!currentUser) return;
  try {
    assertCanWrite(currentUser);
  } catch (err) {
    return res.status(403).json({ message: err.message });
  }

  try {
    const { driver = "postgres", connectionString, query } = req.body || {};
    if (!connectionString || !query) {
      return res.status(400).json({ message: "connectionString e query sao obrigatorios." });
    }
    if (driver !== "postgres") {
      return res.status(400).json({ message: "Driver suportado no momento: postgres." });
    }

    const client = new PgClient({ connectionString });
    await client.connect();
    const result = await client.query(query);
    await client.end();

    const rows = result?.rows || [];
    const summary = { total: rows.length, imported: 0, errors: [] };

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const map = rowMapFromObject(row);
      const code = String(getFromMap(map, ALIASES.code) || "").trim();
      const description = String(getFromMap(map, ALIASES.description) || "").trim();
      const supplierIdRaw = getFromMap(map, ALIASES.supplierId);
      const supplierIdValue =
        supplierIdRaw !== undefined && supplierIdRaw !== null && supplierIdRaw !== ""
          ? Number(supplierIdRaw)
          : null;
      const supplierNameValue = getFromMap(map, ALIASES.supplierName);

      if (!code || !description || (!supplierIdValue && !supplierNameValue)) {
        summary.errors.push({
          line: idx + 1,
          message: "Campos obrigatorios faltando (code, description, supplierId ou supplierName/fornecedor).",
        });
        continue;
      }

      try {
        let supplier = null;
        if (supplierIdValue) {
          supplier = await validateSupplierAccess(currentUser, supplierIdValue);
        } else if (supplierNameValue) {
          const found = await findSupplierByName(supplierNameValue);
          if (!found) {
            throw new Error(`Fornecedor nao encontrado: ${supplierNameValue}`);
          }
          supplier = await validateSupplierAccess(currentUser, found.id);
        }
        if (!supplier) {
          throw new Error("Fornecedor nao encontrado.");
        }
        await upsertProduct({
          tenantId: supplier.tenantId,
          supplierId: supplier.id,
          code,
          description,
          complement: getFromMap(map, ALIASES.complement) || null,
          brand: getFromMap(map, ALIASES.brand) || null,
          category: getFromMap(map, ALIASES.category) || null,
          status: getFromMap(map, ALIASES.status) || "ativo",
        });
        summary.imported += 1;
      } catch (err) {
        summary.errors.push({ line: idx + 1, message: err.message || "Erro ao importar linha." });
      }
    }

    return res.json({
      message: `Importacao concluida: ${summary.imported}/${summary.total}`,
      summary,
    });
  } catch (error) {
    console.error("Erro na importacao via banco:", error);
    res.status(500).json({ message: "Erro na importacao via banco." });
  }
});

module.exports = router;
