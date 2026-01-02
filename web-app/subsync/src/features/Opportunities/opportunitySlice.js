import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import opportunityService from './services/opportunityService.js';

export const fetchOpportunities = createAsyncThunk(
    'opportunities/fetchOpportunities',
    async (params, { rejectWithValue }) => {
        try {
            const data = await opportunityService.getAllOpportunities(params);
            return data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const fetchOpportunityById = createAsyncThunk(
    'opportunities/fetchOpportunityById',
    async (id, { rejectWithValue }) => {
        try {
            const data = await opportunityService.getOpportunityById(id);
            return data.opportunity;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const fetchStatuses = createAsyncThunk(
    'opportunities/fetchStatuses',
    async (_, { rejectWithValue }) => {
        try {
            const data = await opportunityService.getStatuses();
            return data.statuses;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

const opportunitySlice = createSlice({
    name: 'opportunities',
    initialState: {
        list: [],
        statuses: [],
        currentOpportunity: null,
        loading: false,
        error: null,
        totalPages: 1,
        totalRecords: 0,
        currentPage: 1
    },
    reducers: {
        clearCurrentOpportunity: (state) => {
            state.currentOpportunity = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Opportunities
            .addCase(fetchOpportunities.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOpportunities.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload.opportunities;
                state.totalPages = action.payload.totalPages;
                state.totalRecords = action.payload.totalRecords;
                state.currentPage = action.payload.currentPage;
            })
            .addCase(fetchOpportunities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Opportunity By Id
            .addCase(fetchOpportunityById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOpportunityById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOpportunity = action.payload;
            })
            .addCase(fetchOpportunityById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Fetch Statuses
            .addCase(fetchStatuses.fulfilled, (state, action) => {
                state.statuses = action.payload;
            });
    }
});

export const { clearCurrentOpportunity } = opportunitySlice.actions;
export default opportunitySlice.reducer;
