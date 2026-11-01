/* eslint-disable @typescript-eslint/no-explicit-any */
 
// src/store/slices/courseBatchSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ReactNode } from 'react';

// Interfaces
export interface CourseForBatch {
  course_id: number;
  course_code: string;
  course_name: string;
  credits: number;
  semester: number;
  department_id: number;
  department_name: string;
  is_available: boolean;
}

export interface Instructor {
  id: number;
  full_name: string;
  email: string;
  role: string;
  department_id?: number;
  department_name?: string;
}

export interface CourseBatch {
 [key: string]: any;
  semester: ReactNode;
  id: number;
  course_id: number;
  batch: number;
  semester_id: string;
  department_id: number;
  instructor_id?: number | null;
  instructor_name?: string;
  instructor_email?: string;
  created_at: string;
  updated_at: string;
  course_code?: string;
  course_name?: string;
  department_name?: string;
  semester_name?: string;
  batch_year?: string;
  // Additional fields for UI
  available_instructors?: Instructor[];
  is_assigned?: boolean;
}

export interface CourseBatchFormData {
  course_id: number;
  batch: number;
  semester_id: string;
  department_id: number;
  instructor_id?: number;
}

export interface BatchInstructorAssignment {
  course_batch_id: number;
  instructor_id: number;
}

interface CourseBatchState {
  courseBatches: CourseBatch[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  // For department head instructor assignment
  availableDepartmentInstructors: Instructor[];
  selectedBatchForAssignment: CourseBatch | null;
  assignmentLoading: boolean;
  // For bulk operations
  bulkAssignmentData: CourseBatchFormData[];
  bulkAssigning: boolean;
}

const initialState: CourseBatchState = {
  courseBatches: [],
  loading: false,
  error: null,
  successMessage: null,
  availableDepartmentInstructors: [],
  selectedBatchForAssignment: null,
  assignmentLoading: false,
  bulkAssignmentData: [],
  bulkAssigning: false,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ================ COURSE BATCH CRUD OPERATIONS ================

// Fetch course batches
export const fetchCourseBatches = createAsyncThunk(
  'courseBatches/fetchCourseBatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch course batches');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch course batches');
    }
  }
);

// Create single course batch
export const createCourseBatch = createAsyncThunk(
  'courseBatches/createCourseBatch',
  async (data: CourseBatchFormData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to create course batch');
      }
      
      const result = await response.json();
      return result.data || result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create course batch');
    }
  }
);

// Update course batch
export const updateCourseBatch = createAsyncThunk(
  'courseBatches/updateCourseBatch',
  async ({ id, data }: { id: number; data: Partial<CourseBatchFormData> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to update course batch');
      }
      
      const result = await response.json();
      return result.data || result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update course batch');
    }
  }
);

// Delete course batch
export const deleteCourseBatch = createAsyncThunk(
  'courseBatches/deleteCourseBatch',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to delete course batch');
      }
      
      return { id };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete course batch');
    }
  }
);

// ================ DEPARTMENT HEAD: INSTRUCTOR ASSIGNMENT ================

// Fetch instructors available in department (for department head)
export const fetchDepartmentInstructors = createAsyncThunk(
  'courseBatches/fetchDepartmentInstructors',
  async (departmentId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/departments/${departmentId}/instructors`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch department instructors');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch department instructors');
    }
  }
);

// Assign instructor to course batch (Department Head)
export const assignInstructorToCourseBatch = createAsyncThunk(
  'courseBatches/assignInstructor',
  async (
    { courseBatchId, instructorId }: { courseBatchId: number; instructorId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches/${courseBatchId}/instructor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructor_id: instructorId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to assign instructor');
      }
      
      const data = await response.json();
      return { courseBatchId, data: data.data || data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to assign instructor');
    }
  }
);

// Remove instructor from course batch (Department Head)
export const removeInstructorFromCourseBatch = createAsyncThunk(
  'courseBatches/removeInstructor',
  async (courseBatchId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches/${courseBatchId}/instructor`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to remove instructor');
      }
      
      const data = await response.json();
      return { courseBatchId, data: data.data || data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove instructor');
    }
  }
);

