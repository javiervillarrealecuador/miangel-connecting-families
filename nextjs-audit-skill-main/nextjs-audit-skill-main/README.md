# nextjs-audit-skill

Claude Code skill para auditar proyectos Next.js + Supabase + Vercel.

## Qué audita

- **Seguridad**: RLS, rutas protegidas, admin, auth, rate limiting, CAPTCHA, env vars, server-side boundaries, AI/LLM controls, security headers
- **Base de datos**: schema, indexes, relaciones, multi-tenancy, tablas de auditoría
- **Performance**: paginación, N+1, fetch patterns, caching, bundle size
- **Escalabilidad**: estrategia de crecimiento, SaaS readiness, VPS vs Vercel, data retention

## Instalación

```bash
mkdir -p ~/.claude/skills/nextjs-audit
cp .claude/skills/nextjs-audit/SKILL.md ~/.claude/skills/nextjs-audit/SKILL.md
```

## Uso

Parado en el root de tu proyecto Next.js:

```
/nextjs-audit
```

O especificando un path:

```
/nextjs-audit ~/projects/mi-app
```

## Output

Genera un `AUDIT-REPORT.md` con score /100, findings por severidad, y checklist de fixes.
