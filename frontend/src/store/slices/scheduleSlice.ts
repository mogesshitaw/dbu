/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ReactNode } from 'react';

export interface CourseEntry {
  room_type: ReactNode;
  course_name: ReactNode;
  course_code: ReactNode;
  instructor_name: ReactNode;
  block_code: ReactNode;
  room_number: ReactNode;
  id: string;
  course_id: number;
  room_id: number;
  instructor_id: number;
  startTime: string;
  endTime: string;
  color: string;
}

export interface DaySchedule {
  id: string;
  batch: string;
  semester: string;
  department_id: number | undefined;
  section: string;
  day_of_week: string;
  courses: CourseEntry[];
}

export interface SavedSchedule {
  course_name: any;
  instructor_name: any;
  id: string;
  batch_id: number;
  semester_id: number;
  batch: string;
  semester: string;
  section: string;
  department_id?: number;
  days: DaySchedule[];
  created_at: string;
  status: "draft" | "published";
}

export interface Instructor {
  name: any;
  idNumber: any;
  id: number;
  full_name: string;
  department_id?: number;
}

export interface ExistedCourse {
  course_id: number;
  course_code: string;
  course_name: string;
  department_id?: number;
}

// Enhanced Room interface with hierarchy
export interface Room {
  room_id: number;
  department_id:number,
  room_number: string;
  room_name?: string;
  room_type: string;
  capacity?: number;
  facilities: string[];
  is_available: boolean;
  block_id: number;
  block_name: string;
  block_code: string;
  location?: string; // Computed field: "MB - Room 101"
}

export interface Block {
  [x: string]: ReactNode;
  block_id: number;
  block_name: string;
  block_code: string;
  description?: string;
}

export interface UserSession {
  loggedIn: boolean;
  user?: {
    id: number;
    full_name: string;
    username: string;
    email: string;
    role: string;
    status: string;
    department_id: number | undefined;
    department_name: string;
  };
}

// New interfaces for BatchSemesterSelector
export interface Schedule {
  id: number;
  day_of_week: string;
  course_name: string;
  course_code: string;
  instructor_name: string;
  room: string;
  start_time: string;
  end_time: string;
  department_id?: number;
  department_name?: string;
  batch: string;
  batch_id: number;
  semester: string;
  semester_id: string;
  section: string;
  block_name?: string;
  block_code?: string;
  room_number?: string;
  room_type?: string;
  location?: string;
}

export interface Department {
  department_id: number;
  department_name: string;
}

// Today's schedule interface
export interface TodaySchedule {
  id: number;
  course_name: string;
  course_code: string;
  start_time: string;
  end_time: string;
  location: string;
  block_name: string;
  block_code: string;
  room_number: string;
  room_type: string;
  day_of_week: string;
  instructor_name: string;
  department_name: string;
  batch: string;
  batch_id: number;
  semester: string;
  semester_id: number;
  section: string;
}

// Batch interface
export interface Batch {
  batch_id: number;
  batch_year: string;
  created_at: string;
  updated_at: string;
}

// Interface for creating/updating batches (without auto-generated and joined fields)
export interface BatchFormData {
  department_id: number;
  batch_year: number;
}

// Semester interface
export interface Semester {
  [x: string]: any;
  semester_id: number;
  semester:string;
  semester_number: number;
  department_id?: number;
  created_at: string;
  updated_at: string;
}

// ... (keep all your existing interfaces as they are) ...

interface ScheduleState {
  schedules: SavedSchedule[];
  currentSchedule: {
    batch_id: number;
    batch: string;
    semester_id: number;
    semester: string;
    section: string;
    day: string;
    courses: CourseEntry[];
    days: DaySchedule[];
    department_id?: number;
  };
  instructors: Instructor[];
  courses: ExistedCourse[];
  rooms: Room[];
  blocks: Block[]; // New: Room hierarchy
  session: UserSession | null;
  loading: boolean;
  error: string | null;
  submitting: boolean;
  
  // New state for BatchSemesterSelector
  batchSchedules: Schedule[];
  departments: Department[];
  deptLoading: boolean;
  selectedFilters: {
    department: string;
    batch: string; // FIXED: Changed from batch_id to batch to match your form
    semester: string; // FIXED: Changed from semester_id to semester
    section: string;
  };

