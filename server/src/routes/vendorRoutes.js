import express from "express";
import vendorController from "../controllers/vendorController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(vendorController.getAll)
  .post(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    vendorController.createOne,
  );

router
  .route("/:id")
  .get(vendorController.getOne)
  .patch(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    vendorController.updateOne,
  )
  .delete(restrictTo("Admin", "Lead Auditor"), vendorController.deleteOne);

export default router;
