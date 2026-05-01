"use client";

/**
 * Profile Setup — multi-step form for collecting user profile data.
 *
 * Steps: Photo → Personal → Contact → Next of Kin → Employment
 *
 * Key behaviors:
 * - Draft is persisted to localStorage between steps so the user never loses progress.
 * - On mount, the DB profile is fetched in the background and merged into the draft.
 * - User ID is cached in a ref so photo uploads skip the getSession() network call.
 * - Blob URL is shown instantly for photo preview; the real URL replaces it after upload.
 * - Save button is disabled while uploading to prevent the user getting stuck.
 * - After the final step (employment), a summary screen is shown before redirecting.
 * - Monthly income is optional — users may not wish to disclose it.
 */

import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveProfile, type UserProfile } from "@/lib/profile";
import { createClient } from "@/utils/supabase/client";

interface FormErrors { [key: string]: string | undefined; }

function validateNationalId(v: string) {
  if (!v.trim()) return "Required";
  const c = v.toUpperCase().replace(/[\s-]/g, "");
  if (c.length < 11 || c.length > 12) return "Must be 11-12 characters";
  if (!/^[0-9]{2}[A-Z0-9]{7}[A-Z][0-9]{2}$/.test(c) && !/^[0-9]{2}[A-Z0-9]{8}$/.test(c)) return "Invalid format (e.g., 63-1234567K00 or 08-800950Z08)";
  return null;
}
function validateMobile(v: string) {
  if (!v.trim()) return "Required";
  const c = v.replace(/\s/g, "").replace(/-/g, "");
  if (!(/^\+?263[789]\d{8}$/.test(c) || /^0[789]\d{8}$/.test(c) || /^[789]\d{8}$/.test(c))) return "Invalid Zimbabwe number";
  return null;
}
function validateZimbabwePhone(v: string) {
  if (!v.trim()) return "Required";
  const c = v.replace(/[\s-]/g, "");
  if (!(/^\+?263\d{8,10}$/.test(c) || /^0\d{8,10}$/.test(c))) return "Invalid Zimbabwe phone number";
  return null;
}
function validateDob(v: string) {
  if (!v) return "Required";
  const d = new Date(v), t = new Date(), a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (a < 18 || (a === 18 && m < 0) || d > t) return "Must be 18+";
  return null;
}

const emptyForm = {
  first_name: "", last_name: "", national_id: "", date_of_birth: "", gender: "",
  physical_address: "", mobile_number: "", email_address: "",
  nok_full_name: "", nok_address: "", nok_mobile_number: "", nok_relationship: "",
  employer_name: "", employer_no: "", ministry: "", is_civil_servant: false, monthly_income: "", employment_phone: "",
  employer_contact_person: "", employer_email: "", employer_address: "",
  photo_url: "",
};

const STORAGE_KEY = 'profile_draft';
const saveToStorage = (d: typeof emptyForm) => { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); };
const loadFromStorage = (): typeof emptyForm => {
  if (typeof window !== 'undefined') {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) try { return { ...emptyForm, ...JSON.parse(s) }; } catch { return emptyForm; }
  }
  return emptyForm;
};
const clearStorage = () => { if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY); };

function mergeProfileIntoDraft(profile: UserProfile | null, draft: typeof emptyForm): typeof emptyForm {
  if (!profile) return draft;

  return {
    ...draft,
    first_name: profile.first_name || draft.first_name || "",
    last_name: profile.last_name || draft.last_name || "",
    national_id: profile.national_id || draft.national_id || "",
    date_of_birth: profile.date_of_birth || draft.date_of_birth || "",
    gender: profile.gender || draft.gender || "",
    physical_address: profile.physical_address || draft.physical_address || "",
    mobile_number: profile.mobile_number || draft.mobile_number || "",
    email_address: profile.email_address || draft.email_address || "",
    nok_full_name: profile.nok_full_name || draft.nok_full_name || "",
    nok_address: profile.nok_address || draft.nok_address || "",
    nok_mobile_number: profile.nok_mobile_number || draft.nok_mobile_number || "",
    nok_relationship: profile.nok_relationship || draft.nok_relationship || "",
    employer_name: profile.employer_name || draft.employer_name || "",
    employer_no: profile.employer_no || draft.employer_no || "",
    ministry: profile.ministry || draft.ministry || "",
    is_civil_servant: profile.is_civil_servant ?? draft.is_civil_servant ?? false,
    monthly_income: profile.monthly_income || draft.monthly_income || "",
    employment_phone: profile.employment_phone || draft.employment_phone || "",
    employer_contact_person: profile.employer_contact_person || draft.employer_contact_person || "",
    employer_email: profile.employer_email || draft.employer_email || "",
    employer_address: profile.employer_address || draft.employer_address || "",
    photo_url: profile.photo_url || draft.photo_url || "",
  };
}

