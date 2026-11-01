/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface SectionInstructor {
  id: number;
  course_batch_id: number;
  instructor_id: number;
  section: string;
  full_name?: string;
  email?: string;
  course_code?: string;
  course_name?: string;
  batch?: number;
  semester_name?: string;
  department_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SectionInstructorFormData {
  course_batch_id: number;
  instructor_id: number;
  section: string;
}

interface SectionInstructorState {
  sectionAssignments: SectionInstructor[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: SectionInstructorState = {
  sectionAssignments: [],
  loading: false,
  error: null,
  successMessage: null,
};

// Fetch all section assignments
export const fetchSectionAssignments = createAsyncThunk(
  "courseSections/fetchSectionAssignments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-sections`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch section assignments: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      return data.data || data;
    } catch (error: any) {
      console.error('Fetch section assignments error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Fetch section assignments by course batch
export const fetchSectionAssignmentsByCourseBatch = createAsyncThunk(
  "courseSections/fetchByCourseBatch",
  async (courseBatchId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/api/course-sections/course-batch/${courseBatchId}`
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch section assignments: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      return data.data || data;
    } catch (error: any) {
      console.error('Fetch by course batch error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Create single section assignment
export const createSectionAssignment = createAsyncThunk(
  "courseSections/createSectionAssignment",
  async (formData: SectionInstructorFormData, { rejectWithValue }) => {
    try {
      console.log('Creating section assignment with:', formData);
      
      const response = await fetch(`${API_URL}/api/course-sections`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status, response.statusText);
      
      // Get the response text first to see what's coming
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let errorMessage = "Failed to create section assignment";
      
      if (!response.ok) {
        // Try to parse as JSON
        try {
          const errorData = JSON.parse(responseText);
          console.log('Parsed error data:', errorData);
          
          // Handle different error formats
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.details) {
            // If there are detailed error messages
            errorMessage = `Server error: ${JSON.stringify(errorData.details)}`;
          }
          
          // Handle specific error codes
          if (errorData.error_code === 'INSTRUCTOR_OVERLOADED') {
            errorMessage = `Instructor workload error: ${errorData.message || 'Instructor cannot handle more sections'}`;
          }
        } catch (parseError) {
          // If not JSON, use the text
          console.log('Could not parse error as JSON, using text');
          errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`;
        }
        
        // Return detailed error information
        return rejectWithValue({
          message: errorMessage,
          status: response.status,
          data: responseText
        });
      }
      
      // If successful, parse the JSON response
      try {
        const result = JSON.parse(responseText);
        console.log('Success result:', result);
        return result.data || result;
      } catch (parseError) {
        console.error('Failed to parse successful response:', parseError);
        return rejectWithValue({
          message: 'Server returned invalid response format',
          status: response.status,
          data: responseText
        });
      }
      
    } catch (error: any) {
      console.error('Network or other error in createSectionAssignment:', error);
      
      let errorMsg = "Failed to create section assignment";
      if (error.message) {
        errorMsg = error.message;
      } else if (error.toString) {
        errorMsg = error.toString();
      }
      
      return rejectWithValue({
        message: errorMsg,
        status: 0,
        data: null
      });
    }
  }
);
// Create multiple section assignments (bulk)
export const createMultipleSectionAssignments = createAsyncThunk(
  "courseSections/createMultipleSectionAssignments",
  async (assignments: SectionInstructorFormData[], { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-sections/bulk`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ assignments }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create section assignments";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          // If there are partial errors, include them
          if (errorData.errors) {
            errorMessage += `. Partial errors: ${JSON.stringify(errorData.errors)}`;
          }
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Create multiple section assignments error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Update section assignment
export const updateSectionAssignment = createAsyncThunk(
  "courseSections/updateSectionAssignment",
  async (
    { id, formData }: { id: number; formData: Partial<SectionInstructorFormData> },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/course-sections/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = "Failed to update section assignment";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error: any) {
      console.error('Update section assignment error:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Delete section assignment
export const deleteSectionAssignment = createAsyncThunk(
  "courseSections/deleteSectionAssignment",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/course-sections/${id}`, {
        method: "DELETE",
      });

if (!response.ok) {
  let errorMessage = "Failed to create section assignment";

  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    const errorData = await response.json();
    errorMessage =
      errorData.message ||
      errorData.error ||
      JSON.stringify(errorData);
  } else {
    const errorText = await response.text();
    if (errorText) errorMessage = errorText;
  }

  return rejectWithValue(errorMessage);
}


      const data = await response.json();
      return data.data || data;
    }  catch (error: any) {
  console.error('Create section assignment error:', error);
  return rejectWithValue(
    typeof error === "string"
      ? error
      : error?.message || "Failed to create section assignment"
  );
}

  }
);

