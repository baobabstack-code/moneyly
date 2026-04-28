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
  const cleaned = value.replace(/\s/g, "");
  if (!/^\+?263[789]\d{8}$/.test(cleaned) && !/^0?7[789]\d{8}$/.test(cleaned)) {
    return "Enter valid Zimbabwe number";
  }
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

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    setLoading(true);
    getMyProfile().then((p) => {
      if (p) {
        setFormData({
          first_name: p.first_name || "",
          last_name: p.last_name || "",
          national_id: p.national_id || "",
          date_of_birth: p.date_of_birth || "",
          gender: p.gender || "",
          physical_address: p.physical_address || "",
          mobile_number: p.mobile_number || "",
          email_address: p.email_address || "",
          nok_full_name: p.nok_full_name || "",
          nok_address: p.nok_address || "",
          nok_mobile_number: p.nok_mobile_number || "",
          nok_relationship: p.nok_relationship || "",
          employer_name: p.employer_name || "",
          employer_no: p.employer_no || "",
          ministry: p.ministry || "",
          is_civil_servant: p.is_civil_servant || false,
          monthly_income: p.monthly_income || "",
          employment_phone: p.employment_phone || "",
        });
      }
      setLoading(false);
    });
  }, []);

  const validateField = (field: keyof FormErrors, value: any): string | null => {
    switch (field) {
      case "first_name":
        if (!value.trim()) return "First name is required";
        if (value.length < 2) return "Too short";
        return null;
      case "last_name":
        if (!value.trim()) return "Last name is required";
        if (value.length < 2) return "Too short";
        return null;
      case "national_id":
        return validateNationalId(value);
      case "date_of_birth":
        return validateDob(value);
      case "gender":
        if (!value) return "Gender is required";
        return null;
      case "physical_address":
        if (!value.trim()) return "Address is required";
        if (value.length < 10) return "Enter full address";
        return null;
      case "mobile_number":
        return validateMobile(value);
      case "email_address":
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email";
        return null;
      case "nok_full_name":
        if (!value.trim()) return "Next of kin name is required";
        return null;
      case "nok_address":
        if (!value.trim()) return "NOK address is required";
        return null;
      case "nok_mobile_number":
        return validateMobile(value);
      case "nok_relationship":
        if (!value) return "Relationship is required";
        return null;
      case "employer_name":
        if (!value.trim() && !formData.is_civil_servant) return "Employer is required";
        return null;
      case "is_civil_servant":
        if (value === "" || value === null) return "Required";
        return null;
      default:
        return null;
    }
  };

  const handleBlur = (field: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof FormErrors]);
    setErrors((prev) => ({ ...prev, [field]: error || undefined }));
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    const fields: (keyof FormErrors)[] = [
      "first_name", "last_name", "national_id", "date_of_birth", "gender",
      "physical_address", "mobile_number", "email_address",
      "nok_full_name", "nok_address", "nok_mobile_number", "nok_relationship",
      "employer_name", "is_civil_servant"
    ];
    fields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });
    setErrors(newErrors);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateAll()) return;

    setSaving(true);
    const saved = await saveProfile({
      ...formData,
      is_profile_complete: true,
    });
    setSaving(false);

    if (saved) {
      router.push("/dashboard");
    } else {
      alert("Failed to save. Please try again.");
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field as keyof FormErrors]) {
      const error = validateField(field as keyof FormErrors, value);
      setErrors((prev) => ({ ...prev, [field]: error || undefined }));
    }
  };

  const getFieldClass = (field: keyof FormErrors) =>
    `w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border bg-surface text-on-surface text-sm sm:text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none ${
      errors[field] && touched[field] ? "border-red-500" : "border-outline-variant"
    }`;

  const getInputClass = () => "w-full px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-outline-variant bg-surface text-on-surface text-sm sm:text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none";

  const getLabelClass = () => "block font-label-md text-label-md mb-1.5 sm:mb-2 text-on-surface";
  const getErrorClass = () => "text-red-500 text-xs sm:text-sm mt-1";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">Complete Your Profile</h1>
        <p className="text-on-surface-variant text-sm sm:text-base">All fields are required.</p>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 mb-4 sm:mb-6">
        <h2 className="font-bold text-base sm:text-lg text-primary border-b border-outline-variant/30 pb-2">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className={getLabelClass()}>First Name <span className="text-red-500">*</span></label>
            <input type="text" className={getFieldClass("first_name")} value={formData.first_name} onChange={(e) => updateField("first_name", e.target.value)} onBlur={() => handleBlur("first_name")} />
            {errors.first_name && touched.first_name && <p className={getErrorClass()}>{errors.first_name}</p>}
          </div>
          <div>
            <label className={getLabelClass()}>Last Name <span className="text-red-500">*</span></label>
            <input type="text" className={getFieldClass("last_name")} value={formData.last_name} onChange={(e) => updateField("last_name", e.target.value)} onBlur={() => handleBlur("last_name")} />
            {errors.last_name && touched.last_name && <p className={getErrorClass()}>{errors.last_name}</p>}
          </div>
        </div>
        <div>
          <label className={getLabelClass()}>National ID <span className="text-red-500">*</span></label>
          <input type="text" className={getFieldClass("national_id")} value={formData.national_id} onChange={(e) => updateField("national_id", e.target.value.toUpperCase())} onBlur={() => handleBlur("national_id")} />
          {errors.national_id && touched.national_id && <p className={getErrorClass()}>{errors.national_id}</p>}
        </div>
        <div>
          <label className={getLabelClass()}>Date of Birth <span className="text-red-500">*</span></label>
          <input type="date" className={getFieldClass("date_of_birth")} value={formData.date_of_birth} onChange={(e) => updateField("date_of_birth", e.target.value)} onBlur={() => handleBlur("date_of_birth")} max={new Date().toISOString().split("T")[0]} />
          {errors.date_of_birth && touched.date_of_birth && <p className={getErrorClass()}>{errors.date_of_birth}</p>}
        </div>
        <div>
          <label className="block font-label-md text-label-md mb-2 sm:mb-3 text-on-surface">Gender <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {["Male", "Female"].map((g) => (
              <button key={g} type="button" onClick={() => { updateField("gender", g); setTouched((prev) => ({ ...prev, gender: true })); setErrors((prev) => ({ ...prev, gender: undefined })); }} className={`py-3 sm:py-4 rounded-xl border-2 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${formData.gender === g ? "bg-secondary text-on-secondary border-secondary" : "border-outline-variant hover:border-secondary/50"}`}>
                <span className="material-symbols-outlined text-lg sm:text-xl">{g === "Male" ? "male" : "female"}</span>
                {g}
              </button>
            ))}
          </div>
          {errors.gender && touched.gender && <p className={getErrorClass()}>{errors.gender}</p>}
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 mb-4 sm:mb-6">
        <h2 className="font-bold text-base sm:text-lg text-primary border-b border-outline-variant/30 pb-2">Contact Details</h2>
        <div>
          <label className={getLabelClass()}>Physical Address <span className="text-red-500">*</span></label>
          <textarea className={getFieldClass("physical_address")} value={formData.physical_address} onChange={(e) => updateField("physical_address", e.target.value)} onBlur={() => handleBlur("physical_address")} rows={2} />
          {errors.physical_address && touched.physical_address && <p className={getErrorClass()}>{errors.physical_address}</p>}
        </div>
        <div>
          <label className={getLabelClass()}>Mobile Number <span className="text-red-500">*</span></label>
          <input type="tel" className={getFieldClass("mobile_number")} value={formData.mobile_number} onChange={(e) => updateField("mobile_number", e.target.value)} onBlur={() => handleBlur("mobile_number")} placeholder="+263 771 234 567" />
          {errors.mobile_number && touched.mobile_number && <p className={getErrorClass()}>{errors.mobile_number}</p>}
        </div>
        <div>
          <label className={getLabelClass()}>Email Address <span className="text-red-500">*</span></label>
          <input type="email" className={getFieldClass("email_address")} value={formData.email_address} onChange={(e) => updateField("email_address", e.target.value)} onBlur={() => handleBlur("email_address")} placeholder="you@email.com" />
          {errors.email_address && touched.email_address && <p className={getErrorClass()}>{errors.email_address}</p>}
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 mb-4 sm:mb-6">
        <h2 className="font-bold text-base sm:text-lg text-primary border-b border-outline-variant/30 pb-2">Next of Kin</h2>
        <div>
          <label className={getLabelClass()}>Full Name <span className="text-red-500">*</span></label>
          <input type="text" className={getFieldClass("nok_full_name")} value={formData.nok_full_name} onChange={(e) => updateField("nok_full_name", e.target.value)} onBlur={() => handleBlur("nok_full_name")} />
          {errors.nok_full_name && touched.nok_full_name && <p className={getErrorClass()}>{errors.nok_full_name}</p>}
        </div>
        <div>
          <label className={getLabelClass()}>Address <span className="text-red-500">*</span></label>
          <textarea className={getFieldClass("nok_address")} value={formData.nok_address} onChange={(e) => updateField("nok_address", e.target.value)} onBlur={() => handleBlur("nok_address")} rows={2} />
          {errors.nok_address && touched.nok_address && <p className={getErrorClass()}>{errors.nok_address}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className={getLabelClass()}>Mobile Number <span className="text-red-500">*</span></label>
            <input type="tel" className={getFieldClass("nok_mobile_number")} value={formData.nok_mobile_number} onChange={(e) => updateField("nok_mobile_number", e.target.value)} onBlur={() => handleBlur("nok_mobile_number")} placeholder="+263 771 234 567" />
            {errors.nok_mobile_number && touched.nok_mobile_number && <p className={getErrorClass()}>{errors.nok_mobile_number}</p>}
          </div>
          <div>
            <label className={getLabelClass()}>Relationship <span className="text-red-500">*</span></label>
            <select className={getFieldClass("nok_relationship")} value={formData.nok_relationship} onChange={(e) => { updateField("nok_relationship", e.target.value); setTouched((prev) => ({ ...prev, nok_relationship: true })); }} onBlur={() => handleBlur("nok_relationship")}>
              <option value="">Select</option>
              <option value="Spouse">Spouse</option>
              <option value="Parent">Parent</option>
              <option value="Sibling">Sibling</option>
              <option value="Child">Child</option>
              <option value="Other">Other</option>
            </select>
            {errors.nok_relationship && touched.nok_relationship && <p className={getErrorClass()}>{errors.nok_relationship}</p>}
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 mb-4 sm:mb-6">
        <h2 className="font-bold text-base sm:text-lg text-primary border-b border-outline-variant/30 pb-2">Employment</h2>
        <div>
          <label className="block font-label-md text-label-md mb-2 sm:mb-3 text-on-surface">Civil Servant? <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button type="button" onClick={() => { updateField("is_civil_servant", true); setTouched((prev) => ({ ...prev, is_civil_servant: true })); }} className={`py-3 sm:py-4 rounded-xl border-2 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${formData.is_civil_servant ? "bg-secondary text-on-secondary border-secondary" : "border-outline-variant hover:border-secondary/50"}`}>
              <span className="material-symbols-outlined text-lg sm:text-xl">work</span>
              Yes
            </button>
            <button type="button" onClick={() => { updateField("is_civil_servant", false); setTouched((prev) => ({ ...prev, is_civil_servant: true })); }} className={`py-3 sm:py-4 rounded-xl border-2 font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${formData.is_civil_servant === false ? "bg-secondary text-on-secondary border-secondary" : "border-outline-variant hover:border-secondary/50"}`}>
              <span className="material-symbols-outlined text-lg sm:text-xl">business</span>
              No
            </button>
          </div>
          {errors.is_civil_servant && touched.is_civil_servant && <p className={getErrorClass()}>{errors.is_civil_servant}</p>}
        </div>
        {formData.is_civil_servant && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className={getLabelClass()}>EC Number</label>
              <input type="text" className={getInputClass()} value={formData.employer_no} onChange={(e) => updateField("employer_no", e.target.value.toUpperCase())} placeholder="EC12345" />
            </div>
            <div>
              <label className={getLabelClass()}>Ministry</label>
              <input type="text" className={getInputClass()} value={formData.ministry} onChange={(e) => updateField("ministry", e.target.value)} placeholder="Ministry name" />
            </div>
          </div>
        )}
        {formData.is_civil_servant === false && (
          <div>
            <label className={getLabelClass()}>Employer Name <span className="text-red-500">*</span></label>
            <input type="text" className={getFieldClass("employer_name")} value={formData.employer_name} onChange={(e) => updateField("employer_name", e.target.value)} onBlur={() => handleBlur("employer_name")} placeholder="Company name" />
            {errors.employer_name && touched.employer_name && <p className={getErrorClass()}>{errors.employer_name}</p>}
          </div>
        )}
      </div>

      <div className="mt-6 sm:mt-8 flex justify-end">
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-secondary text-on-secondary rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-secondary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto justify-center">
          {saving ? <><div className="w-5 h-5 border-2 border-on-secondary border-t-transparent rounded-full animate-spin"></div><span className="text-sm sm:text-base">Saving...</span></> : <><span className="material-symbols-outlined text-lg sm:text-xl">check</span><span className="text-sm sm:text-base">Save Profile</span></>}
        </button>
      </div>
    </div>
  );
}