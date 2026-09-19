import mongoose from "mongoose";

const RISK_LEVELS = ["Critical", "High", "Medium", "Low"];
const RISK_STATUSES = ["Open", "Mitigated", "Accepted", "Closed"];

const riskSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // e.g. R-001
    title: { type: String, required: [true, "Title is required"], trim: true },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    likelihood: { type: Number, required: true, min: 1, max: 5 },
    impact: { type: Number, required: true, min: 1, max: 5 },
    riskScore: { type: Number, min: 1, max: 25 }, // derived, see pre-save hook below
    level: { type: String, enum: RISK_LEVELS }, // derived, see pre-save hook below
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    status: { type: String, enum: RISK_STATUSES, default: "Open" },
    mitigationPlan: { type: String, trim: true },
  },
  { timestamps: true },
);

/**
 * riskScore and level are never trusted from client input — they are
 * always recalculated from likelihood x impact so the two can never
 * drift out of sync. Bands follow a standard 5x5 risk heat-matrix:
 *   1-4   Low
 *   5-9   Medium
 *   10-15 High
 *   16-25 Critical
 * (The frontend's hand-written mock data is close to this matrix but not
 * perfectly consistent on every row, since it was typed by hand for the
 * demo UI rather than derived from a formula.)
 */
riskSchema.pre("validate", function computeRiskScore(next) {
  if (this.likelihood != null && this.impact != null) {
    this.riskScore = this.likelihood * this.impact;

    if (this.riskScore >= 16) this.level = "Critical";
    else if (this.riskScore >= 10) this.level = "High";
    else if (this.riskScore >= 5) this.level = "Medium";
    else this.level = "Low";
  }
  next();
});

export const RISK_LEVELS_LIST = RISK_LEVELS;
export const RISK_STATUSES_LIST = RISK_STATUSES;

export default mongoose.model("Risk", riskSchema);
