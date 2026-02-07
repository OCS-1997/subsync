const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

(async () => {
  // Connect DB
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  // Ensure history table exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS migration_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Only look inside migrations_new
  const dir = path.join(__dirname, "migrations_new");

  if (!fs.existsSync(dir)) {
    console.log("No migrations_new folder found. Skipping.");
    process.exit();
  }

  const files = fs.readdirSync(dir).sort();

  if (files.length === 0) {
    console.log("No new migrations. Skipping.");
    process.exit();
  }

  for (const file of files) {
    // Check if already applied
    const [rows] = await db.execute(
      "SELECT 1 FROM migration_history WHERE filename=?",
      [file]
    );

    if (rows.length > 0) {
      console.log("Skipping already applied:", file);
      continue;
    }

    console.log("Running migration:", file);

    // Run SQL
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    await db.query(sql);

    // Mark applied
    await db.execute(
      "INSERT INTO migration_history (filename) VALUES (?)",
      [file]
    );

    console.log("Applied:", file);
  }

  console.log("All new migrations complete.");
  process.exit();
})();
