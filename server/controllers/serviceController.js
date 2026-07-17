// serviceController.js
import { createService, getAllServices, getServiceById, updateService, deleteService } from '../models/serviceModel.js';
import { logActivity } from '../models/activityLogModel.js';
import { publishHelpdeskEvent } from '../services/webhookService.js';
// generateID is not needed here as service_id is AUTO_INCREMENT

// CREATE Service
const createServiceController = async (req, res) => {
  try {
    // console.log(req.body);
    const serviceData = {
      ...req.body,
      SKU: req.body.SKU,
      sales_information: req.body.sales_information,
      purchase_information: req.body.purchase_information,
      preferred_vendor: req.body.purchase_information.vendor,
      service_credit: req.body.service_credit,
    };

    if (!serviceData.service_name || !serviceData.SKU || !serviceData.item_group ||
        !serviceData.sales_information || !serviceData.purchase_information || !serviceData.preferred_vendor ||
        !serviceData.default_tax_rates) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const result = await createService(serviceData);
    if (req.user && req.user.username) {
      await logActivity({ username: req.user.username, action: 'CREATE_SERVICE', resourceType: 'Service', resourceId: result.insertId, ipAddress: req.ip, details: serviceData });
    }
    const responseJson = { message: "Service created successfully", service_id: result.insertId };
    res.status(201).json(responseJson);

    // Publish service.created event AFTER response (non-blocking, post-commit)
    // Note: service definitions don't belong to a specific customer — broadcast with a sentinel crmCustomerId
    publishHelpdeskEvent('service', 'service.created', 'GLOBAL', String(result.insertId), {
      crmServiceId: String(result.insertId),
      name: serviceData.service_name,
      SKU: serviceData.SKU,
      serviceCredit: serviceData.service_credit || 0,
      status: 'ACTIVE',
    });

    return;
  } catch (error) {
    console.error("Error creating service:", error);
    if (error.code === 'SKU_EXISTS') {
      return res.status(409).json({ error: error.message });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "A service with this name already exists." });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// READ All Services
const getAllServicesController = async (req, res) => {
  try {
    const { search = "", sort = "service_name", order = "asc", page = 1, limit = 10 } = req.query;
    const result = await getAllServices({ search, sort, order, page: parseInt(page), limit: parseInt(limit) });
    return res.status(200).json(result); // { services, totalPages, totalRecords }
  } catch (error) {
    console.error("Error fetching services:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// READ Service by ID
const getServiceByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await getServiceById(id);

    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    return res.status(200).json({ service });
  } catch (error) {
    console.error("Error fetching service:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// UPDATE Service
const updateServiceController = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getServiceById(id);

    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    const updatedData = {
      ...req.body,
      SKU: req.body.SKU,
      sales_information: req.body.sales_information,
      purchase_information: req.body.purchase_information,
      preferred_vendor: req.body.purchase_information.vendor,
      service_credit: req.body.service_credit,
    };

    if (!updatedData.service_name || !updatedData.SKU || !updatedData.item_group ||
        !updatedData.sales_information || !updatedData.purchase_information || !updatedData.preferred_vendor ||
        !updatedData.default_tax_rates) {
      return res.status(400).json({ error: "Missing required fields for update." });
    }

    const result = await updateService(id, updatedData);
    if (req.user && req.user.username) {
      await logActivity({ username: req.user.username, action: 'UPDATE_SERVICE', resourceType: 'Service', resourceId: id, ipAddress: req.ip, details: updatedData });
    }

    if (result.affectedRows === 0) {
      return res.status(200).json({ message: "Service found, but no changes applied (data might be the same)." });
    }

    res.status(200).json({ message: "Service updated successfully" });

    // Publish service.updated event AFTER response (non-blocking, post-commit)
    publishHelpdeskEvent('service', 'service.updated', 'GLOBAL', String(id), {
      crmServiceId: String(id),
      name: updatedData.service_name,
      SKU: updatedData.SKU,
      serviceCredit: updatedData.service_credit || 0,
      status: 'ACTIVE',
    });

    return;
  } catch (error) {
    console.error("Error updating service:", error);
    if (error.code === 'SKU_EXISTS') {
      return res.status(409).json({ error: error.message });
    }
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "A service with this name already exists." });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// DELETE Service
const deleteServiceController = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getServiceById(id);

    if (!existing) {
      return res.status(404).json({ error: "Service not found" });
    }

    const result = await deleteService(id);
    if (req.user && req.user.username) {
      await logActivity({ username: req.user.username, action: 'DELETE_SERVICE', resourceType: 'Service', ipAddress: req.ip, resourceId: id });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Service not found or already deleted." });
    }

    res.status(200).json({ message: "Service deleted successfully" });

    // Publish service.deleted event AFTER response (non-blocking, post-commit)
    publishHelpdeskEvent('service', 'service.deleted', 'GLOBAL', String(id), {
      crmServiceId: String(id),
      name: existing.service_name,
    });

    return;
  } catch (error) {
    console.error("Error deleting service:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export {
  createServiceController,
  getAllServicesController,
  getServiceByIdController,
  updateServiceController,
  deleteServiceController
};
