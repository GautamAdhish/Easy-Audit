import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import AppError from "../utils/AppError.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const createUploadDir = (subdir) =>
  path.join(__dirname, "..", "..", "uploads", subdir);

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
]);

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Unsupported file type. Allowed: PDF, Word, Excel, PNG, JPEG.",
        400,
      ),
      false,
    );
  }
};

export const createUpload = (
  subdir = "evidence",
  { fileFilter: fileFilterOverride } = {},
) => {
  const uploadDir = createUploadDir(subdir);
  fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${unique}${ext}`);
    },
  });

  return multer({
    storage,
    fileFilter: fileFilterOverride || fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  });
};

const upload = createUpload("evidence");

export const humanFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

export default upload;
