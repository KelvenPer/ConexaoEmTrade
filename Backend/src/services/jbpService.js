const { WorkflowAction } = require("@prisma/client");
const prisma = require("../prisma");

const APPROVED_STATUS = "aprovado";
const CAMPAIGN_STATUS = "planejada";
const EXEC_STATUS = "em_execucao";
const TASK_STATUS = "pendente";
const APPROVAL_STATUS = "rascunho";

function normalizeStatus(value) {
  return (value || "").toString().toLowerCase();
}

function isMarketingAsset(asset) {
  const assetType = (asset?.type || "").toString().toUpperCase();
  return ["BANNER", "VIDEO", "POST", "JORNAL"].includes(assetType);
}

async function approveJbp({ jbpId, userId }) {
  if (!jbpId || !userId) {
    throw new Error("Parametros obrigatorios ausentes para aprovacao do JBP.");
  }

  return prisma.$transaction(async (tx) => {
    const jbp = await tx.TBLJBP.findUnique({
      where: { id: jbpId },
      include: {
        itens: { include: { asset: true, itemStores: true } },
        supplier: true,
      },
    });

    if (!jbp) {
      throw new Error("JBP nao encontrado.");
    }
    if (normalizeStatus(jbp.status) === APPROVED_STATUS) {
      throw new Error("JBP ja esta aprovado.");
    }

    const previousStatus = jbp.status || null;

    await tx.TBLJBP.update({
      where: { id: jbpId },
      data: { status: APPROVED_STATUS },
    });

    await tx.TBLWORKFLOW_HISTORY.create({
      data: {
        relatedTable: "TBLJBP",
        recordId: jbpId,
        userId,
        action: WorkflowAction.APROVADO,
        fromStatus: previousStatus,
        toStatus: APPROVED_STATUS,
      },
    });

    // ====================================================
    // 4. AUTOMACAO DE MARKETING (JBP -> Campanha)
    // ====================================================
    const marketingItems = jbp.itens.filter((item) => isMarketingAsset(item.asset));
    let createdCampaign = null;

    if (marketingItems.length > 0) {
      createdCampaign = await tx.TBLCAMPANHA.create({
        data: {
          supplierId: jbp.supplierId,
          retailId: jbp.retailId || null,
          jbpId: jbp.id,
          name: `Campanha Automatica: ${jbp.name}`,
          status: CAMPAIGN_STATUS,
          startDate: jbp.periodStart || null,
          endDate: jbp.periodEnd || null,
        },
      });

      for (const item of marketingItems) {
        await tx.TBLCAMPANHAITEM.create({
          data: {
            campanhaId: createdCampaign.id,
            jbpItemId: item.id,
            assetId: item.assetId,
            title: `Arte para: ${item.asset?.name || "Ativo"}`,
            notes: `Gerado via JBP #${jbp.id}. Favor seguir o guide da marca.`,
            approvalStatus: APPROVAL_STATUS,
          },
        });
      }
    }

    // ====================================================
    // 5. AUTOMACAO DE EXECUCAO (JBP -> Lojas)
    // ====================================================
    let execPlano = null;
    for (const item of jbp.itens) {
      const itemStores =
        (item.itemStores && item.itemStores.length > 0
          ? item.itemStores
          : await tx.TBLJBPITEM_STORE.findMany({ where: { jbpItemId: item.id } })) || [];

      if (itemStores.length === 0) continue;

      if (!execPlano) {
        execPlano =
          (await tx.TBLEXECPLANO.findFirst({ where: { jbpId: jbp.id } })) ||
          (await tx.TBLEXECPLANO.create({
            data: {
              supplierId: jbp.supplierId,
              retailId: jbp.retailId || null,
              jbpId: jbp.id,
              name: `Execucao JBP: ${jbp.name}`,
              status: EXEC_STATUS,
            },
          }));
      }

      for (const link of itemStores) {
        await tx.TBLEXECTAREFA.create({
          data: {
            planoExecId: execPlano.id,
            jbpItemId: item.id,
            assetId: item.assetId,
            storeId: link.storeId,
            status: TASK_STATUS,
            checklist: "Verificar precificacao, Tirar foto da gondola",
            deadline: item.periodEnd || jbp.periodEnd || null,
          },
        });
      }
    }

    return tx.TBLJBP.findUnique({
      where: { id: jbpId },
      include: {
        itens: { include: { asset: true, itemStores: true } },
        supplier: true,
        retail: true,
        kpiQuery: true,
      },
    });
  });
}

module.exports = { approveJbp };
