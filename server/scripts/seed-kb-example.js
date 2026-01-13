
import appDB from '../db/subsyncDB.js';

const seedExample = async () => {
    try {
        console.log("Seeding example Knowledge Base article...");

        // 1. Create Category
        const [catResult] = await appDB.query(`
            INSERT IGNORE INTO knowledge_categories (name, slug, description) 
            VALUES ('General', 'general', 'General help topics')
        `);

        let categoryId;
        if (catResult.insertId) {
            categoryId = catResult.insertId;
        } else {
            const [rows] = await appDB.query("SELECT id FROM knowledge_categories WHERE slug = 'general'");
            categoryId = rows[0].id;
        }

        console.log(`Using Category ID: ${categoryId}`);

        // 2. Create Article
        const title = "How to Reset Your Password";
        const slug = "how-to-reset-your-password";
        const content = `
# How to Reset Your Password

If you have forgotten your password, follow these steps to reset it:

1. Go to the login page.
2. Click on "Forgot Password?".
3. Enter your email address.
4. Check your email for a reset link.
5. Click the link and set a new password.

> **Note:** The link expires in 15 minutes.

If you still have trouble, contact support.
        `;

        const [artResult] = await appDB.query(`
            INSERT INTO knowledge_articles (title, slug, content, category_id, author_id, is_published)
            VALUES (?, ?, ?, ?, 'admin', 1)
            ON DUPLICATE KEY UPDATE title=VALUES(title)
        `, [title, slug, content, categoryId]);

        let articleId;
        if (artResult.insertId) {
            articleId = artResult.insertId;
            console.log(`Created Article ID: ${articleId}`);
        } else {
            const [rows] = await appDB.query("SELECT id FROM knowledge_articles WHERE slug = ?", [slug]);
            articleId = rows[0].id;
            console.log(`Article already exists, ID: ${articleId}`);
        }

        // 3. Add Tags
        const tags = ['troubleshooting', 'auth', 'security', 'how-to'];
        for (const tagName of tags) {
            // Create tag
            await appDB.query(`INSERT IGNORE INTO knowledge_tags (name) VALUES (?)`, [tagName]);

            // Get tag ID
            const [tRows] = await appDB.query(`SELECT id FROM knowledge_tags WHERE name = ?`, [tagName]);
            const tagId = tRows[0].id;

            // Link tag
            await appDB.query(`
                INSERT IGNORE INTO knowledge_article_tags (article_id, tag_id) VALUES (?, ?)
            `, [articleId, tagId]);
        }

        console.log("Example article seeded successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Error seeding example:", error);
        process.exit(1);
    }
};

seedExample();
