-- EasyTraining — schemat synchronizacji (Supabase)
-- Wklej całość w Supabase → SQL Editor → Run

-- ── PROFIL UŻYTKOWNIKA + ROLA ────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('user','admin','trainer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- każdy widzi wszystkie profile (potrzebne adminowi do listy kont + zmiany ról)
create policy "profiles_select_all" on public.profiles
  for select using (true);

-- użytkownik może aktualizować tylko siebie, ale NIE swoją rolę (rola tylko przez admina — patrz RPC niżej)
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── DANE APLIKACJI (cały store jako JSON) ────────────────────────────────
create table if not exists public.user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "user_data_own" on public.user_data
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Admin może czytać i zapisywać dane KAŻDEGO użytkownika (tryb "wejdź jako"
-- w panelu Konta — podgląd/edycja aplikacji innego usera przez admina).
-- Permisywna policy: dodaje się do "user_data_own" (OR), nie ją zastępuje.
create policy "user_data_admin_all" on public.user_data
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  ) with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ── ĆWICZENIA DODANE PRZEZ ADMINA (widoczne dla wszystkich w apce) ───────
create table if not exists public.shared_exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.shared_exercises enable row level security;

create policy "shared_exercises_select_all" on public.shared_exercises
  for select using (true);

create policy "shared_exercises_write_admin" on public.shared_exercises
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ── AUTO-PROFIL PRZY REJESTRACJI ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── ZMIANA ROLI — TYLKO PRZEZ ADMINA (omija RLS profiles_update_self) ────
create or replace function public.admin_set_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Tylko administrator może zmieniać role';
  end if;
  if new_role not in ('user','admin','trainer') then
    raise exception 'Nieprawidłowa rola';
  end if;
  update public.profiles set role = new_role where id = target_user_id;
end;
$$;

-- Pierwsze konto administratora ustaw ręcznie po rejestracji, np.:
-- update public.profiles set role = 'admin' where email = 'twoj@email.pl';
