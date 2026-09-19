import Audit from "../models/Audit.js";
import Finding from "../models/Finding.js";
import Capa from "../models/Capa.js";
import Risk from "../models/Risk.js";
import Evidence from "../models/Evidence.js";
import asyncHandler from "../utils/asyncHandler.js";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Reproduces the shape of the frontend's static `statCards` array
 * (src/data/dashboardData.ts), but every value is computed live from
 * the database instead of hard-coded.
 */
const buildStatCards = async () => {
  const [
    totalAudits,
    inProgress,
    completed,
    overdue,
    totalNonconformities,
    majorNCs,
    minorNCs,
    observations,
    capaPending,
    complianceAgg,
    highRisks,
    documents,
  ] = await Promise.all([
    Audit.countDocuments(),
    Audit.countDocuments({ status: "In Progress" }),
    Audit.countDocuments({ status: "Completed" }),
    Audit.countDocuments({ status: "Overdue" }),
    Finding.countDocuments(),
    Finding.countDocuments({ severity: "Major" }),
    Finding.countDocuments({ severity: "Minor" }),
    Finding.countDocuments({ severity: "Observation" }),
    Capa.countDocuments({ status: { $in: ["Open", "In Progress"] } }),
    Audit.aggregate([
      { $match: { compliance: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$compliance" } } },
    ]),
    Risk.countDocuments({ level: { $in: ["High", "Critical"] } }),
    Evidence.countDocuments(),
  ]);

  const avgCompliance = complianceAgg[0] ? Math.round(complianceAgg[0].avg) : 0;

  return [
    {
      label: "Total Audits",
      value: totalAudits,
      color: "blue",
      icon: "ClipboardList",
    },
    { label: "In Progress", value: inProgress, color: "amber", icon: "Loader" },
    {
      label: "Completed",
      value: completed,
      color: "green",
      icon: "CheckCircle",
    },
    { label: "Overdue", value: overdue, color: "red", icon: "AlertCircle" },
    {
      label: "Total Nonconformities",
      value: totalNonconformities,
      color: "purple",
      icon: "AlertTriangle",
    },
    { label: "Major NCs", value: majorNCs, color: "red", icon: "XCircle" },
    {
      label: "Minor NCs",
      value: minorNCs,
      color: "amber",
      icon: "MinusCircle",
    },
    { label: "Observations", value: observations, color: "blue", icon: "Eye" },
    {
      label: "CAPA Pending",
      value: capaPending,
      color: "orange",
      icon: "Clock",
    },
    {
      label: "Compliance",
      value: `${avgCompliance}%`,
      color: "green",
      icon: "TrendingUp",
    },
    {
      label: "High Risks",
      value: highRisks,
      color: "red",
      icon: "ShieldAlert",
    },
    { label: "Documents", value: documents, color: "indigo", icon: "FileText" },
  ];
};

/** Average audit compliance grouped by department. */
const buildComplianceByDepartment = () =>
  Audit.aggregate([
    { $group: { _id: "$department", compliance: { $avg: "$compliance" } } },
    {
      $project: {
        _id: 0,
        department: "$_id",
        compliance: { $round: ["$compliance", 0] },
      },
    },
    { $sort: { department: 1 } },
  ]);

/** Findings grouped by month found and severity, for the last 6 months. */
const buildNcTrend = async () => {
  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await Finding.aggregate([
    { $match: { dateFound: { $gte: since } } },
    {
      $group: {
        _id: {
          month: { $month: "$dateFound" },
          year: { $year: "$dateFound" },
          severity: "$severity",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Build the last 6 calendar months in order, defaulting each severity to 0.
  const months = [];
  const cursor = new Date(since);
  for (let i = 0; i < 6; i += 1) {
    months.push({ month: cursor.getMonth() + 1, year: cursor.getFullYear() });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months.map(({ month, year }) => {
    const find = (severity) =>
      rows.find(
        (r) =>
          r._id.month === month &&
          r._id.year === year &&
          r._id.severity === severity,
      );
    return {
      month: MONTH_LABELS[month - 1],
      major: find("Major")?.count || 0,
      minor: find("Minor")?.count || 0,
      observation: find("Observation")?.count || 0,
    };
  });
};

// GET /api/dashboard/stats
export const getStatCards = asyncHandler(async (req, res) => {
  const statCards = await buildStatCards();
  res.status(200).json({ success: true, data: statCards });
});

// GET /api/dashboard/compliance-by-department
export const getComplianceByDepartment = asyncHandler(async (req, res) => {
  const data = await buildComplianceByDepartment();
  res.status(200).json({ success: true, data });
});

// GET /api/dashboard/nc-trend
export const getNcTrend = asyncHandler(async (req, res) => {
  const data = await buildNcTrend();
  res.status(200).json({ success: true, data });
});

// GET /api/dashboard/overview  (all three in one round trip, for the dashboard page)
export const getOverview = asyncHandler(async (req, res) => {
  const [statCards, complianceByDepartment, ncTrend] = await Promise.all([
    buildStatCards(),
    buildComplianceByDepartment(),
    buildNcTrend(),
  ]);
  res
    .status(200)
    .json({
      success: true,
      data: { statCards, complianceByDepartment, ncTrend },
    });
});
