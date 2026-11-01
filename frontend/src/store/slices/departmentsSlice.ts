/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/slices/departmentsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Department {
  department_id: number;
  department_name: string;
  head_id?: number | null;
  head_name?: string | null;
  faculity_id?: number | null;
  faculity_name?: string | null;
}

export interface CreditHourSettings {
  department_id: number;
  department_name: string;
  max_credit_hours: number;
  warning_credit_hours: number;
  max_sections_per_instructor?: number;
  max_weekly_hours_per_instructor?: number;
}

export interface CreditHourUsage {
  department_id: number;
  batch_id: number;
  semester_id: string;
  total_credit_hours: number;
  course_count: number;
  max_credit_hours: number;
  warning_credit_hours: number;
  status: 'normal' | 'warning' | 'exceeded';
  remaining: number;
}

export interface DepartmentHistory extends Department {
  lastdate_at: string;
}

export interface Instructor {
  id: number;
  full_name: string;
  department_id?: number;
  department_name?: string;
}

export interface Faculty {
  faculity_id: number;
  faculity_name: string;
  created_at?: string;
  updated_at?: string;
}

interface DepartmentsState {
  departments: Department[];
  departmentsHistory: DepartmentHistory[];
  instructors: Instructor[];
  faculties: Faculty[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  creditHourSettings: CreditHourSettings | null;
  creditHourUsage: CreditHourUsage | null;
  creditHourLoading: boolean;
}

const initialState: DepartmentsState = {
  departments: [],
  departmentsHistory: [],
  instructors: [],
  faculties: [],
  loading: false,
  error: null,
  successMessage: null,
  creditHourSettings: null,
  creditHourUsage: null,
  creditHourLoading: false,
};
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Async thunks
export const fetchDepartments = createAsyncThunk(
  'departments/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/departments`);
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.departments || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchDepartmentsHistory = createAsyncThunk(
  'departments/fetchDepartmentsHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/departments/his`);
      if (!response.ok) {
        throw new Error('Failed to fetch departments history');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.departments_his || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchInstructors = createAsyncThunk(
  'departments/fetchInstructors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/users/instructors`);
      if (!response.ok) {
        throw new Error('Failed to fetch instructors');
      }
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchFaculties = createAsyncThunk(
  'departments/fetchFaculties',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/faculties`);
      if (!response.ok) {
        throw new Error('Failed to fetch faculties');
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.faculties || [];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const addDepartment = createAsyncThunk(
  'departments/addDepartment',
  async (departmentData: { 
    department_name: string; 
    faculity_id?: number | null 
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add department');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/updateDepartment',
  async ({ 
    id, 
    departmentName, 
    faculity_id 
  }: { 
    id: number; 
    departmentName: string; 
    faculity_id?: number | null 
  }, { rejectWithValue }) => {
    try {
      const payload: any = { department_name: departmentName.trim() };
      if (faculity_id !== undefined) {
        payload.faculity_id = faculity_id;
      }
      
      const response = await fetch(`${API_URL}/api/departments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update department');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
export const deleteDepartment = createAsyncThunk(
  'departments/deleteDepartment',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/departments/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete department');
      }
      
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
export const assignDepartmentHead = createAsyncThunk(
  'departments/assignDepartmentHead',
  async ({ departmentId, instructorId }: { departmentId: number; instructorId: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/departments/${departmentId}/head`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ head_id: instructorId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign department head');
      }
      
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
export const assignDepartmentToFaculty = createAsyncThunk(
  'departments/assignDepartmentToFaculty',
  async ({ 
    departmentId, 
    faculity_id 
  }: { 
    departmentId: number; 
    faculity_id: number | null 
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/departments/${departmentId}/faculty`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ faculity_id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign department to faculty');
      }
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setDepartmentFaculty: (state, action: PayloadAction<{ departmentId: number; faculity_id: number | null }>) => {
      const { departmentId, faculity_id } = action.payload;
      const department = state.departments.find(dept => dept.department_id === departmentId);
      if (department) {
        department.faculity_id = faculity_id;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Departments
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload;
        state.error = null;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch Departments History
      .addCase(fetchDepartmentsHistory.fulfilled, (state, action) => {
        state.departmentsHistory = action.payload;
      })
      // Fetch Instructors
      .addCase(fetchInstructors.fulfilled, (state, action) => {
        state.instructors = action.payload;
      })
      // Fetch Faculties
      .addCase(fetchFaculties.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFaculties.fulfilled, (state, action) => {
        state.loading = false;
        state.faculties = action.payload;
      })
      .addCase(fetchFaculties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Add Department
      .addCase(addDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(addDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.departments.push(action.payload);
        state.successMessage = 'Department added successfully';
        state.error = null;
      })
      .addCase(addDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })
      
      // Update Department
      .addCase(updateDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.departments.findIndex(dept => dept.department_id === action.payload.department_id);
        if (index !== -1) {
          state.departments[index] = action.payload;
        }
        state.successMessage = 'Department updated successfully';
        state.error = null;
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })
      
      // Delete Department
      .addCase(deleteDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = state.departments.filter(dept => dept.department_id !== action.payload);
        state.successMessage = 'Department deleted successfully';
        state.error = null;
      })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })
      
      // Assign Department Head
      .addCase(assignDepartmentHead.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(assignDepartmentHead.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.departments.findIndex(dept => dept.department_id === action.payload.department_id);
        if (index !== -1) {
          state.departments[index] = action.payload;
        }
        state.successMessage = 'Department head assigned successfully';
        state.error = null;
      })
      .addCase(assignDepartmentHead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })
      
      // Assign Department to Faculty
      .addCase(assignDepartmentToFaculty.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(assignDepartmentToFaculty.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.departments.findIndex(dept => dept.department_id === action.payload.department_id);
        if (index !== -1) {
          state.departments[index] = action.payload;
        }
        state.successMessage = 'Department assigned to faculty successfully';
        state.error = null;
      })
      .addCase(assignDepartmentToFaculty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })

      // Fetch credit hour settings
      .addCase(fetchCreditHourSettings.pending, (state) => {
        state.creditHourLoading = true;
      })
      .addCase(fetchCreditHourSettings.fulfilled, (state, action) => {
        state.creditHourLoading = false;
        state.creditHourSettings = action.payload;
      })
      .addCase(fetchCreditHourSettings.rejected, (state) => {
        state.creditHourLoading = false;
      })

      // Update credit hour settings
      .addCase(updateCreditHourSettings.pending, (state) => {
        state.creditHourLoading = true;
      })
      .addCase(updateCreditHourSettings.fulfilled, (state, action) => {
        state.creditHourLoading = false;
        state.creditHourSettings = action.payload;
        state.successMessage = 'Credit hour settings updated';
      })
      .addCase(updateCreditHourSettings.rejected, (state, action) => {
        state.creditHourLoading = false;
        state.error = action.payload as string;
      })

      // Fetch credit hour usage
      .addCase(fetchCreditHourUsage.pending, (state) => {
        state.creditHourLoading = true;
      })
      .addCase(fetchCreditHourUsage.fulfilled, (state, action) => {
        state.creditHourLoading = false;
        state.creditHourUsage = action.payload;
      })
      .addCase(fetchCreditHourUsage.rejected, (state) => {
        state.creditHourLoading = false;
        state.creditHourUsage = null;
      });
  },
});

// Selectors
export const selectDepartments = (state: { departments: DepartmentsState }) => state.departments.departments;
export const selectDepartmentsLoading = (state: { departments: DepartmentsState }) => state.departments.loading;
export const selectDepartmentsError = (state: { departments: DepartmentsState }) => state.departments.error;
export const selectFaculties = (state: { departments: DepartmentsState }) => state.departments.faculties;
export const selectInstructors = (state: { departments: DepartmentsState }) => state.departments.instructors;

export const selectDepartmentOptions = (state: { departments: DepartmentsState }) => 
  state.departments.departments.map((dept) => ({
    value: String(dept.department_id),
    label: dept.department_name,
  }));

export const selectFacultyOptions = (state: { departments: DepartmentsState }) => 
  state.departments.faculties.map((faculty) => ({
    value: String(faculty.faculity_id),
    label: faculty.faculity_name,
  }));

// Helper function to get departments by faculty
export const selectDepartmentsByFaculty = (facultyId: number) => 
  (state: { departments: DepartmentsState }) =>
    state.departments.departments.filter(dept => dept.faculity_id === facultyId);

// Helper function to get unassigned departments
export const selectUnassignedDepartments = (state: { departments: DepartmentsState }) =>
  state.departments.departments.filter(dept => !dept.faculity_id);

export const { clearError, clearSuccessMessage, setDepartmentFaculty } = departmentsSlice.actions;
export default departmentsSlice.reducer;

// ===================== CREDIT HOUR THUNKS =====================

export const fetchCreditHourSettings = createAsyncThunk(
  'departments/fetchCreditHourSettings',
  async (departmentId: number, { rejectWithValue }) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/departments/${departmentId}/credit-hour-settings`);
      if (!res.ok) throw new Error('Failed to fetch credit hour settings');
      return (await res.json()) as CreditHourSettings;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateCreditHourSettings = createAsyncThunk(
  'departments/updateCreditHourSettings',
  async (
    { departmentId, max_credit_hours, warning_credit_hours, max_sections_per_instructor, max_weekly_hours_per_instructor }: { 
      departmentId: number; 
      max_credit_hours?: number; 
      warning_credit_hours?: number;
      max_sections_per_instructor?: number;
      max_weekly_hours_per_instructor?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/departments/${departmentId}/credit-hour-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          max_credit_hours, 
          warning_credit_hours, 
          max_sections_per_instructor,
          max_weekly_hours_per_instructor 
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update credit hour settings');
      return data.data as CreditHourSettings;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchCreditHourUsage = createAsyncThunk(
  'departments/fetchCreditHourUsage',
  async (
    { departmentId, batch_id, semester_id }: { departmentId: number; batch_id: number | string; semester_id: string },
    { rejectWithValue }
  ) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(
        `${API_URL}/api/departments/${departmentId}/credit-hour-usage?batch_id=${batch_id}&semester_id=${semester_id}`
      );
      if (!res.ok) throw new Error('Failed to fetch credit hour usage');
      return (await res.json()) as CreditHourUsage;
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

// Selectors
export const selectCreditHourSettings = (state: { departments: DepartmentsState }) => state.departments.creditHourSettings;
export const selectCreditHourUsage = (state: { departments: DepartmentsState }) => state.departments.creditHourUsage;
export const selectCreditHourLoading = (state: { departments: DepartmentsState }) => state.departments.creditHourLoading;