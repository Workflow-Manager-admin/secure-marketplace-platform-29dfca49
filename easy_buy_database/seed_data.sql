-- Demo seed data for Secure Marketplace Application

-- USERS
INSERT INTO users (username, email, password_hash, display_name, profile_image_url)
VALUES
('alice', 'alice@example.com', '$2b$10$dummyhash1', 'Alice', 'https://i.pravatar.cc/150?img=1'),
('bob',   'bob@example.com',   '$2b$10$dummyhash2', 'Bob',   'https://i.pravatar.cc/150?img=2'),
('carol', 'carol@example.com', '$2b$10$dummyhash3', 'Carol', 'https://i.pravatar.cc/150?img=3');

-- PRODUCTS
INSERT INTO products (seller_id, name, description, price, is_active)
VALUES
(1, 'iPhone 13 Pro', 'Excellent condition, barely used.', 900.00, 1),
(2, 'Mountain Bike', '21-speed, recently serviced. Includes helmet.', 320.50, 1),
(3, 'Guitar', 'Acoustic, comes with carry bag.', 120.00, 1);

-- PRODUCT IMAGES
INSERT INTO product_images (product_id, image_url, is_primary)
VALUES
(1, 'https://example.com/iphone13pro.jpg', 1),
(2, 'https://example.com/bike1.jpg', 1),
(3, 'https://example.com/guitar1.jpg', 1),
(1, 'https://example.com/iphone13pro-side.jpg', 0),
(2, 'https://example.com/bike2.jpg', 0);

-- CHAT MESSAGES
INSERT INTO chat_messages (sender_id, receiver_id, product_id, message)
VALUES
(2, 1, 1, 'Hi, is the iPhone still available?'),
(1, 2, 1, 'Yes, it is!'),
(3, 2, 2, 'I am interested in the bike.'),
(2, 3, 2, 'Sure, would you like to see more photos?');

-- TRANSACTIONS
INSERT INTO transactions (buyer_id, seller_id, product_id, amount, status, payment_method, payment_reference)
VALUES
(2, 1, 1, 900.00, 'completed', 'card', 'demo_ref_abc123'),
(3, 2, 2, 320.50, 'pending', 'paypal', 'demo_ref_xyz789');

-- USER SETTINGS
INSERT INTO user_settings (user_id, email_notifications, push_notifications, dark_mode, language)
VALUES
(1, 1, 1, 0, 'en'),
(2, 1, 0, 1, 'es'),
(3, 0, 1, 0, 'en');

-- End of seed data
