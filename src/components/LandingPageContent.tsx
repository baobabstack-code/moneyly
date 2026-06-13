'use client'

import Link from "next/link";
import { PWAInstallButton } from "@/components/pwa-install-button";

const heroImage =
  "https://images.unsplash.com/photo-1554224154-26032fced8bd?auto=format&fit=crop&w=1800&q=80";

export default function LandingPageContent() {
  return (
    <main className="font-manrope min-h-screen bg-background">
      <section
        className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-primary px-6 pb-16 pt-24 text-on-primary md:px-12"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.94), rgba(15,23,42,0.74), rgba(15,23,42,0.22)), url(${heroImage})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl flex-col justify-between">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-white/70">Moneyly Personal Money Manager</p>
            <h1 className="font-h1 text-h1 leading-tight text-white">
              Know where your money is going before it goes.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/78">
              Track net worth, budgets, bills, savings goals, spending plans, insights, and cash-flow in one calm workspace built for everyday money decisions.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-4 text-sm font-black text-on-secondary shadow-xl shadow-black/20 transition-all hover:opacity-90 active:scale-95"
              >
                Open Moneyly
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </Link>
              <Link
                href="/store-selection"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur transition-all hover:bg-white/15 active:scale-95"
              >
                Plan a Purchase
                <span className="material-symbols-outlined text-lg">playlist_add</span>
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <PWAInstallButton />
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">Installable money workspace</p>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              { label: "Net worth and cash-flow", value: "Snapshot", icon: "account_balance_wallet" },
              { label: "Bills and budgets", value: "Organized", icon: "receipt_long" },
              { label: "Goals and planned purchases", value: "Tracked", icon: "savings" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/15 bg-white/10 p-4 text-white backdrop-blur-md">
                <span className="material-symbols-outlined mb-3 text-2xl text-white/75">{item.icon}</span>
                <p className="text-2xl font-black">{item.value}</p>
                <p className="mt-1 text-sm text-white/68">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-outline-variant bg-surface px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-secondary">Financial Control</p>
            <h2 className="font-h2 text-h2 text-primary">A money dashboard that turns daily decisions into a clear plan.</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              {
                icon: "account_balance_wallet",
                title: "Net worth snapshot",
                text: "See how saved goal contributions and planned commitments affect your current money position.",
              },
              {
                icon: "receipt_long",
                title: "Bills and budgets",
                text: "Convert recurring commitments and planned purchases into monthly bills you can actually scan.",
              },
              {
                icon: "savings",
                title: "Savings goals",
                text: "Track deposits toward purchases and watch each goal move from idea to funded.",
              },
              {
                icon: "tips_and_updates",
                title: "Money insights",
                text: "Spot budget load, cash still needed, file readiness, and plan status before they become surprises.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-lg border border-outline-variant bg-background p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <h3 className="text-lg font-black text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background px-6 py-16 md:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-secondary">How Moneyly Works</p>
              <h2 className="font-h2 text-h2 text-primary">From spending plan to monthly cash-flow.</h2>
            </div>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-black text-secondary">
              Open account
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {[
              { step: "01", title: "Build your money profile", text: "Add the contact and income details Moneyly uses to organize your planning workspace." },
              { step: "02", title: "Create spending plans", text: "Capture upcoming purchases with a budget, saved amount, target length, and supporting files." },
              { step: "03", title: "Track bills and goals", text: "See monthly bill estimates, goal progress, cash still needed, and plan status in one view." },
              { step: "04", title: "Read the signals", text: "Use insights to understand budget load, cash-flow pressure, and what needs attention next." },
            ].map((item) => (
              <div key={item.step} className="rounded-lg border border-outline-variant bg-surface p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-widest text-secondary">{item.step}</p>
                <h3 className="mt-5 text-lg font-black text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface px-6 py-16 md:px-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-lg border border-outline-variant bg-primary p-6 text-on-primary">
            <span className="material-symbols-outlined text-3xl text-on-primary/70">waterfall_chart</span>
            <h3 className="mt-6 text-xl font-black">Cash-flow without the fog</h3>
            <p className="mt-3 text-sm leading-relaxed text-on-primary/70">
              Compare income, bills, planned purchases, and savings progress without digging through separate screens.
            </p>
          </div>
          <div className="rounded-lg border border-outline-variant bg-background p-6">
            <span className="material-symbols-outlined text-3xl text-secondary">playlist_add_check</span>
            <h3 className="mt-6 text-xl font-black text-primary">Spending plans with context</h3>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              The existing purchase flow becomes a practical planning tool for upcoming expenses and goal tracking.
            </p>
          </div>
          <div className="rounded-lg border border-outline-variant bg-background p-6">
            <span className="material-symbols-outlined text-3xl text-secondary">dashboard</span>
            <h3 className="mt-6 text-xl font-black text-primary">A financial home screen</h3>
            <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
              Give each customer one place to check budgets, bills, goals, insights, and net worth signals.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-background px-6 py-16 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-lg border border-outline-variant bg-surface p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-secondary">Ready to organize your money?</p>
            <h2 className="text-2xl font-black text-primary">Start with a profile, then build your first spending plan.</h2>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
              Sign in to see the dashboard and turn upcoming purchases into budgets, bills, savings goals, and cash-flow insight.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-4 text-sm font-black text-on-secondary transition-all hover:opacity-90 active:scale-95"
          >
            Open Moneyly
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
