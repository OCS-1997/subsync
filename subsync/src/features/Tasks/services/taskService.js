import api from '@/lib/axiosInstance';
import { getStorageItem } from '@/utils/storage';
import saveAs from 'file-saver';

export const taskService = {
  // Get tasks list
  getTasks: async (params = {}) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  // Get task statistics for KPI cards
  getTaskStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
  },

  // Get task analytics & high level insights
  getTaskAnalytics: async (params = {}) => {
    const response = await api.get('/tasks/analytics', { params });
    return response.data;
  },

  // Get manageable users for assignment dropdowns
  getManageableUsers: async () => {
    const response = await api.get('/tasks/manageable-users');
    return response.data;
  },

  // Get single task detail
  getTaskById: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create new task
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },

  // Update task details
  updateTask: async (id, taskData) => {
    const response = await api.patch(`/tasks/${id}`, taskData);
    return response.data;
  },

  // Change status
  changeStatus: async (id, status) => {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data;
  },

  // Reassign task
  reassignTask: async (id, assignedTo) => {
    const response = await api.patch(`/tasks/${id}/assignee`, { assignedTo });
    return response.data;
  },

  // Delete task
  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Checklist items
  addChecklistItem: async (taskId, title) => {
    const response = await api.post(`/tasks/${taskId}/checklist`, { title });
    return response.data;
  },

  updateChecklistItem: async (taskId, itemId, updates) => {
    const response = await api.patch(`/tasks/${taskId}/checklist/${itemId}`, updates);
    return response.data;
  },

  deleteChecklistItem: async (taskId, itemId) => {
    const response = await api.delete(`/tasks/${taskId}/checklist/${itemId}`);
    return response.data;
  },

  // Comments
  addComment: async (taskId, content) => {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  },

  // Attachments
  uploadAttachment: async (taskId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Download attachment via authenticated Axios request or authenticated URL
  downloadAttachmentFile: async (taskId, attachmentId, fileName) => {
    try {
      const response = await api.get(`/tasks/${taskId}/attachments/${attachmentId}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      saveAs(blob, fileName || 'attachment');
    } catch (err) {
      console.error('Blob download failed, trying direct link:', err);
      const token = getStorageItem('subsync_token') || '';
      const baseURL = import.meta.env.VITE_API_URL || 'https://ocs365.in/api';
      window.open(`${baseURL}/tasks/${taskId}/attachments/${attachmentId}/download?token=${encodeURIComponent(token)}`, '_blank');
    }
  },

  getAttachmentDownloadUrl: (taskId, attachmentId) => {
    const token = getStorageItem('subsync_token') || '';
    const baseURL = import.meta.env.VITE_API_URL || 'https://ocs365.in/api';
    return `${baseURL}/tasks/${taskId}/attachments/${attachmentId}/download?token=${encodeURIComponent(token)}`;
  },

  deleteAttachment: async (taskId, attachmentId) => {
    const response = await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    return response.data;
  },
};
