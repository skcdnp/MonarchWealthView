  
**WealthView**

UI & Design Specification

Hand this document to Claude Code. It describes every visual and interaction detail needed to build the app exactly as designed in the approved mockup.

# **1\. Design Philosophy**

WealthView uses a flat, clean, financial-grade aesthetic. The guiding principles are:

* Flat surfaces — no gradients, no drop shadows, no glows anywhere in the UI

* Minimal borders — 0.5px lines at low opacity; borders separate, not decorate

* Color encodes meaning — green \= assets/positive, red \= liabilities/negative, blue \= primary actions and net worth, amber \= illiquid/warnings

* Typography does the heavy lifting — size and weight hierarchy, not decoration

* Generous whitespace — padding and breathing room are not wasted space

* Every number is formatted — currency symbol, thousands separators, consistent decimal places always

The overall feel should be close to a premium fintech dashboard — think Robinhood or Monarch Money — not a generic admin panel.

# **2\. App Layout**

## **2.1 Shell Structure**

The app is a fixed two-column shell that fills the full browser viewport height.

| Zone | Width | Background | Behaviour |
| :---- | :---- | :---- | :---- |
| **Left sidebar** | 220px fixed | \#FFFFFF (white) | Never scrolls. Always visible. |
| **Main content area** | Remaining width (flex: 1\) | var(--bg-tertiary) light gray | Scrolls independently if content overflows. |
| **Top bar** | Full width of main area | \#FFFFFF (white) | Sticky at top of main area. Does not scroll. |
| **Content canvas** | Padding 24px 28px | Inherits main area bg | All page content lives here below the top bar. |

## **2.2 Sidebar**

The sidebar is divided into three vertical zones from top to bottom:

* Logo block — app name 'WealthView' in 15px/500 weight, subtitle 'Portfolio Manager' in 11px muted. Padded 20px. Separated from nav by a 0.5px border.

* Navigation — two labelled groups: 'OVERVIEW' (Dashboard, Accounts) and 'VIEWS' (Cash & Liquid, Illiquid Assets, Liabilities, Allocation). Group labels in 10px uppercase muted gray, letter-spacing 0.06em.

* User footer — sits at the very bottom, separated by a 0.5px top border. Contains avatar circle, display name (13px/500), and base currency \+ account type label (11px muted).

**Nav Item States**

| State | Text color | Background | Left border |
| :---- | :---- | :---- | :---- |
| **Default** | \#666 muted | Transparent | 2px transparent |
| **Hover** | var(--text-primary) | var(--bg-secondary) very light gray | 2px transparent |
| **Active (current page)** | \#185FA5 blue | \#E6F1FB light blue | 2px solid \#185FA5 |

**Nav Item Anatomy**

Each nav item is a flex row: colored dot (7px circle) \+ label text (13px). The dot color matches the section's theme color. Padding is 8px 20px.

| Nav item | Dot color |
| :---- | :---- |
| **Dashboard** | \#378ADD — blue |
| **Accounts** | \#1D9E75 — teal |
| **Cash & Liquid** | \#639922 — green |
| **Illiquid Assets** | \#BA7517 — amber |
| **Liabilities** | \#E24B4A — red |
| **Allocation** | \#7F77DD — purple |

## **2.3 Top Bar**

Full-width bar at top of the main content area. White background, 0.5px bottom border. Padding 14px 28px.

* Left side: page title (15px/500, primary text color) \+ date line below it ('As of \[date\]' in 12px muted)

* Right side: two buttons — '+ Add Account' (outline style) and 'Edit Profile' (filled primary blue)

* The page title updates dynamically as the user navigates between views

# **3\. Color System**

## **3.1 Semantic Colors**

These are the core meaning-encoded colors used throughout the entire app. Never use these colors for decorative purposes — they always carry the meaning listed.

