import mongoose from "mongoose";

const CAPA_STATUSES = ["Open", "In Progress", "Verified", "Closed"];
const CAPA_PRIORITIES = ["High", "Medium", "Low"];

const capaSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // e.g. C-001
    findingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Finding",
      required: [true, "Related finding is required"],
    },
    title: { type: String, required: [true, "Title is required"], trim: true },
    rootCause: {
      type: String,
      required: [true, "Root cause is required"],
      trim: true,
    },
    correctiveAction: {
      type: String,
      required: [true, "Corrective action is required"],
      trim: true,
    },
    preventiveAction: {
      type: String,
      required: [true, "Preventive action is required"],
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    dueDate: { type: Date, required: [true, "Due date is required"] },
    status: { type: String, enum: CAPA_STATUSES, default: "Open" },
    priority: { type: String, enum: CAPA_PRIORITIES, default: "Medium" },
  },
  { timestamps: true },
);

export const CAPA_STATUSES_LIST = CAPA_STATUSES;
export const CAPA_PRIORITIES_LIST = CAPA_PRIORITIES;

export default mongoose.model("Capa", capaSchema);
