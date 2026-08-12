import appDB from '../db/subsyncDB.js';

async function run() {
  try {
    await appDB.query(`
      ALTER TABLE users 
      ADD COLUMN gender ENUM('male', 'female', 'other') DEFAULT 'other' AFTER email
    `);
    console.log('Successfully added gender column to users table');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column gender already exists in users table');
    } else {
      console.error('Error adding gender column:', err.message);
    }
  } finally {
    process.exit(0);
  }
}
run();
