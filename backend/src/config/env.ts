import dotenv from "dotenv";
import path from "path";

// Load backend .env or fallback to root .env
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

export const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",

  supabase: {
    url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    publishableKey:
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },

  database: {
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || "",
  },

  openai: {
    apiKey:
      process.env.OPENAI_API_KEY ||
      process.env.AI_API_KEY ||
      process.env.AI_GATEWAY_API_KEY ||
      "",
    modelId: process.env.AI_MODEL_ID || "gpt-4o-mini",
    gatewayUrl: process.env.AI_GATEWAY_URL || process.env.OPENAI_BASE_URL || "",
  },
};
