"use client";

import { Suspense, useEffect, useState, useMemo, useCallback, memo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMyProfile, saveProfile } from "@/lib/profile";
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
  if (!v.trim()) return "Required"; const c = v.replace(/\s/g,"").replace(/-/g,"");
  if (!(/^\+?263[789]\d{8}$/.test(c) || /^0[789]\d{8}$/.test(c) || /^[789]\d{8}$/.test(c))) return "Invalid Zimbabwe number"; return null;
}
function validateDob(v: string) {
  if (!v) return "Required"; const d = new Date(v), t = new Date(), a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (a < 18 || (a === 18 && m < 0) || d > t) return "Must be 18+"; return null;
}

const emptyForm = {
  first_name: "", last_name: "", national_id: "", date_of_birth: "", gender: "",
  physical_address: "", mobile_number: "", email_address: "",
  nok_full_name: "", nok_address: "", nok_mobile_number: "", nok_relationship: "",
  employer_name: "", employer_no: "", ministry: "", is_civil_servant: false, monthly_income: "", employment_phone: "",
  photo_url: "",
};

const STORAGE_KEY = 'profile_draft';
const saveToStorage = (d: typeof emptyForm) => { if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); };
const loadFromStorage = (): typeof emptyForm => { if (typeof window !== 'undefined') { const s = localStorage.getItem(STORAGE_KEY); if (s) try { return { ...emptyForm, ...JSON.parse(s) }; } catch { return emptyForm; } } return emptyForm; };
const clearStorage = () => { if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY); };

const sectionFields: Record<string, string[]> = {
  personal: ["first_name","last_name","national_id","date_of_birth","gender"],
  contact: ["physical_address","mobile_number","email_address"],
  nok: ["nok_full_name","nok_address","nok_mobile_number","nok_relationship"],
  employment: ["is_civil_servant","employer_name","employer_no","ministry"],
};

function ProfileSetupContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const section = sp.get('section') || 'photo';
  const supabase = createClient();
  const [load, setLoad] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState("");
  const [uploading, setUploading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const draft = loadFromStorage();
    setForm(draft);
    setPhoto(draft.photo_url ? draft.photo_url : "");
    // Immediately show the form from localStorage (fast load)
    setLoad(false);
    
    // Fetch profile data in background with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    getMyProfile().then(p => {
      clearTimeout(timeoutId);
      if (p) {
        setForm(prev => ({
          first_name: p.first_name || prev.first_name || "",
          last_name: p.last_name || prev.last_name || "",
          national_id: p.national_id || prev.national_id || "",
          date_of_birth: p.date_of_birth || prev.date_of_birth || "",
          gender: p.gender || prev.gender || "",
          physical_address: p.physical_address || prev.physical_address || "",
          mobile_number: p.mobile_number || prev.mobile_number || "",
          email_address: p.email_address || prev.email_address || "",
          nok_full_name: p.nok_full_name || prev.nok_full_name || "",
          nok_address: p.nok_address || prev.nok_address || "",
          nok_mobile_number: p.nok_mobile_number || prev.nok_mobile_number || "",
          nok_relationship: p.nok_relationship || prev.nok_relationship || "",
          employer_name: p.employer_name || prev.employer_name || "",
          employer_no: p.employer_no || prev.employer_no || "",
          ministry: p.ministry || prev.ministry || "",
          is_civil_servant: p.is_civil_servant ?? prev.is_civil_servant ?? false,
          monthly_income: p.monthly_income || prev.monthly_income || "",
          employment_phone: p.employment_phone || prev.employment_phone || "",
          photo_url: p.photo_url || prev.photo_url || "",
        }));
        setPhoto(p.photo_url || "");
      }
    }).catch(() => {
      clearTimeout(timeoutId);
      // If fetch fails or times out, use localStorage data (already loaded)
    });
  }, []);
  
  useEffect(() => { saveToStorage(form); }, [form]);

  const validate = useCallback((f: string): string | null => {
    const v = form[f as keyof typeof form];
    const s = typeof v === 'string' ? v : '';
    const fullName = `${form.first_name} ${form.last_name}`.toLowerCase().trim();
    const nokName = form.nok_full_name.toLowerCase().trim();
    switch(f) {
      case "first_name": case "last_name": return !s.trim() ? "Required" : s.length < 2 ? "Too short" : null;
      case "national_id": return validateNationalId(s); case "date_of_birth": return validateDob(s);
      case "gender": return !form.gender ? "Required" : null; case "physical_address": return !s.trim() ? "Required" : s.length < 10 ? "Too short" : null;
      case "mobile_number": case "nok_mobile_number": return validateMobile(s); case "email_address": return !s.trim() ? "Required" : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? "Invalid" : null;
      case "nok_full_name": 
        if (!s.trim()) return "Required";
        if (nokName === fullName) return "Cannot be yourself";
        if (nokName === form.first_name.toLowerCase().trim() || nokName === form.last_name.toLowerCase().trim()) return "Cannot be yourself";
        return null;
      case "nok_mobile_number":
        const err = validateMobile(s);
        if (err) return err;
        if (s === form.mobile_number) return "Cannot be your own number";
        return null;
      case "nok_address": return !s.trim() ? "Required" : null;
      case "nok_relationship": return !form.nok_relationship ? "Required" : null; case "employer_name": return !form.is_civil_servant && !s.trim() ? "Required" : null; case "is_civil_servant": return null;
      default: return null;
    }
  }, [form]);

  const handleBlur = useCallback((f: string) => { setTouched(t => ({...t, [f]: true})); setErrors(e => ({...e, [f]: validate(f) || undefined})); }, [validate]);
  const upd = useCallback((f: string, v: any) => { setForm(p => ({...p, [f]: v})); if (touched[f]) setErrors(e => ({...e, [f]: validate(f) || undefined})); }, [touched, validate]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    // Show preview instantly from local blob — no waiting for upload
    const localUrl = URL.createObjectURL(f);
    setPhoto(localUrl);
    setUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setUploading(false); return; }
    const ext = f.name.split('.').pop();
    const path = `${session.user.id}/photo.${ext}`;
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
    const hasPhoto = !!photo;
    return hasName && hasBasic && hasContact && hasPhoto;
  };

  const getNextSection = (current: string): string | null => {
    const sections = ['photo', 'personal', 'contact', 'nok', 'employment'];
    const currentIndex = sections.indexOf(current);
    return currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;
  };

  const getPreviousSection = (current: string): string | null => {
    const sections = ['photo', 'personal', 'contact', 'nok', 'employment'];
    const currentIndex = sections.indexOf(current);
    return currentIndex > 0 ? sections[currentIndex - 1] : null;
  };

  const saveSection = async () => {
    const fields = section === 'photo' ? [] : sectionFields[section] || [];
    const errs: FormErrors = {};
    fields.forEach(f => { const e = validate(f); if (e) errs[f] = e; });
    if (Object.keys(errs).length > 0) { setErrors(errs); setTouched(Object.fromEntries(fields.map(f => [f, true]))); return; }
    setSaving(true);
    const isLastSection = !getNextSection(section);
    const profileComplete = isLastSection && isProfileFormComplete();
    const data: any = { is_profile_complete: profileComplete };
    if (section === 'photo') data.photo_url = photo || undefined;
    else fields.forEach(f => data[f] = form[f as keyof typeof form]);
    const s = await saveProfile(data);
    setSaving(false);
    if (s) {
      clearStorage();
      if (isLastSection) {
        router.push('/dashboard');
      } else {
        const nextSection = getNextSection(section);
        if (nextSection) {
          router.push(`/profile-setup?section=${nextSection}`);
        }
      }
    } else alert('Failed to save');
  };

  const fieldTooltips: Record<string, {icon: string, title: string, tips: string[]}> = useMemo(() => ({
    first_name: { icon: "person", title: "First Name", tips: ["Your legal first name", "Example: John", "Must match your ID document"] },
    last_name: { icon: "person", title: "Last Name", tips: ["Your legal surname", "Example: Moyo", "Must match your ID document"] },
    national_id: { icon: "badge", title: "National ID", tips: ["Examples:", "63-1234567K00 (Harare)", "08-800950Z08 (Bulawayo)", "08-2047823Q29 (Digital)"] },
    date_of_birth: { icon: "cake", title: "Date of Birth", tips: ["Must be 18+ years old", "Example: 2000-05-15"] },
    gender: { icon: "wc", title: "Gender", tips: ["Select Male or Female", "Required for eligibility"] },
    physical_address: { icon: "home", title: "Physical Address", tips: ["Full residential address", "Example: 123 Main St, Harare", "Used for verification"] },
    mobile_number: { icon: "phone_android", title: "Mobile Number", tips: ["Examples:", "+263771234567", "0771234567", "771234567"] },
    email_address: { icon: "email", title: "Email Address", tips: ["Your email address", "Example: john@gmail.com"] },
    nok_full_name: { icon: "person", title: "Full Name", tips: ["Your next of kin's name", "Cannot be yourself", "Must be 18+ years"] },
    nok_address: { icon: "home", title: "Address", tips: ["Kin's residential address"] },
    nok_mobile_number: { icon: "phone_android", title: "Mobile Number", tips: ["Examples:", "+263771234567", "0771234567", "Cannot be your number"] },
    nok_relationship: { icon: "family_restroom", title: "Relationship", tips: ["Spouse, Parent, Sibling", "Child, or Other"] },
    is_civil_servant: { icon: "work", title: "Civil Servant", tips: ["Government employee?", "Select Yes or No"] },
    employer_no: { icon: "badge", title: "EC Number", tips: ["Employee Code number", "Example: EC123456"] },
    ministry: { icon: "domain", title: "Ministry", tips: ["Your government ministry", "Example: Finance"] },
    employer_name: { icon: "business", title: "Employer", tips: ["Company name", "Registered company name"] },
  }), []);

  const Tooltip = ({ field }: { field: string }) => {
    const t = fieldTooltips[field];
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
  };

  const fld = (n: string, label: string, extra?: string) => (
    <div key={n}>
      <div className="flex items-center justify-between mb-2">
        <label className="font-label-md">{label} {extra || ''}<span className="text-red-500">*</span></label>
        <Tooltip field={n} />
      </div>
      <input type={n.includes('date')?'date':n.includes('email')?'email':n.includes('mobile')||n.includes('phone')?'tel':n==='national_id'?'text':'text'} className={`w-full px-4 py-3 rounded-xl border bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 outline-none ${errors[n]&&touched[n]?'border-red-500':'border-outline-variant'}`} value={String(form[n as keyof typeof form] || '')} onChange={e => upd(n, n==='national_id'?e.target.value.toUpperCase():e.target.value)} onBlur={() => handleBlur(n)} />
      {errors[n]&&touched[n] && <p className="text-red-500 text-sm mt-1">{errors[n]}</p>}
    </div>
  );

  const sectionTitles: Record<string, {title: string, icon: string}> = {
    photo: {title: "Profile Photo", icon: "photo_camera"}, personal: {title: "Personal Info", icon: "person"},
    contact: {title: "Contact Details", icon: "contact_page"}, nok: {title: "Next of Kin", icon: "family_restroom"},
    employment: {title: "Employment", icon: "business_center"},
  };

  const steps = [
    { key: 'photo', label: 'Photo', icon: 'photo_camera' },
    { key: 'personal', label: 'Personal Info', icon: 'person' },
    { key: 'contact', label: 'Contact', icon: 'contact_page' },
    { key: 'nok', label: 'Next of Kin', icon: 'family_restroom' },
    { key: 'employment', label: 'Employment', icon: 'business_center' },
  ];
  const currentStepIndex = steps.findIndex(s => s.key === section);

  if (load) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-surface border-r border-outline-variant p-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-secondary flex items-center justify-center bg-surface-container">
            {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-on-surface-variant">person</span>}
          </div>
          <div>
            <p className="font-bold text-on-surface text-sm leading-none">Profile Setup</p>
            <p className="text-xs text-on-surface-variant mt-0.5">Complete all sections</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {steps.map((s, i) => {
            const isActive = s.key === section;
            const isDone = i < currentStepIndex;
            return (
              <div key={s.key} className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{ background: isActive ? 'rgb(var(--color-secondary) / 0.1)' : 'transparent' }}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold border-2 transition-all ${isActive ? 'bg-secondary text-on-secondary border-secondary' : isDone ? 'bg-green-500 text-white border-green-500' : 'border-outline-variant text-on-surface-variant'}`}>
                  {isDone ? <span className="material-symbols-outlined text-sm">check</span> : <span className="material-symbols-outlined text-sm">{s.icon}</span>}
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-secondary font-bold' : isDone ? 'text-on-surface' : 'text-on-surface-variant'}`}>{s.label}</span>
              </div>
            );
          })}
        </nav>

        <button type="button" onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors mt-6">
          <span className="material-symbols-outlined text-sm">close</span>
          Close & go to Dashboard
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top bar - mobile only */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface">
          <p className="font-bold text-sm">{sectionTitles[section]?.title}</p>
          <button type="button" onClick={() => router.push('/dashboard')} className="text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-outline-variant w-full">
          <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }} />
        </div>

        <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-6 py-10">
          {/* Section heading */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-1">
              <span className="material-symbols-outlined text-secondary text-2xl">{sectionTitles[section]?.icon}</span>
              <h1 className="text-2xl font-bold text-on-surface">{sectionTitles[section]?.title}</h1>
            </div>
            <p className="text-sm text-on-surface-variant ml-9">Step {currentStepIndex + 1} of {steps.length}</p>
          </div>

          {/* Form fields */}
          <div className="space-y-5 flex-1">
            {section === 'photo' && (
              <div className="flex flex-col items-center py-8 gap-6">
                <div className="w-36 h-36 rounded-full bg-surface-container border-4 border-outline-variant flex items-center justify-center overflow-hidden shadow-lg">
                  {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">person</span>}
                </div>
                <label className={`px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all ${uploading ? 'bg-surface-container text-on-surface-variant' : 'bg-secondary text-on-secondary hover:opacity-90'}`}>
                  {uploading ? 'Uploading...' : photo ? 'Change Photo' : 'Upload Photo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                </label>
                {photo && <p className="text-xs text-green-600 flex items-center gap-1"><span className="material-symbols-outlined text-sm">check_circle</span>Photo ready</p>}
              </div>
            )}
            {section === 'personal' && <>{fld('first_name','First Name')}{fld('last_name','Last Name')}{fld('national_id','National ID')}{fld('date_of_birth','Date of Birth')}<div><label className="block font-label-md mb-2">Gender<span className="text-red-500">*</span></label><div className="grid grid-cols-2 gap-3">{['Male','Female'].map(g => <button key={g} type="button" onClick={() => {upd('gender',g); setTouched(t => ({...t,gender:true})); setErrors(e => ({...e,gender:undefined}));}} className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${form.gender===g?'bg-secondary text-on-secondary border-secondary':'border-outline-variant text-on-surface hover:bg-surface-container'}`}><span className="material-symbols-outlined">{g==='Male'?'male':'female'}</span>{g}</button>)}</div>{errors.gender&&touched.gender&&<p className="text-red-500 text-sm mt-1">{errors.gender}</p>}</div></>}
            {section === 'contact' && <>{fld('physical_address','Physical Address')}{fld('mobile_number','Mobile Number')}{fld('email_address','Email Address')}</>}
            {section === 'nok' && <>{fld('nok_full_name','Full Name')}{fld('nok_address','Address')}{fld('nok_mobile_number','Mobile Number')}<div><label className="block font-label-md mb-2">Relationship<span className="text-red-500">*</span></label><select title="Relationship" className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 outline-none" value={form.nok_relationship} onChange={e => upd('nok_relationship',e.target.value)}><option value="">Select relationship</option>{['Spouse','Parent','Sibling','Child','Other'].map(r => <option key={r} value={r}>{r}</option>)}</select></div></>}
            {section === 'employment' && <><div><label className="block font-label-md mb-2">Civil Servant?<span className="text-red-500">*</span></label><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => {upd('is_civil_servant',true); setTouched(t => ({...t,is_civil_servant:true}));}} className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${form.is_civil_servant?'bg-secondary text-on-secondary border-secondary':'border-outline-variant text-on-surface hover:bg-surface-container'}`}><span className="material-symbols-outlined">work</span>Yes</button><button type="button" onClick={() => {upd('is_civil_servant',false); setTouched(t => ({...t,is_civil_servant:true}));}} className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${form.is_civil_servant===false?'bg-secondary text-on-secondary border-secondary':'border-outline-variant text-on-surface hover:bg-surface-container'}`}><span className="material-symbols-outlined">business</span>No</button></div></div>{form.is_civil_servant && <>{fld('employer_no','EC Number')}<div><div className="flex items-center justify-between mb-2"><label className="font-label-md">Ministry<span className="text-red-500">*</span></label><Tooltip field="ministry" /></div><select title="Ministry" className={`w-full px-4 py-3 rounded-xl border bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 outline-none ${errors.ministry&&touched.ministry?'border-red-500':'border-outline-variant'}`} value={form.ministry} onChange={e => upd('ministry',e.target.value)} onBlur={() => handleBlur('ministry')}><option value="">Select Ministry</option>{['Finance & Economic Development','Health & Child Care','Education, Sport, Arts & Culture','Agriculture, Fisheries, Water & Rural Development','Home Affairs & Cultural Heritage','Justice, Legal & Parliamentary Affairs','Foreign Affairs & International Trade','Defence','Lands, Agriculture, Fisheries, Water & Rural Resettlement','Public Service, Labour & Social Welfare','Transport & Infrastructural Development','Energy & Power Development','Mines & Mining Development','Environment, Climate, Tourism & Hospitality Industry','Information, Publicity & Broadcasting Services','Primary & Secondary Education','Higher & Tertiary Education, Innovation, Science & Technology Development','Local Government & Public Works','Women Affairs, Community, Small & Medium Enterprises Development','Youth, Sport, Arts & Recreation','ICT, Postal & Courier Services','National Housing & Social Amenities'].map(m => <option key={m} value={m}>{m}</option>)}</select>{errors.ministry&&touched.ministry&&<p className="text-red-500 text-sm mt-1">{errors.ministry}</p>}</div></>}{form.is_civil_servant===false && fld('employer_name','Employer Name')}</>}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-8 mt-8 border-t border-outline-variant">
            {getPreviousSection(section)
              ? <button type="button" onClick={() => router.push(`/profile-setup?section=${getPreviousSection(section)}`)} className="px-6 py-3.5 border border-outline-variant text-on-surface rounded-xl font-bold hover:bg-surface-container flex items-center gap-2 transition-all"><span className="material-symbols-outlined text-sm">arrow_back</span>Back</button>
              : <button type="button" onClick={() => router.push('/dashboard')} className="px-6 py-3.5 border border-outline-variant text-on-surface-variant rounded-xl font-bold hover:bg-surface-container flex items-center gap-2 transition-all"><span className="material-symbols-outlined text-sm">close</span>Cancel</button>
            }
            <button type="button" onClick={saveSection} disabled={saving} className="flex-1 py-3.5 bg-secondary text-on-secondary rounded-xl font-bold shadow-lg hover:opacity-90 flex items-center justify-center gap-2 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-sm">{saving ? 'hourglass_empty' : getNextSection(section) ? 'arrow_forward' : 'check'}</span>
              {saving ? 'Saving...' : getNextSection(section) ? 'Save & Continue' : 'Complete Profile'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProfileSetupPage() {
  return <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div></div>}><ProfileSetupContent /></Suspense>;
}