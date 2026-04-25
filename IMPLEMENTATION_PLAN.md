# WealthView — Implementation Plan

> v1.1 · Created 2026-04-01 · Updated with confirmed configuration

---

## Addressing the Core Tension: Static App vs. Python Backend

The requirements document says "no server-side logic" (Section 7) and the chosen hosting is GitHub Pages, which only serves static files. You also want Python. These goals are not mutually exclusive — they operate in different layers.

**Resolution: Python is a development-time and tooling-layer tool, not a runtime server.**

The production app remains 100% client-side JavaScript hitting Google APIs directly from the browser. Python plays these concrete roles:

1. **Setup scripts** — automate Google Cloud project creation, enabling APIs, creating the OAuth client ID, and generating the Google Sheet with the correct tab/column structure via the Sheets API. Run once from a local machine, not from a server.
2. **Data migration / seeding scripts** — bulk-import existing accounts from a CSV (e.g. exported from Mint or a spreadsheet). Python handles the transformation and writes to Sheets.
3. **Local dev tooling** — serve static files locally (`python -m http.server`) and validate `config.js` structure before a push.
4. **CI scripts** — GitHub Actions can run Python to validate the whitelist config before deployment.

### If a True Backend Becomes Necessary

If server-side logic is ever needed (e.g., server-side currency exchange rate fetching to avoid exposing an API key in the browser), free hosting options are:

| Option | Notes |
|---|---|
| **Google Cloud Run** | Free tier: 2M requests/month, 360K GB-seconds compute. Deploy a single Flask endpoint. |
| **Render free tier** | Simple Flask app; cold starts acceptable for low-traffic family use. |
| **Cloudflare Workers** | JS-only; not Python, but noted for completeness. |

For V1, no backend is needed. The free `open.er-api.com` API (no key required) handles currency exchange directly from the browser.

---

## Recommended Tech Stack

### Frontend (Runtime — deployed to GitHub Pages)

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Vanilla JS with ES modules, no build step | No Node.js/npm required. GitHub Pages serves it directly. Zero build pipeline to maintain. |
| Styling | Tailwind CSS via CDN | No build step needed. Responsive by default. |
| Charts | Chart.js via CDN | Lightweight, handles donut + line charts. No build step. |
| Auth | Google Identity Services (`accounts.google.com/gsi/client`) | Google's current recommended OAuth library for SPAs. Handles token refresh automatically. |
| Sheets access | `gapi.client.sheets` via `apis.google.com/js/api.js` | Official client, handles auth token injection automatically. |
| Routing | Hash-based (`#dashboard`, `#accounts`, etc.) | No server config needed. Works on GitHub Pages without a 404 redirect hack. |

### Python (Development + Tooling — never deployed)

| Script | Purpose |
|---|---|
| `scripts/setup_gcloud.py` | Automates Sheets API + OAuth enablement via `google-api-python-client` |
| `scripts/create_sheet.py` | Creates the Google Sheet, adds 3 tabs, writes header rows |
| `scripts/import_accounts.py` | Reads a CSV and bulk-writes account rows to the Sheet |
| `scripts/validate_config.py` | Parses `config.js`, checks required fields — run in CI |
| `scripts/export_csv.py` | Downloads all Sheet data and writes a local CSV backup |

Python dependencies: `google-api-python-client`, `google-auth-oauthlib`, `google-auth`. A `requirements.txt` lives in `scripts/`.

---

## Project Folder Structure

