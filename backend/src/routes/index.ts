import { Router } from "express";
import authRoutes from "./auth.routes.js";
import plantsRoutes from "./plants.routes.js";
import libraryRoutes from "./library.routes.js";
import diagnoseRoutes from "./diagnose.routes.js";

const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/plants", plantsRoutes);
apiRouter.use("/library", libraryRoutes);
apiRouter.use("/diagnose", diagnoseRoutes);

export default apiRouter;
