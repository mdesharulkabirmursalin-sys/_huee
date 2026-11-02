-- Run in Supabase SQL Editor. Review the policies before launching.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('hoodies','tees','outerwear','accessories')),
  price integer not null check (price >= 0),
  color text not null default '',
  sizes jsonb not null default '["S","M","L","XL"]'::jsonb,
  stock jsonb not null default '{}'::jsonb,
  description text not null default '',
  tag text not null default '',
  image text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_name text not null,
  phone text not null,
  address text not null,
  items jsonb not null,
  total integer not null check (total >= 0),
  currency text not null default 'BDT',
  channel text not null check (channel in ('whatsapp','instagram','payment')),
  status text not null default 'pending' check (status in ('pending','confirmed','paid','shipped','cancelled')),
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;
alter table public.profiles enable row level security;
alter table public.order_requests enable row level security;

drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products" on public.products
  for select using (active = true or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products
  for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Users view own profile" on public.profiles;
create policy "Users view own profile" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "Users create own customer profile" on public.profiles;
create policy "Users create own customer profile" on public.profiles
  for insert with check (id = auth.uid() and role = 'customer');

drop policy if exists "Users create order requests" on public.order_requests;
create policy "Users create order requests" on public.order_requests
  for insert with check (user_id is null or user_id = auth.uid());

drop policy if exists "Users view own orders" on public.order_requests;
create policy "Users view own orders" on public.order_requests
  for select using (user_id = auth.uid() or exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ));

-- Admin setup: after registering your account, replace USER_UUID with the auth.users UUID.
-- Execute manually in SQL editor; never expose service_role keys in frontend code.
-- insert into public.profiles (id, role) values ('USER_UUID', 'admin')
-- on conflict (id) do update set role = 'admin';

-- IMPORTANT:
-- The frontend demo checkout inserts guest order requests with user_id omitted.
-- Before public launch, use a server-side Edge Function for order creation, price
-- verification, stock reservation/decrement, and payment gateway integration.
-- Do not treat browser-supplied prices/totals as trusted.
