-- Migration: Add 'renewed' status to subscriptions table
ALTER TABLE subscriptions MODIFY COLUMN status ENUM('active','paused','cancelled','renewed') NOT NULL DEFAULT 'active';
