import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/axiosInstance';

import { apiLoginUser } from './services/authAPI';

const storedUser = sessionStorage.getItem('subsync_user');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedUser,
  isLoading: false,
  error: null,
  role: storedUser ? JSON.parse(storedUser).role : null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ username, password }, thunkAPI) => {
    try {
      const userData = await apiLoginUser(username, password);

      if (userData.token){
        sessionStorage.setItem('subsync_token', userData.token);
      }
      sessionStorage.setItem('subsync_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || 'Login failed.');
    }
  }
);

// Async logout thunk
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, thunkAPI) => {
    try {
      // Call the logout endpoint to log the activity
      await api.post('/logout');
    } catch (error) {
      console.warn('Logout logging failed:', error);
      // Don't fail the logout if the logging fails
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.role = null;
      sessionStorage.removeItem('subsync_user');
      sessionStorage.removeItem('subsync_token');
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.role = action.payload.role;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        // Clear state after successful logout logging
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.role = null;
        sessionStorage.removeItem('subsync_user');
        sessionStorage.removeItem('subsync_token');
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
