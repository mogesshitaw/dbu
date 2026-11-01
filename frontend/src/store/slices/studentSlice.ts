/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Student {
  student_id: number;
  student_number: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  enrollment_date: string;
  status: 'Active' | 'Inactive' | 'Graduated' | 'Suspended';
  department_id: number;
  batch_id: number;
  semester_id: number;
  section: string;
  profile_image_url: string;
  created_at: string;
  updated_at: string;
  department_name?: string;
  batch_year?: string;
  admission_year?: string;
  batch_full_label?: string;
  semester_name?: string;
}

export interface StudentFormData {
  full_name: string;
  email: string;
  student_number?: string;
  phone?: string;
  date_of_birth?: string;
  gender: 'Male' | 'Female' | 'Other';
  address?: string;
  department_id: number;
  batch_id: number;
  admission_year?: string;
  semester_id: number;
  section?: string;
  status?: string;
}
export interface StudentFormData1 {
  student_number?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  department_id: number;
  batch_id: number;
  semester_id: number;
  section?: string;
  status?: string;
}

export interface Department {
  department_id: number;
  department_name: string;
  department_code?: string;
}

export interface Batch {
  batch_id: number;
  batch_year: string;
  description?: string;
}

export interface Semester {
  id: number;
  semester: string;
  semester_number: number;
  academic_year?: string;
}

interface StudentState {
  students: Student[];
  departments: Department[];
  batches: Batch[];
  semesters: Semester[];
  currentStudent: Student | null;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
  page: number;
  limit: number;
  searchQuery: string;
  filters: {
    department: string;
    batch: string;
    admission_year: string;
    semester: string;
    status: string;
  };
}

const initialState: StudentState = {
  students: [],
  departments: [],
  batches: [],
  semesters: [],
  currentStudent: null,
  loading: false,
  submitting: false,
  error: null,
  successMessage: null,
  totalCount: 0,
  page: 1,
  limit: 10,
  searchQuery: '',
  filters: {
    department: '',
    batch: '',
    admission_year: '',
    semester: '',
    status: '',
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchStudents = createAsyncThunk(
  'students/fetchStudents',
  async (params: { page?: number; limit?: number; search?: string; filters?: any } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search = '', filters = {} } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(filters.department && { department: filters.department }),
        ...(filters.batch && { batch: filters.batch }),
        ...(filters.admission_year && { admission_year: filters.admission_year }),
        ...(filters.semester && { semester: filters.semester }),
        ...(filters.status && { status: filters.status }),
      });

      const response = await fetch(`${API_URL}/api/students?${queryParams}`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch students');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue('Network error: Failed to fetch students');
    }
  }
);

export const fetchStudentById = createAsyncThunk(
  'students/fetchStudentById',
  async (studentId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/students/${studentId}`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch student');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue('Network error: Failed to fetch student');
    }
  }
);

export const createStudent = createAsyncThunk(
  'students/createStudent',
  async (studentData: StudentFormData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create student');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue('Network error: Failed to create student');
    }
  }
);

// Regular update
export const updateStudent = createAsyncThunk(
  'students/updateStudent',
  async ({ studentId, studentData }: { studentId: number; studentData: StudentFormData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update student');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue('Network error: Failed to update student');
    }
  }
);

// First login update - CHANGED NAME
export const updateStudentFirstLogin = createAsyncThunk(
  'students/updateStudentFirstLogin', // DIFFERENT NAME
  async ({ studentId, studentData }: { studentId: number; studentData: StudentFormData1 }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/students/${studentId}/first-login`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update student');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue('Network error: Failed to update student');
    }
  }
);

export const deleteStudent = createAsyncThunk(
  'students/deleteStudent',
  async (studentId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/students/${studentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to delete student');
      }
      
      return studentId;
    } catch (error) {
      return rejectWithValue('Network error: Failed to delete student');
    }
  }
);

export const uploadProfileImage = createAsyncThunk(
  'students/uploadProfileImage',
  async ({ studentId, file }: { studentId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('profile_image', file);
      
      const response = await fetch(`${API_URL}/api/students/${studentId}/profile-image`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to upload profile image');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue('Network error: Failed to upload profile image');
    }
  }
);
// Update student status - CORRECTED VERSION
export const updateStudentStatus = createAsyncThunk(
  'students/updateStudentStatus',
  async ({ studentId, status, reason }: { studentId: number; status: string; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/students/${studentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update student status');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue('Network error: Failed to update student status');
    }
  }
);
// Add this to your studentSlice.ts file
export const updateBatchStudentStatus = createAsyncThunk(
  'students/updateBatchStudentStatus',
  async ({ batch_id, status, reason, department_id }: {
    batch_id: number;
    status: string;
    reason: string | null;
    department_id: number;
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/students/batch/status/${department_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batch_id, status, reason }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update batch status');
      }
      
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);




// Export students - CORRECTED VERSION
export const exportStudents = createAsyncThunk(
  'students/exportStudents',
  async (filters: any, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        ...(filters.department && { department: filters.department }),
        ...(filters.batch && { batch: filters.batch }),
        ...(filters.semester && { semester: filters.semester }),
        ...(filters.status && { status: filters.status }),
      });

      // CORRECT URL with /api prefix
      const url = `${API_URL}/api/students/export${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      console.log('Export URL:', url); // Debug log
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/csv',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to export students');
      }

      // Handle file download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      return 'Export completed successfully';
    } catch (error) {
      return rejectWithValue('Network error: Failed to export students');
    }
  }
);
export const fetchDepartments = createAsyncThunk(
  'students/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/departments`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch departments');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue('Network error: Failed to fetch departments');
    }
  }
);

