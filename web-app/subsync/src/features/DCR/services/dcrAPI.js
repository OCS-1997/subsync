import api from "@/lib/axiosInstance.js";

export const fetchDcrEntries = async (params = {}) => {
  const response = await api.get("/dcr", { params });
  return response.data;
};

export const fetchDcrById = async (id) => {
  const response = await api.get(`/dcr/${id}`);
  return response.data;
};

export const createDcrEntry = async (data) => {
  const response = await api.post("/dcr", data);
  return response.data;
};

export const updateDcrEntry = async (id, data) => {
  const response = await api.put(`/dcr/${id}`, data);
  return response.data;
};

export const deleteDcrEntry = async (id) => {
  const response = await api.delete(`/dcr/${id}`);
  return response.data;
};

export const getWeekMeta = async (date) => {
  const response = await api.get("/dcr/week-meta", { params: { date } });
  return response.data;
};

export const getDomainDetails = async (domainId) => {
  const response = await api.get(`/domains/${domainId}/details`);
  return response.data;
};

export const createContactFromDcr = async (data) => {
  const response = await api.post("/contacts/from-dcr", data);
  return response.data;
};

export const fetchAllDomains = async () => {
  const response = await api.get("/all-domains", { params: { limit: 1000 } });
  return response.data;
};

export const fetchAllUsers = async () => {
  const response = await api.get("/users");
  return response.data;
};