const sectionFields: Record<string, string[]> = {
  personal: ["first_name", "last_name", "national_id", "date_of_birth", "gender"],
  contact: ["physical_address", "mobile_number", "email_address"],
  nok: ["nok_full_name", "nok_address", "nok_mobile_number", "nok_relationship"],
  employment: ["is_civil_servant", "employer_name", "employer_no", "ministry", "employment_phone", "employer_contact_person", "employer_email", "employer_address", "monthly_income"],
};

const MINISTRIES = [
  'Finance & Economic Development','Health & Child Care','Education, Sport, Arts & Culture',
  'Agriculture, Fisheries, Water & Rural Development','Home Affairs & Cultural Heritage',
  'Justice, Legal & Parliamentary Affairs','Foreign Affairs & International Trade','Defence',
  'Lands, Agriculture, Fisheries, Water & Rural Resettlement','Public Service, Labour & Social Welfare',
  'Transport & Infrastructural Development','Energy & Power Development','Mines & Mining Development',
  'Environment, Climate, Tourism & Hospitality Industry','Information, Publicity & Broadcasting Services',
  'Primary & Secondary Education','Higher & Tertiary Education, Innovation, Science & Technology Development',
  'Local Government & Public Works','Women Affairs, Community, Small & Medium Enterprises Development',
  'Youth, Sport, Arts & Recreation','ICT, Postal & Courier Services','National Housing & Social Amenities',
];

// Tooltip defined outside component to avoid "component created during render" error
const tooltipData: Record<string, { icon: string; title: string; tips: string[] }> = {
  first_name: { icon: "person", title: "First Name", tips: ["Your legal first name", "Example: John", "Must match your ID document"] },
  last_name: { icon: "person", title: "Last Name", tips: ["Your legal surname", "Example: Moyo", "Must match your ID document"] },
  national_id: { icon: "badge", title: "National ID", tips: ["Examples:", "63-1234567K00 (Harare)", "08-800950Z08 (Bulawayo)"] },
  date_of_birth: { icon: "cake", title: "Date of Birth", tips: ["Must be 18+ years old", "Example: 2000-05-15"] },
  gender: { icon: "wc", title: "Gender", tips: ["Select Male or Female", "Required for eligibility"] },
  physical_address: { icon: "home", title: "Physical Address", tips: ["Full residential address", "Example: 123 Main St, Harare"] },
  mobile_number: { icon: "phone_android", title: "Mobile Number", tips: ["Examples:", "+263771234567", "0771234567"] },
  email_address: { icon: "email", title: "Email Address", tips: ["Your email address", "Example: john@gmail.com"] },
  nok_full_name: { icon: "person", title: "Full Name", tips: ["Your next of kin's name", "Cannot be yourself"] },
  nok_address: { icon: "home", title: "Address", tips: ["Kin's residential address"] },
  nok_mobile_number: { icon: "phone_android", title: "Mobile Number", tips: ["+263771234567", "Cannot be your number"] },
  nok_relationship: { icon: "family_restroom", title: "Relationship", tips: ["Spouse, Parent, Sibling", "Child, or Other"] },
  employer_no: { icon: "badge", title: "EC Number", tips: ["Employee Code number", "Example: EC123456"] },
  ministry: { icon: "domain", title: "Ministry", tips: ["Your government ministry"] },
  employer_name: { icon: "business", title: "Employer", tips: ["Company name"] },
  employment_phone: { icon: "phone", title: "Employer Phone", tips: ["Main workplace or HR phone", "Example: +263242123456"] },
  employer_contact_person: { icon: "contact_phone", title: "Contact Person", tips: ["HR manager or supervisor", "Someone who can confirm employment"] },
  employer_email: { icon: "alternate_email", title: "Employer Email", tips: ["Company or HR email address"] },
  employer_address: { icon: "location_on", title: "Employer Address", tips: ["Workplace physical address"] },
};

