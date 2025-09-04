import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import api from '@/lib/axiosInstance.js';

export const fetchCustomerById = createAsyncThunk(
  'customers/fetchCustomerById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/customer/${id}`);
      return res.data.customer;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || 'Failed to fetch customer';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createCustomer = createAsyncThunk(
  'customers/createCustomer',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post(`/create-customer`, payload);
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || 'Failed to create customer';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      console.log("Updating customer with ID:", id, "and payload:", payload);
      const res = await api.put(`/update-customer/${id}`, payload);
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || 'Failed to update customer';
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/all-customers', { params });
      return {
        customers: res.data.customers,
        totalPages: res.data.totalPages,
        totalRecords: res.data.totalRecords,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || err.message || 'Failed to fetch customers';
      return rejectWithValue(errorMessage);
    }
  }
);

const customerSlice = createSlice({
  name: 'customers',
  initialState: {
    list: [],
    currentCustomer: null,
    loading: false,
    error: null,
    totalPages: 1,
    totalRecords: 0,
  },
  reducers: {
    clearCustomerState: (state) => {
      state.currentCustomer = null;
      state.loading = false;
      state.error = null;
      state.list = [];
      state.totalPages = 1;
      state.totalRecords = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.customers;
        state.totalPages = action.payload.totalPages;
        state.totalRecords = action.payload.totalRecords;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCustomer = action.payload;
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateCustomer.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCustomerState } = customerSlice.actions;
export default customerSlice.reducer;
