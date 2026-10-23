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

## 🗄️ Supabase Setup (Optional for Live Production)

The application works out-of-the-box with real-time local storage and cross-tab synchronization. To connect to your live Supabase cloud database:

1. Create a Supabase project at [https://supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard and paste the contents of [`supabase_schema.sql`](./supabase_schema.sql).
3. Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
4. Restart the Vite dev server (`npm run dev`).
