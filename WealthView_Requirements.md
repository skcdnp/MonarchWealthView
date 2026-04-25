

**WealthView**

Portfolio Management Tool  —  Family Edition

Requirements Specification  •  v2.0  •  Updated with architecture decisions

# **1\. Product Overview**

WealthView is a personal portfolio management web application for tracking net worth across assets and liabilities. It is designed for private family use, with a shared data layer so that all authorised family members see the same live portfolio.

| SCOPE | This is a manually-updated tool. It does not connect to live bank feeds, execute trades, or provide financial advice. All data is entered by the user. |
| :---- | :---- |

## **1.1 Users**

* Primary owner — creates and manages accounts, sets up the app

* Family members — view and edit the shared portfolio via whitelisted Google accounts

* No public access — the app is locked to a pre-approved list of Google email addresses

## **1.2 Design Principles**

* Zero ongoing cost — no paid hosting, no paid services

* No deployment complexity — one URL, shared with family, always up to date

* Google-native — authentication and data storage use services the family already has

* No passwords to manage — sign in with existing Google account

# **2\. Architecture & Technology Decisions**

The following decisions were made to satisfy the constraint of sharing the app with family members across different machines, without managing a server or paid hosting.

| Concern | Decision | Rationale |
| :---- | :---- | :---- |
| App hosting | **GitHub Pages** | Free static hosting. One URL shared with family. Updates deploy automatically when code is pushed. No server to maintain. |
| Authentication | **Google OAuth 2.0** | Users sign in with their existing Google account. No passwords to create or manage. Industry-standard security. |
| Access control | **Email whitelist** | A hard-coded list of approved Google email addresses in the app config. Anyone not on the list is rejected after sign-in, even with a valid Google account. |
| Data storage | **Google Sheets API** | One shared Google Sheet acts as the database. All family members read and write to the same sheet through the app. No database to host or pay for. |
| Data access | **App only** | Family members never need to open the Google Sheet directly. The app is the only interface. The sheet is shared read/write with the app service account. |
| Cost | **Zero** | GitHub Pages (free), Google OAuth (free), Google Sheets API (free within standard quotas). |

## **2.1 How It Works — End to End**

1. Owner pushes the app code to a GitHub repository

2. GitHub Pages publishes it at a permanent URL (e.g. username.github.io/wealthview)

3. Owner shares the URL with family (once, via message or email)

4. Family member opens the URL — Google sign-in prompt appears

5. App checks their Google email against the whitelist

6. If approved — app loads with full access to the shared portfolio

7. All reads and writes go to the shared Google Sheet transparently

| NOTE | Family members bookmark the URL once. After that, opening the bookmark is all they ever need to do. Google keeps them signed in across sessions. |
| :---- | :---- |

## **2.2 Google Sheet Structure**

The Google Sheet acts as the database. It has the following tabs:

* Accounts — one row per account (id, name, type, classification, liquidity, balance, currency, institution, notes, updatedAt)

* BalanceHistory — timestamped snapshots every time a balance is updated (accountId, balance, updatedAt, updatedBy)

* UserProfiles — one row per whitelisted user (email, displayName, baseCurrency, dateFormat, createdAt)

| NOTE | The sheet is the source of truth. If the app ever has a bug, the raw data is always safely readable in Google Sheets as a fallback. |
| :---- | :---- |

## **2.3 Setup Steps (One-time, Owner Only)**

These steps are performed once by the owner when first deploying the app. Claude Code can assist with all of them.

8. Create a Google Cloud project and enable the Google Sheets API and Google Identity (OAuth) API

9. Create an OAuth 2.0 client ID (Web Application type), add the GitHub Pages URL as an authorised origin

10. Create the Google Sheet with the tab structure above; note the Sheet ID from the URL

11. Add the whitelisted email addresses to the app config file (owner \+ wife \+ any others)

12. Push the code to GitHub; enable GitHub Pages on the repo (Settings → Pages → Deploy from main)

13. Share the GitHub Pages URL with family — setup complete

# **3\. Functional Requirements**

## **3.1 Authentication & Access**

**US-01: Google Sign-In**

* As a user, I want to sign in with my Google account so I do not need a separate password.

  * Sign-in is initiated via Google OAuth 2.0 on first visit

  * Google keeps the session alive across browser restarts

  * Sign-out option available in the app

**US-02: Email Whitelist Enforcement**