  // Today's schedule state
  todaySchedules: TodaySchedule[];
  todayLoading: boolean;

  // Room hierarchy state
  roomHierarchy: Block[];
  roomHierarchyLoading: boolean;

  // Batch state
  batches: Batch[];
  batchLoading: boolean;
  batchError: string | null;
  batchSuccessMessage: string | null;
  currentBatch: Batch | null;

  // Semester state
  semesters: Semester[];
  semesterLoading: boolean;
  semesterError: string | null;

  // AI Suggestions and Conflict Resolution
  aiSuggestions: {
    [scheduleId: string]: {
      text: string;
      model?: string;
      schedule_info?: any;
      disclaimer?: string;
    };
  };
  aiLoading: boolean;
  aiError: string | null;
  aiConflictPlan: {
    recommendations: string;
    model?: string;
    conflicts_count?: number;
    disclaimer?: string;
  } | null;
  aiConflictLoading: boolean;
  aiConflictError: string | null;
}

const initialState: ScheduleState = {
  schedules: [],
  currentSchedule: {
    batch_id: 0,
    batch: "",
    semester_id: 0,
    semester: "",
    section: "",
    day: "",
    courses: [{
      id: generateId(),
      course_id: 0,
      room_id: 0,
      instructor_id: 0,
      startTime: "08:00",
      endTime: "09:00",
      color: "#3b82f6",
      course_name: undefined,
      course_code: undefined,
      instructor_name: undefined,
      block_code: undefined,
      room_number: undefined,
      room_type: undefined
    }],
    days: [],
    department_id: undefined,
  },
  instructors: [],
  courses: [],
  rooms: [],
  blocks: [],
  session: null,
  loading: false,
  error: null,
  submitting: false,
  
  // New initial state for BatchSemesterSelector
  batchSchedules: [],
  departments: [],
  deptLoading: false,
  selectedFilters: {
    department: "",
    batch: "",
    semester: "",
    section: "",
  },

  // Today's schedule initial state
  todaySchedules: [],
  todayLoading: false,

  // Room hierarchy initial state
  roomHierarchy: [],
  roomHierarchyLoading: false,

  // Batch initial state
  batches: [],
  batchLoading: false,
  batchError: null,
  batchSuccessMessage: null,
  currentBatch: null,

  // Semester initial state
  semesters: [],
  semesterLoading: false,
  semesterError: null,

  // AI initial state
  aiSuggestions: {},
  aiLoading: false,
  aiError: null,
  aiConflictPlan: null,
  aiConflictLoading: false,
  aiConflictError: null,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}


