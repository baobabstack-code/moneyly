# Microsoft 365 Integration

> Connect HTB Global to Microsoft 365 so every submitted loan application automatically syncs to SharePoint, uploads a PDF, and optionally notifies your inbox.

---

## What Gets Created on Each Submission

| Destination | What Happens |
|---|---|
| **SharePoint List** | New row with all 33 application fields |
| **Document Library** | PDF uploaded as `LN-XXXX.pdf` |
| **Outlook** *(optional)* | Notification email with summary + PDF attachment |

The MS365 sync is **fire-and-forget** — if it fails for any reason, the user still reaches `/success` and the application is safely in Supabase.

---

## How It Works

```
Customer submits application
         │
         ▼
  ┌─────────────────────────────┐
  │  1. Save to Supabase        │  ← blocks on failure
  │  2. Generate PDF            │
  │  3. Email customer          │  ← non-blocking
  └─────────────────────────────┘
         │
         ▼
  ┌─────────────────────────────┐   fire-and-forget
  │  POST /api/ms365            │ ─────────────────────────────────────┐
  └─────────────────────────────┘                                      │
         │                                                             │
         ▼                                                             ▼
  Create SharePoint list item          User reaches /success
  Upload PDF to Document Library       (regardless of MS365 outcome)
  Patch list item with PDF URL
  Send Outlook notification (optional)
```

**Key files**

| File | Purpose |
|---|---|
| `src/app/(application)/apply/summary/page.tsx` | Fires the MS365 call after Supabase saves |
| `src/app/api/ms365/route.ts` | All Microsoft Graph logic |
| `MS365-INTEGRATION.md` | This guide |

---

## Prerequisites

