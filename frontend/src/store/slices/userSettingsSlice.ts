/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk,  } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "./authSlice"; // assuming RootState is here

export interface UpdateProfilePayload {
  id: number;
  name?: string;
  email?: string;
  username?: string;
  idNumber?: string;
  department?: string | null;
}

export interface ChangePasswordPayload {
  id: number;
  oldPassword: string;
  newPassword: string;
}

interface UserSettingsState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

const initialState: UserSettingsState = {
  loading: false,
  error: null,
  success: null,
};

// ===============================
// 🔵 UPDATE PROFILE THUNK
// ===============================
export const updateProfile = createAsyncThunk(
  "user/updateProfile",
  async (data: UpdateProfilePayload, { rejectWithValue }) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const res = await axios.patch(
        `${API_URL}/api/users/${data.id}/profile`,
        data,
        { withCredentials: true }
      );

      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Profile update failed"
      );
    }
  }
);

// ===============================
// 🔵 CHANGE PASSWORD THUNK
// ===============================
export const changePassword = createAsyncThunk(
  "user/changePassword",
  async (payload: ChangePasswordPayload, { rejectWithValue }) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const res = await axios.patch(
        `${API_URL}/api/users/${payload.id}/change-password`,
        {
          oldPassword: payload.oldPassword,
          newPassword: payload.newPassword,
        },
        { withCredentials: true }
      );

      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Password update failed"
      );
    }
  }
);

const userSettingsSlice = createSlice({
  name: "userSettings",
  initialState,
  reducers: {
    clearUserSettingsMessages: (state) => {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ==================================
      // UPDATE PROFILE
      // ==================================
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateProfile.fulfilled, (state) => {
        state.loading = false;
        state.success = "Profile updated successfully";
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ==================================
      // CHANGE PASSWORD
      // ==================================
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.success = "Password changed successfully";
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUserSettingsMessages } = userSettingsSlice.actions;

// ===============================
// SELECTORS
// ===============================
export const selectSettingsLoading = (state: RootState) =>
  state.userSettings.loading;

export const selectSettingsError = (state: RootState) =>
  state.userSettings.error;

export const selectSettingsSuccess = (state: RootState) =>
  state.userSettings.success;

export default userSettingsSlice.reducer;
