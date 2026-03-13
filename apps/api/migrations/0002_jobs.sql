create table if not exists jobs (
  id uuid primary key,
  name text not null,
  payload jsonb not null default '{}'::jsonb,
  run_at timestamptz not null default now(),
  status text not null check (status in ('pending', 'processing', 'succeeded', 'failed')) default 'pending',
  attempts int not null default 0,
  max_attempts int not null default 5,
  locked_at timestamptz,
  locked_by text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_pending_run_at_idx
  on jobs (run_at)
  where status = 'pending';

