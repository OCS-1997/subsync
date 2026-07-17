import appDB from '../db/subsyncDB.js';

async function generateReport(targetInput) {
  try {
    let customerId = targetInput;
    let customerName = "";

    // 1. Resolve customer
    if (!customerId) {
      // Find OCS customer by default
      const [rows] = await appDB.query(
        "SELECT customer_id, display_name FROM customers WHERE display_name = 'OCS' OR company_name LIKE '%Online Consultancy%' LIMIT 1"
      );
      if (rows.length > 0) {
        customerId = rows[0].customer_id;
        customerName = rows[0].display_name;
      } else {
        console.error("Default customer 'OCS' not found. Please provide a customer ID.");
        process.exit(1);
      }
    } else {
      const [rows] = await appDB.query(
        "SELECT display_name FROM customers WHERE customer_id = ? LIMIT 1",
        [customerId]
      );
      if (rows.length > 0) {
        customerName = rows[0].display_name;
      } else {
        // Search by name
        const [rowsByName] = await appDB.query(
          "SELECT customer_id, display_name FROM customers WHERE display_name LIKE ? OR company_name LIKE ? LIMIT 1",
          [`%${targetInput}%`, `%${targetInput}%`]
        );
        if (rowsByName.length > 0) {
          customerId = rowsByName[0].customer_id;
          customerName = rowsByName[0].display_name;
        } else {
          console.error(`Customer matching '${targetInput}' not found in the database.`);
          process.exit(1);
        }
      }
    }

    console.log(`========================================================================`);
    console.log(`CUSTOMER CREDIT REPORT`);
    console.log(`Customer Name : ${customerName}`);
    console.log(`Customer ID   : ${customerId}`);
    console.log(`========================================================================`);

    // 2. Retrieve all domains owned by the customer
    const [domains] = await appDB.query(
      "SELECT domain_name FROM domains WHERE customer_id = ? ORDER BY domain_name",
      [customerId]
    );

    // 3. Retrieve all subscriptions for the customer
    const [subs] = await appDB.query(
      "SELECT sub_id, domain_name, status FROM subscriptions WHERE customer_id = ? AND archived_at IS NULL",
      [customerId]
    );

    // Create mapping of domains to subscriptions
    const domainToSubs = {};
    domains.forEach(d => {
      domainToSubs[d.domain_name] = [];
    });

    subs.forEach(s => {
      // Map to domain if it is in customer domains, otherwise initialize it
      const dName = s.domain_name;
      if (dName) {
        if (!domainToSubs[dName]) {
          domainToSubs[dName] = [];
        }
        domainToSubs[dName].push(s.sub_id);
      }
    });

    console.log(`\n--- Domain to Subscription Mapping ---`);
    if (Object.keys(domainToSubs).length === 0) {
      console.log("No domains registered for this customer.");
    } else {
      for (const [domain, mappedSubs] of Object.entries(domainToSubs)) {
        const subStr = mappedSubs.length > 0 ? mappedSubs.join(", ") : "No Subscription";
        console.log(`  ${domain} → ${subStr}`);
      }
    }

    // 4. Retrieve services and credit hours for each subscription
    const [services] = await appDB.query("SELECT service_id, service_name, service_credit FROM services");
    const serviceCreditMap = {};
    services.forEach(s => {
      serviceCreditMap[s.service_name] = s.service_credit || 0;
    });

    let totalCustomerCredits = 0;

    console.log(`\n--- Subscription Credit Breakdown ---`);
    if (subs.length === 0) {
      console.log("No active subscriptions found for this customer.");
    } else {
      for (const sub of subs) {
        console.log(`  * Subscription ID: ${sub.sub_id} (Domain: ${sub.domain_name || 'N/A'})`);
        
        const [items] = await appDB.query(
          "SELECT service_name, quantity FROM subscription_items WHERE sub_id = ?",
          [sub.sub_id]
        );

        let subTotalCredits = 0;
        for (const item of items) {
          const baseCredit = serviceCreditMap[item.service_name] || 0;
          const qty = parseFloat(item.quantity) || 0;
          const contribution = baseCredit * qty;
          subTotalCredits += contribution;
          console.log(`    - Service: "${item.service_name}" | Base Credit: ${baseCredit} | Qty: ${qty} → Contribution: ${contribution} credit hours`);
        }
        totalCustomerCredits += subTotalCredits;
        console.log(`    Subscription Total = ${subTotalCredits} credit hours\n`);
      }
    }

    console.log(`========================================================================`);
    console.log(`Total Customer Credits = ${totalCustomerCredits} credit hours`);
    console.log(`========================================================================`);

  } catch (error) {
    console.error("Error generating report:", error);
  } finally {
    await appDB.end();
  }
}

// Get customer search query from CLI arguments
const args = process.argv.slice(2);
const searchInput = args[0];

generateReport(searchInput);
