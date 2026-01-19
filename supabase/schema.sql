create extension if not exists "pgcrypto";

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  summary text,
  description text,
  price_night numeric,
  images text[] default '{}',
  is_active boolean default true,
  occupied boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz,
  guest_name text,
  guest_email text,
  guest_phone text,
  stay_type text,
  checkin date,
  checkout date,
  total text,
  status text default 'Pendiente de pago',
  payment_status text default 'pending',
  room_id uuid references rooms(id) on delete set null,
  room_name text,
  room_snapshot jsonb,
  guest_snapshot jsonb,
  room_occupied int default 0,
  language text default 'es'
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

alter table customers add column if not exists updated_at timestamptz default now();

drop trigger if exists rooms_updated_at on rooms;
drop trigger if exists reservations_updated_at on reservations;
drop trigger if exists customers_updated_at on customers;

create trigger rooms_updated_at
before update on rooms
for each row execute function set_updated_at();

create trigger reservations_updated_at
before update on reservations
for each row execute function set_updated_at();

create trigger customers_updated_at
before update on customers
for each row execute function set_updated_at();

alter table rooms enable row level security;
alter table reservations enable row level security;
alter table customers enable row level security;

create policy "public read active rooms" on rooms
  for select
  using (is_active = true);

create policy "public insert reservations" on reservations
  for insert
  with check (true);
