import mongoose from 'mongoose';

const EVIDENCE_TYPES = ['Policy', 'Procedure', 'Record', 'Report', 'Certificate'];

const evidenceSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, index: true }, // e.g. E-001
    title: { type: String, required: [true, 'Title is required'], trim: true },
    type: { type: String, enum: EVIDENCE_TYPES, required: true },
    relatedAudit: { type: mongoose.Schema.Types.ObjectId, ref: 'Audit', required: [true, 'Related audit is required'] },
    // Set when this document was attached from the Findings page — the
    // controller auto-fills relatedAudit from the finding when this is
    // present, so the caller doesn't have to look it up separately.
    relatedFinding: { type: mongoose.Schema.Types.ObjectId, ref: 'Finding' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: [true, 'Uploader is required'] },
    uploadedDate: { type: Date, default: Date.now },
    fileSize: { type: String },
    filePath: { type: String, select: false },
    fileName: { type: String },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

evidenceSchema.index({ title: 'text', tags: 'text' });

export const EVIDENCE_TYPES_LIST = EVIDENCE_TYPES;

export default mongoose.model('Evidence', evidenceSchema);