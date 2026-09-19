import express from "express";
import evidenceController from "../controllers/evidenceController.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { createUpload, ALLOWED_MIME_TYPES } from "../middleware/upload.js";
import AppError from "../utils/AppError.js";

const router = express.Router();

const evidenceFileFilter = (req, file, cb) => {
  const isFindingUpload = Boolean(req.body?.relatedFinding);

  if (isFindingUpload) {
    if (file.mimetype !== "application/pdf") {
      return cb(
        new AppError(
          "Documents attached to a finding must be a PDF file.",
          400,
        ),
        false,
      );
    }
    return cb(null, true);
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(
      new AppError(
        "Unsupported file type. Allowed: PDF, Word, Excel, PNG, JPEG.",
        400,
      ),
      false,
    );
  }
  return cb(null, true);
};

const evidenceUpload = createUpload("evidence", {
  fileFilter: evidenceFileFilter,
});

router.use(protect);

router
  .route("/")
  .get(evidenceController.getAll)
  .post(
    restrictTo("Admin", "Lead Auditor", "Auditor", "Auditee"),
    evidenceUpload.single("file"),
    evidenceController.createOne,
  );

router
  .route("/:id")
  .get(evidenceController.getOne)
  .patch(
    restrictTo("Admin", "Lead Auditor", "Auditor"),
    evidenceController.updateOne,
  )
  .delete(restrictTo("Admin", "Lead Auditor"), evidenceController.deleteOne);

router.get("/:id/download", evidenceController.downloadFile);

export default router;