| Name / Usage | Hex | Role | Notes |
| :---- | :---- | :---- | :---- |
| **Asset / Positive** | \#3B6D11 | Success green (text) | Used for asset balances, positive values, liquid pills |
| **Asset bg / Liquid pill** | \#EAF3DE | Success green (fill) | Background for liquid tags, asset highlights |
| **Liability / Negative** | \#A32D2D | Danger red (text) | Used for liability balances, negative values |
| **Liability bg** | \#FCEBEB | Danger red (fill) | Background for liability tags, debt highlights |
| **Primary action / Net worth** | \#185FA5 | Blue (text) | Buttons, active nav, net worth value, links |
| **Primary bg / Active nav** | \#E6F1FB | Blue (fill) | Active nav item bg, form backgrounds, info areas |
| **Illiquid / Warning** | \#854F0B | Amber (text) | Illiquid pill text, warning states |
| **Illiquid bg** | \#FAEEDA | Amber (fill) | Illiquid pill background |
| **Page title / Brand** | \#1B4F72 | Dark navy | H1 headings, logo text, brand color |
| **Section headings** | \#2E4057 | Dark blue-gray | H2 headings, table headers |

## **3.2 Chart Colors**

These are the colors used in donut charts and bar charts. Assign them consistently to account types — the same type always gets the same color everywhere in the app.

| Name / Usage | Hex | Role | Notes |
| :---- | :---- | :---- | :---- |
| **Checking** | \#378ADD | Chart / bar | Mid blue |
| **Savings** | \#85B7EB | Chart / bar | Light blue |
| **Brokerage** | \#7F77DD | Chart / bar | Purple |
| **Retirement / 401k** | \#EF9F27 | Chart / bar | Amber/gold |
| **Real Estate** | \#888780 | Chart / bar | Gray |
| **Crypto** | \#1D9E75 | Chart / bar | Teal |
| **Mortgage** | \#E24B4A | Chart / bar | Red |
| **Credit Card** | \#F09595 | Chart / bar | Light red |
| **Car Loan / Other Loan** | \#BA7517 | Chart / bar | Dark amber |

## **3.3 Neutral / UI Colors**

These are CSS variable-based and adapt automatically between light and dark mode. Always use these — never hardcode grays.

| Token | Light mode value | Usage |
| :---- | :---- | :---- |
| **var(--bg-primary)** | \#FFFFFF | Sidebar, top bar, cards, form inputs |
| **var(--bg-secondary)** | \#F8F9FA very light gray | Metric stat cards, hover states, tab bar bg |
| **var(--bg-tertiary)** | \#F2F3F4 page gray | Main content area background |
| **var(--text-primary)** | \#111111 | All primary content text |
| **var(--text-secondary)** | \#555555 | Labels, secondary info, legend items |
| **var(--text-tertiary)** | \#999999 | Muted labels, dates, hints, sub-labels |
| **var(--border-light)** | rgba(0,0,0,0.10) | Default dividers, card borders (0.5px) |
| **var(--border-medium)** | rgba(0,0,0,0.20) | Hover borders, emphasis borders (0.5px) |

# **4\. Typography**

Font family: system-ui / \-apple-system / sans-serif stack. No custom web fonts needed — the system font looks clean and loads instantly.

| Element | Size | Weight | Color token | Usage |
| :---- | :---- | :---- | :---- | :---- |
| **App name / Logo** | 15px | 500 | \--text-primary | Sidebar logo |
| **Page title** | 15px | 500 | \--text-primary | Top bar current page name |
| **H1 / Section heading** | 22px+ | 500 | \#1B4F72 | Document-level headings only |
| **Card title** | 13px | 500 | \--text-primary | Top of each card |
| **Net worth value** | 26px | 500 | \#185FA5 | Hero metric on dashboard |
| **Summary card value** | 26px | 500 | semantic color | Total assets, liabilities numbers |
| **KPI value (small)** | 17px | 500 | \--text-primary | Smaller stat cards (liquid, debt ratio) |
| **Account name** | 13px | 500 | \--text-primary | Primary label in account rows |
| **Account type / meta** | 11px | 400 | \--text-tertiary | Secondary label under account name |
| **Account balance** | 13px | 500 | semantic green/red | Right-aligned in account rows |
| **Nav item** | 13px | 500 (active) / 400 | semantic / muted | Sidebar navigation |
| **Group labels** | 10px | 400 | \--text-tertiary | Sidebar section labels, UPPERCASE |
| **Card action link** | 11px | 400 | \#185FA5 | 'See allocation →' style links |
| **Form label** | 11px | 400 | \--text-secondary | Above input fields |
| **Form input** | 12px | 400 | \--text-primary | Inside input fields |
| **Bar / legend label** | 12px | 400 | \--text-secondary | Chart labels |
| **Pill / badge** | 10px | 500 | semantic color | Liquid, Illiquid, Liability tags |
| **Summary card label** | 11px | 400 | \--text-tertiary | UPPERCASE label above metric |
| **Footer / date text** | 12px | 400 | \--text-tertiary | Top bar date, sidebar user role |

