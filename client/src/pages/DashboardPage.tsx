import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Loader,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  MinusCircle,
  Eye,
  Clock,
  TrendingUp,
  ShieldAlert,
  FileText,
  Plus,
  Users2,
  type LucideIcon,
} from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import ComplianceHeroCard from "../components/dashboard/ComplianceHeroCard";
import ComplianceChart from "../components/dashboard/ComplianceChart";
import NcTrendChart from "../components/dashboard/NcTrendChart";
import Card, { CardHeader, CardBody } from "../components/common/Card";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import StatTile from "../components/common/StatTile";
import IconChip from "../components/common/IconChip";
import AvatarStack from "../components/common/AvatarStack";
import DataTable, {
  type DataTableColumn,
} from "../components/common/DataTable";
import LoadingState from "../components/common/LoadingState";
import Alert from "../components/common/Alert";

const iconMap: Record<string, LucideIcon> = {
  ClipboardList,
  Loader,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  MinusCircle,
  Eye,
  Clock,
  TrendingUp,
  ShieldAlert,
  FileText,
};

type StatCard = {
  label: string;
  value: number | string;
  color: string;
  icon: string;
};

type Audit = {
  _id: string;
  code: string;
  title: string;
  department: string;
  auditor?: { name: string };
  status: string;
  compliance?: number;
};

const statusChipTone = (
  status: string,
): "green" | "red" | "amber" | "neutral" =>
  status === "Completed"
    ? "green"
    : status === "Overdue"
      ? "red"
      : status === "In Progress"
        ? "amber"
        : "neutral";

const columns: DataTableColumn<Audit>[] = [
  {
    key: "title",
    label: "Audit",
    render: (a) => (
      <div className="flex items-center gap-3">
        <IconChip icon={ClipboardList} tone={statusChipTone(a.status)} />
        <div className="min-w-0">
          <p className="font-medium text-ink-900 truncate">{a.title}</p>
          <p className="text-xs text-slate-400 font-mono">{a.code}</p>
        </div>
      </div>
    ),
  },
  { key: "department", label: "Department" },
  { key: "auditor", label: "Auditor", render: (a) => a.auditor?.name || "—" },
  { key: "status", label: "Status", render: (a) => <Badge label={a.status} /> },
  {
    key: "compliance",
    label: "Compliance",
    align: "right",
    render: (a) => (a.compliance ? `${a.compliance}%` : "—"),
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<{
    statCards: StatCard[];
    complianceByDepartment: any[];
    ncTrend: any[];
  }>({ statCards: [], complianceByDepartment: [], ncTrend: [] });
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/overview"),
      api.get("/audits?limit=6&sort=-createdAt"),
    ])
      .then(([a, b]) => {
        setData(a.data);
        setAudits(b.data || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading dashboard…" />;

  const complianceCard = data.statCards.find((c) => c.label === "Compliance");
  const complianceValue = complianceCard
    ? parseInt(String(complianceCard.value), 10) || 0
    : 0;
  const otherStats = data.statCards.filter((c) => c.label !== "Compliance");
  const auditorNames = audits
    .map((a) => a.auditor?.name)
    .filter(Boolean) as string[];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[28px] font-bold text-ink-900 tracking-tight leading-tight">
            Welcome back,{" "}
            <span className="text-slate-400">
              {user?.name?.split(" ")[0] || "there"}
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Live overview from the IS Audit database
          </p>
        </div>
        <Link to="/audits">
          <Button icon={<Plus className="w-4 h-4" />}>New Audit</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        <div className="lg:col-span-3">
          <ComplianceHeroCard value={complianceValue} />
        </div>
        <div className="lg:col-span-5">
          <ComplianceChart data={data.complianceByDepartment} />
        </div>
        <div className="lg:col-span-4">
          <NcTrendChart
            data={data.ncTrend}
            footer={
              <div className="flex gap-2">
                <Link to="/findings" className="flex-1">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
                  >
                    View Findings
                  </Button>
                </Link>
                <Link to="/capa" className="flex-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center"
                  >
                    View CAPA
                  </Button>
                </Link>
              </div>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
        <div className="lg:col-span-9 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
          {otherStats.map((c) => (
            <StatTile
              key={c.label}
              variant="card"
              label={c.label}
              value={c.value}
              tone={c.color as any}
              icon={iconMap[c.icon] ?? ClipboardList}
            />
          ))}
        </div>
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader
              title="Assigned Auditors"
              subtitle="Across recent audits"
            />
            <CardBody className="pt-0">
              {auditorNames.length ? (
                <>
                  <AvatarStack names={auditorNames} max={5} />
                  <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
                    <Users2 className="w-3.5 h-3.5" />
                    {new Set(auditorNames).size} auditor
                    {new Set(auditorNames).size === 1 ? "" : "s"} on recent
                    audits
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400">
                  No auditors assigned yet.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Recent Audits</h3>
        <Link
          to="/audits"
          className="text-xs font-medium text-ink-700 hover:text-ink-900"
        >
          View all →
        </Link>
      </div>
      <DataTable
        columns={columns}
        rows={audits}
        rowKey={(row) => row._id}
        emptyTitle="No audits yet"
        emptyDescription="Recently created audits will show up here."
      />
    </div>
  );
}
