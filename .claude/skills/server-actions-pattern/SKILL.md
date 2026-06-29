---
name: server-actions-pattern
description: Use this skill when creating or editing any Server Action or data query file in lib/data/.
---
## File naming
- lib/data/<feature>.ts — read-only queries
- lib/data/<feature>Actions.ts — "use server" mutations

## Required shape for every Server Action
```ts
"use server"
import { canManageGameplay } from "@/lib/auth/roles"
import { revalidatePath } from "next/cache"

export async function doSomething(...) {
  if (!(await canManageGameplay())) throw new Error("Unauthorized")
  // mutation here
  revalidatePath("/affected-path")
}
```

## Rules
- Always check role before mutating — canView, canManageGameplay, isAdmin, isPending
- Always call revalidatePath after every mutation
- Use lib/supabase/server.ts inside Server Actions — never lib/supabase/client.ts
- getCurrentProfile() is cached per request — use it, never re-query the profile
