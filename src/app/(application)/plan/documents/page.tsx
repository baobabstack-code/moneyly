"use client";

import { useState } from "react";
import { useApplicationStore } from "@/lib/store";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function DocumentUploadsPage() {
  const router = useRouter();
  const { fileUrl, setFileUrl } = useApplicationStore();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      // Using the 'applications' bucket for simplicity as it exists in DB
      const { error: uploadError } = await supabase.storage
        .from('applications')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const fixedPublicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/applications/${filePath}`;
      setFileUrl(fixedPublicUrl);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <span className="text-secondary font-bold text-[10px] uppercase tracking-widest mb-2 block">Step 3 of 4</span>
        <h1 className="text-3xl font-bold text-primary mb-2">Supporting Documents</h1>
        <p className="text-on-surface-variant">Attach a receipt, invoice, or quote to this spending plan.</p>
        <div className="mt-6 relative w-full h-2 bg-outline-variant rounded-full overflow-hidden shadow-inner">
          <div className="absolute left-0 top-0 h-full bg-secondary w-[75%] transition-all duration-500 shadow-[0_0_8px_rgba(0,81,213,0.3)]"></div>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl mb-8 flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="max-w-xl mx-auto mb-10">
        {/* Document Upload */}
        <div className="bg-surface border-2 border-dashed border-outline-variant rounded-3xl p-8 flex flex-col items-center justify-center text-center group hover:border-secondary transition-colors relative overflow-hidden">
          {fileUrl ? (
            <div className="w-full">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <p className="text-sm font-bold text-primary mb-2">Document Attached</p>
              <p className="text-xs text-on-surface-variant mb-6">File successfully uploaded</p>
              <button 
                onClick={() => setFileUrl("")}
                className="text-xs font-bold text-error uppercase tracking-widest hover:underline"
              >
                Remove & Replace
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">upload_file</span>
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Quote, Invoice, or Receipt</h3>
              <p className="text-xs text-on-surface-variant mb-8 leading-relaxed">
                Scan or photo of a quote, invoice, <br /> or receipt (optional).
              </p>
              <label className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold text-sm cursor-pointer hover:shadow-lg transition-all active:scale-95">
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Uploading...
                  </div>
                ) : "Select File"}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,.pdf" 
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </>
          )}
        </div>
      </div>

      <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 flex gap-4 items-start mb-8">
        <span className="material-symbols-outlined text-secondary">info</span>
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">File Requirements</p>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Supported formats: JPG, PNG, PDF. Maximum file size: 5MB.
            Attaching files helps you keep all quotes and receipts in one place for this plan.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button
          type="button"
          onClick={() => router.push("/plan/details")}
          className="flex items-center gap-2 px-6 py-3 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all font-medium text-sm"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back
        </button>
        <button
          type="button"
          onClick={() => router.push("/plan/summary")}
          className="flex items-center gap-2 px-8 py-3 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all"
        >
          Continue to Summary
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
