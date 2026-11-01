/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

export interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  department_id: string;
  department_name: string;
}

export interface UserSession {
  loggedIn: boolean;
  user?: User;
}

interface AuthState {
  session: UserSession | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  session: null,
  loading: true,
  error: null,
};

// Async thunks
export const checkSession = createAsyncThunk(
  'auth/checkSession',
  async (_, { rejectWithValue }) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await axios.get(`${API_URL}/api/auth/profile`, {
        withCredentials: true,
      });
      
      // Simulate loading delay in development
      if (process.env.NODE_ENV === 'development') {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch session');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      await axios.post(`${API_URL}/api/auth/logout`, {}, { withCredentials: true });
      
      // Clear local storage
      localStorage.removeItem('user');
      
      return true;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    updateSession: (state, action: PayloadAction<UserSession>) => {
      state.session = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Session
      .addCase(checkSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload;
        state.error = null;
      })
      .addCase(checkSession.rejected, (state, action) => {
        state.loading = false;
        state.session = { loggedIn: false };
        state.error = action.payload as string;
      })
      // Logout User
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.session = { loggedIn: false };
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setLoading, updateSession } = authSlice.actions;
export default authSlice.reducer;