- A Microsoft 365 **Business** or **Enterprise** tenant with SharePoint enabled
- An account with **SharePoint admin** rights
- Access to the [Azure Portal](https://portal.azure.com)

---

## Setup — 8 Steps

### Step 1 — Register an App in Azure

This creates the identity your API route uses to talk to Microsoft Graph.

1. Sign in to [portal.azure.com](https://portal.azure.com) with your M365 admin account
2. Search **"App registrations"** → click **New registration**
3. Fill in:
   - **Name:** `HTB Global Loans`
   - **Supported account types:** Accounts in this organizational directory only
   - **Redirect URI:** leave blank
4. Click **Register**
5. From the app overview, save these two values:

| Value | Env var |
|---|---|
| Directory (tenant) ID | `MS365_TENANT_ID` |
| Application (client) ID | `MS365_CLIENT_ID` |

---

### Step 2 — Create a Client Secret

1. In your App Registration → **Certificates & secrets** → **New client secret**
2. Set a description (e.g. `HTB Global Production`) and expiry of **24 months**
3. Click **Add** then **copy the Value immediately** — it won't be shown again

| Value | Env var |
|---|---|
| Secret Value | `MS365_CLIENT_SECRET` |

> **Lost the secret?** You must create a new one and update your env vars.

---

### Step 3 — Grant API Permissions

1. In your App Registration → **API permissions** → **Add a permission** → **Microsoft Graph**
2. Select **Application permissions** (not Delegated — the app runs server-side)
3. Add all three permissions:

| Permission | Required for |
|---|---|
| `Sites.ReadWrite.All` | Creating SharePoint list items |
| `Files.ReadWrite.All` | Uploading PDFs to Document Library |
| `Mail.Send` | Sending Outlook notifications *(optional)* |

4. Click **Grant admin consent for [your organisation]**
   — all three must show a **green tick** under Status

> No "Grant admin consent" button? You need Global Admin rights in your tenant.

---

### Step 4 — Create the SharePoint List

1. Go to your SharePoint site → **New** → **List** → **Blank list**
2. Name it exactly: **`Loan Applications`**
3. Add the columns below — use the exact **Internal Name** for each

> **Critical:** SharePoint's Internal Name is locked at creation time. A mismatch will silently drop that field on every submission.

**Identity & Store**

| Display Name | Internal Name | Type |
|---|---|---|
| Title *(rename to "Reference")* | `Title` | Single line of text |
| Status | `Status` | Choice — `Submitted`, `Approved`, `Rejected` |
| Store Name | `StoreName` | Single line of text |
| Store ID | `StoreId` | Number |
| National ID | `NationalId` | Single line of text |

**Personal Information**

| Display Name | Internal Name | Type |
|---|---|---|
| First Name | `FirstName` | Single line of text |
| Last Name | `LastName` | Single line of text |
| Date of Birth | `DateOfBirth` | Date and time |
| Gender | `Gender` | Choice — `Male`, `Female` |

**Contact Details**

| Display Name | Internal Name | Type |
|---|---|---|
| Mobile Number | `MobileNumber` | Single line of text |
| Email Address | `EmailAddress` | Single line of text |
| Physical Address | `PhysicalAddress` | Multiple lines of text |

**Employment**

| Display Name | Internal Name | Type | Notes |
|---|---|---|---|
| Employer Name | `EmployerName` | Single line of text | |
| Is Civil Servant | `IsCivilServant` | Yes/No | |
| EC Number | `EmployerNo` | Single line of text | Civil servants only |
| Ministry | `Ministry` | Single line of text | Civil servants only |
| Employer Phone | `EmployerPhone` | Single line of text | |
| Employer Contact Person | `EmployerContactPerson` | Single line of text | |
| Employer Email | `EmployerEmail` | Single line of text | |
| Employer Address | `EmployerAddress` | Multiple lines of text | |

**Purchase / Loan**

| Display Name | Internal Name | Type | Notes |
|---|---|---|---|
| Product Name | `ProductName` | Single line of text | |
| Retail Price | `RetailPrice` | Currency | |
| Deposit Amount | `DepositAmount` | Currency | |
| Balance Amount | `BalanceAmount` | Currency | Auto-computed: Retail − Deposit |
| Tenure (Months) | `TenureMonths` | Number | |

**Next of Kin**

| Display Name | Internal Name | Type |
|---|---|---|
| Next of Kin Name | `KinFullName` | Single line of text |
| Next of Kin Relationship | `KinRelationship` | Single line of text |
| Next of Kin Mobile | `KinMobile` | Single line of text |
| Next of Kin Address | `KinAddress` | Multiple lines of text |

**Documents & System**

| Display Name | Internal Name | Type | Notes |
|---|---|---|---|
| ID Copy URL | `IdCopyUrl` | Hyperlink | Supabase Storage URL |
| Payslip URL | `PayslipUrl` | Hyperlink | Supabase Storage URL |
| PDF Document URL | `PdfDocumentUrl` | Hyperlink | Set automatically after upload |
| Submission Date | `SubmissionDate` | Date and time | |

---

### Step 5 — Create the Document Library Folder

PDFs are uploaded into a named folder inside your SharePoint Documents library.

1. Go to your SharePoint site → **Documents** library
2. Click **New** → **Folder**
3. Name it exactly: **`Loan Applications`**

Files will be stored as `LN-XXXX.pdf` matching the application reference.

---

### Step 6 — Get Your SharePoint IDs

Use [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer) — sign in with your M365 admin account, then run these three queries:

**6a — Site ID**
```
GET https://graph.microsoft.com/v1.0/sites/yourcompany.sharepoint.com:/sites/your-site-name
```
Copy the `id` from the response → **`MS365_SHAREPOINT_SITE_ID`**

**6b — List ID**
```
GET https://graph.microsoft.com/v1.0/sites/{site-id}/lists
```
Find `Loan Applications` in the response, copy its `id` → **`MS365_SHAREPOINT_LIST_ID`**

**6c — Drive ID**
```
GET https://graph.microsoft.com/v1.0/sites/{site-id}/drives
```
Find your Document Library (usually `Documents`), copy its `id` → **`MS365_SHAREPOINT_DRIVE_ID`**

---

### Step 7 — Set Environment Variables

**Required — SharePoint core**

```env
MS365_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
MS365_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
MS365_CLIENT_SECRET="your-client-secret-value"
MS365_SHAREPOINT_SITE_ID="yourcompany.sharepoint.com,xxxxxxxx-...,xxxxxxxx-..."
MS365_SHAREPOINT_LIST_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
MS365_SHAREPOINT_DRIVE_ID="b!xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Optional — Outlook notifications**

```env
MS365_SENDER_UPN="noreply@yourcompany.com"
MS365_NOTIFY_EMAIL="loans@yourcompany.com"
```

> If either Outlook variable is missing, email notifications are silently skipped. SharePoint list and PDF upload still work normally. You can add these later.

`MS365_SENDER_UPN` must be a **licensed Microsoft 365 mailbox** in your tenant (e.g. a shared mailbox or dedicated sender address).

**Adding to Vercel (production)**

1. Vercel dashboard → **Settings** → **Environment Variables**
2. Add each variable, set environment to **Production**
3. **Redeploy** for the changes to take effect

---

### Step 8 — Verify

Submit a test application end-to-end, then confirm:

- [ ] SharePoint **Loan Applications** list — new row with all fields populated
- [ ] SharePoint **Documents › Loan Applications** folder — `LN-XXXX.pdf` present
- [ ] User lands on `/success` regardless of MS365 outcome
- [ ] *(If Outlook configured)* `MS365_NOTIFY_EMAIL` inbox — email received with PDF attached

**Test graceful degradation** — remove one env var and resubmit. Server logs should show:

```
MS365: Missing env vars: MS365_SHAREPOINT_LIST_ID. Skipping.
```

The user should still reach `/success` and Supabase should still have the record.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| `MS365: Missing env vars` in logs | One or more vars not set | Check Vercel env vars and redeploy |
| `403 Forbidden` from Graph API | Admin consent not granted | App Registration → API permissions → Grant admin consent |
| `404 Not Found` on list or drive | Wrong IDs | Re-run Graph Explorer queries in Step 6 |
| Fields blank in SharePoint row | Column Internal Name mismatch | Delete and recreate the column with the exact name from Step 4 |
| PDF missing from Document Library | `Loan Applications` folder doesn't exist | Create the folder in SharePoint Documents (Step 5) |
| Outlook notifications not arriving | Vars missing or sender not licensed | Set both `MS365_SENDER_UPN` and `MS365_NOTIFY_EMAIL`; sender must be a licensed M365 mailbox |
| `Mail.Send` error | Permission not granted | Add `Mail.Send` and grant admin consent in App Registration |
| Secret / auth failure | Secret expired or copied wrong | Create a new secret in App Registration → Certificates & secrets |
| Works locally, fails in production | Vars missing from Vercel | Add all `MS365_*` vars in Vercel → Settings → Environment Variables and redeploy |
