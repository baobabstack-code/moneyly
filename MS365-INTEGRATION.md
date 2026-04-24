# Microsoft 365 Integration Guide

This guide walks you through connecting HTB Global to Microsoft 365 so that every submitted loan application automatically creates a SharePoint record, uploads the PDF, and sends an Outlook notification.

---

## What Happens on Each Submission

1. Application saves to **Supabase** (primary database)
2. **PDF** is generated
3. Confirmation email sent to the customer via **Resend**
4. Simultaneously (non-blocking):
   - **SharePoint List** — new item created with all 29 application fields
   - **SharePoint Document Library** — PDF uploaded as `LN-XXXX.pdf`
   - **Outlook** — notification email with PDF sent to your business inbox

---

## Step 1 — Azure App Registration

1. Go to [portal.azure.com](https://portal.azure.com) and sign in with your Microsoft 365 admin account
2. Navigate to **Azure Active Directory** → **App registrations** → **New registration**
3. Name it something like `HTB Global Loans` and click **Register**
4. Note down:
   - **Directory (tenant) ID** → this is your `MS365_TENANT_ID`
   - **Application (client) ID** → this is your `MS365_CLIENT_ID`

---

## Step 2 — Create a Client Secret

1. In your App Registration, go to **Certificates & secrets** → **New client secret**
2. Give it a description and set an expiry (24 months recommended)
3. Click **Add** — copy the **Value** immediately (it won't be shown again)
4. This is your `MS365_CLIENT_SECRET`

---

## Step 3 — Add API Permissions

1. In your App Registration, go to **API permissions** → **Add a permission** → **Microsoft Graph**
2. Select **Application permissions** (not Delegated)
3. Add these three permissions:
   - `Sites.ReadWrite.All`
   - `Files.ReadWrite.All`
   - `Mail.Send`
4. Click **Grant admin consent for [your org]** — the status must show green ticks

---

## Step 4 — Create the SharePoint List

1. Go to your SharePoint site and click **New** → **List** → **Blank list**
2. Name it exactly: **Loan Applications**
3. Add the following columns (go to **Add column** for each):

| Column Name | Internal Name | Type |
|---|---|---|
| Title | Title | Single line of text *(already exists — rename to "Reference")* |
| Status | Status | Choice → add: Submitted, Approved, Rejected |
| Store Name | StoreName | Single line of text |
| Store ID | StoreId | Number |
| National ID | NationalId | Single line of text |
| First Name | FirstName | Single line of text |
| Last Name | LastName | Single line of text |
| Date of Birth | DateOfBirth | Date and time |
| Gender | Gender | Choice → add: Male, Female |
| Mobile Number | MobileNumber | Single line of text |
| Email Address | EmailAddress | Single line of text |
| Physical Address | PhysicalAddress | Multiple lines of text |
| Employer Name | EmployerName | Single line of text |
| Is Civil Servant | IsCivilServant | Yes/No |
| EC Number | EmployerNo | Single line of text |
| Ministry | Ministry | Single line of text |
| Employer Phone | EmployerPhone | Single line of text |
| Product Name | ProductName | Single line of text |
| Retail Price | RetailPrice | Currency |
| Deposit Amount | DepositAmount | Currency |
| Balance Amount | BalanceAmount | Currency |
| Next of Kin Name | KinFullName | Single line of text |
| Next of Kin Relationship | KinRelationship | Single line of text |
| Next of Kin Mobile | KinMobile | Single line of text |
| Next of Kin Address | KinAddress | Multiple lines of text |
| ID Copy URL | IdCopyUrl | Hyperlink |
| Payslip URL | PayslipUrl | Hyperlink |
| PDF Document URL | PdfDocumentUrl | Hyperlink |
| Submission Date | SubmissionDate | Date and time |

> **Important:** The **Internal Name** is set when the column is first created. Use exactly the names in the Internal Name column — spaces or different casing will break the integration.

---

## Step 5 — Create the Document Library Folder

1. Go to your SharePoint site's **Documents** library (or whichever Document Library you want to use)
2. Click **New** → **Folder**
3. Name it exactly: **Loan Applications**

PDFs will be uploaded here as `LN-XXXX.pdf`.

---

## Step 6 — Get Your SharePoint IDs

You need three IDs from Microsoft Graph. The easiest way is via **Graph Explorer** at [developer.microsoft.com/graph/graph-explorer](https://developer.microsoft.com/en-us/graph/graph-explorer).

Sign in with your Microsoft 365 admin account, then run these queries:

### Get Site ID
```
GET https://graph.microsoft.com/v1.0/sites/{your-sharepoint-hostname}:/sites/{your-site-name}
```
Example: `https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/htbglobal`

Copy the `id` field from the response → `MS365_SHAREPOINT_SITE_ID`

### Get List ID
```
GET https://graph.microsoft.com/v1.0/sites/{site-id}/lists
```
Find the list named **Loan Applications** in the response and copy its `id` → `MS365_SHAREPOINT_LIST_ID`

### Get Drive ID
```
GET https://graph.microsoft.com/v1.0/sites/{site-id}/drives
```
Find your Document Library (usually named **Documents**) and copy its `id` → `MS365_SHAREPOINT_DRIVE_ID`

---

## Step 7 — Set Environment Variables

### In `.env` (local development)

Open `.env` and fill in the values:

```env
MS365_TENANT_ID="your-tenant-id"
MS365_CLIENT_ID="your-client-id"
MS365_CLIENT_SECRET="your-client-secret"
MS365_SHAREPOINT_SITE_ID="your-site-id"
MS365_SHAREPOINT_LIST_ID="your-list-id"
MS365_SHAREPOINT_DRIVE_ID="your-drive-id"
MS365_SENDER_UPN="sender@yourdomain.com"
MS365_NOTIFY_EMAIL="loans@yourdomain.com"
```

- `MS365_SENDER_UPN` — a licensed Microsoft 365 mailbox that will send the Outlook notification (e.g. a shared mailbox or a dedicated `noreply@` address)
- `MS365_NOTIFY_EMAIL` — the business inbox that receives new application alerts

### In Vercel (production)

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add each of the 8 `MS365_*` variables above with their values
3. Redeploy for the changes to take effect

---

## Step 8 — Verify It Works

Submit a test application end-to-end, then check:

- [ ] SharePoint **Loan Applications** list — new item appears with all fields populated
- [ ] SharePoint **Documents/Loan Applications** folder — PDF named `LN-XXXX.pdf` appears
- [ ] `MS365_NOTIFY_EMAIL` inbox — notification email received with PDF attached
- [ ] User reaches the `/success` page regardless of MS365 outcome

To test graceful degradation: temporarily remove one env var and resubmit — the user should still reach `/success` and the server logs will show `MS365: Missing env vars: ... Skipping.`

---

## Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| `Missing env vars` in server logs | One or more `MS365_*` vars not set | Check Vercel env vars and redeploy |
| `403 Forbidden` from Graph API | Admin consent not granted | Go to App Registration → API permissions → Grant admin consent |
| `404 Not Found` on list/drive | Wrong Site ID, List ID, or Drive ID | Re-run Graph Explorer queries to get correct IDs |
| List item created but PDF missing | "Loan Applications" folder doesn't exist in Document Library | Create the folder manually in SharePoint |
| Outlook send fails | `MS365_SENDER_UPN` mailbox not licensed or wrong UPN | Use a valid licensed mailbox; check UPN format (`user@domain.com`) |
| Client secret expired | Secret was set with short expiry | Create a new secret in App Registration → Certificates & secrets |
