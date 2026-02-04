import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/axiosInstance';

import { apiLoginUser } from './services/authAPI';
import { getStorageItem, setStorageItem, clearAuth } from '../../utils/storage';

const storedUser = getStorageItem('subsync_user');

const parsedUser = storedUser ? JSON.parse(storedUser) : null;

const initialState = {
  user: parsedUser,
  isAuthenticated: !!parsedUser,
  isLoading: false,
  error: null,
  role: parsedUser?.role || null,
  roleKey: parsedUser?.roleKey || null,
  permissions: parsedUser?.permissions || [],
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ username, password, rememberMe }, thunkAPI) => {
    try {
      const userData = await apiLoginUser(username, password, rememberMe);

      if (userData.token){
        setStorageItem('subsync_token', userData.token);
      }
      setStorageItem('subsync_user', JSON.stringify(userData));
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
      state.roleKey = null;
      state.permissions = [];
      clearAuth();
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
        state.roleKey = action.payload.roleKey;
        state.permissions = action.payload.permissions || [];
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
        state.roleKey = null;
        state.permissions = [];
        clearAuth();
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
