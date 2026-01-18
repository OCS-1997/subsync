-- Migration: Create Teams Tables
-- File: 001_create_teams_tables.sql
-- Run: Execute in MySQL/MariaDB

CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    team_lead_username VARCHAR(32) NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (team_lead_username) REFERENCES users(username) ON DELETE SET NULL,
    INDEX idx_team_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    team_id INT NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(32) NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(username) ON DELETE SET NULL,
    
    UNIQUE KEY unique_user_team (user_id, team_id),
    INDEX idx_user (user_id),
    INDEX idx_team (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
