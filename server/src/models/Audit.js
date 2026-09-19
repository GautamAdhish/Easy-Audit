import mongoose from "mongoose";

const AUDIT_STATUSES = ["Planned", "In Progress", "Completed", "Overdue"];

const auditSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // e.g. A-001
    title: { type: String, required: [true, "Title is required"], trim: true },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    auditor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Auditor is required"],
    },
    status: { type: String, enum: AUDIT_STATUSES, default: "Planned" },
    startDate: { type: Date, required: [true, "Start date is required"] },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function validateEndAfterStart(value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "End date must be on or after the start date",
      },
    },
    compliance: { type: Number, min: 0, max: 100, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual: live count of findings linked to this audit, replacing the
// static `findings` counter in the frontend mock data.
auditSchema.virtual("findingsCount", {
  ref: "Finding",
  localField: "_id",
  foreignField: "auditId",
  count: true,
});

auditSchema.index({ title: "text", department: "text" });

export const AUDIT_STATUSES_LIST = AUDIT_STATUSES;

export default mongoose.model("Audit", auditSchema);
