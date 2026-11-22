# 🌸 CampusSummer Archive / 学园夏日局

面向游戏文化领域的非商业档案与资料整理站。

A non-commercial archive for game culture, built around entries, companies, tags,
curated documents, and community interaction.

---

## 🎨 Design Direction

This is an archive and community site, not a generic dashboard template.

- 🌸 Restrained sakura / blue-neutral palette, light and dark themes
- 🗂️ Card-based entries with a four-tab detail layout
- 🔎 Clear navigation for entries, tags, companies, documents, and discussions
- 🌫️ Configurable background image with an adjustable overlay, so the artwork stays visible
- 🚫 No unnecessary gradients, oversized stat blocks, or decorative noise

The visual structure is inspired by
[KunMoe/kun-touchgal-next](https://github.com/KunMoe/kun-touchgal-next) (GPL-3.0),
but this project does not copy its source code. All code, data models, and visual
implementation are independently written.

## 🚧 Current Version: `0.1.0`

Development preview. The core archive, account, community, moderation, and site-setting
flows are implemented; a few admin modules are still placeholders.

### ✨ Core Features

- 📚 **Entry archive** — title, original title, romanized title, aliases, summary,
  cover, screenshots, release date, platforms, languages, tags, company, rating, and
  view/download/favorite counters.
- 🏢 **Companies & tags** — company profiles with aliases, website, region, and main
  language; tags split into `GENRE`, `PLATFORM`, `LANGUAGE`, and `THEME`.
- 📄 **Document center** — Markdown documents in `NOTICE`, `GUIDE`, `POLICY`, and
  `ABOUT` categories, with a collapsible tree, table of contents, and activity carousel.
- 🔍 **Search & filters** — search, sort by update/rating/views, platform and language
  filters, and a random-entry entry point.
- 👤 **Accounts** — nickname and username are separate fields; nickname supports
  Chinese, username is limited to letters, numbers, and underscores.
- ✉️ **Registration verification** — email verification code plus a human check
  (checkbox + two server-signed arithmetic questions).
- 💬 **Community** — comments, ratings, likes, collections, follows, mentions, private
  messages, reports, and appeals.
- 🌸 **Check-in & levels** — daily check-in awards points; levels are derived from
  points; the check-in success dialog is configurable by the site owner.
- 🛡️ **Moderation** — reports for comments, ratings, and users; accept/reject actions;
  optional ban duration or account deletion; creator application review.
- ⚙️ **Site settings** — site name, logo, background image and overlay strength, hero
  title/description, check-in popup, user agreement, footer GitHub/Telegram/contact,
  and friend links.
- 🖼️ **Media library** — S3-compatible storage or local `public/uploads`, content-hash
  deduplication, and orphan cleanup tools.
- 🧑‍💼 **Admin panel** — dashboard statistics, reports, appeals, users/roles, creators,
  games, resources, patches, documents, media, logs, and mail.
- 🌙 **Theme & motion** — light/dark theme with persisted preference; optional sakura
  petals that respect reduced-motion settings.

## 🧠 How It Works

- **Framework** — Next.js 16 App Router with Cache Components, Partial Prerendering,
  Server Actions, and Suspense-based streaming.
- **Data** — PostgreSQL + Prisma 6.19. Public queries use `use cache` + cache tags;
  mutations invalidate the affected tags.
- **Auth** — JWT session in an `httpOnly` cookie, signed with `AUTH_SECRET`; passwords
  are hashed with bcrypt. Route-level guards live in `src/proxy.ts`; pages and server
  actions re-check capabilities with `requireCapability`.
- **Email** — SMTP (Nodemailer) powers registration codes and admin mail. Verification
  codes are stored as salted hashes and expire after 10 minutes.
- **Storage** — S3-compatible object storage when configured; otherwise files are stored
  under `public/uploads`. The database records content hashes for deduplication.
- **Seed** — `prisma/seed.mjs` builds the demo archive (users, companies, games,
  resources, comments, ratings, documents, notifications, DMs, collections, likes,
  media rows, and admin logs). `npm run db:seed` is incremental;
  `npm run db:seed:reset` performs a full reset.

## 📋 Prerequisites

| Item | Requirement |
| --- | --- |
| 🟢 Node.js | ≥ 20.9 |
| 🐘 PostgreSQL | 14+ (the bundled local script defaults to PostgreSQL 18) |
| 📦 Package manager | npm |
| 🖥️ OS | Windows / macOS / Linux; the local DB helper script is PowerShell |
| 📧 SMTP | Required for registration codes and mail features |
| ☁️ S3 | Optional; local uploads are used when omitted |
| 🔴 Redis | Optional; falls back to an in-process cache |

## 🚀 Run from Source

### 1. Clone the repository

```powershell
git clone <repository-url>
cd campussummer-archive
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Configure environment variables

```powershell
Copy-Item .env.example .env
```

Then edit `.env`:

- `DATABASE_URL`
- `AUTH_SECRET` (use a random value in production)
- `SMTP_*` if you want registration/mail to work
- `ADMIN_EMAIL` (local testing: keep it identical to `SMTP_USER`)

See the environment variable table below for the full list.

### 4. Start the database

Option A — use the bundled local PostgreSQL instance:

```powershell
npm run db:up
```

This starts PostgreSQL on `127.0.0.1:5432` and keeps the terminal occupied.
If port 5432 is already used by another PostgreSQL service, stop that service first
or change `DATABASE_URL` / `PG_PORT` to a free port.

Option B — use an existing PostgreSQL server and skip `db:up`.

### 5. Create tables and seed demo data

```powershell
npm run db:push
npm run db:seed            # incremental: keeps existing users/settings/friend links
# npm run db:seed:reset    # full reset: clears everything and rebuilds the demo
```

### 6. Start the development server

```powershell
npm run dev
```

Open **http://127.0.0.1:3000**.

## ⚙️ Environment Variables

Copy `.env.example` to `.env`; never commit `.env`. The file is already ignored by
`.gitignore`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | JWT signing secret; use `openssl rand -base64 32` in production |
| `NEXT_PUBLIC_SITE_URL` | ✅ | Canonical site URL used for metadata and redirects |
| `NEXT_PUBLIC_SITE_NAME` | Optional | Public site name fallback |
| `NEXT_PUBLIC_SITE_YEAR` | Optional | Footer copyright year; defaults to `2026` |
| `REGISTRATION_ENABLED` | Optional | Set `"false"` to close public registration |
| `REDIS_URL` | Optional | Redis cache; empty = in-process fallback |
| `S3_REGION` / `S3_BUCKET` / `S3_ENDPOINT` | Optional | S3-compatible storage |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | Optional | S3 credentials |
| `S3_PUBLIC_BASE_URL` | Optional | Public base URL for stored objects |
| `SMTP_HOST` / `SMTP_PORT` | Registration ✅ | SMTP server and port (465 for SSL) |
| `SMTP_USER` / `SMTP_PASS` | Registration ✅ | SMTP account and **authorization code**, not the login password |
| `SMTP_FROM` | Optional | Sender display string; defaults to `SMTP_USER` |
| `ADMIN_EMAIL` | Local seed ✅ | Bound admin email; must match `SMTP_USER` for local testing |
| `SEED_PASSWORD` | Optional | Demo account password; defaults to `campus2026` |

### Local testing: `ADMIN_EMAIL` must match `SMTP_USER`

The seed binds `allen` and the site-setting "管理员邮箱" to `ADMIN_EMAIL`.
For local testing, set both to the same mailbox:

```env
SMTP_USER="your@example.com"
ADMIN_EMAIL="your@example.com"
```

Otherwise, registration codes are sent to `SMTP_USER` while the administrator account is
bound to a different address. The seed prints a warning when the two values differ.

### CLI-only variables

These are read by `scripts/create-admin.mjs`; do not put real values in the repository:

- `ADMIN_USERNAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_DISPLAY_NAME`

## 🗄️ Database & Seed

### Seed modes

```powershell
npm run db:seed            # incremental: add missing demo data, keep existing data
npm run db:seed:reset      # destructive: clear all tables and rebuild the demo
```

`db:seed` is safe for an existing local database: it preserves users, site settings,
friend links, and existing content. `db:seed:reset` is intended for a clean demo or
schema refresh.

### Demo accounts

Password for all demo accounts: `campus2026` (development only).

| Username | Nickname | Role | Email |
| --- | --- | --- | --- |
| `allen` | AllenShiina | SUPER_ADMIN | `ADMIN_EMAIL` |
| `tobikin` | Tobikin | CREATOR | `tobikin@campussummer.example` |
| `soulbelow` | SoulBelow | USER | `soulbelow@campussummer.example` |

The seeded demo includes 5 companies, 12 entries, 24 resources, 7 documents, purchase
links, notifications, private messages, collections, likes, media-library rows, and
admin logs.

### Create a production administrator

Do not run the demo seed in production. Create the first administrator with environment
variables:

```powershell
npm run db:push

$env:ADMIN_USERNAME='admin'
$env:ADMIN_EMAIL='you@example.com'
$env:ADMIN_DISPLAY_NAME='站长'
$env:ADMIN_PASSWORD='至少10位且含字母和数字'
npm run db:create-admin
```

- Default role: `SUPER_ADMIN`
- Normal administrator only: `npm run db:create-admin -- --role=ADMIN`
- Reset an existing account: add `-- --force`
- The command also writes `ADMIN_EMAIL` into the site setting "管理员邮箱", keeping the
  administrator account and bound email in sync.

Public registration always creates a `USER`. Promote additional administrators from
`/admin/users`; there is no "register as administrator" path.

## 🧪 Verification

```powershell
npm run typecheck
npm run build
```

There is no automated end-to-end test suite yet. Before publishing changes, verify the
main flows manually: registration with an email code, login, check-in, comments/ratings,
reports, admin settings, and friend-link CRUD.

## 🛡️ Security Notes

- **Never commit `.env`.** It contains the database URL, `AUTH_SECRET`, and SMTP
  authorization code. `.gitignore` ignores `.env*` except `.env.example`.
- Replace `AUTH_SECRET` with a random value before deploying.
- Treat `SMTP_PASS` as a secret; if it leaks, revoke and regenerate the authorization
  code in the mail provider.
- Public registration requires an email code and a human check; do not disable these
  checks on a public deployment.
- Seed scripts refuse to run when `NODE_ENV=production` unless `ALLOW_SEED=1`. Do not set
  `ALLOW_SEED=1` on a production site.
- Use HTTPS and a reverse proxy in production. The session cookie is `httpOnly` and
  `sameSite=lax`; `secure` is enabled automatically in production.
- Uploaded files should be served from S3 or a trusted static host. Validate uploads and
  never execute user-provided content.
- The project currently has no LICENSE file. Add one before distributing; without a
  license, the default is "all rights reserved".

## 🧩 Known Limitations

- AI review, feedback, OIDC, and "first release application" admin modules are
  placeholders.
- There is no automated test suite or CI workflow yet.
- Search is `ILIKE`-based; no full-text index or i18n.
- Email-based password reset and email-change flows are not complete.
- Some legal/compliance pages and site content are demo text; replace them with your own
  policies before operating publicly.

## 📁 Project Structure

```text
prisma/
  schema.prisma        data model
  seed.mjs             demo data, generated covers, incremental/reset modes
scripts/
  dev-db.ps1           local PostgreSQL helper
  create-admin.mjs     production administrator bootstrap
src/app/               routes: archive, community, settings, admin, API
src/components/        shared UI, cards, forms, icons, dialogs
src/lib/               auth, db, cache, storage, settings, query layers
public/covers/         generated entry covers and banner
```

## 🌿 Branch & Release

- Develop and test on a feature branch; keep `main` deployable.
- Run `npm run typecheck` and `npm run build` before merging.
- Tag releases after verifying the database seed and admin bootstrap on a clean database.
- Never publish a build that has only been tested against local demo data.

## 📄 Credits

- Layout inspiration: [KunMoe/kun-touchgal-next](https://github.com/KunMoe/kun-touchgal-next)
  (GPL-3.0). No source code is copied; the implementation is independent.
- Entry covers under `public/covers/*.svg` are generated by `prisma/seed.mjs`.
- Background uploads and other media remain the responsibility of the site operator;

---

## 📄 License

Copyright © 2026 AllenShiina-Mashiiro

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

See the [LICENSE](LICENSE) file for details.

### Third-party Resources

This license applies to the original source code of this project.

Third-party game assets, images, audio, video, trademarks, and other resources are not covered by this license unless explicitly stated. Their respective rights belong to their original copyright holders.
  make sure you have the rights to publish them.
- Built with Next.js, React, Prisma, Tailwind CSS, and the open-source packages listed in
  `package.json`.
