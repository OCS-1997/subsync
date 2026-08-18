import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskService } from './services/taskService';

export const fetchTaskStats = createAsyncThunk(
  'tasks/fetchTaskStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await taskService.getTaskStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch task stats');
    }
  }
);

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    stats: {
      total_tasks: 0,
      todo_count: 0,
      in_progress_count: 0,
      blocked_count: 0,
      completed_count: 0,
      cancelled_count: 0,
      my_active_tasks: 0,
      my_open_tasks: 0,
      by_assignee: [],
    },
    isLoading: false,
    error: null,
  },
  reducers: {
    updateActiveTaskCount: (state, action) => {
      if (state.stats) {
        state.stats.my_active_tasks = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaskStats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTaskStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload || state.stats;
      })
      .addCase(fetchTaskStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { updateActiveTaskCount } = taskSlice.actions;
export default taskSlice.reducer;
