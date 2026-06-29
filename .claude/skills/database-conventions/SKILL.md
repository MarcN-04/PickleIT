---
name: database-conventions
description: Use this skill before writing any SQL migration or touching types/database.ts.
---
## Migration rules
- Location: supabase/migrations/
- Filename format: XXXX_description.sql — increment from the last file
- Apply in filename order via the Supabase SQL editor

## types/database.ts
- Hand-maintained — not auto-generated
- Must be updated every time a migration is added or changed
- Mirrors the SQL exactly: tables, enums, views, and their column types
- Imports Category from @/lib/categories — do not redefine skill levels here

## Enums in the project
- PairingMode: balance | king_of_the_court
- SessionStatus: active | ended
- SessionPlayerState: playing | waiting | left
- GameStatus: pending | in_progress | completed
- TeamSide: a | b
- UserRole: admin | organizer | viewer | pending

## Auth
- RLS is the source of truth for access control
- UI role gating is convenience only — never rely on it as the only guard
