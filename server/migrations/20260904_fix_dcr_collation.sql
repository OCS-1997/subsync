-- Migration to standardize collations and fix Illegal mix of collations errors
SET FOREIGN_KEY_CHECKS = 0;

-- Convert dcr_entries, contacts, users, and domains to utf8mb4_unicode_ci
ALTER TABLE dcr_entries CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE contacts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE domains CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
