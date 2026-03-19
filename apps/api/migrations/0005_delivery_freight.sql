-- Add distance and delivery fee to orders
alter table orders add column if not exists distance_km decimal(10, 2);
alter table orders add column if not exists delivery_fee decimal(10, 2);