```
MonarchWealthView/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions: validate config, deploy to Pages
├── scripts/                    # Python tooling — run locally, never deployed
│   ├── requirements.txt
│   ├── setup_gcloud.py         # One-time: enable APIs, create OAuth client
│   ├── create_sheet.py         # One-time: create Sheet with correct structure
│   ├── import_accounts.py      # Optional: bulk CSV import
│   ├── validate_config.py      # CI: verify config.js has required fields
│   └── export_csv.py           # Backup: download Sheet data to CSV
├── src/
│   ├── index.html              # Single-page app shell, loads all JS
│   ├── config.js               # OAuth client ID, Sheet ID, whitelist (NOT secret)
│   ├── css/
│   │   └── app.css             # Minimal custom CSS on top of Tailwind
│   ├── js/
│   │   ├── main.js             # App entry point, router, init sequence
│   │   ├── auth.js             # Google Identity Services wrapper
│   │   ├── sheets.js           # All Google Sheets API read/write logic
│   │   ├── store.js            # In-memory state (accounts, history, profile)
│   │   ├── router.js           # Hash-based SPA routing
│   │   ├── currency.js         # FX conversion logic, rate fetching
│   │   └── views/
│   │       ├── dashboard.js    # Net worth summary + KPI cards
│   │       ├── accounts.js     # Account list + add/edit/archive modal
│   │       ├── allocation.js   # Donut chart view
│   │       ├── cashLiquid.js   # Cash & liquid filtered view
│   │       ├── illiquid.js     # Illiquid assets view
│   │       ├── liabilities.js  # Liabilities + debt ratio view
│   │       ├── history.js      # Balance history table + line chart
│   │       └── profile.js      # User profile form
│   └── components/
│       ├── modal.js            # Reusable modal wrapper
│       ├── toast.js            # Success/error toast notifications
│       ├── table.js            # Reusable sortable table
│       └── nav.js              # Sidebar/top nav component
├── docs/
│   ├── setup-guide.md          # Step-by-step owner setup instructions
│   └── adding-users.md         # How to add a new family member
├── IMPLEMENTATION_PLAN.md      # This file
├── README.md
└── WealthView_Requirements.md
```

> **GitHub Pages deployment note:** The GitHub Actions workflow copies `src/` contents into the Pages deployment. Alternatively, rename `src/` to `docs/` and point GitHub Pages at `/docs` — zero workflow configuration needed.

---

## Google Cloud / OAuth Setup (One-Time, Owner Only)

The Python setup scripts automate these steps. Manual equivalent documented here for reference.

### Step 1 — Google Cloud Project
- Create a new project called `WealthView` at `console.cloud.google.com`
- Note the project ID (e.g. `wealthview-abc123`)

### Step 2 — Enable APIs
- Google Sheets API (`sheets.googleapis.com`)
- Google Identity Services does not need to be enabled but requires an OAuth consent screen

### Step 3 — OAuth Consent Screen
- User type: **External**
- App name: WealthView
- Scopes: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/spreadsheets`
- Publishing status: **In production** (prevents token expiry after 7 days)

### Step 4 — OAuth 2.0 Client ID
- Application type: **Web application**
- Authorised JavaScript origins: `https://USERNAME.github.io`
- Copy the Client ID → goes into `config.js`

### Step 5 — Google Sheet
Run `scripts/create_sheet.py` OR manually:
- Create a Google Sheet named "WealthView Data"
- Copy the Sheet ID from the URL
- Rename Sheet1 to "Accounts", add tabs "BalanceHistory" and "UserProfiles"
- Write header rows exactly matching column names in Section 6 of the requirements
- Share the Sheet with each whitelisted family member's Google account at **Editor** level

### Step 6 — config.js

```js
// config.js — safe to commit, not a secret
const CONFIG = {
  CLIENT_ID: '123456789-abc.apps.googleusercontent.com',
  SHEET_ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
  SCOPES: 'https://www.googleapis.com/auth/spreadsheets openid email profile',
  WHITELIST: [
    'owner@gmail.com',
    'spouse@gmail.com',
  ],
  BASE_CURRENCY: 'USD',
  APP_NAME: 'WealthView',
};
```

> The OAuth Client ID is not a secret — it is visible in any browser's network inspector. The Sheet ID is also safe as long as the Sheet requires authentication to access (i.e., not publicly shared).

---

## Phased Implementation Roadmap

### Phase 1 — Auth Shell and Skeleton

