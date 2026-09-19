import express from "express";
import auditController from "../controllers/auditController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(auditController.getAll)
  .post(restrictTo("Admin", "Lead Auditor"), auditController.createOne);

router
  .route("/:id")
  .get(auditController.getOne)
  .patch(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    auditController.updateOne,
  )
  .delete(restrictTo("Admin", "Lead Auditor"), auditController.deleteOne);

export default router;
