/* eslint-disable @typescript-eslint/no-unused-vars */
// src/store/slices/timeSlotSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  department_id: number;
  lecture_duration: number;
  labratory_duration : number;
  department_name?: string;
  day_name?: string;
  formatted_start_time?: string;
  formatted_end_time?: string;
}

export interface TimeSlotFormData {
  start_time: string;
  end_time: string;
  department_id: number;
  lecture_duration: number;
  labratory_duration: number;
 }

interface TimeSlotState {
  timeSlots: TimeSlot[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: TimeSlotState = {
  timeSlots: [],
  loading: false,
  error: null,
  successMessage: null,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Async Thunks
export const fetchTimeSlots = createAsyncThunk(
  'timeSlots/fetchTimeSlots',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/time-slots`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch time slots');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to fetch time slots');
    }
  }
);

export const fetchTimeSlotsByDepartment = createAsyncThunk(
  'timeSlots/fetchTimeSlotsByDepartment',
  async (departmentId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/time-slots/department/${departmentId}`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch department time slots');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to fetch department time slots');
    }
  }
);

export const createTimeSlot = createAsyncThunk(
  'timeSlots/createTimeSlot',
  async (data: TimeSlotFormData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/time-slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to create time slot');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to create time slot');
    }
  }
);

export const updateTimeSlot = createAsyncThunk(
  'timeSlots/updateTimeSlot',
  async ({ id, data }: { id: number; data: Partial<TimeSlotFormData> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/time-slots/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to update time slot');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to update time slot');
    }
  }
);

export const deleteTimeSlot = createAsyncThunk(
  'timeSlots/deleteTimeSlot',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/time-slots/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to delete time slot');
      }
      
      return { id };
    } catch (error) {
      return rejectWithValue('Failed to delete time slot');
    }
  }
);

export const createBulkTimeSlots = createAsyncThunk(
  'timeSlots/createBulkTimeSlots',
  async ({ department_id, time_slots }: { department_id: number; time_slots: TimeSlotFormData[] }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/time-slots/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_id, time_slots }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to create bulk time slots');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to create bulk time slots');
    }
  }
);

const timeSlotSlice = createSlice({
  name: 'timeSlots',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch time slots
      .addCase(fetchTimeSlots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimeSlots.fulfilled, (state, action) => {
        state.loading = false;
        state.timeSlots = action.payload.data || [];
        state.error = null;
      })
      .addCase(fetchTimeSlots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create time slot
      .addCase(createTimeSlot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTimeSlot.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.timeSlots.push(action.payload.data);
        }
        state.successMessage = 'Time slot created successfully';
        state.error = null;
      })
      .addCase(createTimeSlot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update time slot
      .addCase(updateTimeSlot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTimeSlot.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data;
        if (updated) {
          const index = state.timeSlots.findIndex(ts => ts.id === updated.id);
          if (index !== -1) {
            state.timeSlots[index] = updated;
          }
        }
        state.successMessage = 'Time slot updated successfully';
        state.error = null;
      })
      .addCase(updateTimeSlot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete time slot
      .addCase(deleteTimeSlot.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTimeSlot.fulfilled, (state, action) => {
        state.loading = false;
        state.timeSlots = state.timeSlots.filter(ts => ts.id !== action.payload.id);
        state.successMessage = 'Time slot deleted successfully';
        state.error = null;
      })
      .addCase(deleteTimeSlot.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Bulk create time slots
      .addCase(createBulkTimeSlots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBulkTimeSlots.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = `Successfully created ${action.payload.created} time slots`;
        state.error = null;
      })
      .addCase(createBulkTimeSlots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccessMessage } = timeSlotSlice.actions;
export default timeSlotSlice.reducer;