
-- Schema with Optimistic Locking

CREATE TABLE IF NOT EXISTS products (
    id UUID Primary key default gen_random_uuid(),
    title varchar(255) not null,
    stock int not null check (stock >= 0),
    version int not null default 1
);

CREATE TABLE IF not EXISTS orders (
    id UUID Primary key default gen_random_uuid(),
    user_id UUID not null,
    product_id UUID REFERENCES products(id),
    status VARCHAR(50) default 'PENDING',
    created_at timestamp default CURRENT_TIMESTAMP
);

-- Index for faster querying by user or status
CREATE INDEX idx_orders_user_id on orders(user_id);
CREATE INDEX idx_orders_status on orders(status);

-- Initial dummy data for our flash sale testing!
INSERT INTO products (title, stock, version) VALUES 
('Limited Edition Sneakers', 500, 1),
('RTX 5090 Graphics Card', 10, 1)
ON CONFLICT DO NOTHING;