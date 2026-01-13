
import appDB from '../db/subsyncDB.js';

const deleteTables = async () => {
    try {
        console.log("Deleting Knowledge Base tables...");

        // Drop in reverse order of creation to handle foreign keys
        await appDB.query("DROP TABLE IF EXISTS knowledge_versions;");
        console.log("Dropped knowledge_versions table");

        await appDB.query("DROP TABLE IF EXISTS knowledge_sources;");
        console.log("Dropped knowledge_sources table");

        await appDB.query("DROP TABLE IF EXISTS knowledge_article_tags;");
        console.log("Dropped knowledge_article_tags table");

        await appDB.query("DROP TABLE IF EXISTS knowledge_tags;");
        console.log("Dropped knowledge_tags table");

        await appDB.query("DROP TABLE IF EXISTS knowledge_articles;");
        console.log("Dropped knowledge_articles table");

        await appDB.query("DROP TABLE IF EXISTS knowledge_categories;");
        console.log("Dropped knowledge_categories table");

        // Optional: Remove permissions
        console.log("Removing Knowledge Base permissions...");
        await appDB.query("DELETE FROM role_permissions WHERE permission_id IN (SELECT id FROM permissions WHERE resource = 'knowledge_base');");
        await appDB.query("DELETE FROM permissions WHERE resource = 'knowledge_base';");
        console.log("Removed permissions and role assignments");

        console.log("All Knowledge Base tables deleted successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error deleting tables:", error);
        process.exit(1);
    }
};

deleteTables();
