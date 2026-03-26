import axiosInstance from '@/lib/axiosInstance';

const leavesService = {
    // Leave Types
    getLeaveTypes: async () => {
        const response = await axiosInstance.get('/leaves/types');
        return response.data;
    },

    // Leave Requests
    applyLeave: async (data) => {
        const response = await axiosInstance.post('/leaves/apply', data);
        return response.data;
    },

    getMyLeaves: async (params) => {
        const response = await axiosInstance.get('/leaves/my', { params });
        return response.data;
    },

    getAllLeaves: async (params) => {
        const response = await axiosInstance.get('/leaves/all', { params });
        return response.data;
    },

    actionLeave: async (requestId, status, comments) => {
        const response = await axiosInstance.put(`/leaves/action/${requestId}`, { status, comments });
        return response.data;
    },

    getMyBalances: async (year) => {
        const response = await axiosInstance.get('/leaves/balances', { params: { year } });
        return response.data;
    },

    // Permissions
    applyPermission: async (data) => {
        const response = await axiosInstance.post('/permissions/apply', data);
        return response.data;
    },

    getMyPermissions: async (params) => {
        const response = await axiosInstance.get('/permissions/my', { params });
        return response.data;
    },

    getAllPermissions: async (params) => {
        const response = await axiosInstance.get('/permissions/all', { params });
        return response.data;
    },

    actionPermission: async (requestId, status, comments) => {
        const response = await axiosInstance.put(`/permissions/action/${requestId}`, { status, comments });
        return response.data;
    },

    // Holidays
    getHolidays: async (year) => {
        const response = await axiosInstance.get('/holidays', { params: { year } });
        return response.data;
    },
    // Admin: Leave Types
    createLeaveType: async (data) => {
        const response = await axiosInstance.post('/leaves/types', data);
        return response.data;
    },

    updateLeaveType: async (id, data) => {
        const response = await axiosInstance.put(`/leaves/types/${id}`, data);
        return response.data;
    },

    deleteLeaveType: async (id) => {
        const response = await axiosInstance.delete(`/leaves/types/${id}`);
        return response.data;
    },

    // Admin: Holidays
    createHoliday: async (data) => {
        const response = await axiosInstance.post('/holidays', data);
        return response.data;
    },

    updateHoliday: async (id, data) => {
        const response = await axiosInstance.put(`/holidays/${id}`, data);
        return response.data;
    },

    deleteHoliday: async (id) => {
        const response = await axiosInstance.delete(`/holidays/${id}`);
        return response.data;
    },

    getPendingCounts: async () => {
        const response = await axiosInstance.get('/leaves/stats/pending-counts');
        return response.data;
    }
};

export default leavesService;
