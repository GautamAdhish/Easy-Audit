import mongoose from "mongoose";

const ASSET_CATEGORIES = [
  "Hardware",
  "Software",
  "Equipment",
  "Facility",
  "Vehicle",
  "Tool",
  "Other",
];
const ASSET_CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];
const ASSET_ASSESSMENT_STATUSES = [
  "Pass",
  "Needs Review",
  "Non-Compliant",
  "Retired",
];

const assetSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true },
    assetName: {
      type: String,
      required: [true, "Asset name is required"],
      trim: true,
    },
    assetTag: {
      type: String,
      required: [true, "Asset tag is required"],
      trim: true,
      unique: true,
    },
    category: { type: String, enum: ASSET_CATEGORIES, required: true },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    condition: { type: String, enum: ASSET_CONDITIONS, required: true },
    assessmentStatus: {
      type: String,
      enum: ASSET_ASSESSMENT_STATUSES,
      default: "Needs Review",
    },
    assessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assessed-by user is required"],
    },
    assessmentDate: { type: Date, default: Date.now },
    notes: { type: String, trim: true },
    photoSize: { type: String },
    photoPath: { type: String, select: false },
    photoName: { type: String },
  },
  { timestamps: true },
);

assetSchema.index({
  assetName: "text",
  assetTag: "text",
  location: "text",
  department: "text",
  notes: "text",
});

export const ASSET_CATEGORIES_LIST = ASSET_CATEGORIES;
export const ASSET_CONDITIONS_LIST = ASSET_CONDITIONS;
export const ASSET_ASSESSMENT_STATUSES_LIST = ASSET_ASSESSMENT_STATUSES;

export default mongoose.model("Asset", assetSchema);
