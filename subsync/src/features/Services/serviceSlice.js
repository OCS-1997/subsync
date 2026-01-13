import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';

import api from '@/lib/axiosInstance.js';

export const addService = createAsyncThunk("services/addService", async (data, thunkAPI) => {
    try {
        const res = await api.post("/create-service", data);
        return res.data;
    } catch (err) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to add service.';
        toast.error(errorMessage);
        return thunkAPI.rejectWithValue(errorMessage);
    }
});

export const fetchServices = createAsyncThunk(
    "services/fetchServices",
    async (params = {}, thunkAPI) => {
        try {
            const { search = "", sort, order, page = 1, limit = 10 } = params;
            const hasCustomSort = typeof sort === "string" && sort.trim() !== "";
            const sortField = hasCustomSort ? sort : "updated_at";
            let sortDirection = "desc";
            if (hasCustomSort && typeof order === "string") {
                sortDirection = order.toLowerCase() === "asc" ? "asc" : "desc";
            }

            const queryParams = new URLSearchParams({
                search,
                sort: sortField,
                order: sortDirection,
                page: page.toString(),
                limit: limit.toString()
            });
            
            const response = await api.get(`/all-services?${queryParams.toString()}`);
            // Backend returns { services, totalPages, totalRecords }
            return {
                services: response.data.services || [],
                totalPages: response.data.totalPages || 1,
                totalRecords: response.data.totalRecords || 0
            };
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch services.';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const fetchServiceById = createAsyncThunk(
    "services/fetchServiceById",
    async (id, thunkAPI) => {
        try {
            const res = await api.get(`/service/${id}`);
            return res.data.service;
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch service.';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const updateService = createAsyncThunk(
    "services/updateService",
    async ({ id, serviceData }, thunkAPI) => {
        try {
            const response = await api.put(`/update-service/${id}`, serviceData);
            return response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'Failed to update service.';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

export const deleteService = createAsyncThunk(
    "services/deleteService",
    async (serviceId, thunkAPI) => {
        try {
            await api.delete(`/delete-service/${serviceId}`);
            return serviceId;
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'Failed to delete service.';
            toast.error(errorMessage);
            return thunkAPI.rejectWithValue(errorMessage);
        }
    }
);

const serviceSlice = createSlice({
    name: "services",
    initialState: {
        list: [],
        totalRecords: 0,
        totalPages: 1,
        currentService: null,
        loading: false,
        error: null
    },
    reducers: {
        clearServiceError: (state) => {
            state.error = null;
        },
        clearCurrentService: (state) => {
            state.currentService = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // add
            .addCase(addService.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addService.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(addService.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // fetch all
            .addCase(fetchServices.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchServices.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload.services;
                state.totalRecords = action.payload.totalRecords;
                state.totalPages = action.payload.totalPages;
                state.error = null;
            })
            .addCase(fetchServices.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // fetch by ID
            .addCase(fetchServiceById.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.currentService = null;
            })
            .addCase(fetchServiceById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentService = action.payload;
                state.error = null;
            })
            .addCase(fetchServiceById.rejected, (state, action) => {
                state.loading = false;
                state.currentService = null;
                state.error = action.payload;
            })
            // update
            .addCase(updateService.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateService.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(updateService.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // delete
            .addCase(deleteService.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteService.fulfilled, (state, action) => {
                state.loading = false;
                state.list = state.list.filter(service => service.service_id !== action.payload);
                state.error = null;
            })
            .addCase(deleteService.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const { clearServiceError, clearCurrentService } = serviceSlice.actions;
export default serviceSlice.reducer;
