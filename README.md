# Moneyly

Moneyly is a personal money manager for customers who want one place to track net worth, budgets, bills, savings goals, spending plans, insights, and cash-flow.

The current backend still stores planned purchases in the legacy `applications` table. In the customer experience, those rows are treated as generic spending plans with planned cost, saved amount, cash needed, monthly bill estimate, files, and status.

## Run Locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Core Areas

- Public landing page for the Moneyly money-manager proposition.
- Authenticated dashboard for net worth, cash-flow, bills, budgets, savings goals, and insights.
- Spending plans list at `/applications`, backed by the existing table for compatibility.
- Plan builder under the existing `/store-selection` and `/apply/*` routes, relabelled around planned purchases.
- PDF and email confirmation for saved spending plans.

## Environment

Required Supabase variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Optional email variable:

```bash
RESEND_API_KEY=
```
