import express from "express";
import {
    getSettings,
    updateSettings,
} from "../controllers/settingsController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getSettings);
router.patch("/", restrictTo("Admin"), updateSettings);

export default router;
