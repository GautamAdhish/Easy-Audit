import express from "express";
import checklistController from "../controllers/checklistController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(checklistController.getAll)
  .post(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    checklistController.createOne,
  );

router
  .route("/:id")
  .get(checklistController.getOne)
  .patch(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    checklistController.updateOne,
  )
  .delete(restrictTo("Admin", "Lead Auditor"), checklistController.deleteOne);

export default router;