Two weights only throughout the entire app: 400 (regular) and 500 (medium). Never use 600, 700, or bold — they look heavy and out of place in a clean fintech UI.

# **5\. Component Specifications**

## **5.1 Summary Cards (Top of Dashboard)**

Three equal-width cards in a CSS grid (repeat(3, 1fr), gap 14px). Each card:

* Background: var(--bg-primary) white

* Border: 0.5px solid var(--border-light)

* Border radius: 12px

* Padding: 18px 20px

* Content top to bottom: UPPERCASE label (11px, muted, letter-spacing 0.04em) → value (26px/500, semantic color) → sub-line (11px muted, e.g. account count or badge)

* Total Assets value: \#3B6D11 green

* Total Liabilities value: \#A32D2D red, formatted as (value) with parentheses to indicate negative

* Net Worth value: \#185FA5 blue

## **5.2 KPI / Metric Mini Cards**

Used inside the 'Asset vs Liability' card for Liquid Assets, Illiquid Assets, Debt Ratio. Three in a row (repeat(3,1fr), gap 10px).

* Background: var(--bg-secondary) — slightly off-white, not pure white

* Border radius: 8px

* Padding: 12px 14px

* No border

* Label: 10px muted, margin-bottom 4px

* Value: 17px/500

## **5.3 Cards (General Content Containers)**

Used for all main content sections — account lists, charts, forms, views.

* Background: var(--bg-primary) white

* Border: 0.5px solid var(--border-light)

* Border radius: 12px

* Padding: 18px 20px

* Card header: flex row, space-between, margin-bottom 14px — left is card title (13px/500), right is action link (11px blue)

## **5.4 Account Rows**

Each account is a flex row inside a card. No outer box — rows are separated only by a 0.5px bottom border (except the last row which has none).

* Padding: 10px 0 (top and bottom only, no left/right — the card provides that)

* Gap between elements: 10px

Elements left to right:

* Icon circle (30px × 30px, border-radius 8px) — background and icon color are account-type specific (see icon table below)

  * Info block (flex: 1\) — account name 13px/500 on top, type \+ institution \+ pill tag 11px muted below

  * Balance (text-align right, 13px/500) — green for assets, red in parentheses for liabilities

  * Action buttons — two icon buttons (24px × 24px, border-radius 6px, 0.5px border): pencil edit icon and × remove icon (remove icon in red)

**Account Type Icons & Colors**

| Account Type | Icon / Emoji | Icon bg color | Icon text color |
| :---- | :---- | :---- | :---- |
| **Checking** | $ (dollar sign) | \#E6F1FB light blue | \#185FA5 blue |
| **Savings** | ↑ (up arrow) | \#EAF3DE light green | \#3B6D11 green |
| **Brokerage** | 📈 chart emoji | \#EEEDFE light purple | \#534AB7 purple |
| **Retirement / 401k** | 🏛 column emoji | \#FAEEDA light amber | \#854F0B amber |
| **Real Estate** | 🏠 house emoji | \#F1EFE8 light gray | \#5F5E5A gray |
| **Crypto** | ₿ bitcoin symbol | \#E1F5EE light teal | \#0F6E56 teal |
| **Mortgage** | 🏦 bank emoji | \#FCEBEB light red | \#A32D2D red |
| **Credit Card** | 💳 card emoji | \#FCEBEB light red | \#A32D2D red |
| **Car Loan** | 🚗 car emoji | \#FCEBEB light red | \#A32D2D red |
| **Other (fallback)** | ◆ diamond | \#F1EFE8 light gray | \#5F5E5A gray |

