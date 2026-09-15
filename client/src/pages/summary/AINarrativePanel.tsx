import React, { useState } from "react";
import { Sparkles, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import Card, { CardBody } from "../../components/common/Card";
import { api } from "../../lib/api";
import type { Insights } from "./computeInsights";
import { toNarrativePayload } from "./computeInsights";
import type { NarrativeData } from "../../lib/exportPdf";

// Calls the backend OpenRouter integration — this component never generates text
// itself, it only triggers, loads, and renders the returned narrative.
const AINarrativePanel: React.FC<{
  reportType: "general" | "technical";
  insights: Insights;
  onNarrativeChange?: (data: NarrativeData | null) => void;
}> = ({ reportType, insights, onNarrativeChange }) => {
  const [state, setState] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [data, setData] = useState<NarrativeData | null>(null);
  const [error, setError] = useState("");

  const generate = async () => {
    setState("loading");
    setError("");
    try {
      const res = await api.post<NarrativeData>("/ai-reports/generate", {
        reportType,
        insights: toNarrativePayload(insights),
      });
      setData(res.data);
      setState("done");
      onNarrativeChange?.(res.data);
    } catch (e: any) {
      setError(e.message || "Failed to generate AI narrative.");
      setState("error");
      onNarrativeChange?.(null);
    }
  };

  return (
    <Card data-pdf-section className="print:break-inside-avoid">
      <CardBody>
        <div className="flex items-start justify-between gap-4 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brass-500/15 grid place-items-center shrink-0">
              <Sparkles className="w-4 h-4 text-brass-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900">AI Executive Narrative</p>
              <p className="text-xs text-slate-500">
                Written by AI from this audit's live data — {reportType === "general" ? "board-level, plain language" : "technical, for auditors"}
              </p>
            </div>
          </div>
          {state !== "idle" && (
            <button
              onClick={generate}
              disabled={state === "loading"}
              className="print:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-ink-900 hover:bg-slate-50 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${state === "loading" ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          )}
        </div>

        {state === "idle" && (
          <div className="py-6 text-center print:hidden">
            <button
              onClick={generate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-950 text-white text-sm font-medium hover:opacity-90 transition"
            >
              <Sparkles className="w-4 h-4 text-brass-400" />
              Generate AI Narrative
            </button>
          </div>
        )}

        {state === "loading" && (
          <div className="py-8 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analysing audit data…
          </div>
        )}

        {state === "error" && (
          <div className="py-4 flex items-start gap-2 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p>{error}</p>
              <button onClick={generate} className="text-xs underline mt-1 print:hidden">
                Try again
              </button>
            </div>
          </div>
        )}

        {state === "done" && data && (
          <div className="mt-3 space-y-4">
            <p className="text-sm font-semibold text-ink-900">{data.headline}</p>
            <div className="space-y-2">
              {data.narrative.split("\n\n").map((p, i) => (
                <p key={i} className="text-sm text-slate-600 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
            {data.topConcerns?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-900 uppercase tracking-wide mb-1.5">
                  {reportType === "general" ? "Top Concerns" : "Highest-Priority Exposures"}
                </p>
                <ul className="space-y-1">
                  {data.topConcerns.map((c, i) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.recommendations?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-ink-900 uppercase tracking-wide mb-1.5">Recommendations</p>
                <ul className="space-y-1">
                  {data.recommendations.map((r, i) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default AINarrativePanel;
