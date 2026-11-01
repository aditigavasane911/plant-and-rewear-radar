import { Router } from "express";
import { diagnose, getDiagnosisHistory } from "../controllers/diagnose.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Diagnose plant from photo (optionally authenticated to save history)
router.post("/", diagnose);
router.get("/history", requireAuth, getDiagnosisHistory);

export default router;
