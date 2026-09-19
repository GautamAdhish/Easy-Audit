import mongoose from "mongoose";

const REPORT_TYPES = [
  "Audit Summary",
  "Compliance",
  "Risk",
  "CAPA",
  "Findings",
];
const REPORT_STATUSES = ["Draft", "Final", "Approved"];

const reportSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // e.g. RP-001
    title: { type: String, required: [true, "Title is required"], trim: true },
    type: { type: String, enum: REPORT_TYPES, required: true },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Generated-by user is required"],
    },
    generatedDate: { type: Date, default: Date.now },
    period: {
      type: String,
      required: [true, "Reporting period is required"],
      trim: true,
    },
    status: { type: String, enum: REPORT_STATUSES, default: "Draft" },
    pages: { type: Number, min: 1, default: 1 },
    fileSize: { type: String },
    filePath: { type: String, select: false },
    fileName: { type: String },
  },
  { timestamps: true },
);

export const REPORT_TYPES_LIST = REPORT_TYPES;
export const REPORT_STATUSES_LIST = REPORT_STATUSES;

export default mongoose.model("Report", reportSchema);
