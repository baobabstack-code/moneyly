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
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }
    const ext = f.name.split('.').pop();
    const path = `${user.id}/photo.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, f, { upsert: true });
    if (!error) { const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}`; setPhoto(publicUrl); }
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
        <div className="absolute right-0 bottom-full mb-2 w-56 p-3 bg-surface-container-high text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
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

  if (load) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-surface rounded-[32px] border border-outline-variant shadow-2xl overflow-hidden">
        <div className="bg-secondary text-on-secondary p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
              {photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-3xl">person</span>}
            </div>
            <div className="flex-1"><h1 className="text-xl font-bold">{sectionTitles[section]?.title}</h1><p className="text-on-secondary/80 text-sm">Update and save</p></div>
            <div className="flex items-center gap-3">
              {section === 'photo' && <label className="px-4 py-2 bg-white/20 rounded-xl cursor-pointer hover:bg-white/30 text-sm font-medium">{uploading?'Uploading...':photo?'Change':'Upload'}<input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} /></label>}
              <button type="button" onClick={() => router.push('/dashboard')} className="px-4 py-2 border border-white/20 rounded-xl text-sm text-on-secondary/80 hover:bg-white/10">Close</button>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {section === 'photo' && <div className="text-center py-8"><div className="w-32 h-32 mx-auto rounded-full bg-surface-container flex items-center justify-center overflow-hidden mb-4">{photo ? <img src={photo} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">person</span>}</div><p className="text-on-surface-variant">Your profile photo</p></div>}
          {section === 'personal' && <>{fld('first_name','First Name')}{fld('last_name','Last Name')}{fld('national_id','National ID')}{fld('date_of_birth','Date of Birth')}<div><label className="block font-label-md mb-2">Gender<span className="text-red-500">*</span></label><div className="grid grid-cols-2 gap-3">{['Male','Female'].map(g => <button key={g} type="button" onClick={() => {upd('gender',g); setTouched(t => ({...t,gender:true})); setErrors(e => ({...e,gender:undefined}));}} className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${form.gender===g?'bg-white text-secondary border-white':'border-outline-variant'}`}><span className="material-symbols-outlined">{g==='Male'?'male':'female'}</span>{g}</button>)}</div>{errors.gender&&touched.gender&&<p className="text-red-500 text-sm mt-1">{errors.gender}</p>}</div></>}
          {section === 'contact' && <>{fld('physical_address','Physical Address')} {fld('mobile_number','Mobile Number')} {fld('email_address','Email Address')}</>}
          {section === 'nok' && <>{fld('nok_full_name','Full Name')}{fld('nok_address','Address')}{fld('nok_mobile_number','Mobile Number')}<div><label className="block font-label-md mb-2">Relationship<span className="text-red-500">*</span></label><select title="Relationship" className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface" value={form.nok_relationship} onChange={e => upd('nok_relationship',e.target.value)}><option value="">Select</option>{['Spouse','Parent','Sibling','Child','Other'].map(r => <option key={r} value={r}>{r}</option>)}</select></div></>}
          {section === 'employment' && <><div><label className="block font-label-md mb-2">Civil Servant?<span className="text-red-500">*</span></label><div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => {upd('is_civil_servant',true); setTouched(t => ({...t,is_civil_servant:true}));}} className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${form.is_civil_servant?'bg-white text-secondary border-white':'border-outline-variant'}`}><span className="material-symbols-outlined">work</span>Yes</button><button type="button" onClick={() => {upd('is_civil_servant',false); setTouched(t => ({...t,is_civil_servant:true}));}} className={`py-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 ${form.is_civil_servant===false?'bg-white text-secondary border-white':'border-outline-variant'}`}><span className="material-symbols-outlined">business</span>No</button></div></div>{form.is_civil_servant && <>{fld('employer_no','EC Number')} {fld('ministry','Ministry')}</>}{form.is_civil_servant === false && fld('employer_name','Employer Name')}</>}
        </div>
        <div className="p-6 border-t flex gap-3">
          {getPreviousSection(section) && <button type="button" onClick={() => router.push(`/profile-setup?section=${getPreviousSection(section)}`)} className="px-6 py-4 border border-outline-variant text-on-surface rounded-xl font-bold text-lg hover:bg-surface-container flex items-center gap-2"><span className="material-symbols-outlined">arrow_back</span>Back</button>}
          <button onClick={saveSection} disabled={saving} className={`flex-1 py-4 bg-secondary text-on-secondary rounded-xl font-bold text-lg shadow-lg hover:opacity-90 flex items-center justify-center gap-2`}><span className="material-symbols-outlined">{saving ? 'hourglass_empty' : getNextSection(section) ? 'arrow_forward' : 'check'}</span>{saving ? 'Saving...' : getNextSection(section) ? 'Save & Next' : 'Complete Profile'}</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileSetupPage() {
  return <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div></div>}><ProfileSetupContent /></Suspense>;
}