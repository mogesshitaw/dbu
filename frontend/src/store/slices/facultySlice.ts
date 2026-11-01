/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Department {
  department_id: number;
  department_name: string;
  head_name?: string;
  faculity_id?: number;
  faculity_name?: string;
}

export interface Faculty {
  faculity_id: number;
  block_id: number;
  faculity_name: string;
  department_count?: number;
  department_names?: string;
  created_at?: string;
  block_count?: number; // NEW: Count of blocks assigned
}

interface FacultyState {
  faculties: Faculty[];
  facultyDepartments: Department[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  submitting: boolean;
  selectedFaculty: Faculty | null;
  
  // NEW: State for block assignments
  assignmentLoading: boolean;
  assignmentError: string | null;
  assignmentSuccessMessage: string | null;
}

const initialState: FacultyState = {
  faculties: [],
  facultyDepartments: [],
  loading: false,
  error: null,
  successMessage: null,
  submitting: false,
  selectedFaculty: null,
  
  // NEW: Initial state for block assignments
  assignmentLoading: false,
  assignmentError: null,
  assignmentSuccessMessage: null,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ================ EXISTING FACULTY FUNCTIONS ================

export const fetchFaculties = createAsyncThunk(
  'faculty/fetchFaculties',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/faculties`);
      if (!response.ok) throw new Error('Failed to fetch faculties');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addFaculty = createAsyncThunk(
  'faculty/addFaculty',
  async (faculity_name: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/faculties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ faculity_name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add faculty');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateFaculty = createAsyncThunk(
  'faculty/updateFaculty',
  async ({ id, faculity_name }: { id: number; faculity_name: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/faculties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ faculity_name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update faculty');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteFaculty = createAsyncThunk(
  'faculty/deleteFaculty',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/faculties/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete faculty');
      }

      return { id };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchFacultyDepartments = createAsyncThunk(
  'faculty/fetchFacultyDepartments',
  async (facultyId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/faculties/${facultyId}/departments`);
      if (!response.ok) throw new Error('Failed to fetch faculty departments');
      const data = await response.json();
      return { facultyId, data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const assignDepartmentToFaculty = createAsyncThunk(
  'faculty/assignDepartmentToFaculty',
  async (
    { facultyId, departmentId }: 
    { facultyId: number; departmentId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/faculties/${facultyId}/departments/${departmentId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign department');
      }

      return { facultyId, departmentId };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// ================ NEW BLOCK ASSIGNMENT FUNCTIONS (CALLING ROOM SLICE FUNCTIONS) ================

// These functions are now handled by the roomSlice, but we keep them here for faculty component usage
// The actual implementation will be in the roomSlice

const facultySlice = createSlice({
  name: 'faculty',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    resetSubmitting: (state) => {
      state.submitting = false;
    },
    setSelectedFaculty: (state, action: PayloadAction<Faculty | null>) => {
      state.selectedFaculty = action.payload;
    },
    
    // NEW: Reducers for block assignment state
    clearAssignmentError: (state) => {
      state.assignmentError = null;
    },
    clearAssignmentSuccessMessage: (state) => {
      state.assignmentSuccessMessage = null;
    },
    setAssignmentLoading: (state, action: PayloadAction<boolean>) => {
      state.assignmentLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // ================ EXISTING FACULTY REDUCERS ================
      // Fetch faculties
      .addCase(fetchFaculties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFaculties.fulfilled, (state, action: PayloadAction<Faculty[]>) => {
        state.loading = false;
        state.faculties = action.payload;
      })
      .addCase(fetchFaculties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Add faculty
      .addCase(addFaculty.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(addFaculty.fulfilled, (state, action: PayloadAction<Faculty>) => {
        state.submitting = false;
        state.faculties.push(action.payload);
        state.successMessage = 'Faculty added successfully';
      })
      .addCase(addFaculty.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })

      // Update faculty
      .addCase(updateFaculty.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateFaculty.fulfilled, (state, action: PayloadAction<Faculty>) => {
        state.submitting = false;
        const index = state.faculties.findIndex(
          faculty => faculty.faculity_id === action.payload.faculity_id
        );
        if (index !== -1) {
          state.faculties[index] = action.payload;
        }
        state.successMessage = 'Faculty updated successfully';
      })
      .addCase(updateFaculty.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })

      // Delete faculty
      .addCase(deleteFaculty.pending, (state) => {
        state.submitting = true;
        state.successMessage = null;
      })
      .addCase(deleteFaculty.fulfilled, (state, action: PayloadAction<{ id: number }>) => {
        state.submitting = false;
        state.faculties = state.faculties.filter(
          faculty => faculty.faculity_id !== action.payload.id
        );
        state.successMessage = 'Faculty deleted successfully';
      })
      .addCase(deleteFaculty.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })

      // Fetch faculty departments
      .addCase(fetchFacultyDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFacultyDepartments.fulfilled, (state, action: PayloadAction<{ facultyId: number; data: Department[] }>) => {
        state.loading = false;
        state.facultyDepartments = action.payload.data;
      })
      .addCase(fetchFacultyDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Assign department to faculty
      .addCase(assignDepartmentToFaculty.pending, (state) => {
        state.submitting = true;
        state.successMessage = null;
      })
      .addCase(assignDepartmentToFaculty.fulfilled, (state) => {
        state.submitting = false;
        state.successMessage = 'Department assigned successfully';
      })
      .addCase(assignDepartmentToFaculty.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
        state.successMessage = null;
      });
  },
});

export const { 
  clearError, 
  clearSuccessMessage,
  resetSubmitting,
  setSelectedFaculty,
  clearAssignmentError,
  clearAssignmentSuccessMessage,
  setAssignmentLoading
} = facultySlice.actions;

export default facultySlice.reducer;