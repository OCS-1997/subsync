import axiosInstance from '@/lib/axiosInstance.js';

const opportunityService = {
    // Opportunities
    getAllOpportunities: async (params) => {
        const response = await axiosInstance.get('/opportunities', { params });
        return response.data;
    },

    getOpportunityById: async (id) => {
        const response = await axiosInstance.get(`/opportunities/${id}`);
        return response.data;
    },

    createOpportunity: async (opportunityData) => {
        const response = await axiosInstance.post('/opportunities', opportunityData);
        return response.data;
    },

    updateOpportunity: async (id, opportunityData) => {
        const response = await axiosInstance.put(`/opportunities/${id}`, opportunityData);
        return response.data;
    },

    deleteOpportunity: async (id) => {
        const response = await axiosInstance.delete(`/opportunities/${id}`);
        return response.data;
    },

    // Statuses
    getStatuses: async () => {
        const response = await axiosInstance.get('/opportunities/statuses');
        return response.data;
    },

    createStatus: async (statusData) => {
        const response = await axiosInstance.post('/opportunities/statuses', statusData);
        return response.data;
    },

    updateStatus: async (id, statusData) => {
        const response = await axiosInstance.put(`/opportunities/statuses/${id}`, statusData);
        return response.data;
    },

    deleteStatus: async (id) => {
        const response = await axiosInstance.delete(`/opportunities/statuses/${id}`);
        return response.data;
    }
};

export default opportunityService;
