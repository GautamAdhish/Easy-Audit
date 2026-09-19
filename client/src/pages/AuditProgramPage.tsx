import React, { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import ProgressBar from "../components/common/ProgressBar";
import Card, { CardBody } from "../components/common/Card";
import StatTile from "../components/common/StatTile";
import { api } from "../lib/api";

const months = [
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

const STATUS_TONES: Record<string, "green" | "blue" | "neutral" | "red"> = {
  Completed: "green",
  "In Progress": "blue",
  Planned: "neutral",
  Overdue: "red",
};

export default function AuditProgramPage() {
  const [audits, setAudits] = useState<any[]>([]);
  useEffect(() => {
    api.get("/audits?limit=100").then((r) => setAudits(r.data || []));
  }, []);
  const depts = [...new Set(audits.map((a) => a.department))];
  const completed = audits.filter((a) => a.status === "Completed").length;
  const statusCounts = Object.keys(STATUS_TONES).map((status) => ({
    status,
    count: audits.filter((a) => a.status === status).length,
  }));

  return (
    <div>
      <PageHeader
        title="Audit Program"
        subtitle="Annual audit schedule and progress"
      />

      {audits.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatTile
            variant="card"
            tone="blue"
            icon={BookOpen}
            label="Total Audits"
            value={audits.length}
          />
          {statusCounts.map(({ status, count }) => (
            <StatTile
              key={status}
              variant="card"
              icon={BookOpen}
              tone={STATUS_TONES[status]}
              label={status}
              value={count}
            />
          ))}
        </div>
      )}

      <Card className="mb-5">
        <CardBody>
          <div className="flex justify-between mb-3">
            <span className="text-sm font-semibold text-ink-900">
              Annual Program Progress
            </span>
            <span className="text-sm font-bold text-ink-900">
              {completed}/{audits.length} completed
            </span>
          </div>
          <ProgressBar
            value={
              audits.length ? Math.round((completed / audits.length) * 100) : 0
            }
          />
        </CardBody>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-4 font-semibold w-36">Department</th>
                {months.map((m) => (
                  <th
                    key={m}
                    className="px-3 py-4 font-semibold text-center min-w-[64px]"
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {depts.map((d) => (
                <tr key={d} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-600">{d}</td>
                  {months.map((m, i) => (
                    <td key={m} className="px-2 py-4 text-center">
                      {audits
                        .filter(
                          (a) =>
                            a.department === d &&
                            new Date(a.startDate).getMonth() === i,
                        )
                        .map((a) => (
                          <div key={a._id}>
                            <Badge label={a.status} />
                          </div>
                        ))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
