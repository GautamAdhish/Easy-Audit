import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import Card, { CardHeader, CardBody } from "../../components/common/Card";
import Figurine from "./Figurine";
import type { Insights } from "./computeInsights";
import {
  CHART_COLORS,
  chartAxisTick,
  chartGridProps,
  complianceColor,
} from "../../lib/chartTheme";
import {
  ShieldCheck,
  ShieldAlert,
  ClipboardCheck,
  Target,
  Image,
  Building2,
  TrendingUp,
} from "lucide-react";

// Translates a technical exposure % into a sentence a non-specialist board
// member can act on without needing to know what "residual risk" means.
function plainReadOverall(exposure: number, label: string) {
  if (exposure >= 60)
    return `A large share of the organisation's controls are not yet working as intended. Immediate management attention and budget are recommended to close the gap.`;
  if (exposure >= 35)
    return `Most controls are working, but a meaningful portion still need attention. Continued oversight is recommended to keep this from growing.`;
  return `The vast majority of controls are working as intended. Routine monitoring should be sufficient to keep it that way.`;
}

const GeneralReport: React.FC<{ insights: Insights }> = ({ insights }) => {
  const {
    overallExposure,
    overallLabel,
    avgCompliance,
    auditsCompleted,
    auditsTotal,
    findingsBySeverity,
    complianceByDept,
    vulnerabilityAreas,
    criticalOpenRisks,
  } = insights;

  // Re-label severities into board-friendly language for the pie chart.
  const plainSeverity = findingsBySeverity.map((s) => ({
    ...s,
    name:
      s.name === "Major"
        ? "Needs urgent fix"
        : s.name === "Minor"
          ? "Needs a fix"
          : "Just a note",
  }));

  const worstAreas = [...vulnerabilityAreas]
    .sort((a, b) => b.exposurePct - a.exposurePct)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Headline */}
      <Card data-pdf-section className="print:break-inside-avoid">
        <CardBody className="flex flex-col md:flex-row items-center gap-8">
          <div className="shrink-0 text-center">
            <div className="relative w-32 h-32 mx-auto">
              <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={CHART_COLORS.grid}
                  strokeWidth="3.5"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={
                    overallExposure >= 60
                      ? CHART_COLORS.badStrong
                      : overallExposure >= 35
                        ? CHART_COLORS.warn
                        : CHART_COLORS.good
                  }
                  strokeWidth="3.5"
                  strokeDasharray={`${100 - overallExposure}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-ink-900">
                    {100 - overallExposure}%
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">
                    Healthy
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs font-semibold mt-3 text-ink-900">
              {overallLabel}
            </p>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-ink-900 mb-2">
              Overall Security & Compliance Health
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              {plainReadOverall(overallExposure, overallLabel)}
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Figurines row */}
      <Card data-pdf-section className="print:break-inside-avoid">
        <CardBody className="flex flex-wrap justify-around gap-y-6">
          <Figurine
            icon={ClipboardCheck}
            value={`${auditsCompleted}/${auditsTotal}`}
            label="Audits completed"
            tone="good"
          />
          <Figurine
            icon={ShieldCheck}
            value={`${avgCompliance}%`}
            label="Average compliance score"
            tone={
              avgCompliance >= 80
                ? "good"
                : avgCompliance >= 60
                  ? "warn"
                  : "bad"
            }
          />
          <Figurine
            icon={ShieldAlert}
            value={criticalOpenRisks.length}
            label="Serious risks still open"
            tone={criticalOpenRisks.length > 0 ? "bad" : "good"}
          />
          <Figurine
            icon={Target}
            value={insights.overdueCapas.length}
            label="Fixes running late"
            tone={insights.overdueCapas.length > 0 ? "warn" : "good"}
          />
          <Figurine
            icon={Image}
            value={
              insights.assetCompliance.find((a) => a.name === "Non-Compliant")
                ?.value ?? 0
            }
            label="Equipment needing attention"
            tone="warn"
          />
          <Figurine
            icon={Building2}
            value={insights.vendorResidualRisk
              .filter((v) => v.name === "Critical" || v.name === "High")
              .reduce((s, v) => s + v.value, 0)}
            label="Outside vendors that are risky"
            tone="warn"
          />
        </CardBody>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-pdf-section className="print:break-inside-avoid">
          <CardHeader
            title="What Kind of Issues Did We Find"
            subtitle="In plain terms — no technical detail"
          />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={plainSeverity}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {plainSeverity.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card data-pdf-section className="print:break-inside-avoid">
          <CardHeader
            title="Compliance by Department"
            subtitle="Higher is better"
          />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={complianceByDept}
                margin={{ top: 16, right: 8, left: -16, bottom: 0 }}
              >
                <CartesianGrid {...chartGridProps} />
                <XAxis
                  dataKey="department"
                  tick={chartAxisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={chartAxisTick}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                {/* @ts-expect-error Recharts formatter types are incompatible with the chart value type. */}
                <Tooltip formatter={(v: number) => [`${v}%`, "Compliance"]} />
                <Bar dataKey="compliance" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {complianceByDept.map((entry, i) => (
                    <Cell key={i} fill={complianceColor(entry.compliance)} />
                  ))}
                  <LabelList
                    dataKey="compliance"
                    position="top"
                    // @ts-expect-error Recharts formatter types are incompatible with the chart value type.
                    formatter={(v: number) => `${v}%`}
                    style={{
                      fontSize: 10,
                      fill: CHART_COLORS.neutral,
                      fontWeight: 600,
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Where we're most exposed, plain language */}
      <Card data-pdf-section>
        <CardHeader
          title="Where We're Most Exposed"
          subtitle="The three areas needing the most attention right now"
        />
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {worstAreas.map((a) => (
            <div
              key={a.key}
              className="rounded-lg border border-ink-900/10 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp
                  className={`w-4 h-4 ${a.exposurePct >= 50 ? "text-red-500" : a.exposurePct >= 25 ? "text-amber-500" : "text-green-500"}`}
                />
                <p className="text-sm font-semibold text-ink-900">{a.label}</p>
              </div>
              <p className="text-2xl font-bold text-ink-900 mb-1">
                {a.exposurePct}%
              </p>
              <p className="text-xs text-slate-500">
                {a.openCount} out of {a.totalCount} items here still need work.
                Management sign-off recommended to prioritise fixing these.
              </p>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
};

export default GeneralReport;
