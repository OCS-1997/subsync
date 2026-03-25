import api from "@/lib/axiosInstance.js";

// ADMIN: Templates
export const fetchTemplates = async () => {
    const response = await api.get("/appraisals/templates");
    return response.data;
};

export const createTemplate = async (data) => {
    const response = await api.post("/appraisals/templates", data);
    return response.data;
};

export const updateTemplate = async (id, data) => {
    const response = await api.put(`/appraisals/templates/${id}`, data);
    return response.data;
};

export const deleteTemplate = async (id) => {
    const response = await api.delete(`/appraisals/templates/${id}`);
    return response.data;
};

// ADMIN: Periods
export const fetchPeriods = async (params = {}) => {
    const response = await api.get("/appraisals/periods", { params });
    return response.data;
};

export const createPeriod = async (data) => {
    const response = await api.post("/appraisals/periods", data);
    return response.data;
};

export const activatePeriod = async (id) => {
    const response = await api.put(`/appraisals/periods/${id}/activate`);
    return response.data;
};

export const closePeriod = async (id) => {
    const response = await api.put(`/appraisals/periods/${id}/close`);
    return response.data;
};

export const deletePeriod = async (id) => {
    const response = await api.delete(`/appraisals/periods/${id}`);
    return response.data;
};

// ADMIN: Review Team
export const fetchTeamSubmissions = async (periodId) => {
    const response = await api.get(`/appraisals/period/${periodId}/submissions`);
    return response.data;
};

export const reviewSubmission = async (id, data) => {
    const response = await api.put(`/appraisals/submissions/${id}/review`, data);
    return response.data;
};

export const deleteSubmission = async (id) => {
    const response = await api.delete(`/appraisals/submissions/${id}`);
    return response.data;
};

// USER: My Appraisals
export const fetchMyActiveAppraisal = async () => {
    const response = await api.get("/my/appraisal/active");
    return response.data;
};

export const saveMyAppraisal = async (data) => {
    const response = await api.post("/my/appraisal/save", data);
    return response.data;
};
