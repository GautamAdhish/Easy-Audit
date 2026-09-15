import type { SummaryData } from "./useSummaryData";

// Everything both report views need, pre-computed once so the "board"
// version and the "auditor" version are always describing the same
// underlying numbers, just at different levels of detail.

export type Trajectory = "Escalating" | "Stable" | "Improving";

export interface VulnerabilityArea {
  key: string;
  label: string;
  exposurePct: number; // 0-100: how much of this area is unresolved/non-compliant
  severityScore: number; // weighted 0-100, factors in Critical/Major weighting
  openCount: number;
  totalCount: number;
  topFixes: string[]; // concrete remediation text pulled from CAPA / mitigation fields
  trajectory: Trajectory; // heuristic read on where this area is headed next
  predictedScore: number; // 0-100 composite used to rank/predict where the next exposure is likeliest
}

export interface Insights {
  overallExposure: number; // 0-100 headline "how vulnerable are we" number
  overallLabel: string;
  auditsCompleted: number;
  auditsTotal: number;
  avgCompliance: number;
  findingsBySeverity: { name: string; value: number; color: string }[];
  findingsByStatus: { name: string; value: number; color: string }[];
  risksByLevel: { name: string; value: number; color: string }[];
  riskMatrix: { likelihood: number; impact: number; count: number; z: number }[];
  capaByStatus: { name: string; value: number; color: string }[];
  complianceByDept: { department: string; compliance: number }[];
  assetCompliance: { name: string; value: number; color: string }[];
  vendorResidualRisk: { name: string; value: number; color: string }[];
  vulnerabilityAreas: VulnerabilityArea[];
  predictedRisks: VulnerabilityArea[]; // vulnerabilityAreas ranked by predictedScore, worst first
  criticalOpenRisks: any[];
  overdueCapas: any[];
}

const SEVERITY_COLORS: Record<string, string> = {
  Major: "#dc2626",
  Minor: "#f59e0b",
  Observation: "#64748b",
};
const RISK_COLORS: Record<string, string> = {
  Critical: "#dc2626",
  High: "#f97316",
  Medium: "#f59e0b",
  Low: "#4caf37",
};
const STATUS_COLORS: Record<string, string> = {
  Open: "#dc2626",
  "In Review": "#f59e0b",
  "In Progress": "#f59e0b",
  Closed: "#4caf37",
  Verified: "#4caf37",
  Mitigated: "#4caf37",
  Accepted: "#64748b",
};

