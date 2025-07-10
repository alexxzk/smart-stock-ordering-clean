-- Comprehensive Restaurant Management System Database Schema

-- Users and Authentication
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers
CREATE TABLE suppliers (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_rep VARCHAR(255),
    address TEXT,
    api_type VARCHAR(50),
    api_credentials JSON,
    preferred_delivery_days JSON,
    minimum_order_value DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product Categories
CREATE TABLE product_categories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products/Ingredients
CREATE TABLE products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(255),
    unit VARCHAR(50) NOT NULL, -- kg, L, pcs, etc.
    package_size VARCHAR(100),
    cost_per_unit DECIMAL(10,4),
    supplier_id VARCHAR(255),
    barcode VARCHAR(255),
    description TEXT,
    allergens JSON,
    storage_requirements TEXT,
    shelf_life_days INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES product_categories(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Inventory
CREATE TABLE inventory (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    batch_number VARCHAR(255),
    expiry_date DATE,
    received_date DATE,
    cost_per_unit DECIMAL(10,4),
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Menu Categories
CREATE TABLE menu_categories (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu Items
CREATE TABLE menu_items (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(255),
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    margin_percentage DECIMAL(5,2),
    preparation_time INTEGER, -- minutes
    is_active BOOLEAN DEFAULT TRUE,
    allergens JSON,
    dietary_tags JSON, -- vegetarian, vegan, gluten-free, etc.
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES menu_categories(id)
);

-- Recipe Ingredients (linking menu items to products)
CREATE TABLE recipe_ingredients (
    id VARCHAR(255) PRIMARY KEY,
    menu_item_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sales Transactions
CREATE TABLE sales_transactions (
    id VARCHAR(255) PRIMARY KEY,
    transaction_date TIMESTAMP NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    payment_method VARCHAR(50),
    customer_id VARCHAR(255),
    staff_id VARCHAR(255),
    pos_system VARCHAR(50),
    external_transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES users(id)
);

-- Sales Transaction Items
CREATE TABLE sales_transaction_items (
    id VARCHAR(255) PRIMARY KEY,
    transaction_id VARCHAR(255) NOT NULL,
    menu_item_id VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    modifications TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES sales_transactions(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Waste Records
CREATE TABLE waste_records (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    waste_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    cost_impact DECIMAL(10,2),
    location VARCHAR(255),
    recorded_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Stock Adjustments
CREATE TABLE stock_adjustments (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL, -- manual, sale, waste, received
    quantity_change DECIMAL(10,3) NOT NULL,
    reason VARCHAR(255),
    reference_id VARCHAR(255), -- links to transaction, waste, etc.
    adjusted_by VARCHAR(255),
    adjustment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (adjusted_by) REFERENCES users(id)
);

-- Supplier Orders
CREATE TABLE supplier_orders (
    id VARCHAR(255) PRIMARY KEY,
    supplier_id VARCHAR(255) NOT NULL,
    order_date TIMESTAMP NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    status VARCHAR(50) NOT NULL, -- draft, sent, confirmed, delivered, cancelled
    total_amount DECIMAL(10,2),
    delivery_method VARCHAR(50), -- email, api, manual
    tracking_number VARCHAR(255),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Supplier Order Items
CREATE TABLE supplier_order_items (
    id VARCHAR(255) PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    unit_cost DECIMAL(10,4),
    total_cost DECIMAL(10,2),
    received_quantity DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES supplier_orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sales Forecasts
CREATE TABLE sales_forecasts (
    id VARCHAR(255) PRIMARY KEY,
    menu_item_id VARCHAR(255) NOT NULL,
    forecast_date DATE NOT NULL,
    forecast_period VARCHAR(50) NOT NULL, -- daily, weekly, monthly
    predicted_quantity INTEGER NOT NULL,
    confidence_score DECIMAL(5,2),
    weather_impact DECIMAL(5,2),
    event_impact DECIMAL(5,2),
    seasonal_factor DECIMAL(5,2),
    actual_quantity INTEGER,
    accuracy_score DECIMAL(5,2),
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

-- Events and Weather Impact
CREATE TABLE events (
    id VARCHAR(255) PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    event_type VARCHAR(100), -- holiday, festival, local_event, weather
    impact_multiplier DECIMAL(5,2), -- 0.5 = 50% decrease, 1.5 = 50% increase
    affected_categories JSON,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports
CREATE TABLE reports (
    id VARCHAR(255) PRIMARY KEY,
    report_type VARCHAR(100) NOT NULL,
    report_name VARCHAR(255) NOT NULL,
    parameters JSON,
    generated_by VARCHAR(255),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'completed',
    FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- System Settings
CREATE TABLE system_settings (
    id VARCHAR(255) PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Low Stock Alerts
CREATE TABLE low_stock_alerts (
    id VARCHAR(255) PRIMARY KEY,
    product_id VARCHAR(255) NOT NULL,
    alert_threshold DECIMAL(10,3) NOT NULL,
    current_stock DECIMAL(10,3) NOT NULL,
    alert_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (acknowledged_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX idx_inventory_product_id ON inventory(product_id);
CREATE INDEX idx_inventory_expiry_date ON inventory(expiry_date);
CREATE INDEX idx_sales_transactions_date ON sales_transactions(transaction_date);
CREATE INDEX idx_sales_transaction_items_menu_item ON sales_transaction_items(menu_item_id);
CREATE INDEX idx_waste_records_date ON waste_records(waste_date);
CREATE INDEX idx_waste_records_product ON waste_records(product_id);
CREATE INDEX idx_stock_adjustments_product ON stock_adjustments(product_id);
CREATE INDEX idx_stock_adjustments_date ON stock_adjustments(adjustment_date);
CREATE INDEX idx_supplier_orders_status ON supplier_orders(status);
CREATE INDEX idx_supplier_orders_date ON supplier_orders(order_date);
CREATE INDEX idx_sales_forecasts_item_date ON sales_forecasts(menu_item_id, forecast_date);
CREATE INDEX idx_events_date ON events(event_date);

-- Sample data
INSERT INTO product_categories (id, name, description, color) VALUES
('cat_dairy', 'Dairy Products', 'Milk, cheese, yogurt, etc.', '#FFE135'),
('cat_meat', 'Meat & Poultry', 'Fresh meat, chicken, seafood', '#FF6B6B'),
('cat_vegetables', 'Vegetables', 'Fresh vegetables and herbs', '#4ECDC4'),
('cat_dry_goods', 'Dry Goods', 'Rice, pasta, flour, spices', '#45B7D1'),
('cat_beverages', 'Beverages', 'Coffee, tea, juices, soft drinks', '#96CEB4'),
('cat_cleaning', 'Cleaning Supplies', 'Detergents, sanitizers, paper goods', '#FFEAA7');

INSERT INTO menu_categories (id, name, description, display_order) VALUES
('menu_breakfast', 'Breakfast', 'Morning meals and breakfast items', 1),
('menu_lunch', 'Lunch', 'Lunch specials and main courses', 2),
('menu_dinner', 'Dinner', 'Evening meals and dinner specials', 3),
('menu_beverages', 'Beverages', 'Hot and cold drinks', 4),
('menu_desserts', 'Desserts', 'Sweet treats and desserts', 5);

INSERT INTO system_settings (id, setting_key, setting_value, description) VALUES
('set_business_name', 'business_name', 'Smart Stock Restaurant', 'Business name for reports'),
('set_currency', 'currency', 'AUD', 'Default currency'),
('set_tax_rate', 'tax_rate', '10.0', 'Default tax rate percentage'),
('set_low_stock_threshold', 'low_stock_threshold', '5', 'Default low stock alert threshold'),
('set_waste_alert_threshold', 'waste_alert_threshold', '10', 'Waste percentage alert threshold'),
('set_forecast_days', 'forecast_days', '30', 'Number of days to forecast ahead');