export const fetchBatches = createAsyncThunk(
  'students/fetchBatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/batches`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch batches');
      }
      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else if (data.results && Array.isArray(data.results)) {
        return data.results;
      } else if (data.batches && Array.isArray(data.batches)) {
        return data.batches;
      } else {
        console.error("Unexpected batches response structure:", data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      return rejectWithValue('Network error: Failed to fetch batches');
    }
  }
);

export const fetchSemesters = createAsyncThunk(
  'students/fetchSemesters',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/semesters`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch semesters');
      }
      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else if (data.results && Array.isArray(data.results)) {
        return data.results;
      } else if (data.semesters && Array.isArray(data.semesters)) {
        return data.semesters;
      } else {
        console.error("Unexpected semesters response structure:", data);
        return [];
      }
    } catch (error) {
      console.error("Error fetching semesters:", error);
      return rejectWithValue('Network error: Failed to fetch semesters');
    }
  }
);

const studentSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    setCurrentStudent: (state, action: PayloadAction<Student | null>) => {
      state.currentStudent = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSuccessMessage: (state, action: PayloadAction<string | null>) => {
      state.successMessage = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<StudentState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    resetForm: (state) => {
      state.currentStudent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch students
      .addCase(fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.students = action.payload.data || action.payload.students || [];
        state.totalCount = action.payload.total || action.payload.count || 0;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch student by ID
      .addCase(fetchStudentById.fulfilled, (state, action) => {
        state.currentStudent = action.payload;
      })
      .addCase(fetchStudentById.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Create student
      .addCase(createStudent.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.submitting = false;
        state.successMessage = 'Student created successfully';
        if (action.payload.student) {
          state.students.unshift(action.payload.student);
        }
      })
      .addCase(createStudent.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      })
      
      // Update student
      .addCase(updateStudent.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        state.submitting = false;
        state.successMessage = 'Student updated successfully';
        if (action.payload.student) {
          const index = state.students.findIndex(s => s.student_id === action.payload.student.student_id);
          if (index !== -1) {
            state.students[index] = action.payload.student;
          }
        }
        state.currentStudent = null;
      })
      .addCase(updateStudent.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      })
      
      // Update student first login
      .addCase(updateStudentStatus.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateStudentStatus.fulfilled, (state, action) => {
        state.submitting = false;
        state.successMessage = 'status updated ';
        if (action.payload.student) {
          const index = state.students.findIndex(s => s.student_id === action.payload.student.student_id);
          if (index !== -1) {
            state.students[index] = action.payload.student;
          }
        }
        state.currentStudent = null;
      })
      .addCase(updateStudentStatus.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      })
      
        .addCase(updateStudentFirstLogin.pending, (state) => {
        state.submitting = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateStudentFirstLogin.fulfilled, (state, action) => {
        state.submitting = false;
        state.successMessage = 'User info updated successfully';
        if (action.payload.student) {
          const index = state.students.findIndex(s => s.student_id === action.payload.student.student_id);
          if (index !== -1) {
            state.students[index] = action.payload.student;
          }
        }
        state.currentStudent = null;
      })
      .addCase(updateStudentFirstLogin.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      })
      
      // Delete student
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.students = state.students.filter(student => student.student_id !== action.payload);
        state.successMessage = 'Student deleted successfully';
      })
      .addCase(deleteStudent.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Upload profile image
      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        const studentId = action.meta.arg.studentId;
        const imageUrl = action.payload.imageUrl;
        const index = state.students.findIndex(s => s.student_id === studentId);
        if (index !== -1) {
          state.students[index].profile_image_url = imageUrl;
        }
        if (state.currentStudent?.student_id === studentId) {
          state.currentStudent.profile_image_url = imageUrl;
        }
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      
      // Fetch departments
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchDepartments.rejected, (state) => {
        state.loading = false;
        state.departments = [];
      })
      
      // Fetch batches
      .addCase(fetchBatches.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.loading = false;
        state.batches = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchBatches.rejected, (state) => {
        state.loading = false;
        state.batches = [];
      })
      
      // Fetch semesters
      .addCase(fetchSemesters.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSemesters.fulfilled, (state, action) => {
        state.loading = false;
        state.semesters = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchSemesters.rejected, (state) => {
        state.loading = false;
        state.semesters = [];
      })
      .addCase(updateBatchStudentStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateBatchStudentStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update the status for each updated student
        action.payload.updatedStudents?.forEach((updatedStudent: any) => {
          const index = state.students.findIndex(s => s.student_id === updatedStudent.student_id);
          if (index !== -1) {
            state.students[index] = updatedStudent;
          }
        });
      })
      .addCase(updateBatchStudentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentStudent,
  setError,
  setSuccessMessage,
  setPage,
  setSearchQuery,
  setFilters,
  clearMessages,
  resetForm,
} = studentSlice.actions;

export default studentSlice.reducer;