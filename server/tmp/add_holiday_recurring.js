import appDB from "../db/subsyncDB.js";

async function run() {
    try {
        await appDB.query(`ALTER TABLE holidays ADD COLUMN is_recurring TINYINT(1) DEFAULT 0 AFTER is_optional`);
        console.log("Added is_recurring column");
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log("Column is_recurring already exists");
        } else {
            console.error("Error adding column:", e.message);
        }
    }

    await appDB.query(`
        UPDATE holidays 
        SET is_recurring = 1 
        WHERE name LIKE '%New Year%' 
           OR name LIKE '%Republic%' 
           OR name LIKE '%Independence%' 
           OR name LIKE '%Gandhi%' 
           OR name LIKE '%Christmas%'
    `);
    console.log("Updated standard fixed holidays to recurring");

    const [rows] = await appDB.query("SELECT id, name, holiday_date, is_optional, is_recurring FROM holidays");
    console.log("Holidays:", rows);
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
