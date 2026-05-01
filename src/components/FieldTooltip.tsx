"use client";

import { useState } from "react";

interface FieldTip {
  icon: string;
  title: string;
  tips: string[];
  example?: string;
}

const fieldTips: Record<string, FieldTip> = {
  firstName: { icon: "person", title: "First Name", tips: ["Your legal first name", "Must match ID"], example: "John" },
  lastName: { icon: "person", title: "Last Name", tips: ["Your legal surname", "Must match ID"], example: "Moyo" },
  nationalId: { icon: "badge", title: "National ID", tips: ["Examples:", "63-1234567K00", "08-800950Z08", "08-2047823Q29"] },
  dateOfBirth: { icon: "cake", title: "Date of Birth", tips: ["Must be 18+ years"], example: "2000-05-15" },
  gender: { icon: "wc", title: "Gender", tips: ["Required for eligibility"] },
  photo: { icon: "photo_camera", title: "Photo", tips: ["Clear front-facing photo", "Required for verification"] },
  physicalAddress: { icon: "home", title: "Address", tips: ["Full residential address"], example: "123 Main St, Harare" },
  mobileNumber: { icon: "phone_android", title: "Mobile", tips: ["Examples:"], example: "+263771234567" },
  emailAddress: { icon: "email", title: "Email", tips: ["Valid email address"], example: "john@gmail.com" },
  employerName: { icon: "business", title: "Employer", tips: ["Company name"] },
  isCivilServant: { icon: "work", title: "Civil Servant", tips: ["Government employee?", "Affects SSB eligibility"] },
  employerNo: { icon: "badge", title: "EC Number", tips: ["Employee code"], example: "EC123456" },
  ministry: { icon: "domain", title: "Ministry", tips: ["Government ministry"], example: "Finance" },
  nokFullName: { icon: "person", title: "Full Name", tips: ["Cannot be yourself", "Must be 18+ years"] },
  nokRelationship: { icon: "family_restroom", title: "Relationship", tips: ["Spouse, Parent, Sibling", "Child, Other"] },
  nokMobileNumber: { icon: "phone_android", title: "Mobile", tips: ["Cannot be your number"], example: "+263771234567" },
  nokAddress: { icon: "home", title: "Address", tips: ["Residential address"] },
  monthlyIncome: { icon: "payments", title: "Income", tips: ["Your monthly net income"] },
  loanAmount: { icon: "attach_money", title: "Loan Amount", tips: ["Amount you want to borrow"] },
  loanTerm: { icon: "schedule", title: "Loan Term", tips: ["Months to repay"] },
};

export function FieldTooltip({ field, className = "" }: { field: string; className?: string }) {
  const tip = fieldTips[field];
  if (!tip) return null;

  return (
    <div className={`group relative inline-flex ${className}`}>
      <span className="material-symbols-outlined text-on-surface-variant/60 cursor-help text-sm">info</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-surface-container-high text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-[100] pointer-events-none">
        <p className="font-bold mb-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">{tip.icon}</span> {tip.title}
        </p>
        {tip.tips.map((t, i) => (
          <p key={i} className="text-on-surface-variant/80">{t}</p>
        ))}
        {tip.example && (
          <p className="mt-1 text-secondary font-medium">Example: {tip.example}</p>
        )}
      </div>
    </div>
  );
}

export function validateMobile(v: string): string | null {
  if (!v.trim()) return "Required";
  const c = v.replace(/[\s-]/g, "");
  if (!(/^\+?263[789]\d{8}$/.test(c) || /^0[789]\d{8}$/.test(c) || /^[789]\d{8}$/.test(c))) {
    return "Invalid. Use: +263771234567 or 0771234567";
  }
  return null;
}

export function validateNationalId(v: string): string | null {
  if (!v.trim()) return "Required";
  const c = v.toUpperCase().replace(/[\s-]/g, "");
  if (c.length < 11 || c.length > 12) return "Must be 11-12 characters";
  if (!/^[0-9]{2}[A-Z0-9]{7}[A-Z][0-9]{2}$/.test(c) && !/^[0-9]{2}[A-Z0-9]{8}$/.test(c)) {
    return "Invalid format (e.g., 63-1234567K00)";
  }
  return null;
}

export function validateEmail(v: string): string | null {
  if (!v.trim()) return "Required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Invalid email";
  return null;
}

export function validateNotSelf(field: string, value: string, compareTo: string, fieldLabel: string): string | null {
  if (!value.trim()) return "Required";
  if (value.toLowerCase().trim() === compareTo.toLowerCase().trim()) {
    return `Cannot be ${fieldLabel}`;
  }
  return null;
}

export function useFormValidation<T extends Record<string, string>>(initialForm: T) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (field: string, validator: (value: string) => string | null) => {
    const value = String(initialForm[field] || '');
    const error = validator(value);
    setErrors(prev => ({ ...prev, [field]: error || '' }));
    setTouched(prev => ({ ...prev, [field]: true }));
    return error;
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const hasErrors = Object.values(errors).some(e => e);

  return { errors, touched, setErrors, setTouched, validate, handleBlur, hasErrors };
}