// Async thunks for existing functionality
export const fetchSchedules = createAsyncThunk(
  'schedule/fetchSchedules',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/schedules`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchInstructors = createAsyncThunk(
  'schedule/fetchInstructors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/users/ad_in`);
      if (!response.ok) throw new Error('Failed to fetch instructors');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCourses = createAsyncThunk(
  'schedule/fetchCourses',
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

// Enhanced fetchRooms with hierarchy
export const fetchRooms = createAsyncThunk(
  'schedule/fetchRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/rooms`);
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      
      // Transform rooms to include location information
      const roomsWithLocation = data.map((room: any) => ({
        ...room,
        location: `${room.block_code} - Room ${room.room_number}`,
      }));
      
      return roomsWithLocation;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// In your scheduleSlice.ts - Add these missing async thunks
export const fetchRoomHierarchy = createAsyncThunk(
  'schedule/fetchRoomHierarchy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/schedules/rooms/hierarchy`);
      if (!response.ok) throw new Error('Failed to fetch room hierarchy');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// Fix the fetchTodaySchedule thunk to properly handle errors
export const fetchTodaySchedule = createAsyncThunk(
  'schedule/fetchTodaySchedule',
  async (day?: string) => {
    try {
      const url = day ? `${API_URL}/api/schedules/today?day=${day}` : `${API_URL}/api/schedules/today`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch today\'s schedule' }));
        throw new Error(errorData.error || 'Failed to fetch today\'s schedule');
      }
      const data = await response.json();
      // Ensure we always return an array
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      console.error('Error fetching today schedule:', error);
      // Return empty array instead of error message for this case
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSession = createAsyncThunk(
  'schedule/fetchSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch session');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const saveSchedule = createAsyncThunk(
  'schedule/saveSchedule',
  async ({ scheduleData, publish }: { scheduleData: any; publish: boolean }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...scheduleData,
          status: publish ? "published" : "draft"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save schedule');
      }
  
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save schedule');
    } 
  }
);
export const AutoGenerateSchedule = createAsyncThunk(
  'schedule/autoGenerate',
  async (
    { scheduleData }: { scheduleData: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/api/schedules/autogenerate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scheduleData }),
        }
      );

      const data = await response.json();

      console.log("📡 Backend Response:", {
        status: response.status,
        ok: response.ok,
        data: data
      });

      // ❌ HTTP-level error (4xx, 5xx)
      if (!response.ok) {
        // Extract a readable error string from any backend format
        const errMsg =
          (typeof data?.error === 'string' && data.error)
            ? data.error
            : (typeof data?.message === 'string' && data.message)
              ? data.message
              : `Server error ${response.status}`;
        console.error("❌ HTTP Error:", response.status, errMsg, data);
        return rejectWithValue({ error: errMsg, status: response.status, data });
      }

      // ✅ ANY successful response (even with conflicts)
      // The backend returns 200 OK with {success: false} for partial schedules
      // This is NOT an error - it's a successful response with conflicts
      console.log("✅ Successful response (may have conflicts):", data);
      return data; // Always return data for 200 responses

    } catch (err: any) {
      console.error("❌ Network Error:", err);
      return rejectWithValue({
        error: err.message || 'Network error',
        status: 0
      });
    }
  }
);

export const updateSchedule = createAsyncThunk(
  'schedule/updateSchedule',
  async ({ scheduleId, scheduleData, publish }: { 
    scheduleId: string; 
    scheduleData: any; 
    publish: boolean 
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...scheduleData,
          status: publish ? "published" : "draft"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update schedule');
      }

      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteSchedule = createAsyncThunk(
  'schedule/deleteSchedule',
  async (scheduleId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to delete schedule');
      }

      return scheduleId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const toggleScheduleStatus = createAsyncThunk(
  'schedule/toggleScheduleStatus',
  async ({ scheduleId, currentStatus }: { 
    scheduleId: string; 
    currentStatus: string 
  }, { rejectWithValue }) => {
    try {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      const response = await fetch(`${API_URL}/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Failed to update schedule status';
        throw new Error(errorMessage);
      }

      return { scheduleId, newStatus };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

// NEW: Async thunks for BatchSemesterSelector
export const fetchDepartments = createAsyncThunk(
  'schedule/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/departments`);
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch departments');
    }
  }
);

export const fetchBatchSchedules = createAsyncThunk(
  'schedule/fetchBatchSchedules',
  async (filters: { batch: string; semester: string; section: string; department_id: string }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.batch) params.append('batch', filters.batch);
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.section) params.append('section', filters.section);
      if (filters.department_id) params.append('department_id', filters.department_id);

      const response = await fetch(`${API_URL}/api/schedules/batch?${params}`);
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch schedules');
    }
  }
);

// Update fetchBatches thunk - FIXED to handle the response structure
export const fetchBatches = createAsyncThunk(
  'schedule/fetchBatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/batches`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch batches');
      }
      const data = await response.json();
      
      console.log('Batches API response:', data); // For debugging
      
      // Handle different response structures
      if (Array.isArray(data)) {
        // Ensure each batch has batch_year property
        return data.map(batch => ({
          ...batch,
          batch_year: batch.batch_year || batch.batch || batch.year || ''
        }));
      } else if (data.data && Array.isArray(data.data)) {
        return data.data.map((batch: { batch_year: any; batch: any; year: any; }) => ({
          ...batch,
          batch_year: batch.batch_year || batch.batch || batch.year || ''
        }));
      } else if (data.results && Array.isArray(data.results)) {
        return data.results.map((batch: { batch_year: any; batch: any; year: any; }) => ({
          ...batch,
          batch_year: batch.batch_year || batch.batch || batch.year || ''
        }));
      } else if (data.batches && Array.isArray(data.batches)) {
        return data.batches.map((batch: { batch_year: any; batch: any; year: any; }) => ({
          ...batch,
          batch_year: batch.batch_year || batch.batch || batch.year || ''
        }));
      } else {
        console.error("Unexpected batches response structure:", data);
        return []; // Return empty array for unexpected structure
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      return rejectWithValue('Network error: Failed to fetch batches');
    }
  }
);

