import mongoose from "mongoose";

/**
 * The frontend mock data uses short, human-readable IDs (A-001, F-002,
 * CL-010, ...) throughout the UI (tables, badges, cross-references).
 * MongoDB's ObjectId is the real primary key (_id), but every document
 * also gets one of these codes on creation so the UI experience is
 * unchanged when it's wired up to this API.
 *
 * Counters are tracked in a tiny `counters` collection: one document
 * per prefix, incremented atomically with findOneAndUpdate so
 * concurrent creates never collide.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // the prefix, e.g. "A", "F", "CL"
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

/**
 * @param {string} prefix e.g. 'A', 'F', 'C', 'R', 'E', 'CL', 'RP', 'U'
 * @param {number} pad how many digits to zero-pad the sequence to (default 3)
 * @returns {Promise<string>} e.g. 'A-009'
 */
export const generateCode = async (prefix, pad = 3) => {
  const counter = await Counter.findByIdAndUpdate(
    prefix,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return `${prefix}-${String(counter.seq).padStart(pad, "0")}`;
};

export default generateCode;
