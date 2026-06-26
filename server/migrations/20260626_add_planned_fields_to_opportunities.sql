-- Migration: Add planned_items JSON column to opportunities table
-- Date: 2026-06-26

ALTER TABLE opportunities 
ADD COLUMN planned_items JSON NULL AFTER product_services;