// Update fetchSemesters thunk similarly - FIXED
export const fetchSemesters = createAsyncThunk(
  'schedule/fetchSemesters',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/semesters`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch semesters');
      }
      const data = await response.json();
      
      console.log('Semesters API response:', data); // For debugging
      
      // Handle different response structures
      if (Array.isArray(data)) {
        // Ensure each semester has semester property
        return data.map(semester => ({
          ...semester,
          semester: semester.semester || semester.semester_name || semester.semester_number || ''
        }));
      } else if (data.data && Array.isArray(data.data)) {
        return data.data.map((semester: { semester: any; semester_name: any; semester_number: any; }) => ({
          ...semester,
          semester: semester.semester || semester.semester_name || semester.semester_number || ''
        }));
      } else if (data.results && Array.isArray(data.results)) {
        return data.results.map((semester: { semester: any; semester_name: any; semester_number: any; }) => ({
          ...semester,
          semester: semester.semester || semester.semester_name || semester.semester_number || ''
        }));
      } else if (data.semesters && Array.isArray(data.semesters)) {
        return data.semesters.map((semester: { semester: any; semester_name: any; semester_number: any; }) => ({
          ...semester,
          semester: semester.semester || semester.semester_name || semester.semester_number || ''
        }));
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

// NEW: Async thunk to fetch schedules with filters
export const fetchSchedulesByFilters = createAsyncThunk(
  'schedule/fetchSchedulesByFilters',
  async (filters: { department?: string; batch?: string; semester?: string; section?: string }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append('department_id', filters.department);
      if (filters.batch) params.append('batch', filters.batch);
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.section) params.append('section', filters.section);

      const response = await fetch(`${API_URL}/api/schedules/batch?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch schedules');
      }
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch schedules');
    }
  }
);

