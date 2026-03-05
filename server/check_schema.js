
import appDB from './db/subsyncDB.js';

async function check() {
    const [cols] = await appDB.query('SHOW COLUMNS FROM dcr_entries');
    console.log(cols.map(c => c.Field));
    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
