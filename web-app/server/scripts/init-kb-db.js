
import appDB from '../db/subsyncDB.js';

const createTables = async () => {
    try {
        console.log("Initializing Knowledge Base tables...");

        // 1. Categories
        await appDB.query(`
            CREATE TABLE IF NOT EXISTS knowledge_categories (
                id INT NOT NULL AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                slug VARCHAR(100) NOT NULL,
                description VARCHAR(255) DEFAULT NULL,
                parent_id INT DEFAULT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY slug_UNIQUE (slug),
                FOREIGN KEY (parent_id) REFERENCES knowledge_categories(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created knowledge_categories table");

        // 2. Articles
        await appDB.query(`
            CREATE TABLE IF NOT EXISTS knowledge_articles (
                id INT NOT NULL AUTO_INCREMENT,
                title VARCHAR(255) NOT NULL,
                slug VARCHAR(255) NOT NULL,
                content LONGTEXT,
                category_id INT DEFAULT NULL,
                author_id VARCHAR(32) NOT NULL,
                visibility ENUM('internal','customer','both') NOT NULL DEFAULT 'internal',
                is_published TINYINT(1) DEFAULT '0',
                views INT DEFAULT '0',
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY slug_UNIQUE (slug),
                KEY idx_author_id (author_id),
                KEY idx_category_id (category_id),
                FULLTEXT KEY ft_search (title, content),
                FOREIGN KEY (category_id) REFERENCES knowledge_categories(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created knowledge_articles table");

        // 3. Tags
        await appDB.query(`
            CREATE TABLE IF NOT EXISTS knowledge_tags (
                id INT NOT NULL AUTO_INCREMENT,
                name VARCHAR(50) NOT NULL,
                PRIMARY KEY (id),
                UNIQUE KEY name_UNIQUE (name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created knowledge_tags table");

        // 4. Article Tags
        await appDB.query(`
            CREATE TABLE IF NOT EXISTS knowledge_article_tags (
                article_id INT NOT NULL,
                tag_id INT NOT NULL,
                PRIMARY KEY (article_id, tag_id),
                FOREIGN KEY (article_id) REFERENCES knowledge_articles(id) ON DELETE CASCADE,
                FOREIGN KEY (tag_id) REFERENCES knowledge_tags(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created knowledge_article_tags table");

        // 5. Sources (Linking to DCR)
        await appDB.query(`
            CREATE TABLE IF NOT EXISTS knowledge_sources (
                id INT NOT NULL AUTO_INCREMENT,
                article_id INT NOT NULL,
                source_type ENUM('DCR','MANUAL') NOT NULL,
                source_reference_id INT NOT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (article_id) REFERENCES knowledge_articles(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created knowledge_sources table");

        // 6. Versions
        await appDB.query(`
            CREATE TABLE IF NOT EXISTS knowledge_versions (
                id INT NOT NULL AUTO_INCREMENT,
                article_id INT NOT NULL,
                version_number INT NOT NULL,
                content_snapshot MEDIUMTEXT NOT NULL,
                changed_by VARCHAR(32) NOT NULL,
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (article_id) REFERENCES knowledge_articles(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("Created knowledge_versions table");

        // 7. Seed Permissions
        console.log("Seeding Knowledge Base permissions...");
        const permissions = [
            { key: 'knowledge_base.view', resource: 'knowledge_base', action: 'view', description: 'View knowledge base articles' },
            { key: 'knowledge_base.create', resource: 'knowledge_base', action: 'create', description: 'Create knowledge base articles' },
            { key: 'knowledge_base.update', resource: 'knowledge_base', action: 'update', description: 'Update knowledge base articles' },
            { key: 'knowledge_base.delete', resource: 'knowledge_base', action: 'delete', description: 'Delete knowledge base articles' },
            { key: 'knowledge_base.manage_categories', resource: 'knowledge_base', action: 'manage_categories', description: 'Manage knowledge base categories' }
        ];

        for (const perm of permissions) {
            await appDB.query(`
                INSERT IGNORE INTO permissions (permission_key, resource, action, description)
                VALUES (?, ?, ?, ?)
            `, [perm.key, perm.resource, perm.action, perm.description]);
        }
        console.log("Seeded permissions");

        // 8. Assign Permissions to Roles
        console.log("Assigning permissions to roles...");

        // Admin gets all new permissions
        await appDB.query(`
            INSERT IGNORE INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id 
            FROM roles r 
            CROSS JOIN permissions p 
            WHERE r.role_key = 'admin' 
            AND p.resource = 'knowledge_base'
        `);

        // Support gets access to view
        await appDB.query(`
            INSERT IGNORE INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id 
            FROM roles r 
            JOIN permissions p ON p.permission_key = 'knowledge_base.view'
            WHERE r.role_key = 'support'
        `);

        // Viewer gets access to view
        await appDB.query(`
            INSERT IGNORE INTO role_permissions (role_id, permission_id)
            SELECT r.id, p.id 
            FROM roles r 
            JOIN permissions p ON p.permission_key = 'knowledge_base.view'
            WHERE r.role_key = 'viewer'
        `);
        console.log("Assigned permissions to roles");

        console.log("All Knowledge Base tables initialized successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error creating tables:", error);
        process.exit(1);
    }
};

createTables();
