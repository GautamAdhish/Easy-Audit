import express from "express";
import {
  getStatCards,
  getComplianceByDepartment,
  getNcTrend,
  getOverview,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/overview", getOverview);
router.get("/stats", getStatCards);
router.get("/compliance-by-department", getComplianceByDepartment);
router.get("/nc-trend", getNcTrend);

export default router;
