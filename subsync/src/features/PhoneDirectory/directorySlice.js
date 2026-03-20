import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/lib/axiosInstance.js';

export const fetchDirectory = createAsyncThunk(
  'directory/fetchDirectory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/directory', { params });
      return {
        entries: res.data.entries,
        totalPages: res.data.totalPages,
        totalRecords: res.data.totalRecords,
      };
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to fetch directory';
      return rejectWithValue(errorMessage);
    }
  }
);

export const syncDirectoryAction = createAsyncThunk(
  'directory/syncDirectory',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.post('/directory/sync');
      return res.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to sync directory';
      return rejectWithValue(errorMessage);
    }
  }
);

const directorySlice = createSlice({
  name: 'directory',
  initialState: {
    list: [],
    loading: false,
    syncing: false,
    error: null,
    totalPages: 1,
    totalRecords: 0,
  },
  reducers: {
    clearDirectoryState: (state) => {
      state.loading = false;
      state.syncing = false;
      state.error = null;
      state.list = [];
      state.totalPages = 1;
      state.totalRecords = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDirectory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDirectory.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.entries;
        state.totalPages = action.payload.totalPages;
        state.totalRecords = action.payload.totalRecords;
      })
      .addCase(fetchDirectory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(syncDirectoryAction.pending, (state) => {
        state.syncing = true;
        state.error = null;
      })
      .addCase(syncDirectoryAction.fulfilled, (state) => {
        state.syncing = false;
      })
      .addCase(syncDirectoryAction.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload;
      });
  },
});

export const { clearDirectoryState } = directorySlice.actions;
export default directorySlice.reducer;
