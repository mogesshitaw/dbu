/* eslint-disable @typescript-eslint/no-explicit-any */
// store/slices/instructorSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Instructor {
  id: number;
  full_name: string;
  email?: string;
  id_number?: string;
  department_id?: number;
  department_name?: string;
  role?: string;
}

export interface InstructorSchedule {
  room_type: any;
  day_name: string;
  course: string;
  day_of_week: string;
  id: number;
  course_name: string;
  course_code: string;
  batch: string;
  semester: string;
  section: string;
  day: string;
  time_slot: string;
  start_time: string;
  end_time: string;
  room: string;
  department_name: string;
  instructor_name: string;
  instructor_id: string;
}

export interface InstructorState {
  error: any;
  loading: any;
  // Instructor list management
  instructors: Instructor[];
  instructorsLoading: boolean;
  instructorsError: string | null;
  
  // Instructor schedule management
  schedules: InstructorSchedule[];
  scheduleLoading: boolean;
  scheduleError: string | null;
  
  // Current instructor context
  currentInstructorId: string | null;
  instructorInfo: Instructor | null;
  
  // UI state
  selectedInstructor: Instructor | null;
}

 const initialState: InstructorState = {
   // Instructor list
   instructors: [],
   instructorsLoading: false,
   instructorsError: null,

   // Schedule
   schedules: [],
   scheduleLoading: false,
   scheduleError: null,

   // Current context
   currentInstructorId: null,
   instructorInfo: null,
   selectedInstructor: null,
   error: undefined,
   loading: undefined
 };

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Async thunks for instructor list
export const fetchInstructors = createAsyncThunk(
  'instructor/fetchInstructors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/users/ad_in`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch instructors');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunks for instructor schedule
export const fetchInstructorSchedule = createAsyncThunk(
  'instructor/fetchSchedule',
  async (instructorId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/schedules/instructors/${instructorId}/schedule`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
// Update your instructorSlice.ts to include the new endpoints
export const fetchMySchedule = createAsyncThunk(
  'instructor/fetchMySchedule',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/schedules/me/schedule`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
export const fetchInstructorInfo = createAsyncThunk(
  'instructor/fetchInfo',
  async (instructorId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/schedules/instructors/${instructorId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const instructorSlice = createSlice({
  name: 'instructor',
  initialState,
  reducers: {
    // Instructor list actions
    clearInstructorsError: (state) => {
      state.instructorsError = null;
    },
    addInstructor: (state, action: PayloadAction<Instructor>) => {
      state.instructors.push(action.payload);
    },
    updateInstructor: (state, action: PayloadAction<Instructor>) => {
      const index = state.instructors.findIndex(instructor => instructor.id === action.payload.id);
      if (index !== -1) {
        state.instructors[index] = action.payload;
      }
    },
    removeInstructor: (state, action: PayloadAction<number>) => {
      state.instructors = state.instructors.filter(instructor => instructor.id !== action.payload);
    },
    setSelectedInstructor: (state, action: PayloadAction<Instructor | null>) => {
      state.selectedInstructor = action.payload;
    },

    // Schedule actions
    setCurrentInstructorId: (state, action: PayloadAction<string>) => {
      state.currentInstructorId = action.payload;
    },
    clearScheduleError: (state) => {
      state.scheduleError = null;
    },
    clearSchedules: (state) => {
      state.schedules = [];
      state.instructorInfo = null;
      state.currentInstructorId = null;
    },
    
    // Combined clear all
    clearAllErrors: (state) => {
      state.instructorsError = null;
      state.scheduleError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Instructor list cases
      .addCase(fetchInstructors.pending, (state) => {
        state.instructorsLoading = true;
        state.instructorsError = null;
      })
      .addCase(fetchInstructors.fulfilled, (state, action: PayloadAction<Instructor[]>) => {
        state.instructorsLoading = false;
        state.instructors = action.payload;
      })
      .addCase(fetchInstructors.rejected, (state, action) => {
        state.instructorsLoading = false;
        state.instructorsError = action.payload as string;
      })
      
      // Schedule cases
      .addCase(fetchInstructorSchedule.pending, (state) => {
        state.scheduleLoading = true;
        state.scheduleError = null;
      })
      .addCase(fetchInstructorSchedule.fulfilled, (state, action) => {
        state.scheduleLoading = false;
        state.schedules = action.payload.schedules || action.payload;
      })
      .addCase(fetchInstructorSchedule.rejected, (state, action) => {
        state.scheduleLoading = false;
        state.scheduleError = action.payload as string;
      })
      .addCase(fetchInstructorInfo.fulfilled, (state, action) => {
        state.instructorInfo = action.payload;
      });
  },
});

export const { 
  // Instructor list actions
  clearInstructorsError,
  addInstructor,
  updateInstructor,
  removeInstructor,
  setSelectedInstructor,
  
  // Schedule actions
  setCurrentInstructorId,
  clearScheduleError,
  clearSchedules,
  
  // Combined actions
  clearAllErrors,
} = instructorSlice.actions;

export default instructorSlice.reducer;