import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  Output,
  NoObjectGeneratedError,
  streamText,
  wrapLanguageModel,
  extractJsonMiddleware,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayRunIdFetch } from "./run-id";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL_ID = "openai/gpt-6-astra";

const diagnosisSchema = z.object({
  plant_name: z.string(),
  scientific_name: z.string(),
  health_status: z.enum(["healthy", "needs_attention", "diseased"]),
  confidence: z.number(),
  summary: z.string(),
  issues: z.array(
    z.object({
      name: z.string(),
      severity: z.enum(["mild", "moderate", "severe"]),
      description: z.string(),
      treatment: z.string(),
    }),
  ),
  watering_interval_days: z.number(),
  care_tips: z.array(z.string()),
});

const inputSchema = z.object({
  imageDataUrl: z.string().startsWith("data:image/"),
  plantId: z.string().uuid().nullish(),
  notes: z.string().max(2000).nullish(),
});

const SYSTEM_PROMPT = `You are PlantCare AI, an expert botanist and plant pathologist helping home growers keep their plants thriving.
Analyze the attached plant photo and reply ONLY with a JSON object with exactly these keys:
- plant_name: common name of the plant, or "Unknown plant" if uncertain
- scientific_name: latin binomial, or "Unknown"
- health_status: exactly one of "healthy", "needs_attention", "diseased"
- confidence: your confidence as a number from 0 to 100
- summary: a 2-3 sentence friendly assessment of what you see
- issues: an array of 0 to 4 objects, each with name, severity ("mild", "moderate" or "severe"), description and treatment
- watering_interval_days: recommended days between waterings as a number
- care_tips: an array of 2 to 4 short actionable tips
Keep every text field concise, warm and practical.`;

export const diagnosePlant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.imageDataUrl.length > 3_500_000) {
      throw new Error("That photo is too large. Try a smaller image.");
    }
    const notes = (data.notes ?? "").trim();
    const plantId = data.plantId ?? null;

    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) {
      throw new Error("AI is not configured for this app yet.");
    }

    const runIdFetch = createLovableAiGatewayRunIdFetch();
    const provider = createOpenAI({
      baseURL: GATEWAY_URL,
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: runIdFetch.fetch,
    });

    // @ai-sdk/openai and @ai-sdk/gateway bundle different copies of @ai-sdk/provider with
    // identical runtime contracts, so bridge the version skew with a cast.
    const streamTextModel = provider.responses(MODEL_ID) as unknown as Parameters<
      typeof wrapLanguageModel
    >[0]["model"];
    const result = streamText({
      model: wrapLanguageModel({
        model: streamTextModel,
        middleware: extractJsonMiddleware(),
      }),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: notes
                ? `Diagnose this plant photo. Extra context from the owner: ${notes}`
                : "Diagnose this plant photo.",
            },
            { type: "image", image: data.imageDataUrl },
          ],
        },
      ],
      output: Output.object({ schema: diagnosisSchema }),
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    let parsed;
    try {
      parsed = await result.output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        const text = typeof (error as { text?: unknown }).text === "string" ? (error as { text: string }).text : "";
        try {
          const fallback = diagnosisSchema.safeParse(JSON.parse(text));
          if (fallback.success) {
            parsed = fallback.data;
          } else {
            throw new Error("The AI reply could not be read. Please try again.");
          }
        } catch {
          throw new Error("The AI reply could not be read. Please try again.");
        }
      } else {
        throw error;
      }
    }

    // Normalize model output against the app's rules before storing.
    const health = ["healthy", "needs_attention", "diseased"].includes(parsed.health_status)
      ? parsed.health_status
      : "needs_attention";
    const confidence = Math.max(0, Math.min(100, Math.round(parsed.confidence)));
    const interval = Math.max(1, Math.min(90, Math.round(parsed.watering_interval_days) || 7));

    const { data: row, error: dbError } = await context.supabase
      .from("diagnoses")
      .insert({
        user_id: context.userId,
        plant_id: plantId,
        image_url: data.imageDataUrl,
        plant_name: parsed.plant_name,
        scientific_name: parsed.scientific_name,
        health_status: health,
        confidence,
        summary: parsed.summary,
        issues: parsed.issues,
        watering_interval_days: interval,
        care_tips: parsed.care_tips,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(dbError.message);
    }
    return { diagnosis: row };
  });
