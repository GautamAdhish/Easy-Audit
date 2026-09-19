import express from "express";
import { generateNarrative } from "../controllers/aiReportController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);
router.post("/generate", generateNarrative);

export default router;
