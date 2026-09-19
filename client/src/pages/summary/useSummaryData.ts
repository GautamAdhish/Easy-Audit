import { useEffect, useState } from "react";
import { resourceApi } from "../../lib/api";

// Aggregates every module the report draws from. Fetched once, shared by
// both the General (board) and Technical (auditor) report views so the two
// numbers can never disagree with each other.
export interface SummaryData {
  audits: any[];
  findings: any[];
  risks: any[];
  capas: any[];
  assets: any[];
  vendors: any[];
  checklist: any[];
  evidence: any[];
  loading: boolean;
  error: string;
}

const RESOURCES = [
  "audits",
  "findings",
  "risks",
  "capas",
  "assets",
  "vendors",
  "checklist",
  "evidence",
] as const;

export function useSummaryData(): SummaryData {
  const [state, setState] = useState<SummaryData>({
    audits: [],
    findings: [],
    risks: [],
    capas: [],
    assets: [],
    vendors: [],
    checklist: [],
    evidence: [],
    loading: true,
    error: "",
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all(RESOURCES.map((r) => resourceApi(r).list("limit=1000")))
      .then(
        ([
          audits,
          findings,
          risks,
          capas,
          assets,
          vendors,
          checklist,
          evidence,
        ]) => {
          if (cancelled) return;
          setState({
            audits: audits.data || [],
            findings: findings.data || [],
            risks: risks.data || [],
            capas: capas.data || [],
            assets: assets.data || [],
            vendors: vendors.data || [],
            checklist: checklist.data || [],
            evidence: evidence.data || [],
            loading: false,
            error: "",
          });
        },
      )
      .catch((e) => {
        if (!cancelled)
          setState((s) => ({ ...s, loading: false, error: e.message }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
