import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const USER_ROLES = ["Admin", "Lead Auditor", "Auditor", "Viewer"];
const USER_STATUSES = ["Active", "Inactive"];

const userSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // e.g. U-001
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never returned by default
    },
    role: { type: String, enum: USER_ROLES, default: "Viewer" },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    status: { type: String, enum: USER_STATUSES, default: "Active" },
    lastLogin: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual: number of audits where this user is the auditor.
// Computed on demand instead of stored, so it can never drift out of sync.
userSchema.virtual("auditsAssigned", {
  ref: "Audit",
  localField: "_id",
  foreignField: "auditor",
  count: true,
});

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never leak the hash even if a query accidentally selects it back in.
userSchema.methods.toJSON = function toJSONSafe() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const USER_ROLES_LIST = USER_ROLES;
export const USER_STATUSES_LIST = USER_STATUSES;

export default mongoose.model("User", userSchema);