const courseSectionSlice = createSlice({
  name: "courseSections",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    // Add a reducer to manually update section assignments for a specific course batch
    updateSectionAssignmentsForCourseBatch: (state, action: PayloadAction<{
      courseBatchId: number;
      assignments: SectionInstructor[];
    }>) => {
      // Remove existing assignments for this course batch
      state.sectionAssignments = state.sectionAssignments.filter(
        assignment => assignment.course_batch_id !== action.payload.courseBatchId
      );
      // Add new assignments
      state.sectionAssignments.push(...action.payload.assignments);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all assignments
      .addCase(fetchSectionAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSectionAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.sectionAssignments = action.payload;
      })
      .addCase(fetchSectionAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch by course batch
      .addCase(fetchSectionAssignmentsByCourseBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSectionAssignmentsByCourseBatch.fulfilled, (state, action) => {
        state.loading = false;
        // Update assignments for this specific course batch
        const courseBatchId = action.meta.arg;
        const newAssignments = action.payload;
        
        // Remove existing assignments for this course batch
        state.sectionAssignments = state.sectionAssignments.filter(
          assignment => assignment.course_batch_id !== courseBatchId
        );
        
        // Add new assignments
        state.sectionAssignments.push(...newAssignments);
      })
      .addCase(fetchSectionAssignmentsByCourseBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create single assignment
      .addCase(createSectionAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createSectionAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.sectionAssignments.push(action.payload);
        state.successMessage = "Section instructor assigned successfully";
      })
      .addCase(createSectionAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create multiple assignments
      .addCase(createMultipleSectionAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createMultipleSectionAssignments.fulfilled, (state, action) => {
        state.loading = false;
        
        const { data, message, errors } = action.payload;
        
        if (data && Array.isArray(data)) {
          // Add successful assignments to state
          state.sectionAssignments.push(...data);
        }
        
        if (errors && Array.isArray(errors) && errors.length > 0) {
          // Show partial success message with errors
          const successCount = data?.length || 0;
          const errorCount = errors.length;
          state.successMessage = `${successCount} section(s) assigned successfully. ${errorCount} failed.`;
          state.error = `Some sections failed: ${errors.map((e: any) => 
            `${e.section || 'Unknown'}: ${e.error || 'Failed'}`
          ).join(', ')}`;
        } else {
          // All succeeded
          const successCount = data?.length || 0;
          state.successMessage = `${successCount} section(s) assigned successfully`;
        }
      })
      .addCase(createMultipleSectionAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update assignment
      .addCase(updateSectionAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSectionAssignment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.sectionAssignments.findIndex(
          (assignment) => assignment.id === action.payload.id
        );
        if (index !== -1) {
          state.sectionAssignments[index] = action.payload;
        }
        state.successMessage = "Section assignment updated successfully";
      })
      .addCase(updateSectionAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete assignment
      .addCase(deleteSectionAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSectionAssignment.fulfilled, (state, action: any) => {
        state.loading = false;
        state.sectionAssignments = state.sectionAssignments.filter(
          (assignment) => assignment.id !== action.payload.id
        );
        state.successMessage = "Section assignment deleted successfully";
      })
      .addCase(deleteSectionAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  clearSuccessMessage, 
  updateSectionAssignmentsForCourseBatch 
} = courseSectionSlice.actions;
export default courseSectionSlice.reducer;