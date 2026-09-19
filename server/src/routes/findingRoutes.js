import express from "express";
import findingController from "../controllers/findingController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(findingController.getAll)
  .post(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    findingController.createOne,
  );

router
  .route("/:id")
  .get(findingController.getOne)
  .patch(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    findingController.updateOne,
  )
  .delete(restrictTo("Admin", "Lead Auditor"), findingController.deleteOne);

export default router;
