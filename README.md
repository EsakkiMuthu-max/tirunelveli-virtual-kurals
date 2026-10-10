# Tirunelveli Virtual Kural — திருநெல்வேலி மெய்நிகர் குறள்

A civic grievance redressal portal for the Tirunelveli Corporation, built as a
**Spring Boot 3 + Maven** REST API behind a **React 19 + TypeScript (Vite)** web UI.

Citizens sign in with a pre-issued ID, file a complaint against **one of exactly seven
departments**, and attach a photo or video. The browser can detect the reporting location, and
optional local AI estimates help the assigned officer review category relevance and whether the
media visually resembles a camera capture or AI-generated media. **AI never rejects a complaint**:
only the officer assigned to that department can reject it, and their reason is retained for both
the officer and citizen.

---

## What is included

- **Login only.** There is no registration screen and no registration endpoint. The account
  pool is provisioned on first boot: 9999 citizens and 7 officers.
- **Seven categories, seven departments, seven officers** — one category per complaint.
- **Reporting location.** Browser location permission provides coordinates and an optional area
  label lookup through the free OpenStreetMap Nominatim reverse geocoder. If permission or lookup
  is unavailable, citizens can enter the area manually; attached-file GPS is not required.
- **Advisory local vision review** (`EvidenceScreeningService`): optional Ollama/Qwen2.5-VL estimates
  whether the media appears to match the selected complaint category and whether it resembles a
  camera capture or AI-generated content. These are shown as review details, not acceptance or
  rejection criteria.
- **Evidence stored in the database** alongside the complaint, so a report is never separated
  from its proof.
- **Officer workspace** with department-scoped queue, stats, the full screening audit trail,
  and status updates with a rejection reason that lands on the citizen's timeline. Rejected
  complaints and evidence are retained; there is no automatic purge.
- **No dictation anywhere.** The description field is typed only.

---

## Prerequisites

| Tool | Version | Check with |
|---|---|---|
| Java JDK | 17 or newer | `java -version` |
| Apache Maven | 3.9 or newer | `mvn -version` |
| Node.js | 20 or newer | `node -v` |

The database is **MySQL 8**. Install MySQL Server and make sure it is running on `localhost:3306`.
The `tirunelveli_virtual_kural` database and all tables are created automatically on first run.
Default login is `root` / `root` — change it in `backend/src/main/resources/application.properties`
or set the `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` environment variables.

---

## Run it on Windows (Command Prompt)

### Step 1 — Unzip and open Command Prompt

```bat
cd /d C:\tirunelveli-virtual-kural
```

### Step 2 — Start the Spring Boot API

```bat
cd backend
mvn spring-boot:run
```

The first run downloads dependencies, creates the MySQL database and tables, and seeds the accounts.
Watch for these lines:

```
Officers ready: 7
Citizens created: 9999 (total 9999)
Started TirunelveliVirtualKuralApplication in ... seconds
```

**Leave this window open.** The API is now live:

- REST API — <http://localhost:8080/api>
- MySQL — browse data with MySQL Workbench or `mysql -u root -p tirunelveli_virtual_kural`

> Shortcut: double-click `run-backend.bat` in the project root instead of steps 1–2.

### Step 3 — Start the web UI in a SECOND Command Prompt

```bat
cd /d C:\tirunelveli-virtual-kural\frontend
npm install
npm run dev
```

> Shortcut: double-click `run-frontend.bat`.

### Step 4 — Open the app

<http://localhost:3000>

---

## Sign-in credentials

These are seeded automatically. There is no sign-up.

### Citizens — 9999 accounts

| Citizen ID | Password |
|---|---|
| `TVK0001` through `TVK9999` | `citizen@123` |

### Officers — 7 accounts, one per department

| Officer ID | Department | Password |
|---|---|---|
| `officer1` | Roads & Potholes | `officer@123` |
| `officer2` | Water Supply | `officer@123` |
| `officer3` | Sewerage & Drainage | `officer@123` |
| `officer4` | Street Lights | `officer@123` |
| `officer5` | Solid Waste | `officer@123` |
| `officer6` | Parks & Public Spaces | `officer@123` |
| `officer7` | Encroachment & Buildings | `officer@123` |

An officer must select their own department on the login screen. Picking someone else's
department is refused with `403`.

> Change the demo passwords before any real deployment: edit
> `app.seed.citizen-password` / `app.seed.officer-password` in
> `backend/src/main/resources/application.properties`, delete `backend/data/`, and restart.

---

## Local AI evidence review (optional)

The app requires no API keys. To enable local visual estimates, install Ollama on the same machine
as the backend and run:

```sh
ollama pull qwen2.5vl:3b
ollama serve
```

The backend calls Ollama at `http://localhost:11434/api/chat` using the model configured in
`backend/src/main/resources/application.properties`. Video review extracts one representative
frame with `ffmpeg`, which must be on the backend machine's `PATH`. If Ollama, the model, or ffmpeg
is unavailable, the complaint still submits and the officer sees that the check was unavailable.
Visual AI estimates are not proof of provenance and do not make a complaint decision. Location
detection uses the browser's permission-based geolocation; OpenStreetMap reverse geocoding is
optional and falls back to coordinates if unavailable.