**Goal:** A deployed GitHub Pages URL that shows a Google sign-in button, enforces the whitelist, and displays a placeholder dashboard after successful auth.

**Deliverables:**
- `src/index.html` — full page shell with navigation sidebar and main content area
- `src/config.js` — placeholder values for owner to fill in
- `src/js/auth.js` — wraps Google Identity Services:
  - Renders the Google Sign-In button via `google.accounts.id.renderButton`
  - Decodes the returned JWT to extract email and name
  - Checks email against `CONFIG.WHITELIST`
  - On pass: stores user object in `store.js`, triggers app load
  - On fail: renders "Access not granted" screen with the user's email shown
  - Sign-out: calls `google.accounts.id.disableAutoSelect()` and clears store
- `src/js/router.js` — hash-based routing mapping `#dashboard`, `#accounts`, etc. to view modules
- `src/js/main.js` — initialization: load GSI script, attempt auto sign-in, route to correct view
- `src/js/store.js` — in-memory state object: `{ user, accounts, history, profile, fxRates }`
- `src/components/nav.js` — sidebar with nav links, user avatar, sign-out button
- `.github/workflows/deploy.yml` — validate config, deploy `src/` to Pages

**Python work:**
- `scripts/validate_config.py` — parses `config.js` with regex, asserts CLIENT_ID, SHEET_ID, and at least one WHITELIST entry are non-empty
- `scripts/create_sheet.py` — creates Sheet and writes header rows

**Key implementation detail — the token dance:**

GSI (`accounts.google.com/gsi/client`) and `gapi` (`apis.google.com/js/api.js`) serve different purposes and must both be loaded. This is the most confusing part of the Google auth setup.

- GSI handles **sign-in** → returns an **ID token** (JWT with user identity). Used for whitelist check.
- `gapi` handles **API access** → returns an **access token** (bearer token for Sheets API calls). Obtained separately via `google.accounts.oauth2.initTokenClient`.

The sequence on first load:
1. GSI one-tap returns ID token (has email, name, picture)
2. Whitelist check passes
3. App calls `tokenClient.requestAccessToken()` to get Sheets-scoped access token
4. `gapi.client` is initialized with this access token
5. App loads data from Sheets

---

### Phase 2 — Google Sheets CRUD

**Goal:** Fully functional account add/edit/archive flow writing to and reading from the real Google Sheet.

**Deliverables:**
- `src/js/sheets.js` — all Sheets API interactions:
  - `loadAllData()` — reads all 3 tabs in a single `spreadsheets.values.batchGet` call; parses rows into typed objects using the header row as keys
  - `saveAccount(account)` — appends a row to Accounts tab; also appends a BalanceHistory row
  - `updateAccount(account)` — finds the row by `id`, updates it via `spreadsheets.values.update`
  - `archiveAccount(id)` — finds the row, sets `isArchived` to TRUE
  - `saveProfile(profile)` — upserts a UserProfiles row (append if new, update if email exists)
  - All functions return Promises; errors surface as toast notifications
- `src/views/accounts.js` — account list table, "Add Account" button, row actions (Edit, Archive)
- `src/components/modal.js` — generic modal with title, body slot, confirm/cancel buttons
- Account form inside the modal: all fields from the data model, client-side validation
- UUID generation: `crypto.randomUUID()` (available in all modern browsers)
- `src/components/toast.js` — success/error banners that auto-dismiss after 3 seconds

**Python work:**
- `scripts/import_accounts.py` — `--csv` argument, reads rows, maps columns to Accounts schema, calls Sheets API to append rows and write BalanceHistory entries

**Key implementation detail — row addressing:**

The Sheets API identifies rows by index. Since rows can be appended by any family member at any time, the app must not rely on row numbers as IDs. Every update operation:
1. Reads the full tab to find the row where column `id` matches the target UUID
2. Uses the 1-based row number to build the A1 notation range (e.g. `Accounts!A5:M5`)
3. Writes to that specific range

