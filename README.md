# attendIDto — Smart & Privacy-First Campus Event Attendance

> **Technopreneurship Project:** Real-time, Paperless, and ID-Privacy-First Web Application for Student Organizations and Universities (CDO & Regional Campuses).

---

## 🌟 Key Features

1. **Unified Single-Account Model:**
   - Every student and campus organization member uses **one unified account**.
   - Everyone is equipped with their own **Student's Personal QR Pass** and has the ability to **Start an Event**.

2. **Zero Student ID Displayed (Privacy Compliance):**
   - Strictly conforms to university student privacy rules.
   - Encodes a secure system token (`AID-PASS-XXXXXXXX`) rather than exposing physical student ID numbers.
   - Includes "Save to Photos" for instant offline presentation at event entrances.

3. **"Start an Event" & Simulated Payment Flow:**
   - Interactive event creation wizard (Event Name, Venue, Date, Time, Target Attendees, Time-Out toggle).
   - Technopreneurship monetization checkout modal with **GCash**, **PayMaya**, and **Card** simulated processing and reference number generation.

4. **"Sign in a Participant" Camera Scanner:**
   - In-browser camera scanning powered by `html5-qrcode`.
   - Audio feedback synthesizer (Web Audio API): Success chime, duplicate warning tone, and error buzzer.
   - Duplicate prevention alerts (*"Already checked in at [Time]"*).
   - Quick 1-click presentation demo buttons for defense testing on non-webcam devices.

5. **Live Multi-Device Attendance Progress HUD:**
   - Real-time gauge tracking **Target Attendees vs Current Attendees vs Turnout %**.
   - Multiple organizers can scan simultaneously at separate gates.

6. **Automatic Organization & Print-Ready University Reports:**
   - Instant categorization and filtering by **Department**, **Course**, and **Year Level (1st to 6th Year)**.
   - Official administrative report layout with formal signature lines (*Prepared by*, *Noted by*, *Approved by*).
   - One-click Print / Save as PDF and CSV spreadsheet export.

7. **My Attendance History:**
   - Shows students all events they attended with verified **Time In** timestamps.

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

App runs locally at: `http://localhost:5173/`

---

## Production Setup: Supabase, Admin Review, and Vercel

The production workflow uses Supabase Auth and Postgres. New event requests are pending until an administrator approves the submitted payment reference. The browser never receives a service-role key.

### 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In **Project Settings → API**, copy the project URL and the publishable/anon client key.
3. The GitHub Supabase workflow applies [`supabase/migrations`](./supabase/migrations) in order. On a fresh project it creates the base schema, admin workflow, profile repair, and owner-only event deletion policies.
4. In **Authentication → URL Configuration**, add the local and deployed app URLs to the allowed redirect URLs. Enable email confirmation for user accounts.
5. In **Authentication → Providers → Email**, ensure password sign-in is enabled.

If the original [`supabase_schema.sql`](./supabase_schema.sql) was already applied manually, first mark the baseline migration as applied so the automated workflow doesn't replay its non-idempotent policy setup:

```powershell
supabase migration repair --status applied 202610230001 --project-ref YOUR_PROJECT_REF
```

### 2. Provision the first admin

1. Create the administrator account in **Authentication → Users → Add user** with the admin's email and a strong unique password. Do not make an admin account through public sign-up.
2. Copy that user's UUID from the Auth users table.
3. In SQL Editor, run the following with the actual UUID:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = 'ADMIN_AUTH_USER_UUID';
   ```

The admin dashboard role is read from the protected profile row. Never expose a service-role key or allow users to edit their own role.

### 3. Configure payment notification email

1. Verify a sending domain in [Resend](https://resend.com) and create an API key.
2. Add the GitHub Actions secrets listed below. The approved Supabase workflow sets the Edge Function secrets and deploys the function.

The dashboard inbox is backed by the database; email is a notification. Failed email delivery is shown in the app and does not undo a saved event request or review decision.

### 4. Deploy to Vercel

1. Push the project to GitHub and import it in Vercel. Add these environment variables in **Vercel → Project → Settings → Environment Variables** for Production:

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-publishable-or-anon-key
   ```

2. Select **Vite**, use `npm run build` as the build command and `dist` as the output directory.
3. Add the GitHub Actions secrets below. Pushes to `main` then run the frontend deployment workflow.
4. Add the resulting Vercel URL to Supabase's allowed redirect URLs and set `APP_ORIGIN` to that exact URL in GitHub Actions secrets.
5. Test with a normal account: submit an event and payment reference, confirm it appears pending and cannot open scanning, review it as the admin, then confirm approval enables scanning and cancellation removes the event from My Events.

### 5. GitHub Actions setup

Create these repository secrets under **GitHub → Settings → Secrets and variables → Actions**:

- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, `ADMIN_EMAIL`, `NOTIFICATION_FROM_EMAIL`, `APP_ORIGIN`

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel project environment variables; the workflow pulls them from Vercel during its production build. The Vercel token/project identifiers can be obtained by linking the project with the Vercel CLI and checking `.vercel/project.json` (do not commit that file).

Create a GitHub environment named **production** and configure **Required reviewers**. The Supabase workflow is started manually from **Actions → Deploy Supabase production changes → Run workflow**, and requires the confirmation checkbox plus approval for that environment. It applies committed migrations and deploys the notification and self-account-deletion functions. `SUPABASE_SERVICE_ROLE_KEY` is stored only as a Supabase Edge Function secret and must never be added to Vercel or any `VITE_` variable. `APP_ORIGIN` must exactly match the browser origin, for example `https://attendidto.vercel.app`; for additional preview URLs, enter comma-separated origins with no trailing slash. Run this Supabase workflow after adding or changing the secrets and before testing account deletion. If Vercel's native Git integration also deploys production on pushes, disable one of the two deployment paths to avoid duplicate deployments.

The app intentionally fails closed in a production build without Supabase configuration. Local development without Supabase remains a demo using browser storage; it does not provide cross-device accounts, admin review, or production payment verification. Payment references are manually reviewed, not verified automatically against a payment provider.

Attendance scanning is restricted to the host of an approved active event. The database also limits each host to 30 scan attempts per event per minute. The payment workflow remains manual payment-reference submission and administrator review; it does not require a payment gateway.
