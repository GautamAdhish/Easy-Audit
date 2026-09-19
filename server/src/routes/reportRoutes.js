import express from "express";
import reportController from "../controllers/reportController.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { createUpload } from "../middleware/upload.js";

const router = express.Router();
const reportUpload = createUpload("reports");

router.use(protect);

router
  .route("/")
  .get(reportController.getAll)
  .post(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    reportUpload.single("file"),
    reportController.createOne,
  );

router
  .route("/:id")
  .get(reportController.getOne)
  .patch(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    reportUpload.single("file"),
    reportController.updateOne,
  )
  .delete(restrictTo("Admin", "Lead Auditor"), reportController.deleteOne);

router.get("/:id/download", reportController.downloadFile);

export default router;