For appends, use `spreadsheets.values.append` with `insertDataOption: INSERT_ROWS`.

**Key implementation detail — concurrent writes:**

Multiple family members editing simultaneously can cause a lost-update race. For V1 this is acceptable given the low-traffic use case. Document in README. The mitigation (optimistic locking via `updatedAt` comparison before write) can be added later.

---

### Phase 3 — Dashboard and Portfolio Views

**Goal:** All five portfolio views working with live data, charts rendered, multi-currency support.

**Deliverables:**
- `src/views/dashboard.js` — three KPI cards (Total Assets, Total Liabilities, Net Worth), color-coded, values in user's base currency
- `src/views/cashLiquid.js` — filters accounts where `liquidity === 'Liquid'` and `classification === 'Asset'`, renders table + Chart.js bar chart
- `src/views/illiquid.js` — filters for `Illiquid` and `Semi-liquid` assets, shows % of total portfolio
- `src/views/liabilities.js` — all liability accounts, computed debt-to-asset ratio, grouped by `accountType`
- `src/views/allocation.js` — Chart.js donut chart, one segment per unique `accountType`, values in base currency
- `src/views/history.js` — BalanceHistory table filtered by selected account, Chart.js line chart
- `src/js/currency.js`:
  - Fetches rates from `open.er-api.com/v6/latest/USD` (free, no key required, 1,500 req/month)
  - Caches rates in `store.fxRates` and `sessionStorage`
  - `convert(amount, fromCurrency, toCurrency)` — converts via USD as intermediate when needed
  - All dashboard totals run each account balance through `convert()` before summing

**Key implementation detail — data flow:**

All views read from `store.accounts` (loaded in memory on startup), never re-fetching from Sheets on navigation. A "Refresh" button on the dashboard triggers a fresh `loadAllData()` and re-renders. This keeps navigation fast after the initial load.

**Startup sequence:**
1. `sheets.loadAllData()` — one `batchGet` API call for all 3 tabs
2. Parse rows into typed objects, write to `store`
3. `currency.loadRates()` — one fetch to the exchange rate API
4. Render the dashboard

**Key implementation detail — Chart.js lifecycle:**

When navigating away and back, the previous `Chart` instance must be `.destroy()`ed before creating a new one (Chart.js throws "canvas already in use" otherwise). Each view module stores its Chart instance and calls `.destroy()` before re-rendering.

---

### Phase 4 — Polish, Export, and History

**Goal:** Production-ready. Covers REQ-13 through REQ-16 plus UX refinements.

