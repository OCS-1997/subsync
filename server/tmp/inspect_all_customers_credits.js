import appDB from '../db/subsyncDB.js';

async function inspect() {
  try {
    // 1. Get all customers
    const [customers] = await appDB.query("SELECT customer_id, display_name, company_name FROM customers");
    
    // 2. Get all services and their credit hours
    const [services] = await appDB.query("SELECT service_id, service_name, service_credit FROM services");
    const serviceCreditMap = {};
    services.forEach(s => {
      serviceCreditMap[s.service_name] = s.service_credit || 0;
    });

    console.log(`Processing ${customers.length} customers...\n`);

    for (const customer of customers) {
      // 3. Get all domains for the customer
      const [domains] = await appDB.query("SELECT domain_name FROM domains WHERE customer_id = ?", [customer.customer_id]);
      if (domains.length === 0) continue;

      const domainNames = domains.map(d => d.domain_name);

      // 4. Get all active/non-archived subscriptions for these domains
      // Let's also query subscriptions where customer_id matches to be safe
      const [subs] = await appDB.query(
        "SELECT sub_id, domain_name, status FROM subscriptions WHERE customer_id = ? AND archived_at IS NULL",
        [customer.customer_id]
      );
      if (subs.length === 0) continue;

      // 5. Retrieve services for each subscription
      const subDetails = [];
      let customerTotalCredits = 0;

      for (const sub of subs) {
        const [items] = await appDB.query(
          "SELECT service_name, quantity FROM subscription_items WHERE sub_id = ?",
          [sub.sub_id]
        );

        let subCredits = 0;
        const itemDetails = [];
        for (const item of items) {
          // Credits = service_credit * quantity
          const baseCredit = serviceCreditMap[item.service_name] || 0;
          const qty = parseFloat(item.quantity) || 0;
          const contribution = baseCredit * qty;
          subCredits += contribution;
          itemDetails.push({
            service_name: item.service_name,
            qty: qty,
            baseCredit: baseCredit,
            contribution: contribution
          });
        }

        customerTotalCredits += subCredits;
        subDetails.push({
          sub_id: sub.sub_id,
          domain_name: sub.domain_name,
          subTotalCredits: subCredits,
          items: itemDetails
        });
      }

      console.log(`=========================================`);
      console.log(`Customer: ${customer.display_name} (${customer.company_name})`);
      console.log(`ID: ${customer.customer_id}`);
      console.log(`Domains owned: ${domainNames.join(", ")}`);
      console.log(`-----------------------------------------`);
      for (const sd of subDetails) {
        console.log(`Domain: ${sd.domain_name} -> Subscription: ${sd.sub_id}`);
        for (const item of sd.items) {
          console.log(`  - Service: "${item.service_name}" = ${item.baseCredit} (qty ${item.qty}) -> ${item.contribution} credits`);
        }
        console.log(`  Subscription Total = ${sd.subTotalCredits} credits`);
        console.log(`---`);
      }
      console.log(`Total Customer Credits = ${customerTotalCredits} credits`);
      console.log(`=========================================\n`);
    }

  } catch (error) {
    console.error("Error inspecting database:", error);
  } finally {
    await appDB.end();
  }
}

inspect();
