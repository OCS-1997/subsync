-- User Permission Overrides System
-- Allows granting or denying specific permissions to individual users

CREATE TABLE IF NOT EXISTS user_permission_overrides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    permission_id INT NOT NULL,
    is_granted BOOLEAN NOT NULL COMMENT 'TRUE = grant permission, FALSE = deny permission',
    reason TEXT COMMENT 'Optional reason for the override',
    created_by VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT 'Username of admin who created the override',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_permission (username, permission_id),
    
    FOREIGN KEY (username) 
        REFERENCES users(username) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    FOREIGN KEY (permission_id) 
        REFERENCES permissions(id) 
        ON DELETE CASCADE,
        
    INDEX idx_username (username),
    INDEX idx_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
COMMENT='Stores user-specific permission overrides (grant/deny)';
