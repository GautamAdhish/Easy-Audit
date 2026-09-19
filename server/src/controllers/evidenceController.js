import path from "node:path";
import fs from "node:fs";
import Evidence from "../models/Evidence.js";
import Finding from "../models/Finding.js";
import createCRUDController from "./crudControllerFactory.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import generateCode from "../utils/generateCode.js";
import { humanFileSize } from "../middleware/upload.js";

const base = createCRUDController(Evidence, {
  codePrefix: "E",
  searchFields: ["title", "tags"],
  populate: [
    { path: "relatedAudit", select: "code title" },
    { path: "relatedFinding", select: "code title" },
    { path: "uploadedBy", select: "name email role" },
  ],
});

const createOne = asyncHandler(async (req, res, next) => {
  const { title, type, relatedFinding, tags } = req.body;
  let { relatedAudit } = req.body;
  const uploader = req.user?._id || req.body.uploadedBy;

  if (relatedFinding) {
    const finding = await Finding.findById(relatedFinding).select("auditId");
    if (!finding) {
      return next(
        new AppError(`Finding not found with id ${relatedFinding}`, 404),
      );
    }
    if (!relatedAudit) relatedAudit = String(finding.auditId);
  }

  if (!title || !type || !relatedAudit || !uploader) {
    return next(
      new AppError(
        "title, type, relatedAudit (or relatedFinding) and uploadedBy are required.",
        400,
      ),
    );
  }

  const code = await generateCode("E");
  const doc = await Evidence.create({
    code,
    title,
    type,
    relatedAudit,
    relatedFinding: relatedFinding || undefined,
    uploadedBy: uploader,
    tags: Array.isArray(tags)
      ? tags
      : tags
        ? String(tags)
            .split(",")
            .map((t) => t.trim())
        : [],
    ...(req.file && {
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: humanFileSize(req.file.size),
    }),
  });

  res.status(201).json({ success: true, data: doc });
});

const downloadFile = asyncHandler(async (req, res, next) => {
  const doc = await Evidence.findById(req.params.id).select(
    "+filePath fileName",
  );
  if (!doc)
    return next(
      new AppError(`Evidence not found with id ${req.params.id}`, 404),
    );
  if (!doc.filePath || !fs.existsSync(doc.filePath)) {
    return next(
      new AppError("No file is attached to this evidence record.", 404),
    );
  }
  res.download(doc.filePath, doc.fileName || path.basename(doc.filePath));
});

export default { ...base, createOne, downloadFile };
