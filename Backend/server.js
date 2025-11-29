const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/auth");
const fornecedorRoutes = require("./src/routes/fornecedores");
const userRoutes = require("./src/routes/users");
const ativosRoutes = require("./src/routes/ativos");
const jbpRoutes = require("./src/routes/jbp");
const campanhasRoutes = require("./src/routes/campanhas");
const produtosRoutes = require("./src/routes/produtos");
const retailRoutes = require("./src/routes/retail");



const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// rota testa basica
app.get("/", (req, res) => {
    res.json({
        message: "API conexão em Trade está rodando. 🚀"
    })
})

// rotas de authenticação
app.use("/api/auth", authRoutes);
app.use("/api/fornecedores", fornecedorRoutes);
app.use("/api/usuarios", userRoutes);
app.use("/api/ativos", ativosRoutes);
app.use("/api/jbp", jbpRoutes);
app.use("/api/campanhas", campanhasRoutes);
app.use("/api/produtos", produtosRoutes);
app.use("/api/varejos", retailRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Backend rodando na porta ${PORT}`);
})
