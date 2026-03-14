-- Catalog tables (categories/items/addons).

create table if not exists catalog_categories (
  id text primary key,
  name text not null unique,
  sort_order int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists catalog_items (
  id text primary key,
  name text not null,
  description text not null,
  price_brl numeric(10, 2) not null,
  price_cents int not null,
  category_id text not null references catalog_categories(id) on delete restrict,
  image_url text not null,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalog_items_category_idx on catalog_items (category_id);
create index if not exists catalog_items_available_idx on catalog_items (available);

create table if not exists catalog_addons (
  id text primary key,
  name text not null unique,
  price_brl numeric(10, 2) not null,
  price_cents int not null,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists catalog_item_addons (
  item_id text not null references catalog_items(id) on delete cascade,
  addon_id text not null references catalog_addons(id) on delete cascade,
  primary key (item_id, addon_id)
);

