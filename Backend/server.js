const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./src/routes/auth");

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

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Backend rodando na porta ${PORT}`);
})