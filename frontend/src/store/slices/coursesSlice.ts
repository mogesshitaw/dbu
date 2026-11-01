/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Course {
  department_id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  credit_hour: number;
  category: string;
  lec_hr: number;
  lab_hr: number;
}
export interface Course {
  course_id: number;
  course_code: string;
  course_name: string;
  credit_hour: number;
  lec_hr: number;
  lab_hr: number;
  tut_hr: number;
  category: string;
}
// New Instructor Assignment Interfaces
export interface Instructor {
  instructor_id: number;
  full_name: string;
  email: string;
  department?: string;
}

export interface CourseAssignment {
  assignment_id?: number;
  course_id: number;
  instructor_id: number;
  instructor_name: string;
  email: string;
  department_name?: string;
  course_status: string;
  created_at: string;
  updated_at: string;
  instructor?: Instructor;
  course?: {
    course_code: string;
    course_name: string;
    credit_hour: number;
    category: string;
  };
}

// Extended Courses State with Instructor Assignment
interface CoursesState {
  courses: Course[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  editingCourse: Course | null;
  submitting: boolean;
  
  // New fields for instructor assignment
  assignments: CourseAssignment[];
  availableInstructors: Instructor[];
  selectedCourseForAssignment: Course | null;
  assignmentLoading: boolean;
  assignmentError: string | null;
  assignmentSuccessMessage: string | null;
}

const initialState: CoursesState = {
  courses: [],
  loading: false,
  error: null,
  successMessage: null,
  editingCourse: null,
  submitting: false,
  
  // New initial states
  assignments: [],
  availableInstructors: [],
  selectedCourseForAssignment: null,
  assignmentLoading: false,
  assignmentError: null,
  assignmentSuccessMessage: null,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ================ EXISTING COURSE FUNCTIONS (KEPT AS IS) ================

export const fetchCourses = createAsyncThunk(
  'courses/fetchCourses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/courses`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addCourse = createAsyncThunk(
  'courses/addCourse',
  async (courseData: Omit<Course, 'course_id'>, { rejectWithValue }) => {
    try {
      console.log('Sending course data:', courseData);
      console.log('API URL:', `${API_URL}/api/courses`);
      
      const response = await fetch(`${API_URL}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        let errorMessage = 'Failed to add course';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const newCourse = await response.json();
      console.log('Success response:', newCourse);
      return newCourse;
    } catch (error: any) {
      console.error('Add course error:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateCourse = createAsyncThunk(
  'courses/updateCourse',
  async (courseData: Course, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseData.course_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update course');
      }

      const updatedCourse = await response.json();
      return updatedCourse;
    } catch (error: any) {
      return rejectWithValue(error.message || 'An error occurred while updating course');
    }
  }
);

export const deleteCourse = createAsyncThunk(
  'courses/deleteCourse',
  async (courseId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete course');
      }

      return courseId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'An error occurred while deleting course');
    }
  }
);


// Get all available instructors
export const fetchAvailableInstructors = createAsyncThunk(
  'courses/fetchAvailableInstructors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/courses/instructors`);
      if (!response.ok) throw new Error('Failed to fetch instructors');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Get instructors assigned to a specific course
export const fetchCourseInstructors = createAsyncThunk(
  'courses/fetchCourseInstructors',
  async (courseId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/instructors`);
      if (!response.ok) throw new Error('Failed to fetch course instructors');
      const data = await response.json();
      return { courseId, data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Assign multiple instructors to a course
export const assignInstructorsToCourse = createAsyncThunk(
  'courses/assignInstructorsToCourse',
  async (
    { courseId, instructorIds, status = 'active' }: 
    { courseId: number; instructorIds: number[]; status?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/instructors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructor_ids: instructorIds,
          course_status: status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign instructors');
      }

      const data = await response.json();
      return { courseId, instructorIds, data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Remove an instructor assignment
export const removeInstructorAssignment = createAsyncThunk(
  'courses/removeInstructorAssignment',
  async (
    { courseId, instructorId }: 
    { courseId: number; instructorId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/instructors/${instructorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove instructor assignment');
      }

      return { courseId, instructorId };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Update instructor assignment status
export const updateAssignmentStatus = createAsyncThunk(
  'courses/updateAssignmentStatus',
  async (
    { courseId, instructorId, status }: 
    { courseId: number; instructorId: number; status: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/instructors/${instructorId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course_status: status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update assignment status');
      }

      const data = await response.json();
      return { courseId, instructorId, data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Get all assignments (for admin view)
export const fetchAllAssignments = createAsyncThunk(
  'courses/fetchAllAssignments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/courses/all/assignments`);
      if (!response.ok) throw new Error('Failed to fetch all assignments');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const coursesSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    // Existing reducers
    setEditingCourse: (state, action: PayloadAction<Course | null>) => {
      state.editingCourse = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    resetSubmitting: (state) => {
      state.submitting = false;
    },
    
    // New reducers for instructor assignment
    setSelectedCourseForAssignment: (state, action: PayloadAction<Course | null>) => {
      state.selectedCourseForAssignment = action.payload;
    },
    clearAssignmentError: (state) => {
      state.assignmentError = null;
    },
    clearAssignmentSuccessMessage: (state) => {
      state.assignmentSuccessMessage = null;
    },
    clearAssignments: (state) => {
      state.assignments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ================ EXISTING COURSE REDUCERS ================
      // Fetch courses
      .addCase(fetchCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action: PayloadAction<Course[]>) => {
        state.loading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add course
      .addCase(addCourse.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(addCourse.fulfilled, (state, action: PayloadAction<Course>) => {
        state.submitting = false;
        state.courses.push(action.payload);
        state.successMessage = 'Course added successfully!';
      })
      .addCase(addCourse.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })
      // Update course
      .addCase(updateCourse.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateCourse.fulfilled, (state, action: PayloadAction<Course>) => {
        state.submitting = false;
        state.courses = state.courses.map(course => 
          course.course_id === action.payload.course_id ? action.payload : course
        );
        state.editingCourse = null;
        state.successMessage = 'Course updated successfully!';
      })
      .addCase(updateCourse.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })
      // Delete course
      .addCase(deleteCourse.pending, (state) => {
        state.submitting = true;
        state.successMessage = null;
      })
      .addCase(deleteCourse.fulfilled, (state, action: PayloadAction<number>) => {
        state.submitting = false;
        state.courses = state.courses.filter(course => course.course_id !== action.payload);
        state.successMessage = 'Course deleted successfully!';
      })
      .addCase(deleteCourse.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })
      
      // ================ NEW INSTRUCTOR ASSIGNMENT REDUCERS ================
      // Fetch available instructors
      .addCase(fetchAvailableInstructors.pending, (state) => {
        state.assignmentLoading = true;
        state.assignmentError = null;
      })
      .addCase(fetchAvailableInstructors.fulfilled, (state, action: PayloadAction<Instructor[]>) => {
        state.assignmentLoading = false;
        state.availableInstructors = action.payload;
      })
      .addCase(fetchAvailableInstructors.rejected, (state, action) => {
        state.assignmentLoading = false;
        state.assignmentError = action.payload as string;
      })

      // Fetch course instructors
      .addCase(fetchCourseInstructors.pending, (state) => {
        state.assignmentLoading = true;
        state.assignmentError = null;
      })
      .addCase(fetchCourseInstructors.fulfilled, (state, action: PayloadAction<{ courseId: number; data: CourseAssignment[] }>) => {
        state.assignmentLoading = false;
        // Filter out existing assignments for this course and add new ones
        state.assignments = [
          ...state.assignments.filter(a => a.course_id !== action.payload.courseId),
          ...action.payload.data
        ];
      })
      .addCase(fetchCourseInstructors.rejected, (state, action) => {
        state.assignmentLoading = false;
        state.assignmentError = action.payload as string;
      })

      // Assign instructors to course
      .addCase(assignInstructorsToCourse.pending, (state) => {
        state.submitting = true;
        state.assignmentError = null;
        state.assignmentSuccessMessage = null;
      })
      .addCase(assignInstructorsToCourse.fulfilled, (state, action: PayloadAction<{ courseId: number; instructorIds: number[]; data: any }>) => {
        state.submitting = false;
        state.assignmentSuccessMessage = `Successfully assigned ${action.payload.instructorIds.length} instructor(s) to course`;
        
        // Refresh the assignments for this course
        const existingAssignments = state.assignments.filter(a => a.course_id !== action.payload.courseId);
        const newAssignments = action.payload.data.assignments || [];
        state.assignments = [...existingAssignments, ...newAssignments];
      })
      .addCase(assignInstructorsToCourse.rejected, (state, action) => {
        state.submitting = false;
        state.assignmentError = action.payload as string;
        state.assignmentSuccessMessage = null;
      })

      // Remove instructor assignment
      .addCase(removeInstructorAssignment.pending, (state) => {
        state.submitting = true;
        state.assignmentSuccessMessage = null;
      })
      .addCase(removeInstructorAssignment.fulfilled, (state, action: PayloadAction<{ courseId: number; instructorId: number }>) => {
        state.submitting = false;
        state.assignments = state.assignments.filter(
          assignment => !(assignment.course_id === action.payload.courseId && 
                       assignment.instructor_id === action.payload.instructorId)
        );
        state.assignmentSuccessMessage = 'Instructor assignment removed successfully';
      })
      .addCase(removeInstructorAssignment.rejected, (state, action) => {
        state.submitting = false;
        state.assignmentError = action.payload as string;
        state.assignmentSuccessMessage = null;
      })

      // Update assignment status
      .addCase(updateAssignmentStatus.pending, (state) => {
        state.submitting = true;
        state.assignmentError = null;
        state.assignmentSuccessMessage = null;
      })
      .addCase(updateAssignmentStatus.fulfilled, (state, action: PayloadAction<{ courseId: number; instructorId: number; data: any }>) => {
        state.submitting = false;
        state.assignments = state.assignments.map(assignment => {
          if (assignment.course_id === action.payload.courseId && 
              assignment.instructor_id === action.payload.instructorId) {
            return { ...assignment, course_status: action.payload.data.course_status };
          }
          return assignment;
        });
        state.assignmentSuccessMessage = 'Assignment status updated successfully';
      })
      .addCase(updateAssignmentStatus.rejected, (state, action) => {
        state.submitting = false;
        state.assignmentError = action.payload as string;
        state.assignmentSuccessMessage = null;
      })

      // Fetch all assignments
      .addCase(fetchAllAssignments.pending, (state) => {
        state.assignmentLoading = true;
        state.assignmentError = null;
      })
      .addCase(fetchAllAssignments.fulfilled, (state, action: PayloadAction<CourseAssignment[]>) => {
        state.assignmentLoading = false;
        state.assignments = action.payload;
      })
      .addCase(fetchAllAssignments.rejected, (state, action) => {
        state.assignmentLoading = false;
        state.assignmentError = action.payload as string;
      });
  },
});

export const { 
  // Existing exports
  setEditingCourse, 
  clearError, 
  clearSuccessMessage,
  resetSubmitting,
  
  // New exports
  setSelectedCourseForAssignment,
  clearAssignmentError,
  clearAssignmentSuccessMessage,
  clearAssignments
} = coursesSlice.actions;

export default coursesSlice.reducer;

// Helper functions for direct API calls (compatible with existing code)
export const instructorAssignmentAPI = {
  // Get all available instructors
  getAvailableInstructors: async (): Promise<Instructor[]> => {
    try {
      const response = await fetch(`${API_URL}/api/users/ad_in`);
      if (!response.ok) throw new Error('Failed to fetch instructors');
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching instructors:', error);
      throw error;
    }
  },

  // Get instructors assigned to a specific course
  getCourseInstructors: async (courseId: number): Promise<CourseAssignment[]> => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/instructors`);
      if (!response.ok) throw new Error('Failed to fetch course instructors');
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching course instructors:', error);
      throw error;
    }
  },

  // Assign multiple instructors to a course
  assignInstructorsToCourse: async (
    courseId: number,
    instructorIds: number[],
    status: string = 'active'
  ): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/instructors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructor_ids: instructorIds,
          course_status: status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign instructors');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error assigning instructors:', error);
      throw error;
    }
  },

  // Remove an instructor assignment
  removeInstructorAssignment: async (courseId: number, instructorId: number): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/instructors/${instructorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove instructor assignment');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error removing instructor assignment:', error);
      throw error;
    }
  },

  // Update instructor assignment status
  updateAssignmentStatus: async (
    courseId: number,
    instructorId: number,
    status: string
  ): Promise<any> => {
    try {
      const response = await fetch(`${API_URL}/api/courses/${courseId}/instructors/${instructorId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course_status: status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update assignment status');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error updating assignment status:', error);
      throw error;
    }
  },

  // Get all assignments
  getAllAssignments: async (): Promise<CourseAssignment[]> => {
    try {
      const response = await fetch(`${API_URL}/api/course-instructor-assign`);
      if (!response.ok) throw new Error('Failed to fetch all assignments');
      return await response.json();
    } catch (error: any) {
      console.error('Error fetching all assignments:', error);
      throw error;
    }
  },
};