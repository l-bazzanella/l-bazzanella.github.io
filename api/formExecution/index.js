const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const app = express();

const PORT = process.env.PORT || 3000;

// URL da sua API do Google Apps Script:
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyFrhVTnpGrctM25FZ7wBqU4O4NZP5g02OlGPOKPwtRE7Vu_Qnn6GJKXuaWS_Hq4BRN0w/exec";

// Middleware
app.use(cors());
app.use(express.json());

// Rota pública para receber dados do formulário
app.post("/api/ingresso", async (req, res) => {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(req.body),
      headers: { "Content-Type": "application/json" }
    });

    const result = await response.json();
    res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao encaminhar para Google Script:", error);
    res.status(500).json({ status: "erro", mensagem: "Falha no servidor intermediário." });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy ativo em http://localhost:${PORT}`);
});
