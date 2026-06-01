create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null unique,
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.barbers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('corte', 'barba', 'sobrancelha', 'tintura')),
  duration_minutes integer not null check (
    (name = 'corte' and duration_minutes = 60) or
    (name = 'barba' and duration_minutes = 20) or
    (name = 'sobrancelha' and duration_minutes = 5) or
    (name = 'tintura' and duration_minutes = 120)
  ),
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_phone text not null,
  customer_email text not null,
  barber_id uuid not null references public.barbers(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  total_duration_minutes integer not null check (total_duration_minutes > 0),
  total_price_cents integer not null check (total_price_cents >= 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.appointment_services (
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  service_id uuid not null references public.services(id),
  service_name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price_cents integer not null check (price_cents >= 0),
  primary key (appointment_id, service_id)
);

create index if not exists idx_appointments_barber_time
  on public.appointments (barber_id, starts_at, ends_at)
  where status in ('scheduled', 'confirmed');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_no_barber_overlap'
  ) then
    alter table public.appointments
      add constraint appointments_no_barber_overlap
      exclude using gist (
        barber_id with =,
        tstzrange(starts_at, ends_at, '[)') with &&
      )
      where (status in ('scheduled', 'confirmed'));
  end if;
end $$;

alter table public.admins enable row level security;
alter table public.barbers enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_services enable row level security;

insert into public.services (name, duration_minutes, price_cents, active)
values
  ('corte', 60, 0, true),
  ('barba', 20, 0, true),
  ('sobrancelha', 5, 0, true),
  ('tintura', 120, 0, true)
on conflict (name) do nothing;
