-- Core tables for auth + orders.

create table if not exists users (
  id uuid primary key,
  email text,
  phone text,
  password_hash text not null,
  role text not null check (role in ('customer', 'admin', 'courier')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists users_email_unique
  on users (lower(email))
  where email is not null;

create unique index if not exists users_phone_unique
  on users (phone)
  where phone is not null;

create table if not exists refresh_tokens (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  replaced_by_token_id uuid references refresh_tokens(id),
  user_agent text,
  ip inet
);

create index if not exists refresh_tokens_user_active_idx
  on refresh_tokens (user_id)
  where revoked_at is null;

create table if not exists orders (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  status text not null check (status in (
    'PLACED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'OUT_FOR_DELIVERY',
    'COMPLETED',
    'CANCELLED'
  )),
  courier_id uuid references users(id),
  created_at timestamptz not null default now()
);

create index if not exists orders_user_created_idx on orders (user_id, created_at);

create table if not exists order_lines (
  order_id uuid not null references orders(id) on delete cascade,
  line_no int not null,
  item_id text not null,
  qty int not null check (qty >= 1 and qty <= 99),
  primary key (order_id, line_no)
);

create table if not exists order_idempotency (
  user_id uuid not null references users(id) on delete cascade,
  key text not null,
  body_hash text not null,
  order_id uuid not null references orders(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, key)
);

