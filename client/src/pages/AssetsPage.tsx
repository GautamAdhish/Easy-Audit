import { useEffect, useState } from "react";
import { Download, Eye, Image } from "lucide-react";
import ResourcePage from "../components/common/ResourcePage";
import Modal from "../components/common/Modal";
import { api } from "../lib/api";

export default function AssetsPage() {
  const [preview, setPreview] = useState<{
    name: string;
    url: string;
  } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const openPreview = async (row: any) => {
    setPreviewError(null);
    try {
      const blob = await api.getBlob(`/assets/${row._id}/photo`);
      const url = URL.createObjectURL(blob);

      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return {
          name: row.photoName || row.assetName || "asset-photo",
          url,
        };
      });
    } catch (err) {
      setPreviewError(
        err instanceof Error ? err.message : "Failed to load photo preview.",
      );
    }
  };

  return (
    <>
      <ResourcePage
        title="Assets"
        subtitle="Asset inventory and assessment records with photo evidence"
        resource="assets"
        icon={Image}
        searchKeys={[
          "code",
          "assetName",
          "assetTag",
          "location",
          "department",
          "notes",
        ]}
        filters={[
          {
            key: "category",
            label: "Category",
            values: [
              "Hardware",
              "Equipment",
              "Facility",
              "Vehicle",
              "Tool",
              "Other",
            ],
          },
          {
            key: "condition",
            label: "Condition",
            values: ["Excellent", "Good", "Fair", "Poor"],
          },
          {
            key: "assessmentStatus",
            label: "Assessment Status",
            values: ["Pass", "Needs Review", "Non-Compliant", "Retired"],
          },
        ]}
        fields={[
          { key: "code", label: "ID", hiddenInTable: true },
          { key: "assetName", label: "Asset Name", required: true },
          { key: "assetTag", label: "Asset Tag", required: true },
          {
            key: "category",
            label: "Category",
            options: [
              "Hardware",
              "Equipment",
              "Facility",
              "Vehicle",
              "Tool",
              "Other",
            ],
            required: true,
          },
          { key: "location", label: "Location", required: true },
          { key: "department", label: "Department", required: true },
          {
            key: "condition",
            label: "Condition",
            options: ["Excellent", "Good", "Fair", "Poor"],
            required: true,
          },
          {
            key: "assessmentStatus",
            label: "Assessment Status",
            options: ["Pass", "Needs Review", "Non-Compliant", "Retired"],
            required: true,
          },
          {
            key: "assessedBy",
            label: "Assessed By",
            required: true,
            selectResource: "users",
          },
          {
            key: "assessmentDate",
            label: "Assessment Date",
            type: "date",
            required: true,
          },
          { key: "notes", label: "Assessment Notes", multiline: true },
          {
            key: "photo",
            label: "Asset Photo",
            type: "file",
            accept: ".png,.jpg,.jpeg",
            required: true,
            hiddenInTable: true,
          },
          { key: "photoName", label: "Photo File", hiddenInForm: true },
          { key: "photoSize", label: "Photo Size", hiddenInForm: true },
        ]}
        rowActions={(row) =>
          row.photoName ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  void openPreview(row);
                }}
                className="p-2 text-slate-400 hover:text-ink-700 rounded"
                title="Preview photo"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  api.download(`/assets/${row._id}/photo`, row.photoName)
                }
                className="p-2 text-slate-400 hover:text-ink-700 rounded"
                title="Download photo"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ) : null
        }
      />

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
    </>
  );
}
