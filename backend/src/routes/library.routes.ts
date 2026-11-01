import { Router } from "express";
import { getPlantProfiles, getPlantBySlug } from "../controllers/library.controller.js";

const router = Router();

// Public botanical catalog endpoints
router.get("/", getPlantProfiles);
router.get("/:slug", getPlantBySlug);

export default router;
