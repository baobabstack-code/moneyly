"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyProfile, saveProfile } from "@/lib/profile";

interface FormErrors {
  first_name?: string;
  last_name?: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: string;
  physical_address?: string;
  mobile_number?: string;
  email_address?: string;
  nok_full_name?: string;
  nok_address?: string;
  nok_mobile_number?: string;
  nok_relationship?: string;
  employer_name?: string;
  is_civil_servant?: string;
}

function validateNationalId(value: string): string | null {
  if (!value.trim()) return "National ID is required";
  if (value.length < 5 || value.length > 20) return "Invalid format";
  if (!/^[0-9A-Za-z]+$/.test(value)) return "Only letters/numbers";
  return null;
}

function validateMobile(value: string): string | null {
  if (!value.trim()) return "Mobile number is required";
  const cleaned = value.replace(/\s/g, "").replace(/-/g, "");
  const isValid = /^\+?263[789]\d{8}$/.test(cleaned) || /^0[789]\d{8}$/.test(cleaned) || /^[789]\d{8}$/.test(cleaned);
  if (!isValid) return "Enter valid Zimbabwe number";
  return null;
}

function validateDob(value: string): string | null {
  if (!value) return "Date of birth is required";
  const dob = new Date(value);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  const actualAge = m < 0 || (m === 0 && today.getDate() < dob.getDate()) ? age - 1 : age;
  if (actualAge < 18) return "Must be 18+ years";
  if (dob > today) return "Invalid date";
  return null;
}

const initialFormData = {
  first_name: "",
  last_name: "",
  national_id: "",
  date_of_birth: "",
  gender: "",
  physical_address: "",
  mobile_number: "",
  email_address: "",
  nok_full_name: "",
  nok_address: "",
  nok_mobile_number: "",
  nok_relationship: "",
  employer_name: "",
  employer_no: "",
  ministry: "",
  is_civil_servant: false,
  monthly_income: "",
  employment_phone: "",
};

const STORAGE_KEY = 'profile_draft';

function saveToStorage(data: typeof initialFormData) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage(): typeof initialFormData | null {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
  }
  return null;
}

