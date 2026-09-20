import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  Box,
  Building2,
  CheckCircle2,
  ClipboardList,
  Cpu,
  Download,
  Eye,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Truck,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Textarea from "../components/common/Textarea";
import FormField from "../components/common/FormField";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Alert from "../components/common/Alert";
import Badge from "../components/common/Badge";
import StatTile from "../components/common/StatTile";
import { api, resourceApi } from "../lib/api";

const CATEGORIES = [
  "Hardware",
  "Software",
  "Equipment",
  "Facility",
  "Vehicle",
  "Tool",
  "Other",
];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];
const ASSESSMENT_STATUSES = [
  "Pass",
  "Needs Review",
  "Non-Compliant",
  "Retired",
];

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Hardware: Cpu,
  Software: Box,
  Equipment: Package,
  Facility: Building2,
  Vehicle: Truck,
  Tool: Wrench,
  Other: Package,
};

const STATUS_BADGE: Record<string, "green" | "amber" | "red" | "gray"> = {
  Pass: "green",
  "Needs Review": "amber",
  "Non-Compliant": "red",
  Retired: "gray",
};

const CONDITION_TEXT: Record<string, string> = {
  Excellent: "text-green-700",
  Good: "text-ink-700",
  Fair: "text-amber-700",
  Poor: "text-red-700",
};

const asset = resourceApi("assets");
const usersApi = resourceApi("users");

const fmtDate = (value: any) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const toDateInputValue = (value: any) => {
  if (!value) return "";
  const str = typeof value === "string" ? value : String(value);
  return str.slice(0, 10);
};

const emptyFilters = {
  category: "All",
  department: "All",
  condition: "All",
  assessmentStatus: "All",
};

