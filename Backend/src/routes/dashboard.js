const express = require("express");
const router = express.Router();
const { requireAuthUser } = require("../auth/requireAuth");
const { getDashboardOverview } = require("../services/dashboardService");

router.get("/overview", async (req, res) => {
  try {
    const user = await requireAuthUser(req, res);
    if (!user) return;

    const data = await getDashboardOverview(user);
    return res.json(data);
  } catch (error) {
    console.error("Erro no dashboard overview:", error);
    return res.status(500).json({ message: "Falha ao carregar dashboard", error: error.message });
  }
});

module.exports = router;