* As the owner, I want only approved family members to access the app.

  * After Google sign-in, the app checks the user's email against a config whitelist

  * Emails not on the list see a friendly 'Access not granted' screen — no data is shown

  * The whitelist is a simple array in the app config file; adding a new person \= adding their email and redeploying

  * All whitelisted users have the same access level (full read/write)

## **3.2 User Profile Management**

**US-03: Create & Edit Profile**

* As a user, I want to set my display name, base currency, and date format preferences.

  * Profile is stored in the UserProfiles tab of the shared Google Sheet, keyed to the user's Google email

  * Each whitelisted user has their own profile row

  * Base currency defaults to USD; can be changed to GBP, EUR, CAD, AUD, etc.

## **3.3 Account Management**

**US-04: Add Account**

* As a user, I want to manually add a financial account to the shared portfolio.

  * Required: Account Name, Account Type, Balance, Asset/Liability classification

  * Optional: Institution, currency, liquidity tag, notes

  * On save, a new row is written to the Accounts tab of the Google Sheet

  * A balance snapshot is simultaneously written to BalanceHistory

**US-05: Edit Account**

* As a user, I want to update account details and balances.

  * Edits update the relevant row in the Accounts sheet

  * Balance changes always append a new row to BalanceHistory with a timestamp and the editing user's email

**US-06: Remove / Archive Account**

* As a user, I want to remove an account I no longer hold.

  * Confirmation dialog before deletion

  * Option to archive (mark as inactive) rather than delete, preserving history

## **3.4 Asset & Liability Classification**

**US-07: Classify Accounts**

* As a user, I want each account marked as an Asset or a Liability.

  * Assets: savings, investments, real estate, crypto, retirement accounts

  * Liabilities: mortgages, credit cards, loans

  * Liquid / Illiquid / Semi-liquid sub-tag available on asset accounts

## **3.5 Dashboard & Totals**

**US-08: Net Worth Summary**

* As a user, I want to see total assets, total liabilities, and net worth at a glance.

  * Values computed live from the Google Sheet on each load

  * Color coding: assets green, liabilities red, net worth blue

## **3.6 Portfolio Views**

**US-09 through US-14 — Views**

* Cash & Liquid view: checking, savings, liquid investments

* Illiquid Assets view: real estate, retirement, locked accounts

* Liabilities view: grouped by type, debt-to-asset ratio

* Asset Allocation view: donut chart by account type

* By Account Type view: grouped list

* All views read from the shared Google Sheet — same data regardless of which family member is viewing

# **4\. Prioritized Requirements**

| Req ID | Feature | Description | Priority |
| :---- | :---- | :---- | :---- |
| REQ-01 | Google Sign-In | OAuth 2.0 sign-in with Google account, session persistence | **Must Have** |
| REQ-02 | Email Whitelist | Post-auth email check; block non-whitelisted users | **Must Have** |
| REQ-03 | Add Account | Manual account entry written to Google Sheet | **Must Have** |
| REQ-04 | Edit Account | Modify account fields; balance change logs to history | **Must Have** |
| REQ-05 | Remove/Archive Account | Delete or archive with confirmation | **Must Have** |
| REQ-06 | Asset/Liability Tag | Classify each account; liquid/illiquid sub-tag | **Must Have** |
| REQ-07 | Net Worth Dashboard | Live totals from sheet: assets, liabilities, net worth | **Must Have** |
| REQ-08 | Cash & Liquid View | Filtered view of liquid accounts with chart | **Must Have** |
| REQ-09 | Illiquid Assets View | Illiquid holdings with % of total | **Must Have** |
| REQ-10 | Liabilities View | Debt breakdown with debt-to-asset ratio | **Must Have** |
| REQ-11 | Asset Allocation View | Donut/bar chart by account type | **Must Have** |
| REQ-12 | User Profile | Per-user name, currency, date format stored in sheet | **Must Have** |
| REQ-13 | Balance History Log | Timestamped snapshot on every balance update | **Should Have** |
| REQ-14 | Multi-Currency Display | Per-account currency, convert to base for totals | **Should Have** |
| REQ-15 | Data Export | Export portfolio as CSV or PDF | **Should Have** |
| REQ-16 | Net Worth Trend Chart | Line chart from balance history over time | Nice to Have |
| REQ-17 | Account Notes | Freeform notes field per account | Nice to Have |
| REQ-18 | Dark Mode | Full dark theme toggle | Nice to Have |
| REQ-19 | Last Updated Badge | Show which user last edited each account and when | Nice to Have |