export default function AssetsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(
    null,
  );
  const [previewError, setPreviewError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await asset.list("limit=100&sort=-createdAt");
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (exception: any) {
      setError(exception.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    usersApi
      .list("limit=100")
      .then((response) => setUsers(response.data || []))
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const departments = useMemo(
    () =>
      Array.from(
        new Set(rows.map((row) => row.department).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        [
          row.code,
          row.assetName,
          row.assetTag,
          row.location,
          row.department,
          row.notes,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesCategory =
        filters.category === "All" || row.category === filters.category;
      const matchesDepartment =
        filters.department === "All" || row.department === filters.department;
      const matchesCondition =
        filters.condition === "All" || row.condition === filters.condition;
      const matchesStatus =
        filters.assessmentStatus === "All" ||
        row.assessmentStatus === filters.assessmentStatus;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDepartment &&
        matchesCondition &&
        matchesStatus
      );
    });
  }, [rows, search, filters]);

  const summary = useMemo(
    () => ({
      total: rows.length,
      pass: rows.filter((row) => row.assessmentStatus === "Pass").length,
      needsReview: rows.filter((row) => row.assessmentStatus === "Needs Review")
        .length,
      nonCompliant: rows.filter(
        (row) => row.assessmentStatus === "Non-Compliant",
      ).length,
      retired: rows.filter((row) => row.assessmentStatus === "Retired").length,
    }),
    [rows],
  );

  const openPreview = async (row: any) => {
    setPreviewError(null);
    try {
      const blob = await api.getBlob(`/assets/${row._id}/photo`);
      const url = URL.createObjectURL(blob);
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return { name: row.photoName || row.assetName || "asset-photo", url };
      });
    } catch (err) {
      setPreviewError(
        err instanceof Error ? err.message : "Failed to load photo preview.",
      );
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const body = new FormData();
    [
      "assetName",
      "assetTag",
      "category",
      "location",
      "department",
      "condition",
      "assessmentStatus",
      "assessedBy",
      "assessmentDate",
      "notes",
    ].forEach((key) => {
      const value = form.get(key);
      if (value !== null && value !== "") body.append(key, String(value));
    });
    const photo = form.get("photo");
    if (photo instanceof File && photo.size > 0) body.append("photo", photo);

    try {
      if (editing?.mode === "edit") {
        await asset.update(editing._id, body);
      } else {
        await asset.create(body);
      }
      setEditing(null);
      await load();
    } catch (exception: any) {
      setError(exception.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await asset.remove(deleteTarget._id);
      setRows((current) =>
        current.filter((row) => row._id !== deleteTarget._id),
      );
      setDeleteTarget(null);
    } catch (exception: any) {
      setError(exception.message);
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters =
    filters.category !== "All" ||
    filters.department !== "All" ||
    filters.condition !== "All" ||
    filters.assessmentStatus !== "All";

  return (
    <div>
      <PageHeader
        title="Assets"
        subtitle="Asset inventory and assessment records, reviewed and evidenced like an audit work paper"
        action={
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setEditing({ mode: "create" })}
          >
            New Assessment
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatTile
          variant="card"
          icon={ClipboardList}
          label="Total Assets"
          value={summary.total}
          tone="blue"
        />
        <StatTile
          variant="card"
          icon={CheckCircle2}
          label="Pass"
          value={summary.pass}
          tone="green"
        />
        <StatTile
          variant="card"
          icon={AlertTriangle}
          label="Needs Review"
          value={summary.needsReview}
          tone="amber"
        />
        <StatTile
          variant="card"
          icon={XCircle}
          label="Non-Compliant"
          value={summary.nonCompliant}
          tone="red"
        />
        <StatTile
          variant="card"
          icon={Archive}
          label="Retired"
          value={summary.retired}
          tone="neutral"
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[220px] max-w-sm">
          <Input
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search assets, tags, locations…"
          />
        </div>

        <Select
          value={filters.category}
          onChange={(event) =>
            setFilters({ ...filters, category: event.target.value })
          }
          className="md:w-44"
          aria-label="Filter by type"
        >
          <option value="All">All types</option>
          {CATEGORIES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>

        <Select
          value={filters.department}
          onChange={(event) =>
            setFilters({ ...filters, department: event.target.value })
          }
          className="md:w-48"
          aria-label="Filter by department"
        >
          <option value="All">All departments</option>
          {departments.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>

        <Select
          value={filters.condition}
          onChange={(event) =>
            setFilters({ ...filters, condition: event.target.value })
          }
          className="md:w-40"
          aria-label="Filter by condition"
        >
          <option value="All">All conditions</option>
          {CONDITIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>

        <Select
          value={filters.assessmentStatus}
          onChange={(event) =>
            setFilters({ ...filters, assessmentStatus: event.target.value })
          }
          className="md:w-44"
          aria-label="Filter by assessment status"
        >
          <option value="All">All statuses</option>
          {ASSESSMENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => setFilters(emptyFilters)}
            className="text-xs text-slate-500 hover:text-ink-800 underline underline-offset-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">
          Loading assets…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-slate-300">
          <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-medium text-ink-900">
            No matching assessment records
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Adjust your filters or log a new asset assessment to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((row) => {
            const CategoryIcon = CATEGORY_ICON[row.category] || Package;

            return (
              <div
                key={row._id}
                className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(16,26,46,0.06)] ring-1 ring-ink-900/[0.06] flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 p-5 pb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 grid place-items-center shrink-0">
                      <CategoryIcon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold text-ink-900 truncate"
                        title={row.assetName}
                      >
                        {row.assetName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {row.category} · {row.assetTag}
                      </p>
                    </div>
                  </div>
                  <Badge
                    label={row.assessmentStatus}
                    variant={STATUS_BADGE[row.assessmentStatus] || "gray"}
                  />
                </div>

                <div className="px-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Location
                    </p>
                    <p className="text-ink-800 truncate" title={row.location}>
                      {row.location || "—"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Department
                    </p>
                    <p className="text-ink-800 truncate" title={row.department}>
                      {row.department || "—"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Condition
                    </p>
                    <p
                      className={`font-medium ${CONDITION_TEXT[row.condition] || "text-ink-800"}`}
                    >
                      {row.condition || "—"}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 mb-0.5">
                      Assessed
                    </p>
                    <p className="text-ink-800 truncate">
                      {fmtDate(row.assessmentDate)}
                    </p>
                  </div>
                </div>

                <div className="px-5 pt-3 mt-1 text-sm text-ink-800">
                  <p className="text-[11px] text-slate-400 mb-0.5">
                    Assessed by
                  </p>
                  <p className="truncate" title={row.assessedBy?.name}>
                    {row.assessedBy?.name || "—"}
                  </p>
                </div>

                {row.notes && (
                  <p
                    className="px-5 pt-3 text-xs text-slate-500 line-clamp-2"
                    title={row.notes}
                  >
                    {row.notes}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-end gap-0.5 px-3 py-2 border-t border-ink-900/[0.06]">
                  {row.photoName && (
                    <>
                      <button
                        type="button"
                        onClick={() => void openPreview(row)}
                        className="p-1.5 text-slate-400 hover:text-ink-700 rounded-md"
                        title="Preview photo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          api.download(
                            `/assets/${row._id}/photo`,
                            row.photoName,
                          )
                        }
                        className="p-1.5 text-slate-400 hover:text-ink-700 rounded-md"
                        title="Download photo"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing({ ...row, mode: "edit" })}
                    className="p-1.5 text-slate-400 hover:text-ink-700 rounded-md"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title={`${editing?.mode === "edit" ? "Edit" : "New"} Asset Assessment`}
        description="Changes are saved directly to MongoDB."
        footer={
          editing ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(null)}
              >
                Cancel
              </Button>
              <Button type="submit" form="asset-form" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          ) : null
        }
      >
        {editing && (
          <form id="asset-form" onSubmit={submit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Asset Name" required>
                <Input
                  name="assetName"
                  defaultValue={editing.assetName || ""}
                  required
                />
              </FormField>
              <FormField label="Asset Tag" required>
                <Input
                  name="assetTag"
                  defaultValue={editing.assetTag || ""}
                  required
                />
              </FormField>
              <FormField label="Type" required>
                <Select
                  name="category"
                  defaultValue={editing.category || ""}
                  required
                >
                  <option value="">Select…</option>
                  {CATEGORIES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Location" required>
                <Input
                  name="location"
                  defaultValue={editing.location || ""}
                  required
                />
              </FormField>
              <FormField label="Department" required>
                <Input
                  name="department"
                  list="asset-departments"
                  defaultValue={editing.department || ""}
                  required
                />
                <datalist id="asset-departments">
                  {departments.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </FormField>
              <FormField label="Condition" required>
                <Select
                  name="condition"
                  defaultValue={editing.condition || ""}
                  required
                >
                  <option value="">Select…</option>
                  {CONDITIONS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Assessment Status" required>
                <Select
                  name="assessmentStatus"
                  defaultValue={editing.assessmentStatus || ""}
                  required
                >
                  <option value="">Select…</option>
                  {ASSESSMENT_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Assessed By" required>
                <Select
                  name="assessedBy"
                  defaultValue={
                    editing.assessedBy?._id || editing.assessedBy || ""
                  }
                  required
                >
                  <option value="">Select…</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Assessment Date" required>
                <Input
                  name="assessmentDate"
                  type="date"
                  defaultValue={toDateInputValue(editing.assessmentDate)}
                  required
                />
              </FormField>
              <FormField label="Asset Photo" required={editing.mode !== "edit"}>
                <input
                  name="photo"
                  type="file"
                  accept=".png,.jpg,.jpeg"
                  required={editing.mode !== "edit"}
                  className="w-full text-sm text-slate-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-ink-800 file:text-white hover:file:bg-ink-900"
                />
                {editing.mode === "edit" && editing.photoName && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Current file: {editing.photoName}. Leave blank to keep it.
                  </p>
                )}
              </FormField>
              <FormField label="Assessment Notes" className="md:col-span-2">
                <Textarea name="notes" defaultValue={editing.notes || ""} />
              </FormField>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
        title="Photo Preview"
        description={preview?.name}
        size="lg"
      >
        {preview && (
          <div className="-m-5 bg-slate-950 flex items-center justify-center p-4 sm:p-6">
            <img
              src={preview.url}
              alt={preview.name}
              className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain bg-white shadow-xl"
            />
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(previewError)}
        onOpenChange={(open) => !open && setPreviewError(null)}
        title="Preview failed"
        size="sm"
      >
        <p className="text-sm text-slate-600">{previewError}</p>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete asset record"
        description="Delete this asset assessment record? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        busy={deleting}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
