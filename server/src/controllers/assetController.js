import path from "node:path";
import fs from "node:fs";
import Asset from "../models/Asset.js";
import createCRUDController from "./crudControllerFactory.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import generateCode from "../utils/generateCode.js";
import { humanFileSize } from "../middleware/upload.js";

const base = createCRUDController(Asset, {
  codePrefix: "AS",
  searchFields: ["assetName", "assetTag", "location", "department", "notes"],
  populate: [{ path: "assessedBy", select: "name email role" }],
});

const createOne = asyncHandler(async (req, res, next) => {
  const {
    assetName,
    assetTag,
    category,
    location,
    department,
    condition,
    assessmentStatus,
    assessmentDate,
    notes,
  } = req.body;
  const assessor = req.body.assessedBy || req.user?._id;

  if (
    !assetName ||
    !assetTag ||
    !category ||
    !location ||
    !department ||
    !condition ||
    !assessor
  ) {
    return next(
      new AppError(
        "assetName, assetTag, category, location, department, condition and assessedBy are required.",
        400,
      ),
    );
  }

  if (!req.file) {
    return next(
      new AppError("A photo is required for each asset assessment.", 400),
    );
  }

  const code = await generateCode("AS");
  const doc = await Asset.create({
    code,
    assetName,
    assetTag,
    category,
    location,
    department,
    condition,
    assessmentStatus,
    assessedBy: assessor,
    assessmentDate,
    notes,
    photoPath: req.file.path,
    photoName: req.file.originalname,
    photoSize: humanFileSize(req.file.size),
  });

  res.status(201).json({ success: true, data: doc });
});

const updateOne = asyncHandler(async (req, res, next) => {
  const payload = { ...req.body };
  delete payload.code;
  if (req.file) {
    payload.photoPath = req.file.path;
    payload.photoName = req.file.originalname;
    payload.photoSize = humanFileSize(req.file.size);
  }

  const doc = await Asset.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });

  if (!doc)
    return next(new AppError(`Asset not found with id ${req.params.id}`, 404));
  res.status(200).json({ success: true, data: doc });
});

const downloadPhoto = asyncHandler(async (req, res, next) => {
  const doc = await Asset.findById(req.params.id).select(
    "+photoPath photoName",
  );
  if (!doc)
    return next(new AppError(`Asset not found with id ${req.params.id}`, 404));
  if (!doc.photoPath || !fs.existsSync(doc.photoPath)) {
    return next(
      new AppError("No photo is attached to this asset record.", 404),
    );
  }

  res.download(doc.photoPath, doc.photoName || path.basename(doc.photoPath));
});

const deleteOne = asyncHandler(async (req, res, next) => {
  const doc = await Asset.findById(req.params.id).select("+photoPath");
  if (!doc)
    return next(new AppError(`Asset not found with id ${req.params.id}`, 404));

  if (doc.photoPath && fs.existsSync(doc.photoPath)) {
    fs.unlinkSync(doc.photoPath);
  }

  await Asset.findByIdAndDelete(req.params.id);
  res.status(204).json({ success: true, data: null });
});

export default { ...base, createOne, updateOne, deleteOne, downloadPhoto };
