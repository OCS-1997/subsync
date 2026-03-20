import appDB from "../db/subsyncDB.js";
import { normalizePhone } from "../models/callLogModel.js";
import { upsertDirectoryEntries, cleanupOrphanedEntries } from "../models/directoryModel.js";

/**
 * Main function to sync the directory from all source tables
 */
export async function syncDirectory() {
    console.log("Starting full phone directory sync...");
    const syncStartTime = new Date();
    let totalSynced = 0;

    try {
        // ---- 1. Sync Customers ----
        const [customers] = await appDB.query(
            "SELECT customer_id, display_name, company_name, primary_phone_number, secondary_phone_number, other_contacts, primary_email FROM customers WHERE customer_status = 'Active'"
        );
        const customerEntries = [];
        for (const c of customers) {
            // Primary
            if (c.primary_phone_number) {
                const norm = normalizePhone(c.primary_phone_number);
                if (norm) customerEntries.push(formatEntry('customer', c.customer_id, null, c.display_name, c.primary_phone_number, norm, c.company_name, c.primary_email));
            }
            // Secondary
            if (c.secondary_phone_number) {
                const norm = normalizePhone(c.secondary_phone_number);
                if (norm) customerEntries.push(formatEntry('customer', c.customer_id, null, c.display_name, c.secondary_phone_number, norm, c.company_name, c.primary_email));
            }
            // Other Contacts JSON
            if (c.other_contacts) {
                let others = [];
                try {
                    others = typeof c.other_contacts === 'string' ? JSON.parse(c.other_contacts) : (c.other_contacts || []);
                } catch (e) { others = []; }

                for (const oc of others) {
                    const ocPhone = oc.phone_number || oc.mobile || oc.phone || '';
                    const norm = normalizePhone(ocPhone);
                    if (norm) {
                        const ocName = `${oc.first_name || ''} ${oc.last_name || ''}`.trim() || oc.contact_name || c.display_name;
                        customerEntries.push(formatEntry('other_contact', `OC_${syncStartTime.getTime()}_${totalSynced++}`, c.customer_id, ocName, ocPhone, norm, c.company_name, oc.email, oc.designation));
                    }
                }
            }
        }
        if (customerEntries.length > 0) {
            await upsertDirectoryEntries(customerEntries);
            totalSynced += customerEntries.length;
        }

        // ---- 2. Sync Vendors ----
        const [vendors] = await appDB.query(
            "SELECT vendor_id, display_name, company_name, primary_phone_number, secondary_phone_number, other_contacts, primary_email FROM vendors WHERE vendor_status = 'Active'"
        );
        const vendorEntries = [];
        for (const v of vendors) {
            if (v.primary_phone_number) {
                const norm = normalizePhone(v.primary_phone_number);
                if (norm) vendorEntries.push(formatEntry('vendor', v.vendor_id, null, v.display_name, v.primary_phone_number, norm, v.company_name, v.primary_email));
            }
            if (v.secondary_phone_number) {
                const norm = normalizePhone(v.secondary_phone_number);
                if (norm) vendorEntries.push(formatEntry('vendor', v.vendor_id, null, v.display_name, v.secondary_phone_number, norm, v.company_name, v.primary_email));
            }
            if (v.other_contacts) {
                let others = [];
                try {
                    others = typeof v.other_contacts === 'string' ? JSON.parse(v.other_contacts) : (v.other_contacts || []);
                } catch (e) { others = []; }

                for (const oc of others) {
                    const ocPhone = oc.phone_number || oc.mobile || oc.phone || '';
                    const norm = normalizePhone(ocPhone);
                    if (norm) {
                        const ocName = `${oc.first_name || ''} ${oc.last_name || ''}`.trim() || oc.contact_name || v.display_name;
                        vendorEntries.push(formatEntry('other_contact', `OV_${syncStartTime.getTime()}_${totalSynced++}`, v.vendor_id, ocName, ocPhone, norm, v.company_name, oc.email));
                    }
                }
            }
        }
        if (vendorEntries.length > 0) {
            await upsertDirectoryEntries(vendorEntries);
            totalSynced += vendorEntries.length;
        }

        // ---- 3. Sync Personal Contacts ----
        const [pContacts] = await appDB.query(
            "SELECT contact_id, first_name, last_name, company_name, phone_number, email, designation FROM contacts"
        );
        const pContactEntries = pContacts.map(pc => {
            const norm = normalizePhone(pc.phone_number);
            if (!norm) return null;
            return formatEntry('contact', pc.contact_id, null, `${pc.first_name || ''} ${pc.last_name || ''}`.trim(), pc.phone_number, norm, pc.company_name, pc.email, pc.designation);
        }).filter(Boolean);
        if (pContactEntries.length > 0) {
            await upsertDirectoryEntries(pContactEntries);
            totalSynced += pContactEntries.length;
        }

        // ---- 4. Sync Users (Skipped: users table lacks phone_number column) ----
        /*
        const [users] = await appDB.query(
            "SELECT username, name, email, phone_number FROM users"
        );
        const userEntries = users.map(u => {
            const norm = normalizePhone(u.phone_number);
            if (!norm) return null;
            return formatEntry('user', u.username, null, u.name, u.phone_number, norm, 'Internal Team', u.email);
        }).filter(Boolean);
        if (userEntries.length > 0) {
            await upsertDirectoryEntries(userEntries);
            totalSynced += userEntries.length;
        }
        */

        // ---- 5. Cleanup ----
        // await cleanupOrphanedEntries(syncStartTime);

        console.log(`Sync completed. Total entries synced: ${totalSynced}`);
        return { success: true, count: totalSynced };
    } catch (error) {
        console.error("Sync directory service error:", error);
        throw error;
    }
}

function formatEntry(type, id, parentId, name, phone, norm, company, email, designation = null) {
    return {
        entity_type: type,
        entity_id: String(id),
        parent_entity_id: parentId ? String(parentId) : null,
        name: name || 'Unknown',
        phone_number: phone,
        normalized_number: norm,
        company_name: company || null,
        email: email || null,
        designation: designation || null
    };
}
