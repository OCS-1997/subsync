import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

import api from '@/lib/axiosInstance.js';

export const fetchVendors = createAsyncThunk(
    "vendors/fetchVendors",
    async (params = {}, thunkAPI) => {
        try {
            const { search = "", sortBy, order, page = 1, limit = 10 } = params;
            const hasCustomSort = typeof sortBy === "string" && sortBy.trim() !== "";
            const sortField = hasCustomSort ? sortBy : "updated_at";
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
            
            const response = await api.get(`/all-vendors?${queryParams.toString()}`);
            // console.log("Fetched vendors:", response.data);
            // The server returns {vendors: [], totalPages: number, totalRecords: number}
            return {
                vendors: response.data.vendors || [],
                totalPages: response.data.totalPages || 1,
                totalRecords: response.data.totalRecords || 0
            };
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchAllVendors = createAsyncThunk(
    "vendors/fetchAllVendors",
    async (_, thunkAPI) => {
        try {
            const response = await api.get("/all-vendors")
            // console.log("Fetched all vendors:", response.data);
            return response.data.vendors || [];
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const createVendor = createAsyncThunk(
    "vendors/createVendor",
    async (vendorData, thunkAPI) => {
        try {
            // console.log("Data to be sent:", vendorData);
            const response = await api.post("/create-vendor", vendorData);
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to add vendor.');
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateVendor = createAsyncThunk(
    "vendors/updateVendor",
    async ({ id, ...payload }, thunkAPI) => {
        try {
            const response = await api.put(`/update-vendor/${id}`, payload);
            // toast.success('Vendor updated successfully.');
            return response.data;
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update vendor.');
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteVendor = createAsyncThunk(
    "vendors/deleteVendor",
    async (id, thunkAPI) => {
        try {
            await api.delete(`/delete-vendor/${id}`);
            return id;
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to delete vendor.');
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchVendorById = createAsyncThunk(
    "vendors/fetchVendorById",
    async (id, thunkAPI) => {
        try {
            const response = await api.get(`/get-vendor/${id}`);
            // The server returns the vendor directly, not wrapped in a vendor property
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || error.message);
        }
    }
);

const vendorSlice = createSlice({
    name: "vendors",
    initialState: {
        list: [],
        totalRecords: 0,
        totalPages: 1,
        currentVendor: null,
        loading: false,
        error: null,
    },
    reducers: {
        clearVendorState: (state) => {
            state.currentVendor = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // read
            .addCase(fetchVendors.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVendors.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload.vendors;
                state.totalRecords = action.payload.totalRecords;
                state.totalPages = action.payload.totalPages;
                state.error = null;
            })
            .addCase(fetchVendors.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // fetch all vendors
            .addCase(fetchAllVendors.fulfilled, (state, action) => {
              state.loading = false;
              state.list = action.payload;
              state.error = null;
            })
            // create
            .addCase(createVendor.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createVendor.fulfilled, (state, action) => {
                state.loading = false;
                // Optionally add the new vendor to the list or rely on re-fetching
                // For simplicity and immediate UI update, we can add it if the backend returns the full vendor object
                // If backend only returns id, a re-fetch is better. Given current backend, re-fetch is safest.
                // state.list.push(action.payload); // This depends on the exact payload structure
                state.error = null;
            })
            .addCase(createVendor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // update
            .addCase(updateVendor.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateVendor.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.list.findIndex(vendor => vendor.vendor_id === action.meta.arg.id);
                if (index !== -1) {
                    state.list[index] = { ...state.list[index], ...action.meta.arg };
                }
                state.error = null;
            })
            .addCase(updateVendor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // delete
            .addCase(deleteVendor.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteVendor.fulfilled, (state, action) => {
                state.loading = false;
                state.list = state.list.filter(vendor => vendor.vendor_id !== action.payload);
                state.error = null;
            })
            .addCase(deleteVendor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // fetch vendor by id
            .addCase(fetchVendorById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchVendorById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentVendor = action.payload;
                state.error = null;
            })
            .addCase(fetchVendorById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default vendorSlice.reducer;
export const { clearVendorState } = vendorSlice.actions;
