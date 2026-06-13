# Moneyly Architecture

Moneyly is a Next.js App Router app backed by Supabase Auth, Supabase tables/storage, Zustand state, and a custom Material-inspired UI system.

## Product Model

The customer-facing model is personal money management:

- Net worth snapshots
- Budgets
- Bills
- Savings goals
- Spending plans
- Insights
- Cash-flow

The existing `applications` table remains as a compatibility layer. Customer screens map those rows to planned purchases instead of exposing lending language.

## App Structure

```text
src/
  app/
    (main)/                 Public landing experience
    dashboard/              Money manager dashboard
    applications/           Spending plans ledger
    (application)/          Existing protected plan-builder route group
    api/send-confirmation/  Spending plan confirmation email
  components/               Shared UI and money-manager views
  lib/
    store.ts                Local plan-builder state
    profile.ts              Profile completeness and profile helpers
  utils/
    pdf-generator.ts        Spending plan PDF generation
    supabase/               Supabase clients
```

## Plan Builder

The plan builder collects profile and planned-purchase details, saves them into the existing backend shape, then renders them as Moneyly spending plans. Field names such as `retail_price`, `deposit_amount`, and `tenure_months` remain for database compatibility.

## Verification

Use:

```bash
npm run build
```

Focused tests can be run with:

```bash
npm test
```
