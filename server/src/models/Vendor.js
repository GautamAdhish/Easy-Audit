import mongoose from "mongoose";

const VENDOR_TYPES = [
  "Software",
  "Service",
  "Consulting",
  "Logistics",
  "Manufacturing",
  "Financial",
  "Other",
];
const RISK_LEVELS = ["Critical", "High", "Medium", "Low"];
const DATA_ACCESS_LEVELS = [
  "None",
  "Internal",
  "Confidential",
  "PII",
  "Payment Data",
  "PHI",
];
const HOSTING_MODELS = [
  "SaaS",
  "Cloud Hosted",
  "On-Premise",
  "Hybrid",
  "Other",
];
const CONTROL_EFFECTIVENESS = ["Strong", "Adequate", "Weak"];
const ASSESSMENT_RESULTS = [
  "Approved",
  "Approved with Conditions",
  "Remediation Required",
  "Hold",
  "Terminate",
];
const APPROVAL_STATUSES = ["Pending", "Approved", "Rejected"];

const vendorSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // e.g. V-001
    vendorName: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
    },
    vendorType: { type: String, enum: VENDOR_TYPES, default: "Software" },
    serviceDescription: {
      type: String,
      required: [true, "Service description is required"],
      trim: true,
    },
    website: { type: String, trim: true },
    country: { type: String, trim: true },
    primaryContactName: {
      type: String,
      required: [true, "Primary contact name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Contact email is required"],
      trim: true,
    },
    phone: { type: String, trim: true },
    businessOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Business owner is required"],
    },
    contractEndDate: { type: Date },
    nextReviewDate: { type: Date },
    criticality: { type: String, enum: RISK_LEVELS, default: "Medium" },
    dataAccessLevel: {
      type: String,
      enum: DATA_ACCESS_LEVELS,
      default: "Internal",
    },
    hostingModel: { type: String, enum: HOSTING_MODELS, default: "SaaS" },
    inherentRisk: { type: String, enum: RISK_LEVELS, required: true },
    controlEffectiveness: {
      type: String,
      enum: CONTROL_EFFECTIVENESS,
      required: true,
    },
    residualRisk: { type: String, enum: RISK_LEVELS }, // derived, see pre-validate hook below
    assessmentResult: {
      type: String,
      enum: ASSESSMENT_RESULTS,
      default: "Approved",
    },
    approvalStatus: {
      type: String,
      enum: APPROVAL_STATUSES,
      default: "Pending",
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

vendorSchema.index({
  vendorName: "text",
  serviceDescription: "text",
  country: "text",
  notes: "text",
});

/**
 * residualRisk is never trusted from client input — it's always derived
 * from inherentRisk tempered by how effective the vendor's controls are.
 * This keeps the two fields from drifting out of sync and mirrors the
 * same "derive, don't trust" approach used for Risk.riskScore/level, and
 * it means one fewer dropdown for the person filling out the assessment.
 */
const RANK = { Critical: 4, High: 3, Medium: 2, Low: 1 };
const LEVEL_BY_RANK = ["Low", "Low", "Medium", "High", "Critical"]; // index 0 unused
const EFFECTIVENESS_STEPDOWN = { Strong: 2, Adequate: 1, Weak: 0 };

vendorSchema.pre("validate", function computeResidualRisk(next) {
  if (this.inherentRisk && this.controlEffectiveness) {
    const rank = Math.max(
      1,
      RANK[this.inherentRisk] -
        EFFECTIVENESS_STEPDOWN[this.controlEffectiveness],
    );
    this.residualRisk = LEVEL_BY_RANK[rank];
  }
  next();
});

export const VENDOR_TYPES_LIST = VENDOR_TYPES;
export const VENDOR_RISK_LEVELS_LIST = RISK_LEVELS;
export const VENDOR_DATA_ACCESS_LEVELS_LIST = DATA_ACCESS_LEVELS;
export const VENDOR_HOSTING_MODELS_LIST = HOSTING_MODELS;
export const VENDOR_CONTROL_EFFECTIVENESS_LIST = CONTROL_EFFECTIVENESS;
export const VENDOR_ASSESSMENT_RESULTS_LIST = ASSESSMENT_RESULTS;
export const VENDOR_APPROVAL_STATUSES_LIST = APPROVAL_STATUSES;

export default mongoose.model("Vendor", vendorSchema);
