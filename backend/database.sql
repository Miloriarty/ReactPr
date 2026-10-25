DROP TABLE IF EXISTS payments, appointments, services, categories, users, coupons, roles;

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TABLE coupons (
    coupon_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    discount_percent INT
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    password VARCHAR(255),
    role_id INT REFERENCES roles(role_id),
    coupon_id INT REFERENCES coupons(coupon_id)
);

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE
);

CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    duration_minutes INT,
    price NUMERIC(10, 2),
    discount_percent INT DEFAULT 0,
    image_url VARCHAR(255),
    category_id INT REFERENCES categories(category_id)
);

CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    service_id INT REFERENCES services(service_id),
    quantity INT,
    price NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    appointment_id INT REFERENCES appointments(appointment_id),
    amount NUMERIC(10, 2),
    paid_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO roles (name) VALUES ('admin'), ('user');

INSERT INTO coupons (name, discount_percent) VALUES
    ('Bronze', 5),
    ('Silver', 10),
    ('Gold', 15);

INSERT INTO users (email, password, role_id, coupon_id) VALUES
    ('admin@fox.shop', 'pass', 1, NULL),
    ('user@fox.shop',  'pass', 2, 2);

INSERT INTO categories (name) VALUES
    ('Red foxes'),
    ('Arctic foxes'),
    ('Fennecs'),
    ('3D and art');

INSERT INTO services (name, description, duration_minutes, price, discount_percent, image_url, category_id) VALUES
    ('Fox rat Expie', 'Rare fox rat Expie', 30, 100, 20, '/images/expie.png', 4),
    ('Foxes', 'A pair of red foxes', 60, 200,  0, '/images/fox1.jpg', 1),
    ('Expie 3D', '3D model of Expie', 15, 300,  0, '/images/expie3d.jpg', 4),
    ('Calm Fox', 'Red fox with a calm temper', 45, 400, 10, '/images/fox2.jpg', 1),
    ('Active Fox', 'Very energetic red fox', 45, 500,  0, '/images/fox3.jpg', 1),
    ('Fluffy Fox', 'Red fox with a fluffy tail', 45, 500,  0, '/images/fox4.jpg', 1),
    ('Arctic Fox', 'White winter coat', 60, 700, 15, '/images/fox2.jpg', 2),
    ('Blue Arctic Fox', 'Arctic fox with a blue coat', 60, 750,  0, '/images/fox3.jpg', 2),
    ('Fennec', 'I am all ears', 40, 650,  0, '/images/all-ears.jpg', 3),
    ('Fennec Art', 'Fennec fox artwork', 30, 550,  0, '/images/fennec-art.webp', 3);