function clearStorage() {
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    setLoading(true);
    const draft = loadFromStorage();
    if (draft) setFormData(draft);
    getMyProfile().then((p) => {
      if (p) {
        setFormData({
          first_name: p.first_name || draft?.first_name || "",
          last_name: p.last_name || draft?.last_name || "",
          national_id: p.national_id || draft?.national_id || "",
          date_of_birth: p.date_of_birth || draft?.date_of_birth || "",
          gender: p.gender || draft?.gender || "",
          physical_address: p.physical_address || draft?.physical_address || "",
          mobile_number: p.mobile_number || draft?.mobile_number || "",
          email_address: p.email_address || draft?.email_address || "",
          nok_full_name: p.nok_full_name || draft?.nok_full_name || "",
          nok_address: p.nok_address || draft?.nok_address || "",
          nok_mobile_number: p.nok_mobile_number || draft?.nok_mobile_number || "",
          nok_relationship: p.nok_relationship || draft?.nok_relationship || "",
          employer_name: p.employer_name || draft?.employer_name || "",
          employer_no: p.employer_no || draft?.employer_no || "",
          ministry: p.ministry || draft?.ministry || "",
          is_civil_servant: p.is_civil_servant ?? draft?.is_civil_servant ?? false,
          monthly_income: p.monthly_income || draft?.monthly_income || "",
          employment_phone: p.employment_phone || draft?.employment_phone || "",
        });
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => { saveToStorage(formData); }, [formData]);

  const validateField = (field: keyof FormErrors, value: any): string | null => {
    switch (field) {
      case "first_name": return !value.trim() ? "First name is required" : value.length < 2 ? "Too short" : null;
      case "last_name": return !value.trim() ? "Last name is required" : value.length < 2 ? "Too short" : null;
      case "national_id": return validateNationalId(value);
      case "date_of_birth": return validateDob(value);
      case "gender": return !value ? "Gender is required" : null;
      case "physical_address": return !value.trim() ? "Address is required" : value.length < 10 ? "Enter full address" : null;
      case "mobile_number": return validateMobile(value);
      case "email_address": return !value.trim() ? "Email is required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "Invalid email" : null;
      case "nok_full_name": return !value.trim() ? "Next of kin name is required" : null;
      case "nok_address": return !value.trim() ? "NOK address is required" : null;
      case "nok_mobile_number": return validateMobile(value);
      case "nok_relationship": return !value ? "Relationship is required" : null;
      case "employer_name": return !value.trim() && !formData.is_civil_servant ? "Employer is required" : null;
      case "is_civil_servant": return !value && value !== false ? "Required" : null;
      default: return null;
    }
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof FormErrors]);
    setErrors((prev) => ({ ...prev, [field]: error || undefined }));
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    const fields: (keyof FormErrors)[] = ["first_name", "last_name", "national_id", "date_of_birth", "gender", "physical_address", "mobile_number", "email_address", "nok_full_name", "nok_address", "nok_mobile_number", "nok_relationship", "employer_name", "is_civil_servant"];
    fields.forEach((field) => { const error = validateField(field, formData[field]); if (error) newErrors[field] = error; });
    setErrors(newErrors);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateAll()) return;
    setSaving(true);
    const saved = await saveProfile({ ...formData, is_profile_complete: true });
    setSaving(false);
    if (saved) { clearStorage(); router.push("/dashboard"); }
    else { alert("Failed to save. Please try again."); }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field as keyof FormErrors]) {
      const error = validateField(field as keyof FormErrors, value);
      setErrors((prev) => ({ ...prev, [field]: error || undefined }));
    }
  };

  const getFieldClass = (field: keyof FormErrors) => `w-full px-4 py-3 rounded-xl border bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none ${errors[field] && touched[field] ? "border-red-500" : "border-outline-variant"}`;
  const getInputClass = () => "w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none";

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-surface rounded-[32px] border border-outline-variant shadow-2xl overflow-hidden">
        <div className="bg-secondary text-on-secondary p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"><span className="material-symbols-outlined text-2xl">person_add</span></div>
            <div>
              <h1 className="text-2xl font-bold">Complete Your Profile</h1>
              <p className="text-on-secondary/80 text-sm">Complete all fields below to continue.</p>
            </div>
          </div>
        </div>
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div><label className="block font-label-md mb-2">First Name <span className="text-red-500">*</span></label><input type="text" className={getFieldClass("first_name")} value={formData.first_name} onChange={(e) => updateField("first_name", e.target.value)} onBlur={() => handleBlur("first_name")} />{errors.first_name && touched.first_name && <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>}</div>
          <div><label className="block font-label-md mb-2">Last Name <span className="text-red-500">*</span></label><input type="text" className={getFieldClass("last_name")} value={formData.last_name} onChange={(e) => updateField("last_name", e.target.value)} onBlur={() => handleBlur("last_name")} />{errors.last_name && touched.last_name && <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>}</div>
          <div><label className="block font-label-md mb-2">National ID <span className="text-red-500">*</span></label><input type="text" className={getFieldClass("national_id")} value={formData.national_id} onChange={(e) => updateField("national_id", e.target.value.toUpperCase())} onBlur={() => handleBlur("national_id")} />{errors.national_id && touched.national_id && <p className="text-red-500 text-sm mt-1">{errors.national_id}</p>}</div>
          <div><label className="block font-label-md mb-2">Date of Birth <span className="text-red-500">*</span></label><input type="date" className={getFieldClass("date_of_birth")} value={formData.date_of_birth} onChange={(e) => updateField("date_of_birth", e.target.value)} onBlur={() => handleBlur("date_of_birth")} max={new Date().toISOString().split("T")[0]} />{errors.date_of_birth && touched.date_of_birth && <p className="text-red-500 text-sm mt-1">{errors.date_of_birth}</p>}</div>
          <div><label className="block font-label-md mb-2">Gender <span className="text-red-500">*</span></label><div className="grid grid-cols-2 gap-4">{["Male", "Female"].map((g) => <button key={g} type="button" onClick={() => { updateField("gender", g); setTouched((prev) => ({ ...prev, gender: true })); setErrors((prev) => ({ ...prev, gender: undefined })); }} className={`py-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${formData.gender === g ? "bg-white text-secondary border-white" : "border-outline-variant hover:border-secondary/50"}`}><span className="material-symbols-outlined">{g === "Male" ? "male" : "female"}</span>{g}</button>)}</div>{errors.gender && touched.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}</div>
          <div><label className="block font-label-md mb-2">Physical Address <span className="text-red-500">*</span></label><textarea className={getFieldClass("physical_address")} value={formData.physical_address} onChange={(e) => updateField("physical_address", e.target.value)} onBlur={() => handleBlur("physical_address")} rows={2} />{errors.physical_address && touched.physical_address && <p className="text-red-500 text-sm mt-1">{errors.physical_address}</p>}</div>
          <div><label className="block font-label-md mb-2">Mobile Number <span className="text-red-500">*</span></label><input type="tel" className={getFieldClass("mobile_number")} value={formData.mobile_number} onChange={(e) => updateField("mobile_number", e.target.value)} onBlur={() => handleBlur("mobile_number")} placeholder="0771234567" />{errors.mobile_number && touched.mobile_number && <p className="text-red-500 text-sm mt-1">{errors.mobile_number}</p>}</div>
          <div><label className="block font-label-md mb-2">Email Address <span className="text-red-500">*</span></label><input type="email" className={getFieldClass("email_address")} value={formData.email_address} onChange={(e) => updateField("email_address", e.target.value)} onBlur={() => handleBlur("email_address")} placeholder="you@email.com" />{errors.email_address && touched.email_address && <p className="text-red-500 text-sm mt-1">{errors.email_address}</p>}</div>
          <div><label className="block font-label-md mb-2">Next of Kin Name <span className="text-red-500">*</span></label><input type="text" className={getFieldClass("nok_full_name")} value={formData.nok_full_name} onChange={(e) => updateField("nok_full_name", e.target.value)} onBlur={() => handleBlur("nok_full_name")} />{errors.nok_full_name && touched.nok_full_name && <p className="text-red-500 text-sm mt-1">{errors.nok_full_name}</p>}</div>
          <div><label className="block font-label-md mb-2">Next of Kin Address <span className="text-red-500">*</span></label><textarea className={getFieldClass("nok_address")} value={formData.nok_address} onChange={(e) => updateField("nok_address", e.target.value)} onBlur={() => handleBlur("nok_address")} rows={2} />{errors.nok_address && touched.nok_address && <p className="text-red-500 text-sm mt-1">{errors.nok_address}</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block font-label-md mb-2">NOK Mobile <span className="text-red-500">*</span></label><input type="tel" className={getFieldClass("nok_mobile_number")} value={formData.nok_mobile_number} onChange={(e) => updateField("nok_mobile_number", e.target.value)} onBlur={() => handleBlur("nok_mobile_number")} placeholder="0771234567" />{errors.nok_mobile_number && touched.nok_mobile_number && <p className="text-red-500 text-sm mt-1">{errors.nok_mobile_number}</p>}</div>
            <div><label className="block font-label-md mb-2">Relationship <span className="text-red-500">*</span></label><select className={getFieldClass("nok_relationship")} value={formData.nok_relationship} onChange={(e) => { updateField("nok_relationship", e.target.value); setTouched((prev) => ({ ...prev, nok_relationship: true })); }}><option value="">Select</option><option value="Spouse">Spouse</option><option value="Parent">Parent</option><option value="Sibling">Sibling</option><option value="Child">Child</option></select>{errors.nok_relationship && touched.nok_relationship && <p className="text-red-500 text-sm mt-1">{errors.nok_relationship}</p>}</div>
          </div>
          <div><label className="block font-label-md mb-3">Civil Servant? <span className="text-red-500">*</span></label><div className="grid grid-cols-2 gap-4"><button type="button" onClick={() => { updateField("is_civil_servant", true); setTouched((prev) => ({ ...prev, is_civil_servant: true })); }} className={`py-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${formData.is_civil_servant ? "bg-white text-secondary border-white" : "border-outline-variant hover:border-secondary/50"}`}><span className="material-symbols-outlined">work</span>Yes</button><button type="button" onClick={() => { updateField("is_civil_servant", false); setTouched((prev) => ({ ...prev, is_civil_servant: true })); }} className={`py-4 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${formData.is_civil_servant === false ? "bg-white text-secondary border-white" : "border-outline-variant hover:border-secondary/50"}`}><span className="material-symbols-outlined">business</span>No</button></div>{errors.is_civil_servant && touched.is_civil_servant && <p className="text-red-500 text-sm mt-1">{errors.is_civil_servant}</p>}</div>
          {formData.is_civil_servant && <div className="grid grid-cols-2 gap-4"><div><label className="block font-label-md mb-2">EC Number</label><input type="text" className={getInputClass()} value={formData.employer_no} onChange={(e) => updateField("employer_no", e.target.value.toUpperCase())} placeholder="EC12345" /></div><div><label className="block font-label-md mb-2">Ministry</label><input type="text" className={getInputClass()} value={formData.ministry} onChange={(e) => updateField("ministry", e.target.value)} placeholder="Ministry name" /></div></div>}
          {formData.is_civil_servant === false && <div><label className="block font-label-md mb-2">Employer <span className="text-red-500">*</span></label><input type="text" className={getFieldClass("employer_name")} value={formData.employer_name} onChange={(e) => updateField("employer_name", e.target.value)} onBlur={() => handleBlur("employer_name")} placeholder="Company name" />{errors.employer_name && touched.employer_name && <p className="text-red-500 text-sm mt-1">{errors.employer_name}</p>}</div>}
        </div>
        <div className="p-6 sm:p-8 border-t border-outline-variant"><button onClick={handleSave} disabled={saving} className="w-full py-4 bg-secondary text-on-secondary rounded-xl font-bold text-lg shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40">{saving ? "Saving..." : "Save Profile"}</button></div>
      </div>
    </div>
  );
}