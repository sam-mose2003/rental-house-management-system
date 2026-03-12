-- RHMS database schema (MySQL)
-- Usage (example):
--   mysql -u root -p < backend/schema.sql

CREATE DATABASE IF NOT EXISTS rhms
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE rhms;

CREATE TABLE IF NOT EXISTS houses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  house_number VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('Vacant', 'Occupied') NOT NULL DEFAULT 'Vacant'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tenants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  national_id VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  house_number VARCHAR(50) NOT NULL,
  move_in_date DATE NOT NULL,
  CONSTRAINT fk_tenants_house_number
    FOREIGN KEY (house_number) REFERENCES houses(house_number)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
  CONSTRAINT fk_payments_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS maintenance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant VARCHAR(200) NULL,
  house_number VARCHAR(50) NOT NULL,
  issue VARCHAR(500) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Open',
  CONSTRAINT fk_maintenance_house_number
    FOREIGN KEY (house_number) REFERENCES houses(house_number)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

