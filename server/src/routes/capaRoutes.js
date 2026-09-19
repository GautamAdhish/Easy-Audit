import express from "express";
import capaController from "../controllers/capaController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(capaController.getAll)
  .post(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    capaController.createOne,
  );

router
  .route("/:id")
  .get(capaController.getOne)
  .patch(
    restrictTo("Admin", "Lead Auditor", "Auditor", "Auditee"),
    capaController.updateOne,
  )
  .delete(restrictTo("Admin", "Lead Auditor"), capaController.deleteOne);

export default router;
