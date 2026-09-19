import path from "node:path";
import fs from "node:fs";
import Report from "../models/Report.js";
import createCRUDController from "./crudControllerFactory.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import generateCode from "../utils/generateCode.js";
import { humanFileSize } from "../middleware/upload.js";

const base = createCRUDController(Report, {
  codePrefix: "RP",
  searchFields: ["title", "period"],
  populate: [{ path: "generatedBy", select: "name email role" }],
});

const createOne = asyncHandler(async (req, res, next) => {
  const { title, type, period, status, pages } = req.body;
  const generator = req.body.generatedBy || req.user?._id;

  if (!title || !type || !period || !generator) {
    return next(
      new AppError("title, type, period and generatedBy are required.", 400),
    );
  }

  const code = await generateCode("RP");
  const doc = await Report.create({
    code,
    title,
    type,
    generatedBy: generator,
    period,
    status,
    pages,
    ...(req.file && {
      filePath: req.file.path,
      fileName: req.file.originalname,
      fileSize: humanFileSize(req.file.size),
    }),
  });

  res.status(201).json({ success: true, data: doc });
});

const updateOne = asyncHandler(async (req, res, next) => {
  const payload = { ...req.body };
  delete payload.code;
  if (payload.pages !== undefined) payload.pages = Number(payload.pages);
  if (req.file) {
    payload.filePath = req.file.path;
    payload.fileName = req.file.originalname;
    payload.fileSize = humanFileSize(req.file.size);
  }

  const doc = await Report.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });

  if (!doc)
    return next(new AppError(`Report not found with id ${req.params.id}`, 404));
  res.status(200).json({ success: true, data: doc });
});

const downloadFile = asyncHandler(async (req, res, next) => {
  const doc = await Report.findById(req.params.id).select("+filePath fileName");
  if (!doc)
    return next(new AppError(`Report not found with id ${req.params.id}`, 404));
  if (!doc.filePath || !fs.existsSync(doc.filePath)) {
    return next(
      new AppError("No file is attached to this report record.", 404),
    );
  }

  res.download(doc.filePath, doc.fileName || path.basename(doc.filePath));
});

export default { ...base, createOne, updateOne, downloadFile };
