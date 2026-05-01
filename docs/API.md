# HTB Global — API & Integration Reference

> Platform: Next.js 16 (App Router) · Database: Supabase (PostgreSQL + Auth + Storage) · Hosted: Vercel

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [REST API Endpoints](#2-rest-api-endpoints)
3. [Server Actions](#3-server-actions)
4. [Database Schema](#4-database-schema)
5. [Row-Level Security](#5-row-level-security)
6. [Storage Buckets](#6-storage-buckets)
7. [Role System](#7-role-system)
8. [Impersonation](#8-impersonation)
9. [Environment Variables](#9-environment-variables)
10. [MS365 Integration Guide](#10-ms365-integration-guide)

---

## 1. Authentication

HTB Global uses **Supabase Auth** (email/password + OAuth-ready).

### Sign In

```http
POST https://<project>.supabase.co/auth/v1/token?grant_type=password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "...",
  "user": { "id": "uuid", "email": "user@example.com", ... }
}
```

### Auth Callback (OAuth)

```
GET /auth/callback?code=<code>
```

Exchanges OAuth code for a session and redirects to `/dashboard`.

### Session Management

Sessions are maintained via Supabase SSR cookies. The middleware at `src/utils/supabase/proxy.ts` syncs the session on every request and enforces role-based route protection:

| Route prefix | Required role |
|---|---|
| `/dashboard/*` | Any authenticated user (`customer`) |
| `/admin/*` | `admin` or `super_admin` |
| `/super-admin/*` | `super_admin` only |

---

## 2. REST API Endpoints

### `POST /api/send-confirmation`

Sends a loan application confirmation email with a PDF attachment via Resend.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `email` | `string` | ✓ | Recipient email address |
| `pdfBase64` | `string` | ✓ | Base64 data URI of the generated PDF (e.g. `data:application/pdf;base64,...`) |
| `customerName` | `string` | ✓ | Customer full name (used in email greeting) |
| `reference` | `string` | ✓ | Application reference number (e.g. `LN-4821`) |

**Example request:**

```bash
curl -X POST https://htbglobal.app/api/send-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "pdfBase64": "data:application/pdf;base64,JVBERi0x...",
    "customerName": "Tendai Moyo",
    "reference": "LN-4821"
  }'
```

**Success response `200`:**
```json
{ "success": true, "data": { "id": "resend-message-id" } }
```

**Error response `500`:**
```json
{ "error": "Error message string" }
```

**Notes:**
- If `RESEND_API_KEY` is not set, the endpoint returns `{ "success": true, "mocked": true }` without sending.
- Email is sent from `notifications@htbglobal.app`. The from-address domain must be verified in Resend.

---

### `GET /api/docs`

Returns the OpenAPI 3.0 JSON specification for all documented endpoints.

```bash
curl https://htbglobal.app/api/docs
```

---

## 3. Server Actions

Server actions are Next.js `'use server'` functions — they are not HTTP endpoints but can be called from client components as if they were. They use the current user's Supabase session (cookie-based).

### Store Management (`src/app/super-admin/actions.ts`)

#### `createStore(formData: FormData)`

Creates a new store. Requires `super_admin` role.

| Field | Type | Required |
|---|---|---|
| `name` | string | ✓ |
| `code` | string | — |
| `location` | string | — |
| `hours` | string | — |
| `logo_url` | string | — |

Returns `{ success: true }` or `{ error: string }`.

---

#### `inviteAdmin(formData: FormData)`

Invites a user as a store admin via Supabase Admin API and links them to a store.

| Field | Type | Required |
|---|---|---|
| `email` | string | ✓ |
| `storeId` | number | ✓ |

- Creates the user in Supabase Auth with `role: 'admin'` in metadata.
- Updates `stores.admin_id` to the new user's ID.
- The `handle_new_user` DB trigger auto-creates their profile row with `role = 'admin'`.

Returns `{ success: true }` or `{ error: string }`.

---

#### `updateApplicationStatus(id: string, status: string)`

Updates an application's status. Valid statuses: `submitted`, `approved`, `rejected`.

Returns `{ success: true }` or `{ error: string }`.

---

#### `assignAdminToStore(userId: string, storeId: number)`

Assigns an existing user as the admin of a store and sets their profile `role` to `admin`.

Returns `{ success: true }` or `{ error: string }`.

---

### Impersonation (`src/app/super-admin/impersonate/actions.ts`)

#### `startImpersonation(targetUserId, targetName, returnPath)`

Sets an `htb_impersonate` cookie and redirects to `/dashboard` (for customer impersonation) or `/admin` (for admin impersonation). Only callable by `super_admin`.

Cookie payload:
```json
{
  "targetUserId": "uuid",
  "targetName": "Tendai Moyo",
  "returnPath": "/super-admin/customers",
  "startedAt": 1714500000000
}
```

#### `stopImpersonation(returnPath: string)`

Deletes the `htb_impersonate` cookie and redirects back to `returnPath`.

---

### Profile (`src/lib/profile.ts`)

#### `saveProfile(data: Partial<UserProfile>)`

Upserts the current user's profile row and syncs `full_name` to `auth.users` metadata. Client-side only (uses browser Supabase client).

---

## 4. Database Schema

### `public.profiles`

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | PK — mirrors `auth.users.id` |
| `full_name` | `text` | Combined name (auto-set from first + last) |
| `avatar_url` | `text` | OAuth provider avatar |
| `username` | `text` | Optional username |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |
| `first_name` | `text` | |
| `last_name` | `text` | |
| `national_id` | `text` | Zimbabwe National ID (indexed) |
| `date_of_birth` | `text` | `YYYY-MM-DD` |
| `gender` | `text` | |
| `photo_url` | `text` | Uploaded profile photo (Supabase Storage) |
| `physical_address` | `text` | |
| `mobile_number` | `text` | |
| `email_address` | `text` | |
| `nok_full_name` | `text` | Next of kin full name |
| `nok_address` | `text` | |
| `nok_mobile_number` | `text` | |
| `nok_relationship` | `text` | |
| `employer_name` | `text` | |
| `employer_no` | `text` | EC Number (civil servants) |
| `ministry` | `text` | Government ministry (civil servants) |
| `is_civil_servant` | `boolean` | |
| `monthly_income` | `text` | |
| `employment_phone` | `text` | |
| `employer_contact_person` | `text` | |
| `employer_email` | `text` | |
| `employer_address` | `text` | |
| `is_profile_complete` | `boolean` | Computed completion flag |
| `role` | `text` | `customer` \| `admin` \| `super_admin` |

---

### `public.applications`

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users` |
| `reference` | `text` | e.g. `LN-4821` |
| `status` | `text` | `submitted` \| `approved` \| `rejected` \| `draft` |
| `created_at` | `timestamptz` | |
| `store_id` | `int` | FK → `stores.id` |
| `store_name` | `text` | Denormalised store name at time of submission |
| `national_id` | `text` | |
| `product_name` | `text` | Item being financed |
| `retail_price` | `numeric(12,2)` | Full retail price (USD) |
| `deposit_amount` | `numeric(12,2)` | Upfront deposit |
| `balance_amount` | `numeric(12,2)` | Amount to be financed |
| `tenure_months` | `integer` | Repayment period |
| `first_name` | `text` | Snapshot of customer name at submission |
| `last_name` | `text` | |
| `date_of_birth` | `text` | |
| `gender` | `text` | |
| `photo_url` | `text` | |
| `physical_address` | `text` | |
| `mobile_number` | `text` | |
| `email_address` | `text` | |
| `employer_name` | `text` | |
| `is_civil_servant` | `boolean` | |
| `employer_no` | `text` | |
| `ministry` | `text` | |
| `employer_phone` | `text` | |
| `employer_contact_person` | `text` | |
| `employer_email` | `text` | |
| `employer_address` | `text` | |
| `kin_full_name` | `text` | |
| `kin_relationship` | `text` | |
| `kin_mobile` | `text` | |
| `kin_address` | `text` | |
| `id_copy_url` | `text` | Supabase Storage URL |
| `payslip_url` | `text` | Supabase Storage URL |

---

### `public.stores`

| Column | Type | Description |
|---|---|---|
| `id` | `serial` | PK |
| `name` | `text` | Store display name |
| `code` | `text` | Short code, e.g. `TVS-001` |
| `location` | `text` | Physical address |
| `hours` | `text` | Trading hours |
| `logo_url` | `text` | Store logo |
| `admin_id` | `uuid` | FK → `auth.users` (the store's admin) |
| `created_at` | `timestamptz` | |

---

## 5. Row-Level Security

All tables have RLS enabled. Summary:

| Table | Customer | Admin | Super Admin |
|---|---|---|---|
| `profiles` | Own row only | Profiles of customers who applied to their store | Full access |
| `applications` | Own applications only | Applications for their store | Full access |
| `stores` | Read-only (all stores) | Read-only | Full CRUD |

**Special note:** Stores are publicly readable (even unauthenticated) to allow the store-selection step in the application flow before login.

---

## 6. Storage Buckets

| Bucket | Public | Used for |
|---|---|---|
| `avatars` | ✓ | Profile photos uploaded via the dashboard |
| `applications` | ✓ | ID copies and payslips attached to applications |

**Upload path pattern:**
- Avatars: `avatars/{user_id}/avatar.{ext}`
- Application docs: `applications/{application_id}/{filename}`

---

## 7. Role System

| Role | Access |
|---|---|
| `customer` | Dashboard, own applications, own profile |
| `admin` | Admin panel for their assigned store — applications and customers |
| `super_admin` | All stores, all applications, all customers, platform admin |

Roles are stored in `profiles.role`. A database trigger (`handle_new_user`) reads the `role` field from `auth.users.raw_user_meta_data` at signup, so invited admins automatically get the correct role.

---

## 8. Impersonation

Super admins can impersonate any user to view the platform from their perspective.

**How it works:**
1. Super admin clicks "View as Customer" or "View as Admin".
2. `startImpersonation()` validates the caller is `super_admin`, then sets a non-httpOnly cookie `htb_impersonate` containing the target user info.
3. The caller is redirected to `/dashboard` or `/admin`.
4. `ImpersonationBanner` (rendered in all layouts) reads the cookie client-side and displays a persistent banner.
5. "Exit View" calls `stopImpersonation()` which deletes the cookie and redirects back.

**Cookie name:** `htb_impersonate`  
**Cookie TTL:** 1 hour  
**Payload:**
```json
{
  "targetUserId": "uuid",
  "targetName": "Display Name",
  "returnPath": "/super-admin/customers",
  "startedAt": 1714500000000
}
```

> Note: Impersonation is visual only — it does not switch the Supabase auth session. The super admin's own credentials are still used for all DB operations.

---

## 9. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✓ | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | Supabase service role key (server-only, never expose to client) |
| `RESEND_API_KEY` | — | Resend email API key. If absent, emails are mocked. |

---

## 10. MS365 Integration Guide

This section documents how to integrate Microsoft 365 services into the HTB Global platform.

### Overview of Integration Points

| MS365 Service | HTB Global Use Case |
|---|---|
| **Microsoft Entra ID (Azure AD)** | Single Sign-On (SSO) for staff — admins and super admins log in with their work accounts |
| **Microsoft Graph API** | Read user details, sync org directory, send emails via Outlook |
| **SharePoint / OneDrive** | Store application documents (ID copies, payslips) in corporate document libraries |
| **Teams Webhooks** | Notify staff channels when new applications are submitted or status changes |
| **Power Automate** | Trigger workflows on application events (approval, rejection) |
| **Outlook (Graph Mail)** | Replace Resend with Microsoft-managed email sending |

---

### 10.1 Microsoft Entra ID SSO

Supabase supports Azure AD as an OAuth provider. This allows your admins and super admins to sign in with their `@yourorg.co.zw` Microsoft accounts.

#### Step 1 — Register an App in Azure

1. Go to [Azure Portal](https://portal.azure.com) → **Entra ID** → **App Registrations** → **New Registration**.
2. Name: `HTB Global`
3. Supported account types: **Single tenant** (your org only) or **Multitenant** depending on need.
4. Redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
5. Click **Register**. Note the **Application (client) ID** and **Directory (tenant) ID**.
6. Under **Certificates & Secrets** → **New client secret**. Copy the secret value immediately.
7. Under **API Permissions**, add `User.Read` (delegated).

#### Step 2 — Enable Azure in Supabase

In the Supabase Dashboard → **Authentication** → **Providers** → **Azure**:

```
Client ID:     <Application (client) ID from step 1>
Client Secret: <Secret value from step 1>
Tenant URL:    https://login.microsoftonline.com/<Directory (tenant) ID>/
```

#### Step 3 — Add sign-in button in the app

Create or update `src/components/MicrosoftSignInButton.tsx`:

```tsx
'use client'
import { createClient } from '@/utils/supabase/client'

export function MicrosoftSignInButton() {
  const supabase = createClient()

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        scopes: 'email openid profile',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <button onClick={handleSignIn} className="...">
      Sign in with Microsoft
    </button>
  )
}
```

Add it to `src/app/login/page.tsx` alongside the existing form.

#### Step 4 — Assign roles to Microsoft users

When a Microsoft user signs in for the first time, Supabase creates an `auth.users` row and the `handle_new_user` trigger creates their `profiles` row with `role = 'customer'` by default.

To automatically assign `admin` or `super_admin` to specific Microsoft accounts, add a Supabase DB function that checks the user's email domain or a custom claim:

```sql
-- Run in Supabase SQL Editor
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role text;
begin
  -- Assign super_admin to a specific email, admin from invite metadata, else customer
  v_role := coalesce(
    new.raw_user_meta_data ->> 'role',
    case when new.email = 'superadmin@yourorg.co.zw' then 'super_admin' else 'customer' end
  );

  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    v_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
```

---

### 10.2 Microsoft Graph API

Use the Graph API to read staff directory info or send emails through Outlook.

#### Required packages

```bash
npm install @azure/msal-node @microsoft/microsoft-graph-client
```

#### Create a Graph client utility

Create `src/utils/msgraph.ts`:

```ts
import { ClientSecretCredential } from '@azure/identity'
import { Client } from '@microsoft/microsoft-graph-client'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'

export function createGraphClient() {
  const credential = new ClientSecretCredential(
    process.env.AZURE_TENANT_ID!,
    process.env.AZURE_CLIENT_ID!,
    process.env.AZURE_CLIENT_SECRET!,
  )

  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'],
  })

  return Client.initWithMiddleware({ authProvider })
}
```

Add to `.env.local`:

```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

#### Required Azure App Permissions (Application permissions, not delegated)

| Permission | Use |
|---|---|
| `Mail.Send` | Send emails as a service account |
| `User.Read.All` | Read user profiles from the org directory |
| `Files.ReadWrite.All` | Upload documents to SharePoint/OneDrive |

Grant admin consent for these permissions in Azure Portal → App Registrations → API Permissions.

---

### 10.3 Send Emails via Outlook (replace Resend)

Replace `src/app/api/send-confirmation/route.ts` with a Graph Mail implementation:

```ts
// src/app/api/send-confirmation/route.ts
import { NextResponse } from 'next/server'
import { createGraphClient } from '@/utils/msgraph'

export async function POST(req: Request) {
  const { email, pdfBase64, customerName, reference } = await req.json()

  try {
    const graph = createGraphClient()
    const base64Data = pdfBase64.split(',')[1] || pdfBase64

    await graph.api('/users/notifications@yourorg.co.zw/sendMail').post({
      message: {
        subject: `Loan Application Submitted: ${reference}`,
        body: {
          contentType: 'HTML',
          content: `
            <p>Dear ${customerName},</p>
            <p>Your application <strong>${reference}</strong> has been submitted.</p>
          `,
        },
        toRecipients: [{ emailAddress: { address: email } }],
        attachments: [
          {
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: `Application-${reference}.pdf`,
            contentType: 'application/pdf',
            contentBytes: base64Data,
          },
        ],
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

---

### 10.4 Store Documents in SharePoint / OneDrive

Upload application documents (ID copies, payslips) to a SharePoint document library instead of (or in addition to) Supabase Storage.

Create `src/utils/sharepoint.ts`:

```ts
import { createGraphClient } from './msgraph'

const SITE_ID = process.env.SHAREPOINT_SITE_ID!      // SharePoint site ID
const DRIVE_ID = process.env.SHAREPOINT_DRIVE_ID!    // Document library drive ID

export async function uploadToSharePoint(
  fileName: string,
  fileBuffer: Buffer,
  folderPath: string,
): Promise<string> {
  const graph = createGraphClient()

  const response = await graph
    .api(`/sites/${SITE_ID}/drives/${DRIVE_ID}/root:/${folderPath}/${fileName}:/content`)
    .put(fileBuffer)

  return response.webUrl as string
}
```

Add to `.env.local`:
```env
SHAREPOINT_SITE_ID=your-sharepoint-site-id
SHAREPOINT_DRIVE_ID=your-drive-id
```

To find these IDs:
```bash
# Get site ID
curl -H "Authorization: Bearer <token>" \
  "https://graph.microsoft.com/v1.0/sites/yourorg.sharepoint.com:/sites/HTBDocuments"

# Get drive ID
curl -H "Authorization: Bearer <token>" \
  "https://graph.microsoft.com/v1.0/sites/<site-id>/drives"
```

---

### 10.5 Microsoft Teams Notifications

Send a Teams channel message when an application is submitted or approved.

#### Step 1 — Create an Incoming Webhook in Teams

1. In Teams, go to the target channel → **···** → **Connectors** → **Incoming Webhook**.
2. Name it `HTB Alerts`, copy the webhook URL.

#### Step 2 — Create a notification utility

Create `src/utils/teams.ts`:

```ts
export async function notifyTeams(webhookUrl: string, message: {
  title: string
  text: string
  color?: string
}) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: message.color ?? '0078D4',
      summary: message.title,
      sections: [{ activityTitle: message.title, activityText: message.text }],
    }),
  })
}
```

Add to `.env.local`:
```env
TEAMS_WEBHOOK_URL=https://yourorg.webhook.office.com/webhookb2/...
```

#### Step 3 — Call from the application submission

In `src/app/(application)/apply/summary/page.tsx` (server action or route), after inserting the application:

```ts
import { notifyTeams } from '@/utils/teams'

await notifyTeams(process.env.TEAMS_WEBHOOK_URL!, {
  title: `New Application: ${reference}`,
  text: `**${customerName}** submitted a loan application at **${storeName}** for **${productName}** (${reference}).`,
  color: '6D28D9',
})
```

---

### 10.6 Power Automate Webhooks

Power Automate can listen for HTTP triggers and run approval workflows, update SharePoint lists, or send adaptive card notifications.

#### Create a Power Automate flow

1. In Power Automate → **Create** → **Instant cloud flow** → **When an HTTP request is received**.
2. Copy the **HTTP POST URL** generated.
3. Define the JSON schema for your payload (use the application fields from [Section 4](#4-database-schema)).

#### Trigger from HTB Global

Create `src/utils/powerautomate.ts`:

```ts
export async function triggerPowerAutomate(payload: Record<string, unknown>) {
  const url = process.env.POWER_AUTOMATE_WEBHOOK_URL
  if (!url) return

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}
```

Add to `.env.local`:
```env
POWER_AUTOMATE_WEBHOOK_URL=https://prod-xx.westus.logic.azure.com/workflows/...
```

Trigger on application submission:
```ts
await triggerPowerAutomate({
  event: 'application.submitted',
  reference,
  customerName,
  storeName,
  productName,
  retailPrice,
  submittedAt: new Date().toISOString(),
})
```

---

### 10.7 Complete `.env.local` for MS365

```env
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email (existing — keep as fallback)
RESEND_API_KEY=re_...

# Microsoft Entra ID / Azure AD
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-client-secret-value

# SharePoint / OneDrive
SHAREPOINT_SITE_ID=yourorg.sharepoint.com,site-guid,web-guid
SHAREPOINT_DRIVE_ID=drive-guid

# Teams
TEAMS_WEBHOOK_URL=https://yourorg.webhook.office.com/webhookb2/...

# Power Automate
POWER_AUTOMATE_WEBHOOK_URL=https://prod-xx.westus.logic.azure.com/workflows/...
```

---

### 10.8 Integration Priority Recommendation

Start with these in order — each builds on the previous:

| Priority | Integration | Effort | Value |
|---|---|---|---|
| 1 | **Entra ID SSO** | Low | Staff use their existing work credentials |
| 2 | **Teams Notifications** | Low | Instant visibility when applications arrive |
| 3 | **Graph Mail (Outlook)** | Medium | Emails from your org domain, no third-party dependency |
| 4 | **Power Automate** | Medium | Approval workflows, escalation, SharePoint list sync |
| 5 | **SharePoint Storage** | Medium-High | Centralised document management under IT governance |
