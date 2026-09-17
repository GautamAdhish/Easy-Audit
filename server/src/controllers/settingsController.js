import Settings from '../models/Settings.js';
import asyncHandler from '../utils/asyncHandler.js';

const getSingleton = async () => {
  let settings = await Settings.findOne().select('+groqApiKey');
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

const toSafeJSON = (settings) => {
  const data = settings.toObject();
  data.groqKeyConfigured = Boolean(settings.groqApiKey);
  delete data.groqApiKey;
  return data;
};

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getSingleton();
  res.status(200).json({ success: true, data: toSafeJSON(settings) });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await getSingleton();

  const {
    organisationName,
    industry,
    primaryStandard,
    auditCycle,
    notifications,
    auditParameters,
    groqApiKey,
  } = req.body;

  if (organisationName !== undefined) settings.organisationName = organisationName;
  if (industry !== undefined) settings.industry = industry;
  if (primaryStandard !== undefined) settings.primaryStandard = primaryStandard;
  if (auditCycle !== undefined) settings.auditCycle = auditCycle;
  if (notifications) Object.assign(settings.notifications, notifications);
  if (auditParameters) Object.assign(settings.auditParameters, auditParameters);

  if (groqApiKey !== undefined) {
    settings.groqApiKey = String(groqApiKey).trim();
  }

  await settings.save();
  res.status(200).json({ success: true, data: toSafeJSON(settings) });
});