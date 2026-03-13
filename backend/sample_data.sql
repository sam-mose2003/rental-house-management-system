-- RHMS Sample Data
-- Run this to add sample houses and test data

USE rhms;

-- Insert sample houses
INSERT INTO houses (house_number, status) VALUES
('A101', 'Vacant'),
('A102', 'Vacant'),
('A103', 'Vacant'),
('B101', 'Vacant'),
('B102', 'Vacant'),
('B103', 'Vacant'),
('C101', 'Occupied'),
('C102', 'Occupied'),
('D101', 'Vacant'),
('D102', 'Vacant');

-- Display the houses
SELECT * FROM houses;
