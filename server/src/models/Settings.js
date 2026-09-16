import mongoose from 'mongoose';

/**
 * The Settings page in the UI edits one organisation-wide configuration
 * document, not a list of records — so this collection is a singleton.
 * The controller always operates on the single document, creating it
 * with sane defaults on first read if it doesn't exist yet.
 */
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

    // Secret: used by aiReportController to call OpenRouter. `select: false`
    // means it is left out of every query by default (including GET
    // /api/settings, which any logged-in role can call) — it only comes
    // back when a query explicitly does .select('+openRouterApiKey').
    // Never send this value to the browser; expose only a
    // "configured yes/no" flag instead.
    openRouterApiKey: { type: String, select: false, trim: true, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);