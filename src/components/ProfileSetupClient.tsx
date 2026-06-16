"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, type UserProfile } from "@/lib/profile";

function ProfileSetupContent({
  initialProfile,
}: {
  initialProfile: UserProfile | null;
  initialUserId: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(initialProfile?.first_name || "");
  const [lastName, setLastName] = useState(initialProfile?.last_name || "");
  const [username, setUsername] = useState(initialProfile?.username || "");
  const [monthlyIncome, setMonthlyIncome] = useState(initialProfile?.monthly_income || "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    setError(null);
    setSaving(true);

    try {
      const result = await saveProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim() || null,
        monthly_income: monthlyIncome ? String(parseFloat(monthlyIncome)) : null,
      });

      if (result) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError("Failed to save profile. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 font-manrope">
      <div className="w-full max-w-md space-y-8 bg-surface border border-outline-variant p-6 sm:p-8 rounded-3xl shadow-xl">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
            <span className="material-symbols-outlined text-3xl">account_balance_wallet</span>
          </div>
          <h2 className="mt-6 text-3xl font-black tracking-tight text-primary">
            Welcome to Moneyly
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Let's set up your profile to customize your personal finance dashboard.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-status-danger-bg p-4 text-sm text-status-danger border border-status-danger/25">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                <p className="font-semibold">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-bold text-on-surface mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="first_name"
                name="first-name"
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder:text-on-surface-variant/30"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-bold text-on-surface mb-2">
                Last Name
              </label>
              <input
                id="last_name"
                name="last-name"
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder:text-on-surface-variant/30"
                placeholder="Enter your last name (optional)"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-bold text-on-surface mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder:text-on-surface-variant/30"
                placeholder="Choose a username (optional)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="monthly_income" className="block text-sm font-bold text-on-surface mb-2">
                Monthly Income
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-bold text-sm">$</span>
                <input
                  id="monthly_income"
                  name="monthly-income"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 rounded-xl border border-outline-variant bg-surface text-on-surface focus:ring-2 focus:ring-secondary/20 outline-none transition-all placeholder:text-on-surface-variant/30"
                  placeholder="0.00"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-on-surface-variant/60">
                Used to compute budget load and cash flow.
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={saving}
              className="group relative flex w-full justify-center rounded-xl bg-secondary py-3.5 px-4 text-sm font-bold text-on-secondary shadow-lg shadow-secondary/10 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">
                  {saving ? "hourglass_empty" : "check"}
                </span>
                {saving ? "Saving Profile..." : "Start Using Moneyly"}
              </span>
            </button>
          </div>
        </form>
      </div>
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
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ProfileSetupContent initialProfile={initialProfile} initialUserId={initialUserId} />
    </Suspense>
  );
}
