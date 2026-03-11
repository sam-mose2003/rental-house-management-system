CREATE DATABASE IF NOT EXISTS rhms;

USE rhms;

-- Tenants Table
CREATE TABLE tenants (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100),
national_id VARCHAR(50),
phone VARCHAR(20),
email VARCHAR(100),
house_number VARCHAR(20),
move_in_date DATE
);

-- Houses Table
CREATE TABLE houses (
id INT AUTO_INCREMENT PRIMARY KEY,
house_number VARCHAR(20),
house_type VARCHAR(50),
rent DECIMAL(10,2),
status VARCHAR(20)
);

-- Payments Table
CREATE TABLE payments (
id INT AUTO_INCREMENT PRIMARY KEY,
tenant_id INT,
amount DECIMAL(10,2),
payment_date DATE,
payment_method VARCHAR(50),

FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Maintenance Table
CREATE TABLE maintenance (
id INT AUTO_INCREMENT PRIMARY KEY,
house_number VARCHAR(20),
issue TEXT,
date_reported DATE,
status VARCHAR(20)
);