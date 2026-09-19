import express from "express";
import riskController from "../controllers/riskController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(riskController.getAll)
  .post(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    riskController.createOne,
  );

router
  .route("/:id")
  .get(riskController.getOne)
  .patch(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    riskController.updateOne,
  )
  .delete(restrictTo("Admin", "Lead Auditor"), riskController.deleteOne);

export default router;
