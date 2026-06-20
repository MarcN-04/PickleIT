-- =============================================================================
-- PickleIT — 0003 auth profiles + roles
-- Adds a role-bearing profile per auth user.
--
-- Auth model:
--   * Username + password login. The app maps a username to a synthetic email
--     "<username>@pickleit.local" for Supabase Auth, and stores the chosen
--     username in raw_user_meta_data.username at sign-up.
--   * The FIRST user to sign up becomes 'admin'. Everyone after lands as
--     'pending' (no data access) until an admin assigns a role.
-- =============================================================================

create type user_role as enum ('admin', 'organizer', 'viewer', 'pending');

-- ----------------------------------------------------------------------------
-- profiles — 1:1 with auth.users. id == auth.users.id.
-- ----------------------------------------------------------------------------
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique,
  role       user_role not null default 'pending',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Auto-create a profile when a new auth user is created.
-- First-ever profile => 'admin', otherwise 'pending'.
-- Username comes from sign-up metadata; falls back to the email local-part.
-- SECURITY DEFINER so the trigger can write the profile regardless of the
-- (not-yet-existing) caller role; search_path pinned to avoid hijacking.
-- ----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
  uname    text;
begin
  select count(*) = 0 into is_first from public.profiles;

  uname := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, username, role)
  values (
    new.id,
    uname,
    case when is_first then 'admin'::user_role else 'pending'::user_role end
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- Helper: the caller's role (or 'pending' if no profile / not signed in).
-- Used by RLS policies in 0004. STABLE + SECURITY DEFINER so policies can
-- read the profile row without recursing through profiles' own RLS.
-- ----------------------------------------------------------------------------
create or replace function current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'pending'::user_role
  );
$$;
