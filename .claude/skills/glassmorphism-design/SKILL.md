---
name: glassmorphism-design
description: Use this skill before creating or editing any UI component, page layout, or visual style in PickleIT.
---
## Component library — always use before creating new components
- Location: components/ui/
- Exports: Button, Panel, Input, Toggle, Chip, CategoryBadge, TierDot
- All exported via components/ui/index.ts — import from there

## Utility
- cn() from lib/cn.ts — all conditional classnames go through this
- Framer Motion variants — lib/motion.ts — use existing variants before defining new ones

## Nav rules
- Desktop (≥1024px): SideNav renders
- Mobile: TabBar renders
- Never render both simultaneously
- Nav items defined in components/nav-items.ts — update there, not in the layout

## Rules
- Match the existing glassmorphism aesthetic — check app/style/page.tsx for the design reference
- Do not introduce a second animation library — Framer Motion is already in the bundle
- Do not create a new UI primitive if an existing one in components/ui/ covers the need
- Every new page route must have a loading.tsx