## **5.5 Pills / Tags**

Small inline badges shown in the account row's meta line. Pill shape (border-radius: 20px). Font 10px/500. Padding 2px 7px. Never use a border — background color only.

| Tag | Background | Text color | When shown |
| :---- | :---- | :---- | :---- |
| **Liquid** | \#EAF3DE | \#3B6D11 | Asset accounts tagged as Liquid |
| **Illiquid** | \#FAEEDA | \#854F0B | Asset accounts tagged as Illiquid |
| **Semi-liquid** | \#EAF3DE (same) | \#3B6D11 | Semi-liquid assets |
| **Liability** | \#FCEBEB | \#A32D2D | All liability accounts |

## **5.6 Buttons**

| Variant | Background | Border | Text color | Usage |
| :---- | :---- | :---- | :---- | :---- |
| **Outline (default)** | var(--bg-primary) | 0.5px solid var(--border-medium) | var(--text-primary) | '+ Add Account', Cancel |
| **Primary (filled)** | \#185FA5 | none | \#FFFFFF white | 'Edit Profile', 'Save Account' |
| **Icon button** | none | 0.5px solid var(--border-light) | var(--text-tertiary) | Edit ✎ and Remove ✕ in account rows |

* All buttons: border-radius 8px, font-size 12px, font-weight 500

* Outline and primary: padding 7px 14px, display inline-flex, align-items center, gap 6px

* Icon buttons: 24px × 24px fixed size, display flex, centered

* Remove icon button text color: \#A32D2D red (exception to the muted default)

* Hover state on outline: background transitions to var(--bg-secondary)

* Active/press state: scale(0.98) transform

## **5.7 View Tabs**

Used in the Accounts view to switch between All / Assets / Liabilities.

* A single pill-shaped container: border-radius 8px, border 0.5px var(--border-light), overflow hidden, background var(--bg-secondary)

* Tab items sit inside with no gaps — they touch each other

* Each tab: padding 7px 14px, font-size 12px

* Default state: text var(--text-secondary), background transparent

* Active state: background var(--bg-primary) white, text \#185FA5 blue, font-weight 500

* No border on individual tabs — the container border does the work

## **5.8 Donut Charts**

Used in Cash & Liquid, Liabilities, and Allocation views. Built with SVG — no chart library required.

* Size: 110px × 110px SVG viewBox

* Outer radius: 48px. Inner circle (donut hole) radius: \~26px (55% of outer). This creates the ring.

* Inner hole fill: var(--bg-primary) white — so it looks hollow

* Each segment is a filled SVG path (pie slice shape), not a stroked arc

* No stroke/gap between segments — they sit flush

* Segments start at the top (−90° / −π/2 angle offset)

* The donut always sits left-aligned, with the legend to its right in a flex row, gap 20px

Legend items:

* Each item: flex row, align-items center, gap 8px, font-size 12px, color var(--text-secondary)

  * Dot: 9px circle, background matches segment color

  * Label: account type name

  * Value: margin-left auto, font-weight 500, var(--text-primary) — right-aligned within the legend block

## **5.9 Bar Charts (Horizontal Progress Bars)**

Used in the Quick Snapshot card and Illiquid view. Simple CSS-based bars — no chart library.

* Container: flex column, gap 10px

* Each bar row: flex column, gap 4px

* Label row: flex, space-between — left is account/type name (12px var(--text-secondary)), right is formatted value (12px var(--text-primary) 500\)

* Track: height 7px, border-radius 4px, background var(--bg-secondary)

* Fill: same height, border-radius 4px, width is (value / max) × 100%, background is the account type's chart color

* Width is animated with CSS transition: width 0.4s ease on load

## **5.10 Asset vs Liability Bar**

The two-tone horizontal bar on the Dashboard showing the asset/liability split at a glance.

* Container: height 10px, border-radius 5px, display flex, overflow hidden, background var(--bg-secondary)

* Left fill (assets): background \#639922 green, width \= assets / (assets \+ liabilities) × 100%

* Right fill (liabilities): background \#E24B4A red, takes remaining width

