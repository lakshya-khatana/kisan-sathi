# KISAN SATHI

Website with two account types:

- **Farmer** – uploads a leaf photo → gets crop, disease, severity, confidence, treatment (organic + chemical),
  prevention, when to see an expert (Hinglish / Hindi / English). Keeps a scan history. Reads expert updates.
- **Expert** – posts schemes/benefits, tips and alerts that every farmer sees. Needs a secret access code to register.

**Stack:** React (Vite) · Django REST Framework · PostgreSQL · Claude vision API for the photo analysis.
One Docker container serves both the API and the website.

## How the analysis works
The photo goes to your **backend** (never directly from the browser), is shrunk/cleaned, and sent to the Anthropic API.
The reply is validated and clamped before it reaches farmers. Bad/blurry/non-plant photos give a "retake photo" message
instead of a guess. Photos are **not stored**; only the text result is saved in the scan history.
It is AI guidance, not a lab test – the result screen says so.

---
# GO-LIVE CHECKLIST

1. **Anthropic API key** – create at console.anthropic.com, add billing, and **set a monthly spend limit** there.
   Every scan costs a small amount. Farmers are limited to `30 scans/day` (change with `THROTTLE_SCAN`).
2. **PostgreSQL** – create a managed Postgres database and copy its connection URL into `DATABASE_URL`.
   **Do not use SQLite in production** – container disks are wiped on every redeploy and all users would vanish.
   Turn on the provider's automatic backups.
3. **Secrets** (set in your host's Environment panel – never commit them):

| Variable | Value |
|---|---|
| `DJANGO_SECRET_KEY` | `python -c "import secrets;print(secrets.token_urlsafe(50))"` |
| `EXPERT_SIGNUP_CODE` | your own secret (8+ chars); give it only to real experts |
| `ANTHROPIC_API_KEY` | key from step 1 |
| `DATABASE_URL` | `postgres://user:pass@host:5432/dbname` |
| `ALLOWED_HOSTS` | `yourdomain.com` (comma-separated for several) |
| `CSRF_TRUSTED_ORIGINS` | `https://yourdomain.com` |
| `SITE_URL` | `https://yourdomain.com` (used to build password-reset links) |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` | any SMTP account (Gmail app-password, Brevo, Resend, Zoho...). Without it, "Forgot password" sends nothing. |
| `ADMIN_URL` | private path for the admin panel, e.g. `my-private-admin-path` |
| `DJANGO_SUPERUSER_USERNAME` / `_EMAIL` / `_PASSWORD` | creates your admin login automatically on first start |

   The server **refuses to start** if the secret key or expert code is missing/weak – that is intentional.
4. **Deploy** (Render, Railway, Fly.io, any Docker host): create a *Web Service* from this repo with the
   root `Dockerfile`. Health-check path: `/api/health/`. The container runs migrations automatically on start.
5. **Domain + HTTPS** – attach your domain; HTTPS is provided by the host. HTTP is redirected to HTTPS.
6. **Admin panel** – open `https://yourdomain.com/<ADMIN_URL>/` and log in with the superuser above. There you can view
   users, farmers' scans, and **delete any expert post** (Advisories) or block an account (untick *Active*).
7. **Test once live:** register a farmer, upload a real leaf photo, register an expert (with the code), post an
   update, confirm the farmer sees it, and try "Forgot password?" once to confirm the email arrives.

## Run locally
```bash
# backend
cd backend
python -m venv venv && venv\Scripts\activate          # Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
set DJANGO_DEBUG=True                                  # PowerShell: $env:DJANGO_DEBUG="True"
set ANTHROPIC_API_KEY=sk-ant-...                       # needed for real analysis
python manage.py migrate && python manage.py createcachetable
python manage.py runserver
# frontend (new terminal)
cd frontend && npm install && npm run dev              # http://localhost:5173
```
In local debug mode the expert code is `KISAN-EXPERT-2026`. Delete any old `db.sqlite3` from earlier versions first.

Run the backend tests: `cd backend && python manage.py test detection`
(set `DJANGO_DEBUG=True`, or provide the secrets above).

## API
| Method | URL | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/register/` | public | `name,email,password,role` (+`access_code` for experts) |
| POST | `/api/auth/login/` | public | `email,password,role` → token (30-day expiry) |
| GET | `/api/auth/me/` · POST `/api/auth/logout/` | logged in | |
| POST | `/api/predict/` | farmer | multipart `image`, optional `crop`, `language` (`hinglish`/`hindi`/`english`) |
| GET | `/api/scans/` | farmer | own history |
| POST | `/api/auth/forgot/` · `/api/auth/reset/` | public | email password reset (link valid 1 hour, single use) |
| GET/POST | `/api/advisories/` | GET any user, POST expert | expert posts |
| DELETE | `/api/advisories/<id>/` | expert (author) | |
| GET | `/api/health/` | public | uptime check |

## What is built in for safety
Password reset by email (no account enumeration, single-use 1-hour link, logs out old sessions) · admin panel on a private URL · Login/register rate limit (60/hour per IP) · daily scan limit per farmer · tokens expire after 30 days and are
rotated on login · upload type/size checks + image re-encoding · API key only on the server · errors shown to users
never leak internals · HTTPS redirect, HSTS, secure headers · Postgres via `DATABASE_URL`.

## Known limits (plan for these as you grow)
- **No email verification at signup** – anyone can register with any email. Reset links only go to the real owner, so this is safe, but you cannot be sure an address is genuine.
- Rate-limit counters live in the database (shared by all workers) – fine for thousands of users; use Redis beyond that.
- The AI can be wrong, especially on blurry, multi-leaf or unusual photos. Keep the disclaimers visible.
- Treatment text is general guidance, not a replacement for a local agriculture officer / KVK.
- Not tested here: a real Anthropic call with a valid key, a real SMTP send, and the Docker image build. Test these once on your host (checklist step 7).
