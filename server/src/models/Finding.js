import mongoose from "mongoose";

const FINDING_SEVERITIES = ["Major", "Minor", "Observation"];
const FINDING_STATUSES = ["Open", "In Review", "Closed"];

const findingSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // e.g. F-001
    auditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audit",
      required: [true, "Related audit is required"],
    },
    title: { type: String, required: [true, "Title is required"], trim: true },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    severity: { type: String, enum: FINDING_SEVERITIES, required: true },
    status: { type: String, enum: FINDING_STATUSES, default: "Open" },
    dateFound: { type: Date, required: [true, "Date found is required"] },
    dueDate: { type: Date, required: [true, "Due date is required"] },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assignee is required"],
    },
    description: { type: String, trim: true },
  },
  { timestamps: true },
);

findingSchema.index({ title: "text", description: "text" });

export const FINDING_SEVERITIES_LIST = FINDING_SEVERITIES;
export const FINDING_STATUSES_LIST = FINDING_STATUSES;

export default mongoose.model("Finding", findingSchema);
