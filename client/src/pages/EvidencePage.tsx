import React, { useEffect, useRef, useState } from "react";
import PageHeader from "../components/common/PageHeader";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import Select from "../components/common/Select";
import Input from "../components/common/Input";
import FormField from "../components/common/FormField";
import Alert from "../components/common/Alert";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import StatTile from "../components/common/StatTile";
import { api } from "../lib/api";
import { Upload, Download, FileText, Search, FolderOpen } from "lucide-react";

const DOC_TYPES = ["Policy", "Procedure", "Record", "Report", "Certificate"];
const DOC_TYPE_TONES: Record<
  string,
  "blue" | "purple" | "amber" | "green" | "indigo"
> = {
  Policy: "blue",
  Procedure: "purple",
  Record: "amber",
  Report: "green",
  Certificate: "indigo",
};

export default function EvidencePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.get("/evidence?limit=100&sort=-uploadedDate"),
      api.get("/audits?limit=100"),
    ])
      .then(([e, a]) => {
        setRows(e.data || []);
        setAudits(a.data || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const pickFile = () => fileInputRef.current?.click();

  const onFileChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setUploadOpen(true);
  };

  const submitUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pendingFile) return;

    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") || "").trim();
    const auditId = String(form.get("relatedAudit") || "");
    const docType = String(form.get("type") || "Record");

    if (!title || !auditId) return;

    const body = new FormData();
    body.append("file", pendingFile);
    body.append("title", title);
    body.append("type", docType);
    body.append("relatedAudit", auditId);
    body.append("tags", "uploaded");

    setBusy(true);
    setError("");
    try {
      const r = await api.post("/evidence", body);
      setRows((x) => [r.data, ...x]);
      setUploadOpen(false);
      setPendingFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const download = async (row: any) => {
    try {
      await api.download(
        `/evidence/${row._id}/download`,
        row.fileName || row.title || "evidence",
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filtered = rows.filter(
    (r) =>
      (type === "All" || r.type === type) &&
      (!search ||
        `${r.title} ${r.tags?.join(" ")} ${r.uploadedBy?.name}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );

  return (
    <div>
      <PageHeader
        title="Documents & Evidence"
        subtitle={`${rows.length} documents stored`}
        action={
          <>
            <Button
              icon={<Upload className="w-4 h-4" />}
              disabled={busy}
              onClick={pickFile}
            >
              Upload Document
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={onFileChosen}
            />
          </>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {rows.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <StatTile
            variant="card"
            tone="blue"
            icon={FileText}
            label="Total Documents"
            value={rows.length}
          />
          {DOC_TYPES.map((t) => (
            <StatTile
              key={t}
              variant="card"
              icon={FileText}
              tone={DOC_TYPE_TONES[t]}
              label={t}
              value={rows.filter((r) => r.type === t).length}
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
            placeholder="Search documents, tags…"
          />
        </div>
        <Select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="md:w-48"
        >
          <option>All</option>
          {DOC_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <LoadingState message="Loading documents…" />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={FolderOpen}
            title="No documents found"
            description="Try a different search or filter, or upload a new document."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((r) => (
            <div
              key={r._id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
            >
              <div className="flex justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-slate-50 grid place-items-center">
                  <FileText className="w-4 h-4 text-ink-700" />
                </div>
                <Badge label={r.type} />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">
                {r.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {r.uploadedBy?.name || "—"} · {r.fileSize || "—"}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Audit: {r.relatedAudit?.code || "—"}
              </p>
              {r.relatedFinding?.code && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Finding: {r.relatedFinding.code}
                </p>
              )}
              {r.fileName ? (
                <button
                  type="button"
                  onClick={() => download(r)}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-ink-700 hover:text-ink-900"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              ) : (
                <span className="mt-3 inline-flex items-center text-xs text-slate-400">
                  No file attached
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) {
            setPendingFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }}
        title="Upload document"
        description={pendingFile ? pendingFile.name : undefined}
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUploadOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" form="evidence-upload-form" disabled={busy}>
              {busy ? "Uploading…" : "Upload"}
            </Button>
          </>
        }
      >
        <form
          id="evidence-upload-form"
          onSubmit={submitUpload}
          className="space-y-4"
        >
          <FormField label="Document title" required>
            <Input
              name="title"
              defaultValue={pendingFile?.name.replace(/\.[^.]+$/, "")}
              required
              autoFocus
            />
          </FormField>
          <FormField label="Related audit" required>
            <Select name="relatedAudit" required defaultValue="">
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
          <FormField label="Document type" required>
            <Select name="type" defaultValue="Record" required>
              {DOC_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