// Bulk assign instructors to multiple course batches
export const bulkAssignInstructors = createAsyncThunk(
  'courseBatches/bulkAssignInstructors',
  async (assignments: BatchInstructorAssignment[], { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches/bulk-instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to bulk assign instructors');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to bulk assign instructors');
    }
  }
);

// ================ BULK COURSE BATCH OPERATIONS ================

// Create multiple course batches
export const createMultipleCourseBatches = createAsyncThunk(
  'courseBatches/createMultipleCourseBatches',
  async (assignments: CourseBatchFormData[], { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to create course batches');
      }
      
      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create course batches');
    }
  }
);

// Get course batch by ID
export const fetchCourseBatchById = createAsyncThunk(
  'courseBatches/fetchCourseBatchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-batches/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch course batch');
      }
      const data = await response.json();
      return data.data || data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch course batch');
    }
  }
);

// ================ HELPER FUNCTIONS ================

// Get unassigned course batches for department
export const getUnassignedBatches = (state: CourseBatchState, departmentId?: number) => {
  let batches = state.courseBatches.filter(cb => !cb.instructor_id);
  
  if (departmentId) {
    batches = batches.filter(cb => cb.department_id === departmentId);
  }
  
  return batches;
};

// Get assigned course batches for department
export const getAssignedBatches = (state: CourseBatchState, departmentId?: number) => {
  let batches = state.courseBatches.filter(cb => cb.instructor_id);
  
  if (departmentId) {
    batches = batches.filter(cb => cb.department_id === departmentId);
  }
  
  return batches;
};

