import dotenv from 'dotenv';
dotenv.config();

import appDB from './db/subsyncDB.js';

async function seed() {
  console.log("Seeding service credit hours in CRM MySQL...");
  
  // Set default values for tests based on business rules
  await appDB.query("UPDATE services SET service_credit = 10 WHERE service_name LIKE '%Google Workspace%'");
  await appDB.query("UPDATE services SET service_credit = 2 WHERE service_name LIKE '%SSL%'");
  await appDB.query("UPDATE services SET service_credit = 5 WHERE service_name LIKE '%Hosting%' OR service_name LIKE '%SDH%'");
  await appDB.query("UPDATE services SET service_credit = 20 WHERE service_name LIKE '%AMC%'");

  // Also query them to verify
  const [rows] = await appDB.query("SELECT service_id, service_name, service_credit FROM services WHERE service_credit IS NOT NULL");
  console.log("Services seeded successfully:", rows);
  
  await appDB.end();
}

seed().catch(console.error);
