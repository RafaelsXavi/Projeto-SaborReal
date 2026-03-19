-- Rename courier_id to motoboy_id in orders
ALTER TABLE orders RENAME COLUMN courier_id TO motoboy_id;

-- Update the check constraint on users.role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role in ('customer', 'admin', 'motoboy', 'courier'));

-- Update existing courier records to motoboy
UPDATE users SET role = 'motoboy' WHERE role = 'courier';
