-- RHMS Database Schema Updates for Admin Dashboard
-- Run this to update existing database with new features

USE rhms;

-- Add status column to tenants table for approval workflow
ALTER TABLE tenants 
ADD COLUMN status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved' 
AFTER move_in_date;

-- Add created_at column to maintenance table for better tracking
ALTER TABLE maintenance 
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
AFTER status;

-- Update existing tenants to have 'approved' status
UPDATE tenants SET status = 'approved' WHERE status IS NULL OR status = 'pending';

-- Add index for better performance
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_maintenance_status ON maintenance(status);
CREATE INDEX idx_maintenance_created_at ON maintenance(created_at);

-- Sample data for testing (optional)
-- INSERT INTO tenants (name, national_id, phone, email, house_number, move_in_date, status) VALUES
-- ('John Doe', '123456789', '0712345678', 'john@example.com', 'A101', CURDATE(), 'pending'),
-- ('Jane Smith', '987654321', '0723456789', 'jane@example.com', 'A102', CURDATE(), 'approved');

-- INSERT INTO maintenance (tenant, house_number, issue, status) VALUES
-- ('John Doe', 'A101', 'Water leak in bathroom', 'Open'),
-- ('Jane Smith', 'A102', 'Broken window lock', 'Open');
