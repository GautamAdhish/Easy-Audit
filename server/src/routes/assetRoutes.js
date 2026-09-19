import express from "express";
import assetController from "../controllers/assetController.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { createUpload } from "../middleware/upload.js";

const router = express.Router();
const assetUpload = createUpload("assets");

router.use(protect);

router
  .route("/")
  .get(assetController.getAll)
  .post(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    assetUpload.single("photo"),
    assetController.createOne,
  );

router
  .route("/:id")
  .get(assetController.getOne)
  .patch(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    assetUpload.single("photo"),
    assetController.updateOne,
  )
  .delete(restrictTo("Admin", "Lead Auditor"), assetController.deleteOne);

router.get("/:id/photo", assetController.downloadPhoto);

export default router;