const courseBatchSlice = createSlice({
  name: 'courseBatches',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setSelectedBatchForAssignment: (state, action: PayloadAction<CourseBatch | null>) => {
      state.selectedBatchForAssignment = action.payload;
    },
    clearDepartmentInstructors: (state) => {
      state.availableDepartmentInstructors = [];
    },
    setBulkAssignmentData: (state, action: PayloadAction<CourseBatchFormData[]>) => {
      state.bulkAssignmentData = action.payload;
    },
    addToBulkAssignment: (state, action: PayloadAction<CourseBatchFormData>) => {
      state.bulkAssignmentData.push(action.payload);
    },
    removeFromBulkAssignment: (state, action: PayloadAction<number>) => {
      state.bulkAssignmentData = state.bulkAssignmentData.filter(
        (_, index) => index !== action.payload
      );
    },
    clearBulkAssignment: (state) => {
      state.bulkAssignmentData = [];
    },
    resetAssignmentState: (state) => {
      state.assignmentLoading = false;
      state.selectedBatchForAssignment = null;
      state.availableDepartmentInstructors = [];
      state.bulkAssigning = false;
    },
    // Update a single course batch locally (for optimistic updates)
    updateCourseBatchLocally: (state, action: PayloadAction<CourseBatch>) => {
      const index = state.courseBatches.findIndex(cb => cb.id === action.payload.id);
      if (index !== -1) {
        state.courseBatches[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ================ COURSE BATCH CRUD ================
      .addCase(fetchCourseBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseBatches.fulfilled, (state, action) => {
        state.loading = false;
        state.courseBatches = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchCourseBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(createCourseBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createCourseBatch.fulfilled, (state, action) => {
        state.loading = false;
        state.courseBatches.push(action.payload);
        state.successMessage = 'Course batch created successfully';
        state.error = null;
      })
      .addCase(createCourseBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(updateCourseBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateCourseBatch.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const index = state.courseBatches.findIndex(cb => cb.id === updated.id);
        if (index !== -1) {
          state.courseBatches[index] = updated;
        }
        state.successMessage = 'Course batch updated successfully';
        state.error = null;
      })
      .addCase(updateCourseBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(deleteCourseBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteCourseBatch.fulfilled, (state, action) => {
        state.loading = false;
        state.courseBatches = state.courseBatches.filter(cb => cb.id !== action.payload.id);
        state.successMessage = 'Course batch deleted successfully';
        state.error = null;
      })
      .addCase(deleteCourseBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // ================ DEPARTMENT HEAD INSTRUCTOR ASSIGNMENT ================
      .addCase(fetchDepartmentInstructors.pending, (state) => {
        state.assignmentLoading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentInstructors.fulfilled, (state, action) => {
        state.assignmentLoading = false;
        state.availableDepartmentInstructors = Array.isArray(action.payload) ? action.payload : [];
        state.error = null;
      })
      .addCase(fetchDepartmentInstructors.rejected, (state, action) => {
        state.assignmentLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(assignInstructorToCourseBatch.pending, (state) => {
        state.assignmentLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(assignInstructorToCourseBatch.fulfilled, (state, action) => {
        state.assignmentLoading = false;
        const { courseBatchId, data } = action.payload;
        
        // Update the course batch in the array
        const index = state.courseBatches.findIndex(cb => cb.id === courseBatchId);
        if (index !== -1) {
          state.courseBatches[index] = {
            ...state.courseBatches[index],
            instructor_id: data.instructor_id,
            instructor_name: data.instructor_name,
            instructor_email: data.instructor_email,
            is_assigned: true,
          };
        }
        
        state.successMessage = 'Instructor assigned successfully';
        state.error = null;
      })
      .addCase(assignInstructorToCourseBatch.rejected, (state, action) => {
        state.assignmentLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(removeInstructorFromCourseBatch.pending, (state) => {
        state.assignmentLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(removeInstructorFromCourseBatch.fulfilled, (state, action) => {
        state.assignmentLoading = false;
        const { courseBatchId } = action.payload;
        
        // Update the course batch in the array
        const index = state.courseBatches.findIndex(cb => cb.id === courseBatchId);
        if (index !== -1) {
          state.courseBatches[index] = {
            ...state.courseBatches[index],
            instructor_id: null,
            instructor_name: undefined,
            instructor_email: undefined,
            is_assigned: false,
          };
        }
        
        state.successMessage = 'Instructor removed successfully';
        state.error = null;
      })
      .addCase(removeInstructorFromCourseBatch.rejected, (state, action) => {
        state.assignmentLoading = false;
        state.error = action.payload as string;
      })
      
      .addCase(bulkAssignInstructors.pending, (state) => {
        state.bulkAssigning = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(bulkAssignInstructors.fulfilled, (state, action) => {
        state.bulkAssigning = false;
        
        // Update all assigned batches
        const assignments = action.payload.assignments || [];
        assignments.forEach((assignment: any) => {
          const index = state.courseBatches.findIndex(cb => cb.id === assignment.course_batch_id);
          if (index !== -1) {
            state.courseBatches[index] = {
              ...state.courseBatches[index],
              instructor_id: assignment.instructor_id,
              instructor_name: assignment.instructor_name,
              instructor_email: assignment.instructor_email,
              is_assigned: true,
            };
          }
        });
        
        state.successMessage = `Successfully assigned instructors to ${assignments.length} course batch(es)`;
        state.error = null;
      })
      .addCase(bulkAssignInstructors.rejected, (state, action) => {
        state.bulkAssigning = false;
        state.error = action.payload as string;
      })
      
      // ================ BULK COURSE BATCH OPERATIONS ================
      .addCase(createMultipleCourseBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createMultipleCourseBatches.fulfilled, (state, action) => {
        state.loading = false;
        
        // Refresh the list to include newly created batches
        const newBatches = action.payload.created || action.payload.results || [];
        state.courseBatches.push(...newBatches);
        
        state.successMessage = `Successfully created ${newBatches.length} course batch(es)`;
        state.error = null;
      })
      .addCase(createMultipleCourseBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      .addCase(fetchCourseBatchById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseBatchById.fulfilled, (state, action) => {
        state.loading = false;
        const batch = action.payload;
        const index = state.courseBatches.findIndex(cb => cb.id === batch.id);
        if (index !== -1) {
          state.courseBatches[index] = batch;
        } else {
          state.courseBatches.push(batch);
        }
        state.error = null;
      })
      .addCase(fetchCourseBatchById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  clearSuccessMessage,
  setSelectedBatchForAssignment,
  clearDepartmentInstructors,
  setBulkAssignmentData,
  addToBulkAssignment,
  removeFromBulkAssignment,
  clearBulkAssignment,
  resetAssignmentState,
  updateCourseBatchLocally,
} = courseBatchSlice.actions;

export default courseBatchSlice.reducer;