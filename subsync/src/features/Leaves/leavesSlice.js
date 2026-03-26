import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import leavesService from './leavesService';

export const fetchPendingCounts = createAsyncThunk(
  'leaves/fetchPendingCounts',
  async (_, { rejectWithValue }) => {
    try {
      return await leavesService.getPendingCounts();
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch pending counts');
    }
  }
);

const leavesSlice = createSlice({
  name: 'leaves',
  initialState: {
    pendingCounts: {
      leaves: 0,
      permissions: 0,
      total: 0
    },
    isLoading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingCounts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPendingCounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingCounts = action.payload;
      })
      .addCase(fetchPendingCounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export default leavesSlice.reducer;
