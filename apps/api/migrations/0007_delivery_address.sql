-- Add delivery address fields to orders
alter table orders add column if not exists delivery_cep text;
alter table orders add column if not exists delivery_number text;
alter table orders add column if not exists delivery_notes text;

