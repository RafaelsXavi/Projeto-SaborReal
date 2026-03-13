create table if not exists audit_events (
  id uuid primary key,
  name text not null,
  actor_user_id uuid,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_created_idx on audit_events (created_at desc);
create index if not exists audit_events_entity_idx on audit_events (entity_type, entity_id);

