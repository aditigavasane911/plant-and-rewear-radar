import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config/env.js";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

import { testPostgresConnection } from "./services/db.service.js";

const app = express();

// Middlewares
app.use(
  cors({
    origin: [config.frontendUrl, "http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(morgan("dev"));

// Support large base64 image uploads from camera
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health Check Endpoint
app.get("/health", async (_req, res) => {
  const pgStatus = await testPostgresConnection();
  res.json({
    status: "ok",
    app: "PlantCare AI Backend",
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
    services: {
      supabase: Boolean(config.supabase.url),
      postgres: pgStatus.connected ? "connected" : pgStatus.error || "not configured",
      openai: Boolean(config.openai.apiKey),
    },
  });
});

// API Routes
app.use("/api", apiRouter);

// Centralized error handling
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`🌿 PlantCare AI Backend is running at http://localhost:${config.port}`);
  console.log(`📡 Health check available at http://localhost:${config.port}/health`);
  console.log(`🤖 AI Engine: ${config.openai.apiKey ? "OpenAI Vision (" + config.openai.modelId + ")" : "Built-in Botanist Diagnostic Engine"}`);
});

export default app;
