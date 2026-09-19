import React, { useMemo, useRef, useState } from "react";
import { FileDown, Loader2, Users, ShieldAlert } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import Tabs from "../components/common/Tabs";
import LoadingState from "../components/common/LoadingState";
import Alert from "../components/common/Alert";
import { useAuth } from "../context/AuthContext";
import { useSummaryData } from "./summary/useSummaryData";
import { computeInsights, toNarrativePayload } from "./summary/computeInsights";
import GeneralReport from "./summary/GeneralReport";
import TechnicalReport from "./summary/TechnicalReport";
import AINarrativePanel from "./summary/AINarrativePanel";
import { exportReportToPdf, type NarrativeData } from "../lib/exportPdf";
import { api } from "../lib/api";

type ReportType = "general" | "technical";

export default function SummaryPage() {
  const data = useSummaryData();
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>("general");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const insights = useMemo(() => computeInsights(data), [data]);
  const reportRef = useRef<HTMLDivElement>(null);

  // Kept per report type (not a single value) because switching tabs remounts
  // AINarrativePanel — without this, a narrative generated on one tab would
  // vanish the moment the user looked at the other one.
  const [narratives, setNarratives] = useState<
    Record<ReportType, NarrativeData | null>
  >({
    general: null,
    technical: null,
  });

  const reportTitle =
    reportType === "general"
      ? "General Summary Report — Board"
      : "Technical Summary Report — Auditors";

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    setExportError("");
    try {
      // The PDF should always carry the AI narrative, whether or not the
      // user remembered to click "Generate AI Narrative" first.
      let narrative = narratives[reportType];
      if (!narrative) {
        try {
          const res = await api.post<NarrativeData>("/ai-reports/generate", {
            reportType,
            insights: toNarrativePayload(insights),
          });
          narrative = res.data;
          setNarratives((prev) => ({ ...prev, [reportType]: narrative }));
        } catch {
          // Export still proceeds — exportReportToPdf renders a clear
          // placeholder note in the narrative section when this is null.
          narrative = null;
        }
      }

      const dateStamp = new Date().toISOString().slice(0, 10);
      await exportReportToPdf(
        insights,
        reportType,
        narrative,
        {
          title: reportTitle,
          subtitle:
            reportType === "general"
              ? "Board-ready overview of security & compliance posture"
              : "Full technical detail for auditors — exposure, trajectory, remediation",
          classification: "Confidential — Internal Use Only",
          preparedBy: user?.name || user?.email || "IS-Audit System",
          generatedAt: new Date(),
        },
        `IS-Audit-${reportType}-report-${dateStamp}.pdf`,
      );
    } catch (e: any) {
      setExportError(e.message || "Failed to generate PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Summary Report"
        subtitle="Generate a board-ready overview or a full technical report for auditors"
        action={
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={handleExport}
              disabled={exporting || data.loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-950 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {exporting ? "Preparing PDF…" : "Download PDF"}
            </button>
            {exportError && (
              <p className="text-xs text-red-500">{exportError}</p>
            )}
          </div>
        }
      />

      {/* Report type toggle */}
      <Tabs
        className="mb-6"
        value={reportType}
        onValueChange={(v) => setReportType(v as ReportType)}
        items={[
          {
            value: "general",
            icon: <Users className="w-4 h-4" />,
            label: (
              <>
                General Report{" "}
                <span className="text-[10px] font-normal opacity-75">
                  (Board)
                </span>
              </>
            ),
          },
          {
            value: "technical",
            icon: <ShieldAlert className="w-4 h-4" />,
            label: (
              <>
                Technical Report{" "}
                <span className="text-[10px] font-normal opacity-75">
                  (Auditors)
                </span>
              </>
            ),
          },
        ]}
      />

      {data.loading ? (
        <LoadingState message="Loading audit data…" />
      ) : data.error ? (
        <div className="py-12">
          <Alert variant="error">{data.error}</Alert>
        </div>
      ) : (
        // This is exactly what gets captured for the PDF — nothing outside
        // this ref (page header, report-type toggle, download button) is
        // ever included, so we don't need any print-media trickery to hide app chrome from the export.
        <div ref={reportRef}>
          {reportType === "general" ? (
            <div className="space-y-6">
              <AINarrativePanel
                key="general"
                reportType="general"
                insights={insights}
                onNarrativeChange={(n) =>
                  setNarratives((prev) => ({ ...prev, general: n }))
                }
              />
              <GeneralReport insights={insights} />
            </div>
          ) : (
            <div className="space-y-6">
              <AINarrativePanel
                key="technical"
                reportType="technical"
                insights={insights}
                onNarrativeChange={(n) =>
                  setNarratives((prev) => ({ ...prev, technical: n }))
                }
              />
              <TechnicalReport insights={insights} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
