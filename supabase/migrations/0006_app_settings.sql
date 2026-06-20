-- =============================================================================
-- PickleIT — 0006 app settings
-- A single-row table holding app-wide defaults (default pairing mode + court
-- count, and category display labels). Readable by anyone signed in with a
-- role; writable by admins only.
-- =============================================================================

create table app_settings (
  id                   int primary key default 1,
  default_pairing_mode pairing_mode not null default 'balance',
  default_court_count  int not null default 2 check (default_court_count between 1 and 3),
  -- Display labels for the three categories (functional rename is v1-display-only).
  label_beginner       text not null default 'Beginner',
  label_intermediate   text not null default 'Intermediate',
  label_pro            text not null default 'Pro',
  updated_at           timestamptz not null default now(),
  -- Enforce single row.
  constraint app_settings_singleton check (id = 1)
);

-- Seed the single row.
insert into app_settings (id) values (1) on conflict (id) do nothing;

alter table app_settings enable row level security;

-- Anyone with a role can read settings.
create policy app_settings_read on app_settings for select
  using (current_user_role() in ('admin','organizer','viewer'));

-- Only admins can change settings.
create policy app_settings_write on app_settings for all
  using      (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');
