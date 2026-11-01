/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ReactNode } from 'react';

// Define RootState type if not already defined
export interface RootState {
  userSettings: any;
  loginauth: AuthState;
}

export interface User {
  phone: string;
  section: string;
  department_name: unknown;
  name: any;
  student_id: ReactNode;
  current_semester: ReactNode;
  id: number;
  full_name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  department_id: string;
  avatar?: string;
  last_login?: string;
  created_at?: string;
  is_first_login: boolean;
  batch_id: number;
  semester_id: number;
  batch: string;
  semester: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  token: string | null;
  loginAttempts: number;
  lastLoginAttempt: number | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isAuthenticated: false,
  token: null,
  loginAttempts: 0,
  lastLoginAttempt: null,
};

// Helper function to check if user is rate limited
const isRateLimited = (lastAttempt: number | null, attempts: number): boolean => {
  if (!lastAttempt) return false;
  
  const now = Date.now();
  const timeSinceLastAttempt = now - lastAttempt;
  
  // Rate limiting: max 5 attempts per minute
  if (attempts >= 5 && timeSinceLastAttempt < 60000) {
    return true;
  }
  
  // Reset attempts after 1 minute
  if (timeSinceLastAttempt > 60000) {
    return false;
  }
  
  return false;
};

// Async thunks
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const { lastLoginAttempt, loginAttempts } = state.loginauth;

      // ⛔ Rate limiting
      if (isRateLimited(lastLoginAttempt, loginAttempts)) {
        return rejectWithValue(
          "Too many login attempts. Please wait 1 minute before trying again."
        );
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000" || "https://class-scheduled-backend1.onrender.com";

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 🔥 replaces axios withCredentials
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        if (response.status === 401) {
          return rejectWithValue(
            errorData?.message || "Invalid email or password."
          );
        }

        if (response.status === 403) {
          return rejectWithValue(
            errorData?.message ||
              "Account is not active. Please contact administrator."
          );
        }

        if (response.status >= 500) {
          return rejectWithValue(
            errorData?.message || "Server error. Please try again later."
          );
        }

        return rejectWithValue(
          errorData?.message || "Login failed. Please try again."
        );
      }

      // ✅ Success
      const data = await response.json();

      if (!data.success) {
        return rejectWithValue(
          data.message || "Login failed. Please try again."
        );
      }

      return data;
    } catch (err) {
      console.error("Login error:", err);
      return rejectWithValue(
        "Network error. Please check your connection."
      );
    }
  }
);


const authSlice = createSlice({
  name: 'loginauth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLoading: (state) => {
      state.loading = false;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.token = null;
      state.loading = false;
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.lastLoginAttempt = null;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    clearToken: (state) => {
      state.token = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login User
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.lastLoginAttempt = Date.now();
        state.loginAttempts += 1;
      })
       .addCase(loginUser.fulfilled, (state, action) => {
      if (action.payload.success && action.payload.user) {
        state.loading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        state.loginAttempts = 0;
      } else {
        state.loading = false;
        state.error = action.payload.message || "Login failed";
        state.isAuthenticated = false;
      }
    })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });
  },
});

export const { 
  clearError, 
  clearLoading,
  setUser, 
  logout, 
  resetLoginAttempts,
  setToken,
  clearToken,
} = authSlice.actions;

// Selectors with proper RootState type
export const selectUser = (state: RootState) => state.loginauth.user;
export const selectIsAuthenticated = (state: RootState) => state.loginauth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.loginauth.loading;
export const selectAuthError = (state: RootState) => state.loginauth.error;
export const selectLoginAttempts = (state: RootState) => state.loginauth.loginAttempts;
export const selectIsRateLimited = (state: RootState) => 
  isRateLimited(state.loginauth.lastLoginAttempt, state.loginauth.loginAttempts);

export default authSlice.reducer;