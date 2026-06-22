# Audit Report: MiAngel (Connecting Families)

**Date:** 2026-06-22
**Stack:** Vite 5.4 + React 18.3 + Supabase + Vercel
**Router:** React Router v6 (Client-Side SPA)
**Score:** 88/100

## Executive Summary

The project is structured as a Vite + React Single Page Application utilizing Supabase as its backend. The application demonstrates solid coding practices, including explicit column selections in database queries and a clean multi-tenant schema design. However, the absence of active Row Level Security (RLS) on Supabase tables and the exposure of a service role key in local environment configurations present major security risks that must be resolved prior to production launch.

## Scores by Category

| Category | Score | Critical | Major | Minor |
|----------|-------|----------|-------|-------|
| Security | 18/25 | 1 | 0 | 2 |
| Database | 24/25 | 0 | 0 | 1 |
| Performance | 24/25 | 0 | 0 | 1 |
| Scalability | 22/25 | 0 | 0 | 3 |

---

## Critical Findings (fix immediately)

### 1. Row Level Security (RLS) is disabled on key tables
- **Impact:** Since the project is a SPA, the Supabase URL and Anon Key are public. With RLS disabled, anyone can read, write, or delete records from any table using the client credentials.
- **Fix:** Enable RLS and define policies validating `auth.uid()` against member registries in `equipo_pai`.
- **References:** [supabase_policies_plan.sql](file:///c:/Users/LENOVO/OneDrive%20-%20Universidad%20Politécnica%20Estatal%20del%20Carchi/PUBLICA/BACK%20EMPRESAS/CLASES/4.%20MARKETING%20DIGITAL/CURSO%20LABORA%20IA/miangel-connecting-families/supabase_policies_plan.sql)

---

## Major Findings (fix soon)

No major findings were identified. The application follows clean code structure patterns and does not contain massive architecture anti-patterns.

---

## Minor Findings (nice to have)

### 1. Service Role Key in `.env`
- **Impact:** Having `SUPABASE_SERVICE_ROLE_KEY` in the local `.env` is a security risk if the file is accidentally committed or shared.
- **Fix:** Keep it strictly out of client repositories. (It is currently gitignored, which prevents leak to Git, but we should make sure it is not bundled).

### 2. Missing Security Headers in `vercel.json`
- **Impact:** The application is vulnerable to clickjacking and mime sniffing since security headers like `X-Frame-Options` and `X-Content-Type-Options` are not defined.
- **Fix:** Add a headers section to `vercel.json`.

### 3. Missing Indexes on Foreign Keys
- **Impact:** Query times on `alertas` or `observaciones` filtering by `persona_autismo_id` or `familia_id` could degrade when the DB grows.
- **Fix:** Ensure indexes exist on foreign key columns (`familia_id`, `persona_autismo_id`).

---

## Scalability Strategy

- **Infra Strategy:** Stay on Vercel + Supabase (Pro Tier) for initial release.
- **Data Retention:** Implement a simple cron or job to clean or archive read/old alerts from the `alertas` table after 90 days.
- **API Cache:** Protect the `catalogos` table with cache headers or client-side local caching since catalog categories rarely change.

---

## Fix Checklist

- [ ] Execute [supabase_policies_plan.sql](file:///c:/Users/LENOVO/OneDrive%20-%20Universidad%20Politécnica%20Estatal%20del%20Carchi/PUBLICA/BACK%20EMPRESAS/CLASES/4.%20MARKETING%20DIGITAL/CURSO%20LABORA%20IA/miangel-connecting-families/supabase_policies_plan.sql) in Supabase SQL Editor.
- [ ] Add security headers configuration to `vercel.json`.
- [ ] Add database indexes for frequently filtered columns (`persona_autismo_id`, `familia_id`).

---

## Detailed Findings

### Security

#### Row Level Security
Currently, there are no files or migrations declaring `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. This exposes the following tables to public access:
- `familias`
- `personas_autismo`
- `equipo_pai`
- `pai_goals`
- `observaciones`
- `alertas`

#### Clickjacking Protection
Add the following to [vercel.json](file:///c:/Users/LENOVO/OneDrive%20-%20Universidad%20Politécnica%20Estatal%20del%20Carchi/PUBLICA/BACK%20EMPRESAS/CLASES/4.%20MARKETING%20DIGITAL/CURSO%20LABORA%20IA/miangel-connecting-families/vercel.json):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### Database
Create indexes for critical relationships:
```sql
CREATE INDEX IF NOT EXISTS idx_equipo_pai_user ON public.equipo_pai(user_id);
CREATE INDEX IF NOT EXISTS idx_alertas_persona ON public.alertas(persona_autismo_id);
CREATE INDEX IF NOT EXISTS idx_observaciones_persona ON public.observaciones(persona_autismo_id);
```