**Deliverables:**
- Enhanced `history.js` — account selector dropdown, date range filter, line chart
- CSV export — in-browser using `Blob` + temporary `<a>` download link; no server needed
- `src/views/profile.js` — display name, base currency selector, date format selector; saves to UserProfiles tab
- "Last Updated By" badge on each account row (`updatedBy` email + `updatedAt` in user's date format)
- Loading skeletons during initial data fetch (prevents layout shift)
- Error handling — if Sheets API returns 401 (token expired), trigger re-auth flow automatically
- Dark mode toggle — Tailwind `dark:` variant classes; toggle adds/removes `class="dark"` on `<html>`, persisted in `localStorage`
- `docs/setup-guide.md` — complete owner setup walkthrough
- `docs/adding-users.md` — two-step guide for adding a new family member

**Python work:**
- `scripts/export_csv.py` — downloads all three tabs, writes timestamped CSV files to a local `backups/` folder

---

## GitHub Actions Deployment Workflow

`.github/workflows/deploy.yml`:

```
Trigger: push to main
Steps:
  1. Set up Python 3.11
  2. pip install -r scripts/requirements.txt
  3. python scripts/validate_config.py  ← fails build if config is missing fields
  4. Upload src/ as GitHub Pages artifact
  5. Deploy to GitHub Pages
```

Uses the official `actions/deploy-pages` action. No npm, no build step, no bundling. Deploy completes in under 60 seconds.

---

## Security Notes

### Whitelist Check
The whitelist check is client-side (UX gate). However, since the Google Sheet is shared only with whitelisted Google accounts at the Drive level, an unauthorized user's access token would be rejected by the Sheets API with a 403. The Sheet's own sharing permissions are the actual security layer.

This means: **share the Google Sheet with each whitelisted family member's Google account at the Drive level.** The Python setup script handles this via the Drive API's `permissions.create` endpoint.

### What Is and Is Not a Secret
- `CLIENT_ID` — **not secret**, safe to commit and push publicly. Visible in browser network inspector.
- `SHEET_ID` — **not secret** as long as the Sheet is not publicly shared (requires authentication to access).
- No API keys, no service account keys, no secrets in the frontend codebase.

---

## Multi-Currency Implementation

Use a single cached exchange rate fetch per session. The free `open.er-api.com` API returns rates for ~170 currencies with USD as the base.

Conversion formula when base currency is not USD:
```
amount_in_base = (amount_in_foreign / usd_rate_for_foreign) * usd_rate_for_base
```

Store `fxRates` and the fetch timestamp in `sessionStorage`. On next load, if cached rates are under 24 hours old, skip the fetch.

---

## Confirmed Configuration

All setup decisions have been confirmed:

| Decision | Value |
|---|---|
| GitHub username | `skcdnp` |
| Repository name | `MonarchWealthView` |
| Live URL | `https://skcdnp.github.io/MonarchWealthView/` |
| OAuth authorized origin | `https://skcdnp.github.io` |
| Repository visibility | Public (required for free GitHub Pages) |
| Base currency | USD |
| Sheet sharing model | Individual — each family member's Google account added separately |
| Exchange rate API | `open.er-api.com` (free, no key, session-cached) |
| Python auth method | `gcloud auth application-default login` |

### Confirmed Account Types

Expanded from the original list based on common US household finances:

| Category | Types |
|---|---|
| **Liquid** | Checking, Savings, Money Market, CD |
| **Tax-Advantaged** | HSA, 529 (College Savings), Retirement (401k/IRA/Roth) |
| **Investments** | Brokerage, Crypto, Annuity |
| **Physical Assets** | Real Estate, Vehicle, Collectibles |
| **Business** | Business Equity |
| **Insurance** | Life Insurance (Cash Value) |
| **Liabilities** | Mortgage, Credit Card, Loan |
| **Catch-all** | Other |

Full flat list for `config.js`:
```js
ACCOUNT_TYPES: [
  'Checking', 'Savings', 'Money Market', 'CD',
  'HSA', '529', 'Retirement',
  'Brokerage', 'Crypto', 'Annuity',
  'Real Estate', 'Vehicle', 'Collectibles',
  'Business',
  'Life Insurance',
  'Mortgage', 'Credit Card', 'Loan',
  'Other',
]
```

### config.js template (owner fills in IDs after Google Cloud setup)

```js
// config.js — safe to commit publicly
const CONFIG = {
  CLIENT_ID: 'YOUR_OAUTH_CLIENT_ID.apps.googleusercontent.com',
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID',
  SCOPES: 'https://www.googleapis.com/auth/spreadsheets openid email profile',
  WHITELIST: [
    'owner@gmail.com',   // replace with real emails
  ],
  BASE_CURRENCY: 'USD',
  APP_NAME: 'MonarchWealthView',
};
```

---

## Recommended Build Order

1. Complete Google Cloud setup manually (30 min) — create project, enable APIs, OAuth consent screen, Client ID
2. Create GitHub repo, enable Pages (5 min)
3. Build Phase 1 locally, test sign-in + whitelist rejection, push — verify live URL works
4. Run `scripts/create_sheet.py` to provision the Sheet with headers
5. Build Phase 2, test add/edit/archive against the real Sheet
6. Build Phase 3, test all five views and charts
7. Build Phase 4, write setup guide
8. Share URL with family

---

*— End of Plan —*
