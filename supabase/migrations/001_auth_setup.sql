-- ============================================================
-- 001_auth_setup.sql
-- Kullanıcı profilleri, roller ve RLS politikaları
-- ============================================================

-- Rol enum tipi
create type user_role as enum ('customer', 'agent', 'admin');

-- Profil tablosu (Supabase auth.users ile 1-1 ilişki)
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  full_name   text,
  role        user_role not null default 'customer',
  avatar_url  text,
  company     text,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Yeni kullanıcı kaydında otomatik profil oluştur
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at otomatik güncelle
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;

-- Herkes kendi profilini okuyabilir
create policy "profiles: kendi profilini oku"
  on public.profiles for select
  using (auth.uid() = id);

-- Agent ve admin tüm profilleri görebilir
create policy "profiles: agent/admin tümünü görür"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('agent', 'admin')
    )
  );

-- Sadece kendi profilini güncelleyebilir
create policy "profiles: kendi profilini güncelle"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admin rol değiştirebilir
create policy "profiles: admin rol atar"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- Yardımcı fonksiyonlar
-- ============================================================

-- Mevcut kullanıcının rolünü döndür
create or replace function public.get_my_role()
returns user_role
language sql stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Kullanıcı belirli role sahip mi?
create or replace function public.has_role(check_role user_role)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = check_role
  );
$$;

-- Admin mi?
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select has_role('admin');
$$;

-- Agent veya admin mi?
create or replace function public.is_agent_or_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('agent', 'admin')
  );
$$;

-- ============================================================
-- İndeksler
-- ============================================================

create index profiles_role_idx on public.profiles(role);
create index profiles_email_idx on public.profiles(email);
