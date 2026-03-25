import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as appraisalAPI from "./services/appraisalAPI.js";

// Async thunks for User
export const getMyActiveAppraisal = createAsyncThunk(
    "appraisals/getMyActive",
    async (_, { rejectWithValue }) => {
        try {
            return await appraisalAPI.fetchMyActiveAppraisal();
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);

export const saveAppraisal = createAsyncThunk(
    "appraisals/save",
    async (appraisalData, { rejectWithValue }) => {
        try {
            return await appraisalAPI.saveMyAppraisal(appraisalData);
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);

// Async thunks for Admin
export const getTemplates = createAsyncThunk(
    "appraisals/getTemplates",
    async (_, { rejectWithValue }) => {
        try {
            return await appraisalAPI.fetchTemplates();
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);

export const createTemplate = createAsyncThunk(
    "appraisals/createTemplate",
    async (data, { rejectWithValue, dispatch }) => {
        try {
            const response = await appraisalAPI.createTemplate(data);
            dispatch(getTemplates());
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);

export const updateTemplate = createAsyncThunk(
    "appraisals/updateTemplate",
    async ({ id, data }, { rejectWithValue, dispatch }) => {
        try {
            const response = await appraisalAPI.updateTemplate(id, data);
            dispatch(getTemplates());
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);

export const deleteTemplate = createAsyncThunk(
    "appraisals/deleteTemplate",
    async (id, { rejectWithValue, dispatch }) => {
        try {
            const response = await appraisalAPI.deleteTemplate(id);
            dispatch(getTemplates());
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);

export const getPeriods = createAsyncThunk(
    "appraisals/getPeriods",
    async (params, { rejectWithValue }) => {
        try {
            return await appraisalAPI.fetchPeriods(params);
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);

export const deletePeriod = createAsyncThunk(
    "appraisals/deletePeriod",
    async (id, { rejectWithValue, dispatch }) => {
        try {
            const response = await appraisalAPI.deletePeriod(id);
            dispatch(getPeriods()); // Refresh list
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);

export const deleteSubmission = createAsyncThunk(
    "appraisals/deleteSubmission",
    async ({ id, periodId }, { rejectWithValue, dispatch }) => {
        try {
            const response = await appraisalAPI.deleteSubmission(id);
            if (periodId) {
                // If we're on the submissions list for a period, refresh it. 
                // We'll need to define fetchTeamSubmissions if we want to use it here or handle in component.
            }
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);

const initialState = {
    activeAppraisalInfo: null, // { active: boolean, period: {}, appraisal: {} }
    templates: [],
    periods: [],
    submissions: [],
    loading: false,
    error: null,
};

const appraisalSlice = createSlice({
    name: "appraisals",
    initialState,
    reducers: {
        clearAppraisalError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // User: Get active appraisal
            .addCase(getMyActiveAppraisal.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getMyActiveAppraisal.fulfilled, (state, action) => {
                state.loading = false;
                state.activeAppraisalInfo = action.payload;
            })
            .addCase(getMyActiveAppraisal.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Admin: Templates
            .addCase(getTemplates.fulfilled, (state, action) => {
                state.templates = action.payload.templates;
            })
            // Admin: Periods
            .addCase(getPeriods.fulfilled, (state, action) => {
                state.periods = action.payload.periods;
            });
    },
});

export const { clearAppraisalError } = appraisalSlice.actions;
export default appraisalSlice.reducer;
