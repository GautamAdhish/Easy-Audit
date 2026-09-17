import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    organisationName: { type: String, default: 'Acme Corp Pty Ltd', trim: true },
    industry: { type: String, default: 'Information Technology', trim: true },
    primaryStandard: { type: String, default: 'ISO/IEC 27001:2022', trim: true },
    auditCycle: { type: String, default: 'Annual', trim: true },

    notifications: {
      auditOverdueAlerts: { type: Boolean, default: true },
      newFindingAssigned: { type: Boolean, default: true },
      capaDueDateReminders: { type: Boolean, default: true },
      weeklyComplianceDigest: { type: Boolean, default: false },
      newUserRegistrations: { type: Boolean, default: false },
      documentUploads: { type: Boolean, default: true },
    },

    auditParameters: {
      defaultAuditDurationDays: { type: Number, default: 10 },
      capaResolutionSlaDays: { type: Number, default: 30 },
      majorNcEscalationThreshold: { type: Number, default: 5 },
      riskScoreAlertThreshold: { type: Number, default: 12 },
    },

    groqApiKey: { type: String, select: false, trim: true, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);