"use client";

import { useState } from "react";
import { useApplicationStore } from "@/lib/store";
import { createClient } from "@/utils/supabase/client";

export default function DocumentUploadsPage() {
  const { documentUploads, setDocumentUploads } = useApplicationStore();
  const [uploading, setUploading] = useState<{ id: boolean; payslip: boolean }>({ id: false, payslip: false });
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'payslip') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));
    setError(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `documents/${type}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('applications') // Using the 'applications' bucket (common pattern)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('applications')
        .getPublicUrl(filePath);

      if (type === 'id') {
        setDocumentUploads({ idCopyUrl: publicUrl });
      } else {
        setDocumentUploads({ payslipUrl: publicUrl });
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file.");
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-primary mb-2">Document Uploads</h1>
        <p className="text-on-surface-variant">Please provide high-quality scans of your supporting documents.</p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl mb-8 flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* ID Copy Upload */}
        <div className="bg-surface border-2 border-dashed border-outline-variant rounded-3xl p-8 flex flex-col items-center justify-center text-center group hover:border-secondary transition-colors relative overflow-hidden">
          {documentUploads.idCopyUrl ? (
            <div className="w-full">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <p className="text-sm font-bold text-primary mb-2">National ID Uploaded</p>
              <p className="text-xs text-on-surface-variant mb-6">File successfully processed</p>
              <button 
                onClick={() => setDocumentUploads({ idCopyUrl: "" })}
                className="text-xs font-bold text-error uppercase tracking-widest hover:underline"
              >
                Remove & Replace
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">badge</span>
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">National ID Copy</h3>
              <p className="text-xs text-on-surface-variant mb-8 leading-relaxed">
                Clear scan or photo of your original <br /> National Identity Card.
              </p>
              <label className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold text-sm cursor-pointer hover:shadow-lg transition-all active:scale-95">
                {uploading.id ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Uploading...
                  </div>
                ) : "Select File"}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,.pdf" 
                  onChange={(e) => handleFileUpload(e, 'id')}
                  disabled={uploading.id}
                />
              </label>
            </>
          )}
        </div>

        {/* Payslip Upload */}
        <div className="bg-surface border-2 border-dashed border-outline-variant rounded-3xl p-8 flex flex-col items-center justify-center text-center group hover:border-secondary transition-colors relative overflow-hidden">
          {documentUploads.payslipUrl ? (
            <div className="w-full">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <p className="text-sm font-bold text-primary mb-2">Latest Payslip Uploaded</p>
              <p className="text-xs text-on-surface-variant mb-6">Income proof verified</p>
              <button 
                onClick={() => setDocumentUploads({ payslipUrl: "" })}
                className="text-xs font-bold text-error uppercase tracking-widest hover:underline"
              >
                Remove & Replace
              </button>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">payments</span>
              </div>
              <h3 className="text-lg font-bold text-primary mb-2">Latest Payslip</h3>
              <p className="text-xs text-on-surface-variant mb-8 leading-relaxed">
                Your most recent payslip showing <br /> current income and EC number.
              </p>
              <label className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold text-sm cursor-pointer hover:shadow-lg transition-all active:scale-95">
                {uploading.payslip ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Uploading...
                  </div>
                ) : "Select File"}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,.pdf" 
                  onChange={(e) => handleFileUpload(e, 'payslip')}
                  disabled={uploading.payslip}
                />
              </label>
            </>
          )}
        </div>
      </div>

      <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/30 flex gap-4 items-start">
        <span className="material-symbols-outlined text-secondary">info</span>
        <div>
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Upload Requirements</p>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Supported formats: JPG, PNG, PDF. Maximum file size: 5MB per document. 
            Ensure all details are legible and the document is not cropped.
          </p>
        </div>
      </div>
    </div>
  );
}
