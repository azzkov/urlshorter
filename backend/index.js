const express = require("express");
const cors = require("cors");
const { createClient } = require("redis");
require("dotenv").config();

const app = express();
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Variáveis para conexão com Redis a partir do .env
const redisClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT)
    }
});

async function connectToRedis() {
  await redisClient.connect();
  console.log("Conectado ao Redis");
}

// Iniciar conexão e servidor
async function startServer() {
  try {
    await connectToRedis();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Servidor iniciado na porta ${PORT}`));
  } catch (err) {
    console.error("Erro ao iniciar o servidor:", err);
    process.exit(1);
  }
}

startServer();

// Rota para encurtar URLs
app.post("/api/shorten", async (req, res) => {
  const { originalUrl, customSlug } = req.body;

  if (!originalUrl) {
    return res.status(400).json({ error: "URL original é obrigatória" });
  }

  const slug = customSlug || Math.random().toString(36).substring(2, 8);

  try {
    const exists = await redisClient.exists(slug);
    if (exists) return res.status(400).json({ error: "Slug já existe" });

    const newUrl = {
      originalUrl,
      slug,
      createdAt: new Date().toISOString()
    };

    await redisClient.set(slug, JSON.stringify(newUrl));

    res.json({ shortUrl: `${process.env.BASE_URL}/${slug}` });
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).json({ error: "Erro ao encurtar URL" });
  }
});

// Rota para redirecionar para a URL original
app.get("/:slug", async (req, res) => {
  try {
    const urlData = await redisClient.get(req.params.slug);
    if (urlData) {
      const url = JSON.parse(urlData);
      let redirectUrl = url.originalUrl;
      if (!redirectUrl.startsWith("http://") && !redirectUrl.startsWith("https://")) {
        redirectUrl = "http://" + redirectUrl;
      }
      return res.redirect(redirectUrl);
    }
    res.status(404).send("URL não encontrada");
  } catch (err) {
    console.error("Erro:", err);
    res.status(500).send("Erro interno");
  }
});

// Criar uma rota básica para a página inicial
app.get("/", (req, res) => {
  res.send("API de encurtamento de URLs. Use /api/shorten para criar uma URL curta.");
});

// Lidar com o encerramento da aplicação
process.on("SIGINT", async () => {
  await redisClient.disconnect();
  console.log("Conexão com Redis fechada");
  process.exit(0);
});