* Below the bar: flex row space-between, two labels — 'Assets X%' in green, 'Liabilities X%' in red — font-size 11px

## **5.11 Add Account Form**

Appears inline within the Accounts card when '+ Add account' is clicked. Styled as a distinct inset panel to differentiate it from the list.

* Background: \#E6F1FB light blue (same as active nav)

* Border: 1px dashed \#85B7EB medium blue

* Border radius: 12px

* Padding: 16px 20px

* Form title: 'New Account' in 13px/500 \#185FA5 blue, margin-bottom 12px

* Layout: two-column grid (1fr 1fr) for each row of fields, gap 10px between columns, 10px between rows

* Field label: 11px var(--text-secondary) above the input

* Input / select: padding 7px 10px, border-radius 8px, border 0.5px var(--border-medium), bg var(--bg-primary), font-size 12px

* Action buttons row: justify-content flex-end, gap 8px, margin-top 4px — Cancel (outline) \+ Save Account (primary)

## **5.12 User Profile Form**

Opens when 'Edit Profile' is clicked in the top bar. Displayed as a standalone card, max-width 520px.

* Avatar circle at top: 60px × 60px, border-radius 50%, background \#E6F1FB, text \#185FA5, font 22px/500 — shows user initials

* Display name 16px/500 and member-since date 12px muted sit to the right of the avatar

* 'Change photo' outline button sits at the far right of the avatar row

* A 0.5px top border separates the header from the form fields below

* Same two-column field grid as the Add Account form

* 'Save changes' primary button, right-aligned

## **5.13 Tooltips**

Tooltips appear on hover over icon buttons (the edit ✎ and remove ✕ buttons in account rows). Native HTML title attribute is acceptable for V1. For V2 consider custom CSS tooltips.

* Edit button title: 'Edit account'

* Remove button title: 'Remove account'

* Custom tooltip style (if implemented): background \#1B4F72 dark navy, text white, font-size 11px, padding 4px 8px, border-radius 4px, appears above the element

# **6\. Page-by-Page Specifications**

## **6.1 Dashboard**

The main landing page after sign-in. Contains four sections top to bottom:

* Summary cards row (Total Assets, Total Liabilities, Net Worth) — 3-col grid

* Two-column row: 'Asset vs Liability' card (left) \+ 'Quick Snapshot' bar chart card (right)

* 'All Accounts' card — shows first 5 accounts, with a '+ N more accounts · View all' link at the bottom

Asset vs Liability card contains: the two-tone bar, percentage labels, then the 3 KPI mini cards (Liquid Assets, Illiquid Assets, Debt Ratio).

Quick Snapshot card contains: 4 horizontal bar rows (Cash & Savings, Investments, Retirement, Real Estate), each bar sized relative to total assets.

## **6.2 Accounts View**

Full account management page. One card containing:

* Card header: 'All Accounts (N)' title \+ '+ Add account' link

* Add Account form panel (hidden by default, appears inline when triggered)

* View tabs: All / Assets / Liabilities

* Full account list — all accounts, no truncation

Filtering by tab: All shows everything. Assets shows only classification=Asset rows. Liabilities shows only classification=Liability rows. Filtering is client-side — no reload.

## **6.3 Cash & Liquid View**

Summary cards row (Cash Balance, Liquid Assets, % of Net Worth) then a two-column row:

* Left card: 'Cash & Savings' — list of Checking and Savings account rows only

* Right card: 'Liquid Breakdown' — donut chart showing Checking+Savings / Brokerage / Crypto split with legend

## **6.4 Illiquid Assets View**

Summary cards row (Illiquid Assets total, % of Total Assets, Liquid Assets remainder) then one full-width card:

* 'Illiquid Holdings' card with horizontal bar chart at top (each illiquid account as a bar, sized relative to illiquid total)

* Full account list of illiquid accounts below the bars

## **6.5 Liabilities View**

Summary cards row (Total Liabilities, Debt-to-Asset ratio, Largest Single Debt) then two-column row:

* Left card: 'Liabilities' — list of all liability account rows

* Right card: 'Breakdown' — donut chart of liability types (Mortgage / Credit Card / Loan) with legend

## **6.6 Allocation View**

