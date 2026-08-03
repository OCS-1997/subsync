import api from '@/lib/axiosInstance';

export const goalService = {
    // Goals CRUD
    getGoals: async (params) => {
        const response = await api.get('/goals', { params });
        return response.data;
    },

    getGoalById: async (id) => {
        const response = await api.get(`/goals/${id}`);
        return response.data;
    },

    createGoal: async (data) => {
        const response = await api.post('/goals', data);
        return response.data;
    },

    updateGoal: async (id, data) => {
        const response = await api.put(`/goals/${id}`, data);
        return response.data;
    },

    patchProgress: async (id, progress) => {
        const response = await api.patch(`/goals/${id}/progress`, { progress });
        return response.data;
    },

    patchStatus: async (id, status_id) => {
        const response = await api.patch(`/goals/${id}/status`, { status_id });
        return response.data;
    },

    deleteGoal: async (id) => {
        const response = await api.delete(`/goals/${id}`);
        return response.data;
    },

    getDashboardStats: async (params) => {
        const response = await api.get('/goals/dashboard-stats', { params });
        return response.data;
    },

    getActivityLogs: async (id) => {
        const response = await api.get(`/goals/${id}/activity`);
        return response.data;
    },

    uploadAttachment: async (id, formData) => {
        const response = await api.post(`/goals/${id}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteAttachment: async (id, attachmentId) => {
        const response = await api.delete(`/goals/${id}/attachments/${attachmentId}`);
        return response.data;
    },

    addComment: async (id, comment) => {
        const response = await api.post(`/goals/${id}/comments`, { comment });
        return response.data;
    },

    exportGoals: async (params) => {
        const response = await api.get('/goals/export', {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    // Masters
    getCategories: async (includeInactive = true) => {
        const response = await api.get('/goal-categories', { params: { includeInactive } });
        return response.data;
    },
    createCategory: async (data) => {
        const response = await api.post('/goal-categories', data);
        return response.data;
    },
    updateCategory: async (id, data) => {
        const response = await api.put(`/goal-categories/${id}`, data);
        return response.data;
    },
    deleteCategory: async (id) => {
        const response = await api.delete(`/goal-categories/${id}`);
        return response.data;
    },

    getBusinessImpacts: async (includeInactive = true) => {
        const response = await api.get('/business-impacts', { params: { includeInactive } });
        return response.data;
    },
    createBusinessImpact: async (data) => {
        const response = await api.post('/business-impacts', data);
        return response.data;
    },
    updateBusinessImpact: async (id, data) => {
        const response = await api.put(`/business-impacts/${id}`, data);
        return response.data;
    },
    deleteBusinessImpact: async (id) => {
        const response = await api.delete(`/business-impacts/${id}`);
        return response.data;
    },

    getStatuses: async (includeInactive = true) => {
        const response = await api.get('/goal-statuses', { params: { includeInactive } });
        return response.data;
    },
    createStatus: async (data) => {
        const response = await api.post('/goal-statuses', data);
        return response.data;
    },
    updateStatus: async (id, data) => {
        const response = await api.put(`/goal-statuses/${id}`, data);
        return response.data;
    },
    deleteStatus: async (id) => {
        const response = await api.delete(`/goal-statuses/${id}`);
        return response.data;
    }
};
