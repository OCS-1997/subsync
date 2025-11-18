// src/models/serviceModel.js
import appDB from "../db/subsyncDB.js";

// Check if SKU already exists
const checkSkuExists = async (sku, excludeServiceId = null) => {
  let query = `SELECT service_id FROM services WHERE stock_keepers_unit = ?`;
  let params = [sku];
  
  if (excludeServiceId) {
    query += ` AND service_id != ?`;
    params.push(excludeServiceId);
  }
  
  const [rows] = await appDB.execute(query, params);
  return rows.length > 0;
};

// CREATE
const createService = async (service) => {
  // Check if SKU already exists
  const skuExists = await checkSkuExists(service.SKU);
  if (skuExists) {
    throw { code: 'SKU_EXISTS', message: 'A service with this SKU already exists.' };
  }

  const query = `
    INSERT INTO services (
      service_name, stock_keepers_unit,
      tax_preference, item_group,
      sales_info, purchase_info,
      preferred_vendor, default_tax_rates
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Optimize tax rates storage - store only IDs and kind
  const defaultTaxRates = {
    intra: {
      kind: service.default_tax_rates?.intra?.kind || null,
      id: service.default_tax_rates?.intra?.id || null
    },
    inter: {
      kind: service.default_tax_rates?.inter?.kind || null,
      id: service.default_tax_rates?.inter?.id || null
    }
  };

  const values = [
    service.service_name,
    service.SKU,
    service.tax_preference || 'Taxable',
    parseInt(service.item_group, 10), // Ensure item_group is stored as an integer ID
    JSON.stringify(service.sales_information),
    JSON.stringify(service.purchase_information),
    service.preferred_vendor, // Store vendor_id directly
    JSON.stringify(defaultTaxRates),
  ];

  const [result] = await appDB.execute(query, values);
  return result; // result.insertId will contain the newly generated service_id
}

// READ - All (MODIFIED TO JOIN TABLES FOR DISPLAY NAMES)
const getAllServices = async ({ search = "", sort = "updated_at", order = "desc", page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;
  const searchQuery = `%${search}%`;
  
  // Ensure sort is valid and not null/undefined
  const allowedSortColumns = [
    'service_id', 'service_name', 'stock_keepers_unit', 'tax_preference', 
    'item_group_name', 'preferred_vendor_name', 'selling_price', 'created_at', 'updated_at'
  ];
  
  const hasValidSort = sort && sort.trim() !== '' && allowedSortColumns.includes(sort);
  const validSort = hasValidSort ? sort : 'updated_at';
  let validOrder = 'DESC';
  if (hasValidSort && order && ['asc', 'desc'].includes(order.toLowerCase())) {
    validOrder = order.toUpperCase();
  }
  const query = `
    SELECT
        s.service_id,
        s.service_name,
        s.stock_keepers_unit,
        s.tax_preference,
        s.item_group AS item_group_id,
        ig.item_group_name,
        s.sales_info,
        s.purchase_info,
        s.preferred_vendor AS preferred_vendor_id,
        v.display_name AS preferred_vendor_name,
        v.company_name AS preferred_vendor_company,
        s.default_tax_rates,
        s.created_at,
        s.updated_at,
        CAST(JSON_UNQUOTE(JSON_EXTRACT(s.sales_info, '$.price')) AS DECIMAL(10,2)) AS selling_price
    FROM
        services s
    LEFT JOIN
        item_groups ig ON s.item_group = ig.item_group_id
    LEFT JOIN
        vendors v ON s.preferred_vendor = v.vendor_id
    WHERE (
      s.service_name LIKE ? OR
      s.stock_keepers_unit LIKE ? OR
      ig.item_group_name LIKE ? OR
      v.display_name LIKE ?
    )
    ORDER BY ?? ${validOrder}
    LIMIT ? OFFSET ?;
  `;
  const [rows] = await appDB.query(query, [searchQuery, searchQuery, searchQuery, searchQuery, validSort, parseInt(limit), parseInt(offset)]);
  const [[{ total }]] = await appDB.query(
    `SELECT COUNT(*) as total FROM services s
      LEFT JOIN item_groups ig ON s.item_group = ig.item_group_id
      LEFT JOIN vendors v ON s.preferred_vendor = v.vendor_id
      WHERE (
        s.service_name LIKE ? OR
        s.stock_keepers_unit LIKE ? OR
        ig.item_group_name LIKE ? OR
        v.display_name LIKE ?
      )`,
    [searchQuery, searchQuery, searchQuery, searchQuery]
  );

  // Enhance services with tax information
  const servicesWithTax = await Promise.all(rows.map(async (service) => {
    // Parse the default_tax_rates from JSON
    let taxRates = {};
    try {
      // Check if it's already an object or needs parsing
      if (typeof service.default_tax_rates === 'string') {
        taxRates = JSON.parse(service.default_tax_rates || '{}');
      } else if (service.default_tax_rates && typeof service.default_tax_rates === 'object') {
        taxRates = service.default_tax_rates;
      } else {
        taxRates = {};
      }
    } catch (error) {
      console.error('Error parsing default_tax_rates:', error);
      taxRates = {};
    }

    // Fetch tax information for intra and inter state rates
    const taxDetails = {};
    
    if (taxRates.intra?.id && taxRates.intra?.kind) {
      try {
        if (taxRates.intra.kind === 'tax') {
          // Fetch individual tax rate
          const [intraTaxRows] = await appDB.execute(
            `SELECT * FROM tax_rates WHERE tax_id = ?`,
            [taxRates.intra.id]
          );
          if (intraTaxRows.length > 0) {
            taxDetails.intra = intraTaxRows[0];
          }
        } else if (taxRates.intra.kind === 'group') {
          // Fetch tax group and calculate total rate from members
          const [groupRows] = await appDB.execute(
            `SELECT tg.*, COALESCE(SUM(tr.tax_rate), 0) as total_rate
             FROM tax_groups tg
             LEFT JOIN tax_group_members tgm ON tg.group_id = tgm.group_id
             LEFT JOIN tax_rates tr ON tgm.tax_id = tr.tax_id
             WHERE tg.group_id = ?
             GROUP BY tg.group_id`,
            [taxRates.intra.id]
          );
          
          // Also fetch individual members for detailed display
          const [memberRows] = await appDB.execute(
            `SELECT tr.tax_name, tr.tax_rate, tr.tax_type
             FROM tax_group_members tgm
             JOIN tax_rates tr ON tgm.tax_id = tr.tax_id
             WHERE tgm.group_id = ?
             ORDER BY tr.tax_name`,
            [taxRates.intra.id]
          );
          
          if (groupRows.length > 0) {
            const group = groupRows[0];
            taxDetails.intra = {
              group_id: group.group_id,
              group_name: group.group_name,
              tax_name: group.group_name,
              tax_rate: group.total_rate,
              description: group.description,
              kind: 'group',
              members: memberRows || []
            };
          }
        }
      } catch (error) {
        console.error(`Error fetching intra tax info for ${taxRates.intra.kind} with id ${taxRates.intra.id}:`, error);
      }
    }

    if (taxRates.inter?.id && taxRates.inter?.kind) {
      try {
        if (taxRates.inter.kind === 'tax') {
          // Fetch individual tax rate
          const [interTaxRows] = await appDB.execute(
            `SELECT * FROM tax_rates WHERE tax_id = ?`,
            [taxRates.inter.id]
          );
          if (interTaxRows.length > 0) {
            taxDetails.inter = interTaxRows[0];
          }
        } else if (taxRates.inter.kind === 'group') {
          // Fetch tax group and calculate total rate from members
          const [groupRows] = await appDB.execute(
            `SELECT tg.*, COALESCE(SUM(tr.tax_rate), 0) as total_rate
             FROM tax_groups tg
             LEFT JOIN tax_group_members tgm ON tg.group_id = tgm.group_id
             LEFT JOIN tax_rates tr ON tgm.tax_id = tr.tax_id
             WHERE tg.group_id = ?
             GROUP BY tg.group_id`,
            [taxRates.inter.id]
          );
          
          // Also fetch individual members for detailed display
          const [memberRows] = await appDB.execute(
            `SELECT tr.tax_name, tr.tax_rate, tr.tax_type
             FROM tax_group_members tgm
             JOIN tax_rates tr ON tgm.tax_id = tr.tax_id
             WHERE tgm.group_id = ?
             ORDER BY tr.tax_name`,
            [taxRates.inter.id]
          );
          
          if (groupRows.length > 0) {
            const group = groupRows[0];
            taxDetails.inter = {
              group_id: group.group_id,
              group_name: group.group_name,
              tax_name: group.group_name,
              tax_rate: group.total_rate,
              description: group.description,
              kind: 'group',
              members: memberRows || []
            };
          }
        }
      } catch (error) {
        console.error(`Error fetching inter tax info for ${taxRates.inter.kind} with id ${taxRates.inter.id}:`, error);
      }
    }

    return {
      ...service,
      sales_info: typeof service.sales_info === 'string' ? JSON.parse(service.sales_info || '{}') : (service.sales_info || {}),
      purchase_info: typeof service.purchase_info === 'string' ? JSON.parse(service.purchase_info || '{}') : (service.purchase_info || {}),
      default_tax_rates: taxRates,
      tax_details: taxDetails
    };
  }));

  const totalPages = Math.ceil(total / limit);
  return { services: servicesWithTax, totalPages, totalRecords: total };
}

// READ - One
const getServiceById = async (service_id) => {
  const query = `
    SELECT
        s.service_id,
        s.service_name,
        s.stock_keepers_unit,
        s.tax_preference,
        s.item_group AS item_group_id,
        ig.item_group_name,
        s.sales_info,
        s.purchase_info,
        s.preferred_vendor,
        v.display_name AS preferred_vendor_name,
        v.company_name AS preferred_vendor_company,
        s.default_tax_rates,
        s.created_at,
        s.updated_at
    FROM
        services s
    LEFT JOIN
        item_groups ig ON s.item_group = ig.item_group_id
    LEFT JOIN
        vendors v ON s.preferred_vendor = v.vendor_id
    WHERE s.service_id = ?`;
  const [rows] = await appDB.execute(query, [service_id]);
  
  if (rows.length === 0) {
    return null;
  }

  const service = rows[0];
  
  // Parse the default_tax_rates from JSON
  let taxRates = {};
  try {
    // Check if it's already an object or needs parsing
    if (typeof service.default_tax_rates === 'string') {
      taxRates = JSON.parse(service.default_tax_rates || '{}');
    } else if (service.default_tax_rates && typeof service.default_tax_rates === 'object') {
      taxRates = service.default_tax_rates;
    } else {
      taxRates = {};
    }
  } catch (error) {
    console.error('Error parsing default_tax_rates:', error);
    taxRates = {};
  }

  // Fetch tax information for intra and inter state rates
  const taxDetails = {};
  
  if (taxRates.intra?.id && taxRates.intra?.kind) {
    try {
      if (taxRates.intra.kind === 'tax') {
        // Fetch individual tax rate
        const [intraTaxRows] = await appDB.execute(
          `SELECT * FROM tax_rates WHERE tax_id = ?`,
          [taxRates.intra.id]
        );
        if (intraTaxRows.length > 0) {
          taxDetails.intra = intraTaxRows[0];
        }
      } else if (taxRates.intra.kind === 'group') {
        // Fetch tax group and calculate total rate from members
        const [groupRows] = await appDB.execute(
          `SELECT tg.*, COALESCE(SUM(tr.tax_rate), 0) as total_rate
           FROM tax_groups tg
           LEFT JOIN tax_group_members tgm ON tg.group_id = tgm.group_id
           LEFT JOIN tax_rates tr ON tgm.tax_id = tr.tax_id
           WHERE tg.group_id = ?
           GROUP BY tg.group_id`,
          [taxRates.intra.id]
        );
        
        // Also fetch individual members for detailed display
        const [memberRows] = await appDB.execute(
          `SELECT tr.tax_name, tr.tax_rate, tr.tax_type
           FROM tax_group_members tgm
           JOIN tax_rates tr ON tgm.tax_id = tr.tax_id
           WHERE tgm.group_id = ?
           ORDER BY tr.tax_name`,
          [taxRates.intra.id]
        );
        
        if (groupRows.length > 0) {
          const group = groupRows[0];
          taxDetails.intra = {
            group_id: group.group_id,
            group_name: group.group_name,
            tax_name: group.group_name,
            tax_rate: group.total_rate,
            description: group.description,
            kind: 'group',
            members: memberRows || []
          };
        }
      }
    } catch (error) {
      console.error(`Error fetching intra tax info for ${taxRates.intra.kind} with id ${taxRates.intra.id}:`, error);
    }
  }

  if (taxRates.inter?.id && taxRates.inter?.kind) {
    try {
      if (taxRates.inter.kind === 'tax') {
        // Fetch individual tax rate
        const [interTaxRows] = await appDB.execute(
          `SELECT * FROM tax_rates WHERE tax_id = ?`,
          [taxRates.inter.id]
        );
        if (interTaxRows.length > 0) {
          taxDetails.inter = interTaxRows[0];
        }
      } else if (taxRates.inter.kind === 'group') {
        // Fetch tax group and calculate total rate from members
        const [groupRows] = await appDB.execute(
          `SELECT tg.*, COALESCE(SUM(tr.tax_rate), 0) as total_rate
           FROM tax_groups tg
           LEFT JOIN tax_group_members tgm ON tg.group_id = tgm.group_id
           LEFT JOIN tax_rates tr ON tgm.tax_id = tr.tax_id
           WHERE tg.group_id = ?
           GROUP BY tg.group_id`,
          [taxRates.inter.id]
        );
        
        // Also fetch individual members for detailed display
        const [memberRows] = await appDB.execute(
          `SELECT tr.tax_name, tr.tax_rate, tr.tax_type
           FROM tax_group_members tgm
           JOIN tax_rates tr ON tgm.tax_id = tr.tax_id
           WHERE tgm.group_id = ?
           ORDER BY tr.tax_name`,
          [taxRates.inter.id]
        );
        
        if (groupRows.length > 0) {
          const group = groupRows[0];
          taxDetails.inter = {
            group_id: group.group_id,
            group_name: group.group_name,
            tax_name: group.group_name,
            tax_rate: group.total_rate,
            description: group.description,
            kind: 'group',
            members: memberRows || []
          };
        }
      }
    } catch (error) {
      console.error(`Error fetching inter tax info for ${taxRates.inter.kind} with id ${taxRates.inter.id}:`, error);
    }
  }

  return {
    ...service,
    sales_info: typeof service.sales_info === 'string' ? JSON.parse(service.sales_info || '{}') : (service.sales_info || {}),
    purchase_info: typeof service.purchase_info === 'string' ? JSON.parse(service.purchase_info || '{}') : (service.purchase_info || {}),
    default_tax_rates: taxRates,
    tax_details: taxDetails
  };
}

// UPDATE
const updateService = async (service_id, updatedData) => {
  // Check if SKU already exists (excluding current service)
  const skuExists = await checkSkuExists(updatedData.SKU, service_id);
  if (skuExists) {
    throw { code: 'SKU_EXISTS', message: 'A service with this SKU already exists.' };
  }

  const query = `
    UPDATE services SET
                      service_name = ?,
                      stock_keepers_unit = ?,
                      tax_preference = ?,
                      item_group = ?,
                      sales_info = ?,
                      purchase_info = ?,
                      preferred_vendor = ?,
                      default_tax_rates = ?,
                      updated_at = CURRENT_TIMESTAMP
    WHERE service_id = ?
  `;

  // Optimize tax rates storage for updates - store only IDs and kind
  const defaultTaxRates = {
    intra: {
      kind: updatedData.default_tax_rates?.intra?.kind || null,
      id: updatedData.default_tax_rates?.intra?.id || null
    },
    inter: {
      kind: updatedData.default_tax_rates?.inter?.kind || null,
      id: updatedData.default_tax_rates?.inter?.id || null
    }
  };

  const values = [
    updatedData.service_name,
    updatedData.SKU,
    updatedData.tax_preference,
    parseInt(updatedData.item_group, 10), // Convert to integer
    JSON.stringify(updatedData.sales_information),
    JSON.stringify(updatedData.purchase_information),
    updatedData.preferred_vendor, // Store vendor_id directly
    JSON.stringify(defaultTaxRates),
    service_id,
  ];

  const [result] = await appDB.execute(query, values);
  return result;
}

// DELETE
const deleteService = async (service_id) => {
  const query = `DELETE FROM services WHERE service_id = ?`;
  const [result] = await appDB.execute(query, [service_id]);
  return result;
}

export {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
  checkSkuExists
};
