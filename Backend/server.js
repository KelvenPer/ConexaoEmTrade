const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/auth");
const fornecedorRoutes = require("./src/routes/fornecedores");
const userRoutes = require("./src/routes/users");


const app = express();

app.use(cors());
app.use(express.json());

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


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Backend rodando na porta ${PORT}`);
})