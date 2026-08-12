-- Migration: Add gender column to users table
ALTER TABLE users 
ADD COLUMN gender ENUM('male', 'female', 'other') DEFAULT 'other' AFTER email;
