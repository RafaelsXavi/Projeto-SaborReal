-- Performance indexes for common order queries (motoboy/admin flows).

create index if not exists orders_motoboy_created_idx
  on orders (motoboy_id, created_at);

create index if not exists orders_ready_for_pickup_idx
  on orders (created_at)
  where motoboy_id is null and status = 'READY_FOR_PICKUP';

