# ARISE — Solo Leveling Health System

## Overview
A gamified health/fitness webapp themed around Solo Leveling. Real-world fitness goals (calories, workouts, water, sleep) map to RPG dungeon quests and XP progression using the Solo Leveling manhwa aesthetic.

## Stack
| Layer | Tech |
|---|---|
| Framework | Next.js 14 App Router |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | NextAuth.js v5 (beta) — JWT + Credentials |
| ORM | Prisma 5 |
| Database | Supabase (PostgreSQL) |
| Animations | Framer Motion |
| Charts | Recharts |
| Validation | Zod |

## Environment Variables
Copy `.env.example` → `.env.local` and fill in:

```
DATABASE_URL     # Supabase pooler URL (port 6543, pgbouncer=true)
DIRECT_URL       # Supabase direct URL (port 5432, for migrations)
NEXTAUTH_SECRET  # openssl rand -base64 32
NEXTAUTH_URL     # http://localhost:3000
```

## File Structure
```
src/
  app/
    (auth)/
      login/page.tsx
      register/page.tsx
    (dashboard)/
      dashboard/page.tsx
      quests/page.tsx
      shadows/page.tsx
      weapons/page.tsx
      skills/page.tsx
    api/
      auth/[...nextauth]/route.ts
    layout.tsx
    page.tsx                    ← landing / splash
    globals.css
  components/
    ui/                         ← shadcn/ui base components
    system/                     ← Solo Leveling system window components
  lib/
    auth.ts                     ← NextAuth config + handlers
    db.ts                       ← Prisma singleton
    utils.ts                    ← cn(), formatXP(), calculateDailyCalories()
  types/
    index.ts                    ← Rank types, RANKS config, XP helpers
  hooks/
prisma/
  schema.prisma
```

## XP & Rank System
| Rank | XP Required | Color |
|---|---|---|
| E | 0 | Gray (#6b7280) |
| D | 1,000 | Green (#10b981) |
| C | 5,000 | Blue (#3b82f6) |
| B | 15,000 | Purple (#8b5cf6) |
| A | 40,000 | Gold (#f59e0b) |
| S | 100,000 | Red (#ef4444) |
| National | 250,000 | Pink (#ec4899) |
| Shadow Monarch | 500,000 | Purple Glow (#7c3aed) |

## UI Design Rules
- Background: `#0a0a0f` (deep black)
- Panels: `.system-window` class (dark purple gradient, purple border glow)
- Text: `system-text` for system messages (mono, purple)
- Font: Geist Mono for all UI labels, ranks, system messages
- Rank colors: `.rank-{E|D|C|B|A|S|National|ShadowMonarch}` CSS classes

## Development
```bash
npm run dev      # start dev server
npx prisma db push    # push schema to Supabase (after setting up .env.local)
npx prisma studio     # browse database
```

## Implementation Progress
- [x] Project scaffold (Next.js 14 + Tailwind)
- [x] Full stack dependencies installed (NextAuth v5, Prisma 5, shadcn/ui, Framer Motion, Recharts, Zod)
- [x] Prisma schema (User, Account, Session, Quest, QuestLog, Shadow, Weapon, Skill)
- [x] Tailwind config — Solo Leveling theme (black/purple/gold, CSS vars, animations)
- [x] globals.css — dark System Window aesthetic, rank color classes
- [x] lib/auth.ts — NextAuth v5 credentials provider + JWT
- [x] lib/db.ts — Prisma singleton
- [x] lib/utils.ts — cn(), formatXP(), calculateDailyCalories() (Mifflin-St Jeor)
- [x] types/index.ts — Rank type, RANKS config, getRankForXP(), getXPProgress()
- [x] Landing page (System Window splash)
- [x] CLAUDE.md
- [x] Auth pages — /login, /register (metric/imperial toggle)
- [x] Onboarding questionnaire (weight/height/age/goal → daily calorie target)
- [x] Dashboard — hunter status, XP bar, rank, daily quest summary card
- [x] Nav bar — links to all sections, sign out
- [x] Daily dungeon quests (/quests) — 5 categories: calories, water, workout, sleep, tasks
- [x] Quest progress tracking — +/- controls, exact kcal input, completion detection
- [x] XP awarding on quest completion, rank-up detection + toast
- [x] XP bar + rank display (color-coded per rank)
- [ ] Shadow army page
- [ ] Weapons page
- [ ] Skills page
- [ ] Streak tracking