function Tooltip({ field }: { field: string }) {
  const t = tooltipData[field];
  if (!t) return null;
  return (
    <div className="relative group">
      <span className="material-symbols-outlined text-on-surface-variant/60 cursor-help text-sm">info</span>
      <div className="absolute right-0 top-6 w-56 p-3 bg-surface-container-high text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none border border-outline-variant">
        <p className="font-bold mb-1 flex items-center gap-1"><span className="material-symbols-outlined text-sm">{t.icon}</span> {t.title}</p>
        {t.tips.map((tip, i) => <p key={i} className="text-on-surface-variant/80">{tip}</p>)}
      </div>
    </div>
  );
}

const STEPS = [
  { key: 'photo', label: 'Photo', icon: 'photo_camera' },
  { key: 'personal', label: 'Personal Info', icon: 'person' },
  { key: 'contact', label: 'Contact', icon: 'contact_page' },
  { key: 'nok', label: 'Next of Kin', icon: 'family_restroom' },
  { key: 'employment', label: 'Employment', icon: 'business_center' },
];

const SECTION_TITLES: Record<string, { title: string; icon: string }> = {
  photo: { title: "Profile Photo", icon: "photo_camera" },
  personal: { title: "Personal Info", icon: "person" },
  contact: { title: "Contact Details", icon: "contact_page" },
  nok: { title: "Next of Kin", icon: "family_restroom" },
  employment: { title: "Employment", icon: "business_center" },
};

