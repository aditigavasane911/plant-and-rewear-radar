import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);

export default router;
