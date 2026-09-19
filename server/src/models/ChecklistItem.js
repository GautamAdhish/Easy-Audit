import mongoose from "mongoose";

const CHECKLIST_STATUSES = ["Compliant", "Non-Compliant", "Partial", "N/A"];

const checklistItemSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // e.g. CL-001
    auditId: { type: mongoose.Schema.Types.ObjectId, ref: "Audit" }, // optional: which audit this checklist run belongs to
    clause: {
      type: String,
      required: [true, "Clause reference is required"],
      trim: true,
    },
    title: { type: String, required: [true, "Title is required"], trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: CHECKLIST_STATUSES, default: "N/A" },
    evidence: { type: String, trim: true }, // free-text reference/description of supporting evidence
    auditor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Auditor is required"],
    },
  },
  { timestamps: true },
);

export const CHECKLIST_STATUSES_LIST = CHECKLIST_STATUSES;

export default mongoose.model("ChecklistItem", checklistItemSchema);