// 🤖 AI Schedule Suggestion Thunk
export const fetchAiScheduleSuggestion = createAsyncThunk(
  'schedule/fetchAiScheduleSuggestion',
  async (scheduleId: number | string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/schedules/${scheduleId}/ai-suggest`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate AI suggestion');
      }
      return { scheduleId: String(scheduleId), ...data };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to connect to AI suggestion service');
    }
  }
);

// 🤖 AI Conflict Resolution Thunk
export const fetchAiConflictResolution = createAsyncThunk(
  'schedule/fetchAiConflictResolution',
  async (
    payload: {
      schedule_id?: number | string;
      conflicts: any[];
      batch_id?: number | string;
      semester_id?: number | string;
      section?: string;
      department_id?: number | string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/schedules/ai-resolve-conflicts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate conflict resolution');
      }
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resolve conflicts with AI');
    }
  }
);

export const regenerateConflicts = createAsyncThunk(
  'schedule/regenerateConflicts',
  async (scheduleId: number | string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/schedules/${scheduleId}/regenerate-conflicts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to re-schedule conflicts');
      }
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to re-schedule conflicts');
    }
  }
);

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setBatch: (state, action: PayloadAction<string>) => {
      state.currentSchedule.batch = action.payload;
    },
    setSemester: (state, action: PayloadAction<string>) => {
      state.currentSchedule.semester = action.payload;
    },
    setSection: (state, action: PayloadAction<string>) => {
      state.currentSchedule.section = action.payload;
    },
    setDay: (state, action: PayloadAction<string>) => {
      state.currentSchedule.day = action.payload;
    },
    setCourses: (state, action: PayloadAction<CourseEntry[]>) => {
      state.currentSchedule.courses = action.payload;
    },
    setDays: (state, action: PayloadAction<DaySchedule[]>) => {
      state.currentSchedule.days = action.payload;
    },
    setDepartmentId: (state, action: PayloadAction<number | undefined>) => {
      state.currentSchedule.department_id = action.payload;
    },
    addCourse: (state) => {
      const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      state.currentSchedule.courses.push({
        id: generateId(),
        course_id: 0,
        room_id: 0,
        instructor_id: 0,
        startTime: "08:00",
        endTime: "09:00",
        color: randomColor,
        course_name: undefined,
        course_code: undefined,
        instructor_name: undefined,
        block_code: undefined,
        room_number: undefined,
        room_type: undefined
      });
    },
    removeCourse: (state, action: PayloadAction<number>) => {
      if (state.currentSchedule.courses.length > 1) {
        state.currentSchedule.courses = state.currentSchedule.courses.filter((_, i) => i !== action.payload);
      }
    },
    updateCourse: (state, action: PayloadAction<{ index: number; field: string; value: any }>) => {
      const { index, field, value } = action.payload;
      if (state.currentSchedule.courses[index]) {
        (state.currentSchedule.courses[index] as any)[field] = value;
        
        if (field === "startTime") {
          const startTime = new Date(`2000-01-01T${value}`);
          startTime.setHours(startTime.getHours() + 1);
          state.currentSchedule.courses[index].endTime = startTime.toTimeString().slice(0, 5);
        }
      }
    },
    addDaySchedule: (state, action: PayloadAction<DaySchedule>) => {
      state.currentSchedule.days.push(action.payload);
    },
    removeDaySchedule: (state, action: PayloadAction<string>) => {
      state.currentSchedule.days = state.currentSchedule.days.filter(day => day.id !== action.payload);
    },
    resetForm: (state) => {
      state.currentSchedule = {
        batch_id: 0,
        batch: "",
        semester_id: 0,
        semester: "",
        section: "",
        day: "",
        courses: [{
          id: generateId(),
          course_id: 0,
          room_id: 0,
          instructor_id: 0,
          startTime: "08:00",
          endTime: "09:00",
          color: "#3b82f6",
          course_name: undefined,
          course_code: undefined,
          instructor_name: undefined,
          block_code: undefined,
          room_number: undefined,
          room_type: undefined
        }],
        days: [],
        department_id: state.session?.user?.department_id,
      };
    },
    clearError: (state) => {
      state.error = null;
    },
    setEditingSchedule: (state, action: PayloadAction<SavedSchedule | null>) => {
      if (action.payload) {
        state.currentSchedule = {
          batch_id: 0,
          batch: action.payload.batch,
          semester_id: 0,
          semester: action.payload.semester,
          section: action.payload.section,
          day: "",
          courses: [{
            id: generateId(),
            course_id: 0,
            room_id: 0,
            instructor_id: 0,
            startTime: "08:00",
            endTime: "09:00",
            color: "#3b82f6",
            course_name: undefined,
            course_code: undefined,
            instructor_name: undefined,
            block_code: undefined,
            room_number: undefined,
            room_type: undefined
          }],
          days: action.payload.days || [],
          department_id: action.payload.department_id,
        };
      } else {
        state.currentSchedule = {
          batch_id: 0,
          batch: "",
          semester_id: 0,
          semester: "",
          section: "",
          day: "",
          courses: [{
            id: generateId(),
            course_id: 0,
            room_id: 0,
            instructor_id: 0,
            startTime: "08:00",
            endTime: "09:00",
            color: "#3b82f6",
            course_name: undefined,
            course_code: undefined,
            instructor_name: undefined,
            block_code: undefined,
            room_number: undefined,
            room_type: undefined
          }],
          days: [],
          department_id: state.session?.user?.department_id,
        };
      }
    },

    // NEW: Reducers for BatchSemesterSelector
    setBatchFilters: (state, action: PayloadAction<Partial<ScheduleState['selectedFilters']>>) => {
      state.selectedFilters = { ...state.selectedFilters, ...action.payload };
    },
    clearBatchSchedules: (state) => {
      state.batchSchedules = [];
    },
    resetBatchFilters: (state) => {
      state.selectedFilters = initialState.selectedFilters;
    },

    // NEW: Filter rooms by department
    filterRoomsByDepartment: (state, action: PayloadAction<number | undefined>) => {
      if (!action.payload) {
        // Reset to all rooms if no department specified
        state.rooms = state.rooms;
      } else {
        // Filter rooms by department (you might need to adjust this based on your data structure)
        state.rooms = state.rooms.filter(room => 
          room.department_id === action.payload
        );
      }
    },

    // NEW: Clear today's schedules
    clearTodaySchedules: (state) => {
      state.todaySchedules = [];
    },

    // NEW: Clear batch error and success messages
    clearBatchMessages: (state) => {
      state.batchError = null;
      state.batchSuccessMessage = null;
    },

    // NEW: Clear semester error
    clearSemesterError: (state) => {
      state.semesterError = null;
    },

    // NEW: Set current batch
    setCurrentBatch: (state, action: PayloadAction<Batch | null>) => {
      state.currentBatch = action.payload;
    },
    
    // NEW: Set loading state for schedules
    setScheduleLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // 🤖 AI Reducers
    clearAiSuggestion: (state, action: PayloadAction<string | number>) => {
      delete state.aiSuggestions[String(action.payload)];
    },
    clearAiConflictPlan: (state) => {
      state.aiConflictPlan = null;
      state.aiConflictError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch schedules (existing)
      .addCase(fetchSchedules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedules.fulfilled, (state, action) => {
        state.loading = false;
        state.schedules = action.payload;
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch instructors
      .addCase(fetchInstructors.fulfilled, (state, action) => {
        state.instructors = action.payload;
      })
      
      // Fetch courses
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.courses = action.payload;
      })
      
      // Fetch rooms
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRooms.fulfilled, (state, action) => {
        state.loading = false;
        state.rooms = action.payload;
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch room hierarchy
      .addCase(fetchRoomHierarchy.pending, (state) => {
        state.roomHierarchyLoading = true;
      })
      .addCase(fetchRoomHierarchy.fulfilled, (state, action) => {
        state.roomHierarchyLoading = false;
        state.roomHierarchy = action.payload;
        // Also extract blocks from hierarchy
        state.blocks = action.payload;
      })
      .addCase(fetchRoomHierarchy.rejected, (state, action) => {
        state.roomHierarchyLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch today's schedule
      .addCase(fetchTodaySchedule.fulfilled, (state, action) => {
        state.todayLoading = false;
        // Ensure todaySchedules is always an array
        state.todaySchedules = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchTodaySchedule.rejected, (state, action) => {
        state.todayLoading = false;
        state.todaySchedules = []; // Set to empty array on error
        console.error('Failed to fetch today schedule:', action.payload);
      })
      
      // Fetch session
      .addCase(fetchSession.fulfilled, (state, action) => {
        state.session = action.payload;
        // Set department_id from session if available
        if (action.payload.user?.department_id) {
          state.currentSchedule.department_id = action.payload.user.department_id;
        }
      })
      
      // Save schedule
      .addCase(saveSchedule.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(saveSchedule.fulfilled, (state) => {
        state.submitting = false;
        state.currentSchedule = {
          batch_id: 0,
          batch: "",
          semester_id: 0,
          semester: "",
          section: "",
          day: "",
          courses: [{
            id: generateId(),
            course_id: 0,
            room_id: 0,
            instructor_id: 0,
            startTime: "08:00",
            endTime: "09:00",
            color: "#3b82f6",
            course_name: undefined,
            course_code: undefined,
            instructor_name: undefined,
            block_code: undefined,
            room_number: undefined,
            room_type: undefined
          }],
          days: [],
          department_id: state.session?.user?.department_id,
        };
      })
      .addCase(saveSchedule.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      })
      
      // Update schedule
      .addCase(updateSchedule.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateSchedule.fulfilled, (state) => {
        state.submitting = false;
        state.currentSchedule = {
          batch_id: 0,
          batch: "",
          semester_id: 0,
          semester: "",
          section: "",
          day: "",
          courses: [{
            id: generateId(),
            course_id: 0,
            room_id: 0,
            instructor_id: 0,
            startTime: "08:00",
            endTime: "09:00",
            color: "#3b82f6",
            course_name: undefined,
            course_code: undefined,
            instructor_name: undefined,
            block_code: undefined,
            room_number: undefined,
            room_type: undefined
          }],
          days: [],
          department_id: state.session?.user?.department_id,
        };
      })
      .addCase(updateSchedule.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      })
      
      // Delete schedule
      .addCase(deleteSchedule.fulfilled, (state, action) => {
        state.schedules = state.schedules.filter(schedule => schedule.id !== action.payload);
      })
      
      // Toggle schedule status
      .addCase(toggleScheduleStatus.fulfilled, (state, action) => {
        const { scheduleId, newStatus } = action.payload;
        const schedule = state.schedules.find(s => s.id === scheduleId);
        if (schedule) {
          schedule.status = newStatus as "draft" | "published";
        }
      })
      
      // NEW: Fetch departments for BatchSemesterSelector
      .addCase(fetchDepartments.pending, (state) => {
        state.deptLoading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.deptLoading = false;
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.deptLoading = false;
        state.error = action.payload as string;
      })
      
      // NEW: Fetch schedules with filters
      .addCase(fetchSchedulesByFilters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSchedulesByFilters.fulfilled, (state, action) => {
        state.loading = false;
        state.batchSchedules = action.payload;
      })
      .addCase(fetchSchedulesByFilters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.batchSchedules = [];
      })
      
      // NEW: Fetch batches - FIXED
      .addCase(fetchBatches.pending, (state) => {
        state.batchLoading = true;
        state.batchError = null;
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.batchLoading = false;
        state.batches = action.payload;
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.batchLoading = false;
        state.batchError = action.payload as string;
        state.batches = []; // Set empty array on error
      })
      
      // NEW: Fetch semesters - FIXED
      .addCase(fetchSemesters.pending, (state) => {
        state.semesterLoading = true;
        state.semesterError = null;
      })
      .addCase(fetchSemesters.fulfilled, (state, action) => {
        state.semesterLoading = false;
        state.semesters = action.payload;
      })
      .addCase(fetchSemesters.rejected, (state, action) => {
        state.semesterLoading = false;
        state.semesterError = action.payload as string;
        state.semesters = []; // Set empty array on error
      })

      // 🤖 AI Schedule Suggestion
      .addCase(fetchAiScheduleSuggestion.pending, (state) => {
        state.aiLoading = true;
        state.aiError = null;
      })
      .addCase(fetchAiScheduleSuggestion.fulfilled, (state, action) => {
        state.aiLoading = false;
        state.aiSuggestions[action.payload.scheduleId] = {
          text: action.payload.ai_suggestion,
          model: action.payload.model,
          schedule_info: action.payload.schedule_info,
          disclaimer: action.payload.disclaimer,
        };
      })
      .addCase(fetchAiScheduleSuggestion.rejected, (state, action) => {
        state.aiLoading = false;
        state.aiError = action.payload as string;
      })

      // 🤖 AI Conflict Resolution
      .addCase(fetchAiConflictResolution.pending, (state) => {
        state.aiConflictLoading = true;
        state.aiConflictError = null;
      })
      .addCase(fetchAiConflictResolution.fulfilled, (state, action) => {
        state.aiConflictLoading = false;
        state.aiConflictPlan = {
          recommendations: action.payload.ai_recommendations,
          model: action.payload.model,
          conflicts_count: action.payload.conflicts_count,
          disclaimer: action.payload.disclaimer,
        };
      })
      .addCase(fetchAiConflictResolution.rejected, (state, action) => {
        state.aiConflictLoading = false;
        state.aiConflictError = action.payload as string;
      });
  },
});

export const {
  setBatch,
  setSemester,
  setSection,
  setDay,
  setCourses,
  setDays,
  setDepartmentId,
  addCourse,
  removeCourse,
  updateCourse,
  addDaySchedule,
  removeDaySchedule,
  resetForm,
  clearError,
  setEditingSchedule,
  // NEW: Export BatchSemesterSelector actions
  setBatchFilters,
  clearBatchSchedules,
  resetBatchFilters,
  // NEW: Export room filtering actions
  filterRoomsByDepartment,
  clearTodaySchedules,
  // NEW: Export batch and semester actions
  clearBatchMessages,
  clearSemesterError,
  setCurrentBatch,
  setScheduleLoading,
  // 🤖 AI actions
  clearAiSuggestion,
  clearAiConflictPlan,
} = scheduleSlice.actions;

export default scheduleSlice.reducer;

const colorPalette = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function rejectWithValue(_message: any): any {
  throw new Error('Function not implemented.');
}
