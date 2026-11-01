import { Router } from "express";
import {
  getGardenPlants,
  addPlant,
  updatePlant,
  deletePlant,
  logWatering,
} from "../controllers/plants.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getGardenPlants);
router.post("/", requireAuth, addPlant);
router.put("/:id", requireAuth, updatePlant);
router.delete("/:id", requireAuth, deletePlant);
router.post("/:id/water", requireAuth, logWatering);

export default router;