---

## REST API

Every route is under `/api`. Auth is an httpOnly session cookie; no token is ever returned
in a JSON body.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/departments` | The seven departments |
| `POST` | `/api/auth/citizen/login` | Citizen sign-in |
| `POST` | `/api/auth/officer/login` | Officer sign-in (department-scoped) |
| `GET` | `/api/auth/me` | Who am I |
| `POST` | `/api/auth/logout` | Sign out |
| `POST` | `/api/complaints` | File a complaint (multipart, with evidence) |
| `GET` | `/api/complaints/mine` | The signed-in citizen's complaints |
| `GET` | `/api/complaints/mine/stats` | Citizen dashboard counters |
| `GET` | `/api/complaints/{id}` | One complaint |
| `GET` | `/api/complaints/{id}/evidence` | Stream the stored evidence file |
| `GET` | `/api/officer/complaints?status=` | Department queue |
| `GET` | `/api/officer/stats` | Department counters |
| `PATCH` | `/api/officer/complaints/{id}/status` | Change status with a note |

---

## Project layout

```
tirunelveli-virtual-kural/
  run-backend.bat            Starts the Spring Boot API
  run-frontend.bat           Installs and starts the Vite dev server
  backend/
    pom.xml
    src/main/resources/application.properties
    src/main/java/com/tirunelveli/kural/
      TirunelveliVirtualKuralApplication.java
      config/WebConfig.java              CORS for the Vite dev origin
      domain/                            JPA entities + the Department enum
        Department.java                  The seven categories, as one enum
        AppUser.java, UserSession.java
        Complaint.java, ComplaintUpdate.java
        ComplaintEvidence.java, EvidenceCheck.java
      repository/                        Spring Data JPA repositories
      service/
        PasswordService.java             PBKDF2-HMAC-SHA256
        SessionService.java              httpOnly cookie sessions
        EvidenceScreeningService.java    Advisory visual-AI review + metadata
        ComplaintService.java            Complaint lifecycle
        DataSeeder.java                  9999 citizens + 7 officers
      web/                               REST controllers + error handling
      dto/Dtos.java                      Wire shapes
  frontend/
    src/pages/                 Login, CitizenDashboard, ReportIssue, MyReports,
                               OfficerDashboard
    src/components/            AppShell, StatCard, StatusBadge, EvidenceAudit
    src/lib/api.ts             Typed fetch layer over /api
    src/lib/types.ts           TypeScript mirrors of the Java DTOs
```

---

## Build a production JAR

```bat
cd backend
mvn clean package
java -jar target\virtual-kural-1.0.0.jar
```

For a single-origin deployment, build the UI and copy it into the API's static folder:

```bat
cd frontend
npm run build
xcopy /E /I /Y dist ..\backend\src\main\resources\static
cd ..\backend
mvn clean package
```

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `'mvn' is not recognized` | Install Maven and add its `bin` folder to `PATH`, then open a new Command Prompt. |
| `Port 8080 was already in use` | `netstat -ano \| findstr :8080`, then `taskkill /PID <pid> /F`. |
| `Port 3000 is in use` | Stop the other process, or run `npm run dev -- --port 3001` and update the proxy target note. |
| Login always fails | Delete `backend\data\` and restart the API so the seeder re-runs. |
| Reporting location is unavailable | Allow location access in the browser, or enter the area or ward manually. |
| `npm install` fails on a corporate network | `npm config set registry https://registry.npmjs.org/` and retry. |

---

## A note on the authenticity screening

The two visual AI outputs are estimates, not a forensic determination. An officer reviews the
original uploaded image or video and the model's explanation before deciding the complaint. Missing
GPS metadata, a suspected AI-generated image, or a possible category mismatch never automatically
rejects a complaint.

## Rejected complaints

Only an officer assigned to the complaint's department can reject it, and a rejection requires a
reason. Rejected complaints, reasons, status history, and attached evidence stay stored and appear
in the officer's **Rejected** tab and the citizen's dashboard/report history. There is no scheduled
deletion.

## AI-generated evidence detection

Qwen2.5-VL runs locally through Ollama and gives an advisory camera-versus-AI-generated estimate
along with a category relevance estimate. No token or API key is needed. The model can be wrong or
unavailable; its output is displayed to officers and never changes the complaint status.


## Evidence capture & AI category check (updated)

- Citizens can only capture a **live photo or video** (up to 30 s) from the camera on the Report page. Gallery/file uploads are removed.
- A free AI model (CLIP via transformers.js) runs **in the browser** — no API key, no Ollama, no ffmpeg. It checks only whether the capture visually shows the selected complaint category. If it doesn't match, the citizen must retake it.
- The model (~90 MB) downloads once on first use and is cached by the browser. If it cannot load, the complaint can still be submitted and the officer sees "check could not run".
- Officers now reliably see the attached photo/video (evidence loads inside a transaction and videos support seeking).
- Camera access needs `http://localhost` or HTTPS.
