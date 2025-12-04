import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchDcrEntries,
  fetchDcrById,
  createDcrEntry,
  updateDcrEntry,
  deleteDcrEntry,
} from "./services/dcrAPI.js";

// Async thunks
export const getDcrEntries = createAsyncThunk(
  "dcr/getEntries",
  async (params, { rejectWithValue }) => {
    try {
      const data = await fetchDcrEntries(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const getDcrById = createAsyncThunk(
  "dcr/getById",
  async (id, { rejectWithValue }) => {
    try {
      const data = await fetchDcrById(id);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const addDcrEntry = createAsyncThunk(
  "dcr/addEntry",
  async (entryData, { rejectWithValue }) => {
    try {
      const data = await createDcrEntry(entryData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const editDcrEntry = createAsyncThunk(
  "dcr/editEntry",
  async ({ id, entryData }, { rejectWithValue }) => {
    try {
      const data = await updateDcrEntry(id, entryData);
      return { id, data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const removeDcrEntry = createAsyncThunk(
  "dcr/removeEntry",
  async (id, { rejectWithValue }) => {
    try {
      await deleteDcrEntry(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

const initialState = {
  list: [],
  currentEntry: null,
  loading: false,
  error: null,
  totalPages: 1,
  totalRecords: 0,
  startDate: null,
  endDate: null,
};

const dcrSlice = createSlice({
  name: "dcr",
  initialState,
  reducers: {
    clearDcrState: (state) => {
      state.currentEntry = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get entries
      .addCase(getDcrEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDcrEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.entries || [];
        state.totalPages = action.payload.totalPages || 1;
        state.totalRecords = action.payload.totalRecords || 0;
        state.startDate = action.payload.startDate;
        state.endDate = action.payload.endDate;
      })
      .addCase(getDcrEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get by ID
      .addCase(getDcrById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDcrById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEntry = action.payload.entry;
      })
      .addCase(getDcrById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add entry
      .addCase(addDcrEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDcrEntry.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addDcrEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Edit entry
      .addCase(editDcrEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(editDcrEntry.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(editDcrEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove entry
      .addCase(removeDcrEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeDcrEntry.fulfilled, (state, action) => {
        state.loading = false;
        state.list = state.list.filter((entry) => entry.id !== action.payload);
      })
      .addCase(removeDcrEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDcrState } = dcrSlice.actions;
export default dcrSlice.reducer;