function tally(items: any[], key: string, colorMap: Record<string, string>) {
  const counts: Record<string, number> = {};
  items.forEach((i) => {
    const v = i[key] || "Unknown";
    counts[v] = (counts[v] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
    color: colorMap[name] || "#94a3b8",
  }));
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function computeInsights(data: SummaryData): Insights {
  const { audits, findings, risks, capas, assets, vendors, checklist } = data;

  // --- Findings ---
  const findingsBySeverity = tally(findings, "severity", SEVERITY_COLORS);
  const findingsByStatus = tally(findings, "status", STATUS_COLORS);
  const openFindings = findings.filter((f) => f.status !== "Closed");
  const majorOpenFindings = openFindings.filter((f) => f.severity === "Major");

  // --- Risks ---
  const risksByLevel = tally(risks, "level", RISK_COLORS);
  const openRisks = risks.filter((r) => r.status === "Open");
  const criticalOpenRisks = openRisks
    .filter((r) => r.level === "Critical" || r.level === "High")
    .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
  const riskMatrixMap: Record<string, { likelihood: number; impact: number; count: number }> = {};
  risks.forEach((r) => {
    const k = `${r.likelihood}-${r.impact}`;
    if (!riskMatrixMap[k]) riskMatrixMap[k] = { likelihood: r.likelihood, impact: r.impact, count: 0 };
    riskMatrixMap[k].count += 1;
  });
  const riskMatrix = Object.values(riskMatrixMap).map((r) => ({ ...r, z: r.count }));

  // --- CAPA ---
  const capaByStatus = tally(capas, "status", STATUS_COLORS);
  const now = new Date();
  const overdueCapas = capas.filter(
    (c) => c.status !== "Closed" && c.status !== "Verified" && c.dueDate && new Date(c.dueDate) < now
  );

  // --- Assets ---
  const nonCompliantAssets = assets.filter(
    (a) => a.assessmentStatus === "Non-Compliant" || a.assessmentStatus === "Needs Review"
  );
  const assetCompliance = tally(assets, "assessmentStatus", {
    Pass: "#4caf37",
    "Needs Review": "#f59e0b",
    "Non-Compliant": "#dc2626",
    Retired: "#64748b",
  });

  // --- Vendors ---
  const highRiskVendors = vendors.filter((v) => v.residualRisk === "Critical" || v.residualRisk === "High");
  const vendorResidualRisk = tally(vendors, "residualRisk", RISK_COLORS);

  // --- Checklist / compliance ---
  const nonCompliantChecklist = checklist.filter(
    (c) => c.status === "Non-Compliant" || c.status === "Partial"
  );
  const deptMap: Record<string, { compliant: number; total: number }> = {};
  checklist.forEach((c) => {
    const dept = c.clause?.split(".")[0] || "General";
    if (!deptMap[dept]) deptMap[dept] = { compliant: 0, total: 0 };
    deptMap[dept].total += 1;
    if (c.status === "Compliant") deptMap[dept].compliant += 1;
  });
  const complianceByDept =
    audits.length > 0
      ? Array.from(new Set(audits.map((a) => a.department))).map((department) => {
          const deptAudits = audits.filter((a) => a.department === department);
          const avg =
            deptAudits.reduce((sum, a) => sum + (a.compliance || 0), 0) / deptAudits.length;
          return { department, compliance: Math.round(avg) };
        })
      : Object.entries(deptMap).map(([department, v]) => ({
          department,
          compliance: pct(v.compliant, v.total),
        }));

  const avgCompliance =
    audits.length > 0
      ? Math.round(audits.reduce((s, a) => s + (a.compliance || 0), 0) / audits.length)
      : 100 - pct(nonCompliantChecklist.length, checklist.length || 1);

  const auditsCompleted = audits.filter((a) => a.status === "Completed").length;

  // --- Vulnerability areas (the "how vulnerable, by how much, how to fix" table) ---
  const rawVulnerabilityAreas: Omit<VulnerabilityArea, "trajectory" | "predictedScore">[] = [
    {
      key: "checklist",
      label: "Compliance Checklist",
      exposurePct: pct(nonCompliantChecklist.length, checklist.length || 1),
      severityScore: pct(
        checklist.filter((c) => c.status === "Non-Compliant").length,
        checklist.length || 1
      ),
      openCount: nonCompliantChecklist.length,
      totalCount: checklist.length,
      topFixes: nonCompliantChecklist
        .slice(0, 3)
        .map((c) => `${c.clause}: ${c.title} — provide/renew evidence and close gap`),
    },
    {
      key: "findings",
      label: "Audit Findings",
      exposurePct: pct(openFindings.length, findings.length || 1),
      severityScore: pct(majorOpenFindings.length, findings.length || 1),
      openCount: openFindings.length,
      totalCount: findings.length,
      topFixes: majorOpenFindings.slice(0, 3).map((f) => `${f.code || ""} ${f.title} — remediate before ${f.dueDate ? new Date(f.dueDate).toLocaleDateString() : "due date"}`),
    },
    {
      key: "risks",
      label: "Risk Register",
      exposurePct: pct(openRisks.length, risks.length || 1),
      severityScore: pct(criticalOpenRisks.length, risks.length || 1),
      openCount: openRisks.length,
      totalCount: risks.length,
      topFixes: criticalOpenRisks
        .slice(0, 3)
        .map((r) => `${r.code || ""} ${r.title} — ${r.mitigationPlan || "mitigation plan needed"}`),
    },
    {
      key: "capa",
      label: "CAPA (Corrective/Preventive Actions)",
      exposurePct: pct(
        capas.filter((c) => c.status !== "Closed" && c.status !== "Verified").length,
        capas.length || 1
      ),
      severityScore: pct(overdueCapas.length, capas.length || 1),
      openCount: overdueCapas.length,
      totalCount: capas.length,
      topFixes: overdueCapas
        .slice(0, 3)
        .map((c) => `${c.code || ""} ${c.title} — overdue since ${c.dueDate ? new Date(c.dueDate).toLocaleDateString() : "n/a"}; ${c.correctiveAction || ""}`),
    },
    {
      key: "assets",
      label: "Assets",
      exposurePct: pct(nonCompliantAssets.length, assets.length || 1),
      severityScore: pct(
        assets.filter((a) => a.assessmentStatus === "Non-Compliant").length,
        assets.length || 1
      ),
      openCount: nonCompliantAssets.length,
      totalCount: assets.length,
      topFixes: nonCompliantAssets
        .slice(0, 3)
        .map((a) => `${a.assetTag || ""} ${a.assetName} — re-assess and remediate condition/controls`),
    },
    {
      key: "vendors",
      label: "Vendor / Third-Party Risk",
      exposurePct: pct(highRiskVendors.length, vendors.length || 1),
      severityScore: pct(
        vendors.filter((v) => v.residualRisk === "Critical").length,
        vendors.length || 1
      ),
      openCount: highRiskVendors.length,
      totalCount: vendors.length,
      topFixes: highRiskVendors
        .slice(0, 3)
        .map((v) => `${v.code || ""} ${v.vendorName} — strengthen controls (currently ${v.controlEffectiveness}) or re-negotiate data access`),
    },
  ];

  // --- Predictive read: without historical time-series data, we can't fit a
  // trend line, so instead we use a transparent heuristic — comparing how
  // severe the *open* backlog skews (severityScore) against how big it is
  // (exposurePct). An area whose open items skew disproportionately toward
  // the worst-severity bucket is read as "Escalating" even if its overall
  // exposure % looks moderate today; one whose backlog is mostly low-severity
  // noise is read as "Improving". This is a stated model, not a guarantee.
  function trajectoryOf(a: Omit<VulnerabilityArea, "trajectory" | "predictedScore">): Trajectory {
    const skew = a.severityScore - a.exposurePct;
    if (skew >= 15) return "Escalating";
    if (skew <= -15) return "Improving";
    return "Stable";
  }
  function predictedScoreOf(a: Omit<VulnerabilityArea, "trajectory" | "predictedScore">): number {
    // weights severity skew most heavily, then raw exposure, then sheer
    // backlog size — the combination used to rank "where's the next
    // exposure likeliest to surface" across areas.
    const skew = a.severityScore - a.exposurePct;
    const backlogFactor = Math.min(20, a.openCount * 2);
    const score = a.exposurePct * 0.4 + a.severityScore * 0.45 + Math.max(0, skew) * 0.15 + backlogFactor * 0.1;
    return Math.round(Math.min(100, score));
  }

  const vulnerabilityAreas: VulnerabilityArea[] = rawVulnerabilityAreas.map((a) => ({
    ...a,
    trajectory: trajectoryOf(a),
    predictedScore: predictedScoreOf(a),
  }));

  const predictedRisks = [...vulnerabilityAreas].sort((a, b) => b.predictedScore - a.predictedScore);

  const overallExposure = Math.round(
    vulnerabilityAreas.reduce((s, a) => s + a.exposurePct, 0) / vulnerabilityAreas.length
  );
  const overallLabel =
    overallExposure >= 60 ? "High Exposure" : overallExposure >= 35 ? "Moderate Exposure" : "Low Exposure";

  return {
    overallExposure,
    overallLabel,
    auditsCompleted,
    auditsTotal: audits.length,
    avgCompliance,
    findingsBySeverity,
    findingsByStatus,
    risksByLevel,
    riskMatrix,
    capaByStatus,
    complianceByDept,
    assetCompliance,
    vendorResidualRisk,
    vulnerabilityAreas,
    predictedRisks,
    criticalOpenRisks,
    overdueCapas,
  };
}

// The narrative generator only ever reads a subset of Insights. The rest
// (predictedRisks, riskMatrix, complianceByDept, assetCompliance,
// vendorResidualRisk, capaByStatus, findingsByStatus) exists for the report
// UI only and was never meant to cross the wire. Sending the full Insights
// object here is what pushed a real payload over the API's 10kb body limit
// once predictedRisks (a full duplicate of vulnerabilityAreas) was added —
// this keeps the POST to exactly what the backend uses.
export function toNarrativePayload(insights: Insights) {
  return {
    overallExposure: insights.overallExposure,
    overallLabel: insights.overallLabel,
    avgCompliance: insights.avgCompliance,
    auditsCompleted: insights.auditsCompleted,
    auditsTotal: insights.auditsTotal,
    findingsBySeverity: insights.findingsBySeverity,
    risksByLevel: insights.risksByLevel,
    vulnerabilityAreas: insights.vulnerabilityAreas,
    // only .length and (for the first item) these named fields are read —
    // trim to that instead of shipping every field on every open risk.
    criticalOpenRisks: insights.criticalOpenRisks.slice(0, 10).map((r) => ({
      code: r.code,
      title: r.title,
      likelihood: r.likelihood,
      impact: r.impact,
      riskScore: r.riskScore,
      level: r.level,
      mitigationPlan: r.mitigationPlan,
    })),
    // only .length is ever read for this one
    overdueCapas: insights.overdueCapas.map(() => ({})),
  };
}