Summary cards row (Asset Types count, Largest Position, Total Assets) then two-column row:

* Left card: 'Allocation by type' — donut chart with all asset types as segments, legend with percentage

* Right card: 'By balance' — horizontal bar chart, one bar per asset type, sorted largest to smallest

## **6.7 Edit Profile View**

Standalone page (not a modal). Single card max-width 520px. See component spec 5.12 above.

# **7\. Spacing & Sizing Reference**

| Token | Value | Used for |
| :---- | :---- | :---- |
| **Content canvas padding** | 24px 28px | Outer padding of all page content |
| **Card padding** | 18px 20px | Inside all cards |
| **Summary card grid gap** | 14px | Between the 3 summary cards |
| **Two-column row gap** | 14px | Between left and right cards |
| **Account row padding** | 10px 0 | Top/bottom only; card provides left/right |
| **Account row gap** | 10px | Between icon, info, balance, actions |
| **Form field grid gap** | 10px | Between columns and between rows |
| **KPI card grid gap** | 10px | Between the 3 KPI mini cards |
| **Legend item gap** | 8px | Between dot and label in chart legends |
| **Button gap (icon \+ text)** | 6px | Inside buttons with icon prefix |
| **Card header margin-bottom** | 14px | Below card title before content |
| **Sidebar nav item padding** | 8px 20px | Each nav item |
| **Top bar padding** | 14px 28px | Top bar left/right and top/bottom |
| **Border radius — cards** | 12px | All content cards |
| **Border radius — buttons** | 8px | All button types |
| **Border radius — icons** | 8px | Account type icon squares |
| **Border radius — pills** | 20px | Liquid / Illiquid / Liability tags |
| **Border radius — KPI cards** | 8px | Smaller metric cards |
| **Border width** | 0.5px | All borders throughout the app |

# **8\. Number Formatting Rules**

These rules apply to every number shown in the UI without exception.

* All currency values: currency symbol prefix \+ thousands separators \+ no decimal places for whole numbers (e.g. $14,200 not $14200.00)

* If a value has cents, show 2 decimal places (e.g. $14,200.50)

* Liability values displayed in parentheses: ($490,000) — never with a minus sign

* Percentages: one decimal place (e.g. 23.4%) except for debt ratio which shows one decimal

* All formatting via Intl.NumberFormat in JavaScript — never manual string concatenation

* Base currency symbol comes from the user's profile setting — do not hardcode $

Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)

# **9\. Empty & Loading States**

## **9.1 Empty State (No Accounts Yet)**

* Show centered in the main content area: a simple icon (e.g. 📊), a heading 'No accounts yet', a sub-line 'Add your first account to get started', and a primary '+ Add Account' button

* Do not show summary cards or charts when there are zero accounts

## **9.2 Loading State**

* On initial load while Google Sheets data is being fetched: show a subtle centered spinner or 'Loading your portfolio...' text in muted color

* Do not show skeleton cards — keep it simple

## **9.3 Access Denied State**

* If the signed-in Google email is not on the whitelist: show a full-page message — avatar of the signed-in user, 'Access not granted' heading, 'This app is private. Contact the owner to request access.' sub-line, and a 'Sign out' button

* No portfolio data is fetched or shown before the whitelist check passes

## **9.4 Confirmation Dialog (Delete)**

* When the remove ✕ button is clicked: show a browser confirm() dialog or a simple inline confirmation row that replaces the account row temporarily

* Message: 'Remove \[Account Name\]? This cannot be undone.'

* Two options: 'Cancel' (outline) and 'Remove' (red filled button)

# **10\. Responsive Behaviour**

The app is primarily designed for desktop/laptop screens (1024px+). The following adaptations apply at smaller sizes:

* Below 768px: sidebar collapses to a bottom tab bar or hamburger menu. Main content goes full width.

* Summary cards: stack to 1-column on mobile (repeat(1,1fr))

* Two-column rows: stack to single column on mobile

* Account rows: hide the action buttons behind a tap-to-expand or long-press on mobile

* Donut \+ legend layout: stack vertically on mobile (column not row)

* All font sizes stay the same — do not reduce below 11px on mobile

*— End of Design Specification —*