function ProfileSetupContent({
  initialProfile,
  initialUserId,
}: {
  initialProfile: UserProfile | null;
  initialUserId: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const section = sp.get('section') || 'photo';
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<typeof emptyForm>(() => mergeProfileIntoDraft(initialProfile, loadFromStorage()));
  const [photo, setPhoto] = useState(() => form.photo_url);
  const [showSummary, setShowSummary] = useState(false);
  const userIdRef = useRef<string | null>(initialUserId);

  useEffect(() => { saveToStorage(form); }, [form]);

  const validate = (f: string): string | null => {
    const v = form[f as keyof typeof form];
    const s = typeof v === 'string' ? v : '';
    const fullName = `${form.first_name} ${form.last_name}`.toLowerCase().trim();
    const nokName = form.nok_full_name.toLowerCase().trim();
    switch (f) {
      case "first_name": case "last_name": return !s.trim() ? "Required" : s.length < 2 ? "Too short" : null;
      case "national_id": return validateNationalId(s);
      case "date_of_birth": return validateDob(s);
      case "gender": return !form.gender ? "Required" : null;
      case "physical_address": return !s.trim() ? "Required" : s.length < 10 ? "Too short" : null;
      case "mobile_number": return validateMobile(s);
      case "email_address": return !s.trim() ? "Required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? "Invalid" : null;
      case "nok_full_name":
        if (!s.trim()) return "Required";
        if (nokName === fullName || nokName === form.first_name.toLowerCase().trim() || nokName === form.last_name.toLowerCase().trim()) return "Cannot be yourself";
        return null;
      case "nok_mobile_number": {
        const err = validateMobile(s);
        if (err) return err;
        if (s === form.mobile_number) return "Cannot be your own number";
        return null;
      }
      case "nok_address": return !s.trim() ? "Required" : null;
      case "nok_relationship": return !form.nok_relationship ? "Required" : null;
      case "employer_name": return !form.is_civil_servant && !s.trim() ? "Required" : null;
      case "employment_phone": return validateZimbabwePhone(s);
      case "employer_contact_person": return !s.trim() ? "Required" : null;
      case "employer_email": return s.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? "Invalid" : null;
      case "employer_address": return !s.trim() ? "Required" : null;
      case "is_civil_servant": return null;
      default: return null;
    }
  };

  const handleBlur = (f: string) => {
    setTouched(t => ({ ...t, [f]: true }));
    setErrors(e => ({ ...e, [f]: validate(f) || undefined }));
  };

  const upd = (f: string, v: string | boolean) => {
    setForm(p => ({ ...p, [f]: v }));
    if (touched[f]) setErrors(e => ({ ...e, [f]: validate(f) || undefined }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const localUrl = URL.createObjectURL(f);
    setPhoto(localUrl);
    setUploading(true);
    // Use cached userId — no network round-trip needed
    let userId = userIdRef.current;
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setUploading(false); return; }
      userId = session.user.id;
      userIdRef.current = userId;
    }
    const ext = f.name.split('.').pop();
    const path = `${userId}/photo.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, f, { upsert: true });
    if (!error) {
      const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`;
      setPhoto(publicUrl);
      URL.revokeObjectURL(localUrl);
    }
    setUploading(false);
  };

  const isProfileFormComplete = () => {
    const hasName = form.first_name.trim().length > 0 && form.last_name.trim().length > 0;
    const hasBasic = form.national_id.trim().length > 0 && form.date_of_birth.trim().length > 0 && !!form.gender;
    const hasContact = form.physical_address.trim().length > 0 && form.mobile_number.trim().length > 0 && form.email_address.trim().length > 0;
    return hasName && hasBasic && hasContact;
  };

  const getNextSection = (current: string): string | null => {
    const idx = STEPS.findIndex(s => s.key === current);
    return idx < STEPS.length - 1 ? STEPS[idx + 1].key : null;
  };

  const getPreviousSection = (current: string): string | null => {
    const idx = STEPS.findIndex(s => s.key === current);
    return idx > 0 ? STEPS[idx - 1].key : null;
  };

  const saveSection = async () => {
    const fields = section === 'photo' ? [] : sectionFields[section] || [];
    const errs: FormErrors = {};
    fields.forEach(f => { const e = validate(f); if (e) errs[f] = e; });
    if (Object.keys(errs).length > 0) { setErrors(errs); setTouched(Object.fromEntries(fields.map(f => [f, true]))); return; }
    setSaving(true);
    const isLastSection = !getNextSection(section);
    const profileComplete = isLastSection && isProfileFormComplete();
    const data: Record<string, string | boolean | undefined> = { is_profile_complete: profileComplete };
    if (section === 'photo') data.photo_url = photo || undefined;
    else fields.forEach(f => data[f] = form[f as keyof typeof form]);
    const s = await saveProfile(data);
    setSaving(false);
    if (s) {
      clearStorage();
      if (isLastSection) {
        setShowSummary(true);
      } else {
        const next = getNextSection(section);
        if (next) router.push(`/profile-setup?section=${next}`);
      }
    } else alert('Failed to save');
  };

  const fld = (n: string, label: string) => (
    <div key={n}>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={n} className="font-label-md">{label}<span className="text-red-500">*</span></label>
        <Tooltip field={n} />
      </div>
      <input
        id={n}
        type={n.includes('date') ? 'date' : n.includes('email') ? 'email' : n.includes('mobile') || n.includes('phone') ? 'tel' : 'text'}
        className={`w-full px-4 py-3 rounded-xl border bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 outline-none ${errors[n] && touched[n] ? 'border-red-500' : 'border-outline-variant'}`}
        value={String(form[n as keyof typeof form] || '')}
        onChange={e => upd(n, n === 'national_id' ? e.target.value.toUpperCase() : e.target.value)}
        onBlur={() => handleBlur(n)}
      />
      {errors[n] && touched[n] && <p className="text-red-500 text-sm mt-1">{errors[n]}</p>}
    </div>
  );

  const currentStepIndex = STEPS.findIndex(s => s.key === section);

  // ── Summary screen ──────────────────────────────────────────────
  if (showSummary) {
    const rows = [
      { label: "Full Name", value: `${form.first_name} ${form.last_name}` },
      { label: "National ID", value: form.national_id },
      { label: "Date of Birth", value: form.date_of_birth },
      { label: "Gender", value: form.gender },
      { label: "Mobile", value: form.mobile_number },
      { label: "Email", value: form.email_address },
      { label: "Address", value: form.physical_address },
      { label: "Next of Kin", value: form.nok_full_name },
      { label: "NOK Relationship", value: form.nok_relationship },
      { label: "NOK Mobile", value: form.nok_mobile_number },
      { label: "NOK Address", value: form.nok_address },
      { label: "Civil Servant", value: form.is_civil_servant ? "Yes" : "No" },
      ...(form.is_civil_servant
        ? [{ label: "EC Number", value: form.employer_no }, { label: "Ministry", value: form.ministry }]
        : [{ label: "Employer", value: form.employer_name }]),
      { label: "Employer Phone", value: form.employment_phone },
      { label: "Employer Contact", value: form.employer_contact_person },
      { label: "Employer Email", value: form.employer_email },
      { label: "Employer Address", value: form.employer_address },
       { label: "Monthly Income", value: form.monthly_income ? `$${form.monthly_income}` : "" },
    ];
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8 md:p-6">
        <div className="w-full max-w-lg">
          {/* Success header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface mb-1">Profile Complete!</h1>
            <p className="text-on-surface-variant text-sm">Here&apos;s a summary of your profile</p>
          </div>

          {/* Photo + name */}
          <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-surface rounded-2xl border border-outline-variant">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-secondary shrink-0">
              {photo
                ? <img src={photo} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-surface-container flex items-center justify-center"><span className="material-symbols-outlined text-on-surface-variant">person</span></div>}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-on-surface text-lg leading-tight">{form.first_name} {form.last_name}</p>
              <p className="text-sm text-on-surface-variant truncate">{form.email_address}</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="bg-surface rounded-2xl border border-outline-variant divide-y divide-outline-variant/40 mb-6">
            {rows.filter(r => r.value).map(r => (
              <div key={r.label} className="flex justify-between items-start gap-3 px-4 py-3 md:px-5">
                <span className="text-sm text-on-surface-variant shrink-0">{r.label}</span>
                <span className="text-sm font-medium text-on-surface text-right wrap-break-word max-w-[60%]">{r.value}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="w-full py-4 bg-secondary text-on-secondary rounded-xl font-bold text-base shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">dashboard</span>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-surface border-r border-outline-variant p-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-secondary flex items-center justify-center bg-surface-container">
            {photo
              ? <img src={photo} alt="" className="w-full h-full object-cover" />
              : <span className="material-symbols-outlined text-on-surface-variant">person</span>}
          </div>
          <div>
            <p className="font-bold text-on-surface text-sm leading-none">Profile Setup</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Complete all sections</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {STEPS.map((s, i) => {
            const isActive = s.key === section;
            const isDone = i < currentStepIndex;
            return (
              <div key={s.key} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-secondary/10' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${isActive ? 'bg-secondary text-on-secondary border-secondary' : isDone ? 'bg-green-500 text-white border-green-500' : 'border-outline-variant text-on-surface-variant'}`}>
                  <span className="material-symbols-outlined text-sm">{isDone ? 'check' : s.icon}</span>
                </div>
                <span className={`text-sm ${isActive ? 'text-secondary font-bold' : isDone ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>{s.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header — back/cancel on left, title center, close on right */}
        <div className="md:hidden flex items-center justify-between px-2 py-2 border-b border-outline-variant bg-surface">
          <button
            type="button"
            onClick={() => {
              const prev = getPreviousSection(section);
              if (prev) router.push(`/profile-setup?section=${prev}`);
              else router.push('/dashboard');
            }}
            className="w-11 h-11 flex items-center justify-center rounded-xl text-on-surface-variant active:bg-surface-container"
          >
            <span className="material-symbols-outlined">{getPreviousSection(section) ? 'arrow_back' : 'close'}</span>
          </button>
          <div className="text-center">
            <p className="font-bold text-sm text-on-surface">{SECTION_TITLES[section]?.title}</p>
            <p className="text-[10px] text-on-surface-variant">Step {currentStepIndex + 1} of {STEPS.length}</p>
          </div>
          <button type="button" onClick={() => router.push('/dashboard')} className="w-11 h-11 flex items-center justify-center rounded-xl text-on-surface-variant active:bg-surface-container">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Progress bar (desktop) + step dots (mobile) */}
        <div className="hidden md:block h-1 bg-outline-variant w-full">
          <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-outline-variant/30">
          {STEPS.map((s, i) => {
            const isActive = s.key === section;
            const isDone = i < currentStepIndex;
            return (
              <div key={s.key} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${isActive ? 'bg-secondary border-secondary text-on-secondary' : isDone ? 'bg-green-500 border-green-500 text-white' : 'border-outline-variant text-on-surface-variant/40'}`}>
                  <span className="material-symbols-outlined text-body-sm">{isDone ? 'check' : s.icon}</span>
                </div>
                <span className={`text-[9px] font-medium leading-tight text-center ${isActive ? 'text-secondary' : isDone ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>{s.label}</span>
              </div>
            );
          })}
        </div>

        <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 py-6 md:px-6 md:py-10 pb-28 md:pb-10">
          <div className="mb-6 md:mb-8">
            <div className="hidden md:flex items-center gap-3 mb-1">
              <span className="material-symbols-outlined text-secondary text-2xl">{SECTION_TITLES[section]?.icon}</span>
              <h1 className="text-2xl font-bold text-on-surface">{SECTION_TITLES[section]?.title}</h1>
            </div>
            <p className="hidden md:block text-sm text-on-surface-variant ml-9">Step {currentStepIndex + 1} of {STEPS.length}</p>
          </div>

          <div className="space-y-5 flex-1">
            {section === 'photo' && (
              <div className="flex flex-col items-center py-6 md:py-8 gap-5 md:gap-6">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-surface-container border-4 border-outline-variant flex items-center justify-center overflow-hidden shadow-lg">
                  {photo
                    ? <img src={photo} alt="" className="w-full h-full object-cover" />
                    : <span className="material-symbols-outlined text-5xl md:text-6xl text-on-surface-variant/30">person</span>}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-bold text-sm cursor-pointer transition-all ${uploading ? 'bg-surface-container text-on-surface-variant pointer-events-none' : 'bg-secondary text-on-secondary hover:opacity-90'}`}>
                    <span className="material-symbols-outlined text-base">upload</span>
                    {uploading ? 'Uploading...' : photo ? 'Change' : 'Upload'}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
                  <label className={`sm:hidden flex-1 flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-bold text-sm cursor-pointer transition-all border-2 ${uploading ? 'border-outline-variant text-on-surface-variant pointer-events-none' : 'border-secondary text-secondary hover:bg-secondary/10'}`}>
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                    Take Photo
                    <input type="file" accept="image/*" capture="user" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                  </label>
                </div>
                {photo && <p className="text-xs text-green-600 flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span>Photo ready</p>}
              </div>
            )}

            {section === 'personal' && (
              <>{fld('first_name', 'First Name')}{fld('last_name', 'Last Name')}{fld('national_id', 'National ID')}{fld('date_of_birth', 'Date of Birth')}
                <div>
                  <label className="block font-label-md mb-2">Gender<span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Male', 'Female'].map(g => (
                      <button key={g} type="button" onClick={() => { upd('gender', g); setTouched(t => ({ ...t, gender: true })); setErrors(e => ({ ...e, gender: undefined })); }}
                        className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${form.gender === g ? 'bg-secondary text-on-secondary border-secondary' : 'border-outline-variant text-on-surface hover:bg-surface-container'}`}>
                        <span className="material-symbols-outlined">{g === 'Male' ? 'male' : 'female'}</span>{g}
                      </button>
                    ))}
                  </div>
                  {errors.gender && touched.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                </div>
              </>
            )}

            {section === 'contact' && <>{fld('physical_address', 'Physical Address')}{fld('mobile_number', 'Mobile Number')}{fld('email_address', 'Email Address')}</>}

            {section === 'nok' && (
              <>{fld('nok_full_name', 'Full Name')}{fld('nok_address', 'Address')}{fld('nok_mobile_number', 'Mobile Number')}
                <div>
                  <label className="block font-label-md mb-2">Relationship<span className="text-red-500">*</span></label>
                  <select title="Relationship" className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 outline-none"
                    value={form.nok_relationship} onChange={e => upd('nok_relationship', e.target.value)}>
                    <option value="">Select relationship</option>
                    {['Spouse', 'Parent', 'Sibling', 'Child', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </>
            )}

            {section === 'employment' && (
              <>
                <div>
                  <label className="block font-label-md mb-2">Civil Servant?<span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ label: 'Yes', icon: 'work', val: true }, { label: 'No', icon: 'business', val: false }].map(opt => (
                      <button key={opt.label} type="button"
                        aria-label={opt.label}
                        onClick={() => { upd('is_civil_servant', opt.val); setTouched(t => ({ ...t, is_civil_servant: true })); }}
                        className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${form.is_civil_servant === opt.val ? 'bg-secondary text-on-secondary border-secondary' : 'border-outline-variant text-on-surface hover:bg-surface-container'}`}>
                        <span className="material-symbols-outlined">{opt.icon}</span>{opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {form.is_civil_servant && (
                  <>{fld('employer_no', 'EC Number')}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-label-md">Ministry<span className="text-red-500">*</span></label>
                        <Tooltip field="ministry" />
                      </div>
                      <select title="Ministry"
                        className={`w-full px-4 py-3 rounded-xl border bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 outline-none ${errors.ministry && touched.ministry ? 'border-red-500' : 'border-outline-variant'}`}
                        value={form.ministry} onChange={e => upd('ministry', e.target.value)} onBlur={() => handleBlur('ministry')}>
                        <option value="">Select Ministry</option>
                        {MINISTRIES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      {errors.ministry && touched.ministry && <p className="text-red-500 text-sm mt-1">{errors.ministry}</p>}
                    </div>
                  </>
                )}
                {form.is_civil_servant === false && fld('employer_name', 'Employer Name')}
                 {fld('employment_phone', 'Employer Phone')}
                 {fld('employer_contact_person', 'Employer Contact Person')}
                 {fld('employer_email', 'Employer Email')}
                 {fld('employer_address', 'Employer Address')}
                 <div>
                   <label className="block font-label-md mb-2">Monthly Income <span className="text-on-surface-variant/50 font-normal text-xs">(optional)</span></label>
                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">$</span>
                     <input
                       type="number"
                       min="0"
                       step="0.01"
                       className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 outline-none placeholder:text-on-surface-variant/30"
                       placeholder="0.00"
                       value={form.monthly_income}
                       onChange={e => upd('monthly_income', e.target.value)}
                     />
                   </div>
                 </div>
               </>
             )}
          </div>

          {/* Desktop nav — inline at bottom of form */}
          <div className="hidden md:flex gap-3 pt-8 mt-8 border-t border-outline-variant">
            {getPreviousSection(section)
              ? <button type="button" onClick={() => router.push(`/profile-setup?section=${getPreviousSection(section)}`)}
                  className="px-6 py-3.5 border border-outline-variant text-on-surface rounded-xl font-bold hover:bg-surface-container flex items-center gap-2 transition-all">
                  <span className="material-symbols-outlined text-sm">arrow_back</span>Back
                </button>
              : <button type="button" onClick={() => router.push('/dashboard')}
                  className="px-6 py-3.5 border border-outline-variant text-on-surface-variant rounded-xl font-bold hover:bg-surface-container flex items-center gap-2 transition-all">
                  <span className="material-symbols-outlined text-sm">close</span>Cancel
                </button>
            }
            <button type="button" onClick={saveSection} disabled={saving || uploading}
              className="flex-1 py-3.5 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg hover:opacity-90 flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">{(saving || uploading) ? 'hourglass_empty' : getNextSection(section) ? 'arrow_forward' : 'check'}</span>
              {uploading ? 'Uploading photo...' : saving ? 'Saving...' : getNextSection(section) ? 'Save & Continue' : 'Complete Profile'}
            </button>
          </div>
        </div>

        {/* Mobile nav — fixed bottom bar */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-10 bg-surface border-t border-outline-variant px-4 py-3 pb-safe">
          <button type="button" onClick={saveSection} disabled={saving || uploading}
            className="w-full py-4 bg-secondary text-on-secondary rounded-2xl font-bold shadow-lg hover:opacity-90 flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-base">
            <span className="material-symbols-outlined">{(saving || uploading) ? 'hourglass_empty' : getNextSection(section) ? 'arrow_forward' : 'check'}</span>
            {uploading ? 'Uploading photo...' : saving ? 'Saving...' : getNextSection(section) ? 'Save & Continue' : 'Complete Profile'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function ProfileSetupClient({
  initialProfile,
  initialUserId,
}: {
  initialProfile: UserProfile | null;
  initialUserId: string;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div></div>}>
      <ProfileSetupContent initialProfile={initialProfile} initialUserId={initialUserId} />
    </Suspense>
  );
}