# **5\. Non-Functional Requirements**

## **5.1 Performance**

* Dashboard load: under 2 seconds on first visit (includes Google Sheet API call)

* Subsequent navigation: under 500ms (data cached in memory for the session)

* Account saves: under 1 second round-trip to Google Sheets API

## **5.2 Security**

* All traffic over HTTPS (enforced by GitHub Pages)

* Google OAuth tokens handled by Google's own libraries — no tokens stored in the app

* Whitelist check happens client-side immediately after sign-in; no data is fetched before the check passes

* Google Sheet is not publicly shared — only the OAuth-authenticated app can access it

* No financial data is stored in the browser beyond the active session

## **5.3 Usability**

* A new family member should be able to sign in and view the portfolio in under 2 minutes

* Mobile-responsive layout; usable on phones and tablets

* All monetary values formatted with currency symbol and thousands separators

## **5.4 Maintainability**

* Adding a new whitelisted user requires editing one config line and pushing to GitHub — no other steps

* The Google Sheet can be inspected directly as a fallback if the app has issues

* No server, no database, no infrastructure to maintain

# **6\. Data Model — Google Sheet Structure**

All data lives in a single Google Sheet with the following tabs. Column names match the field names used in the app code exactly.

## **Tab 1: Accounts**

| Column | Type | Notes |
| :---- | :---- | :---- |
| id | String (UUID) | Generated client-side; unique per account |
| name | String | e.g. Fidelity Brokerage |
| accountType | String | Checking / Savings / Brokerage / Retirement / Real Estate / Crypto / Mortgage / Credit Card / Loan / Other |
| classification | String | Asset | Liability |
| liquidity | String | Liquid | Illiquid | Semi-liquid | — (for liabilities) |
| balance | Number | Stored in the account's own currency |
| currency | String | ISO 4217, e.g. USD, GBP |
| institution | String | Optional: bank or firm name |
| notes | String | Optional freeform notes |
| isArchived | Boolean | FALSE by default; TRUE when archived |
| createdAt | ISO DateTime | Set on creation |
| updatedAt | ISO DateTime | Updated on every edit |
| updatedBy | String | Google email of the user who last edited |

## **Tab 2: BalanceHistory**

| Column | Type | Notes |
| :---- | :---- | :---- |
| id | String (UUID) | Unique per snapshot row |
| accountId | String | Foreign key → Accounts.id |
| balance | Number | Balance at this point in time |
| currency | String | Copied from the account at time of snapshot |
| snapshotAt | ISO DateTime | When the balance was recorded |
| updatedBy | String | Google email of the editing user |

## **Tab 3: UserProfiles**

| Column | Type | Notes |
| :---- | :---- | :---- |
| email | String | Google email; primary key; must match whitelist |
| displayName | String | User's preferred name in the app |
| baseCurrency | String | ISO 4217; defaults to USD |
| dateFormat | String | e.g. MM/DD/YYYY |
| createdAt | ISO DateTime | When profile was first created |

# **7\. Out of Scope (V1)**

* Live bank or brokerage feed integration (Plaid, Open Banking)

* Automated transaction import or categorisation

* Investment performance tracking (IRR, returns by position)

* Per-user access levels (all whitelisted users have full read/write)

* Tax reporting or tax lot tracking

* Bill payment or budgeting features

* Mobile native apps (the web app is mobile-responsive)

* Server-side logic — the app is entirely client-side static HTML/JS

# **8\. Deployment Reference**

This section is a quick reference for the owner during initial setup. Claude Code can assist with all steps.

| \# | Step | Detail |
| :---- | :---- | :---- |
| 1 | **Google Cloud project** | Create project, enable Sheets API and Google Identity Services |
| 2 | **OAuth credentials** | Create OAuth 2.0 Web Client ID; add GitHub Pages URL to authorised origins |
| 3 | **Google Sheet** | Create sheet with 3 tabs: Accounts, BalanceHistory, UserProfiles |
| 4 | **App config** | Add OAuth client ID, Sheet ID, and whitelisted emails to config.js |
| 5 | **GitHub repo** | Push code to GitHub; enable Pages under Settings → Pages → main branch |
| 6 | **Share URL** | Send the GitHub Pages URL to family members — done |
| 7 | **Add new user (future)** | Add their email to whitelist in config.js, push — takes 2 minutes |

*— End of Document —*