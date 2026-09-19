import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Download,
  Eye,
  FileText,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import DataTable, {
  type DataTableColumn,
} from "../components/common/DataTable";
import Input from "../components/common/Input";
import Select from "../components/common/Select";
import Textarea from "../components/common/Textarea";
import FormField from "../components/common/FormField";
import Alert from "../components/common/Alert";
import Badge, { statusVariant } from "../components/common/Badge";
import IconChip from "../components/common/IconChip";
import StatTile from "../components/common/StatTile";
import { api } from "../lib/api";

const SEVERITIES = ["Major", "Minor", "Observation"];
const STATUSES = ["Open", "In Review", "Closed"];

const display = (value: any) =>
  typeof value === "object" && value
    ? value.name || value.title || value.code || "—"
    : (value ?? "—");

const toDateInput = (value: any) =>
  typeof value === "string" ? value.slice(0, 10) : "";

type Doc = {
  _id: string;
  title: string;
  fileName?: string;
  fileSize?: string;
  uploadedDate?: string;
  relatedFinding?: any;
};

export default function FindingsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<Doc[]>([]);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [docsFinding, setDocsFinding] = useState<any | null>(null);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(
    null,
  );
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [docBusyId, setDocBusyId] = useState<string | null>(null);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [f, a, u, e] = await Promise.all([
        api.get("/findings?limit=200&sort=-createdAt"),
        api.get("/audits?limit=100"),
        api.get("/users?limit=200"),
        api.get("/evidence?limit=500&sort=-uploadedDate"),
      ]);
      setRows(f.data || []);
      setAudits(a.data || []);
      setUsers(u.data || []);
      setEvidence(e.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const docsFor = (findingId: string) =>
    evidence.filter((e) => {
      const rel = e.relatedFinding as any;
      return (typeof rel === "object" ? rel?._id : rel) === findingId;
    });

  const filtered = rows.filter((row) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      `${row.code} ${row.title} ${row.department} ${display(row.assignee)}`
        .toLowerCase()
        .includes(query);
    const matchesSeverity =
      severityFilter === "All" || row.severity === severityFilter;
    const matchesStatus = statusFilter === "All" || row.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const openCreate = () => {
    setPendingFiles([]);
    setEditing({ mode: "create" });
  };

  const openEdit = (row: any) => {
    setPendingFiles([]);
    setEditing({ ...row, mode: "edit" });
  };

  const onFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length) setPendingFiles((current) => [...current, ...chosen]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((current) => current.filter((_, i) => i !== index));
  };

  const uploadDocument = async (
    findingId: string,
    auditId: string,
    file: File,
  ) => {
    const body = new FormData();
    body.append("relatedFinding", findingId);
    body.append("relatedAudit", auditId);
    body.append("title", file.name.replace(/\.[^.]+$/, ""));
    body.append("type", "Record");
    body.append("tags", "finding-evidence");
    body.append("file", file);
    await api.post("/evidence", body);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      department: String(form.get("department") || ""),
      auditId: String(form.get("auditId") || ""),
      severity: String(form.get("severity") || ""),
      status: String(form.get("status") || "Open"),
      assignee: String(form.get("assignee") || ""),
      dateFound: String(form.get("dateFound") || ""),
      dueDate: String(form.get("dueDate") || ""),
      description: String(form.get("description") || ""),
    };

    try {
      let findingId: string;
      if (editing?.mode === "edit") {
        await api.patch(`/findings/${editing._id}`, payload);
        findingId = editing._id;
      } else {
        const r = await api.post("/findings", payload);
        findingId = r.data._id;
      }

      const uploadErrors: string[] = [];
      for (const file of pendingFiles) {
        try {
          await uploadDocument(findingId, payload.auditId, file);
        } catch (err: any) {
          uploadErrors.push(`${file.name}: ${err.message}`);
        }
      }

      setPendingFiles([]);
      setEditing(null);
      await loadAll();

      if (uploadErrors.length) {
        setError(
          `Finding saved, but some documents failed to upload — ${uploadErrors.join("; ")}`,
        );
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/findings/${deleteTarget._id}`);
      setRows((current) =>
        current.filter((row) => row._id !== deleteTarget._id),
      );
      setDeleteTarget(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const openPreview = async (doc: Doc) => {
    setPreviewError(null);
    try {
      const blob = await api.getBlob(`/evidence/${doc._id}/download`);
      const url = URL.createObjectURL(blob);
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return { name: doc.fileName || doc.title || "document", url };
      });
    } catch (err) {
      setPreviewError(
        err instanceof Error ? err.message : "Failed to load document preview.",
      );
    }
  };

  const deleteDoc = async (doc: Doc) => {
    setDocBusyId(doc._id);
    try {
      await api.delete(`/evidence/${doc._id}`);
      setEvidence((current) => current.filter((d) => d._id !== doc._id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDocBusyId(null);
    }
  };

  const summaryTiles = useMemo(
    () => [
      { label: "Total Findings", value: rows.length, tone: "blue" as const },
      ...SEVERITIES.map((s) => ({
        label: s,
        value: rows.filter((r) => r.severity === s).length,
        tone:
          statusVariant(s) === "gray"
            ? ("neutral" as const)
            : (statusVariant(s) as any),
      })),
    ],
    [rows],
  );

  const columns: DataTableColumn<any>[] = [
    {
      key: "title",
      label: "Title",
      render: (row) => (
        <div className="flex items-center gap-3">
          <IconChip
            icon={AlertTriangle}
            tone={
              statusVariant(row.severity) === "gray"
                ? "neutral"
                : (statusVariant(row.severity) as any)
            }
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{row.title}</p>
            <p className="text-xs text-slate-400">{row.code}</p>
          </div>
        </div>
      ),
    },
    { key: "department", label: "Department", render: (row) => row.department },
    { key: "audit", label: "Audit", render: (row) => display(row.auditId) },
    {
      key: "severity",
      label: "Severity",
      render: (row) => <Badge label={row.severity} />,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <Badge label={row.status} />,
    },
    {
      key: "assignee",
      label: "Assignee",
      render: (row) => display(row.assignee),
    },
    {
      key: "dueDate",
      label: "Due Date",
      render: (row) => toDateInput(row.dueDate) || "—",
    },
    {
      key: "documents",
      label: "Documents",
      render: (row) => {
        const count = docsFor(row._id).length;
        return (
          <button
            type="button"
            onClick={() => setDocsFinding(row)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-ink-700"
            title="View attached documents"
          >
            <Paperclip className="w-3.5 h-3.5" />
            {count}
          </button>
        );
      },
    },
  ];

  const editingDocs = editing?.mode === "edit" ? docsFor(editing._id) : [];

  return (
    <div>
      <PageHeader
        title="Findings"
        subtitle="Track nonconformities, observations and remediation deadlines"
        action={
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            New
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {summaryTiles.map((tile) => (
            <StatTile
              key={tile.label}
              variant="card"
              icon={AlertTriangle}
              label={tile.label}
              value={tile.value}
              tone={tile.tone}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="flex-1 max-w-sm">
          <Input
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search findings…"
          />
        </div>
        <Select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="md:w-48"
        >
          <option>All</option>
          {SEVERITIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="md:w-48"
        >
          <option>All</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(row) => row._id}
        loading={loading}
        emptyTitle="No findings found"
        emptyDescription="Try a different search or filter, or create a new finding."
        renderActions={(row) => (
          <>
            <button
              onClick={() => openEdit(row)}
              className="p-2 text-slate-400 hover:text-ink-700 rounded"
              aria-label={`Edit ${row.title}`}
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteTarget(row)}
              className="p-2 text-slate-400 hover:text-red-600 rounded"
              aria-label={`Delete ${row.title}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      />

      <Modal
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
            setPendingFiles([]);
          }
        }}
        title={`${editing?.mode === "edit" ? "Edit" : "Create"} Finding`}
        description="Attach evidence as PDF — it's stored on the Documents page and linked to this finding."
        size="lg"
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
              <Button type="submit" form="finding-form" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          ) : null
        }
      >
        {editing && (
          <form id="finding-form" onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Title" required>
                <Input
                  name="title"
                  defaultValue={editing.title}
                  required
                  autoFocus
                />
              </FormField>
              <FormField label="Department" required>
                <Input
                  name="department"
                  defaultValue={editing.department}
                  required
                />
              </FormField>
              <FormField label="Audit" required>
                <Select
                  name="auditId"
                  required
                  defaultValue={editing.auditId?._id || editing.auditId || ""}
                >
                  <option value="" disabled>
                    Select an audit…
                  </option>
                  {audits.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.code} — {a.title}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Severity" required>
                <Select
                  name="severity"
                  required
                  defaultValue={editing.severity || ""}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {SEVERITIES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Status">
                <Select name="status" defaultValue={editing.status || "Open"}>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Assignee" required>
                <Select
                  name="assignee"
                  required
                  defaultValue={editing.assignee?._id || editing.assignee || ""}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Date Found" required>
                <Input
                  name="dateFound"
                  type="date"
                  required
                  defaultValue={toDateInput(editing.dateFound)}
                />
              </FormField>
              <FormField label="Due Date" required>
                <Input
                  name="dueDate"
                  type="date"
                  required
                  defaultValue={toDateInput(editing.dueDate)}
                />
              </FormField>
              <FormField label="Description" className="md:col-span-2">
                <Textarea
                  name="description"
                  defaultValue={editing.description}
                />
              </FormField>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-600">
                  Evidence documents (PDF only)
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Paperclip className="w-3.5 h-3.5" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Attach PDF
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="hidden"
                  onChange={onFilesChosen}
                />
              </div>

              {editingDocs.length > 0 && (
                <ul className="space-y-1.5 mb-2">
                  {editingDocs.map((doc) => (
                    <li
                      key={doc._id}
                      className="flex items-center justify-between gap-2 text-xs bg-slate-50 rounded-lg px-3 py-2"
                    >
                      <span className="flex items-center gap-1.5 min-w-0 text-slate-600">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{doc.title}</span>
                      </span>
                      <span className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => void openPreview(doc)}
                          className="p-1.5 text-slate-400 hover:text-ink-700 rounded"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            api.download(
                              `/evidence/${doc._id}/download`,
                              doc.fileName || doc.title,
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-ink-700 rounded"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteDoc(doc)}
                          disabled={docBusyId === doc._id}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {pendingFiles.length > 0 && (
                <ul className="space-y-1.5">
                  {pendingFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between gap-2 text-xs bg-brass-50 rounded-lg px-3 py-2"
                    >
                      <span className="flex items-center gap-1.5 min-w-0 text-ink-800">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{file.name}</span>
                        <span className="text-slate-400 shrink-0">
                          (not yet uploaded)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removePendingFile(index)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded shrink-0"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {editingDocs.length === 0 && pendingFiles.length === 0 && (
                <p className="text-xs text-slate-400">
                  No documents attached yet.
                </p>
              )}
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={Boolean(docsFinding)}
        onOpenChange={(open) => !open && setDocsFinding(null)}
        title="Attached Documents"
        description={
          docsFinding ? `${docsFinding.code} — ${docsFinding.title}` : undefined
        }
        size="md"
      >
        {docsFinding &&
          (docsFor(docsFinding._id).length === 0 ? (
            <p className="text-sm text-slate-500">
              No documents attached to this finding.
            </p>
          ) : (
            <ul className="space-y-2">
              {docsFor(docsFinding._id).map((doc) => (
                <li
                  key={doc._id}
                  className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-ink-700 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {doc.title}
                      </p>
                      <p className="text-xs text-slate-400">
                        {doc.fileSize || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => void openPreview(doc)}
                      className="p-2 text-slate-400 hover:text-ink-700 rounded"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        api.download(
                          `/evidence/${doc._id}/download`,
                          doc.fileName || doc.title,
                        )
                      }
                      className="p-2 text-slate-400 hover:text-ink-700 rounded"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteDoc(doc)}
                      disabled={docBusyId === doc._id}
                      className="p-2 text-slate-400 hover:text-red-600 rounded"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </Modal>

      <Modal
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
        title="Document Preview"
        description={preview?.name}
        size="lg"
        footer={
          preview && (
            <Button
              icon={<Download className="w-4 h-4" />}
              onClick={() => {
                const a = document.createElement("a");
                a.href = preview.url;
                a.download = preview.name;
                a.click();
              }}
            >
              Download
            </Button>
          )
        }
      >
        {preview && (
          <iframe
            src={preview.url}
            title={preview.name}
            className="w-full h-[70vh] rounded-lg border border-slate-200 bg-white"
          />
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
        title="Delete finding"
        description="Delete this finding? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        busy={deleting}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
