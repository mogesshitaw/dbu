/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// store/slices/dashboardSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface TodaySchedule {
  id: number;
  course_name: string;
  course_code: string;
  start_time: string;
  end_time: string;
  room: string;
  day_of_week: string;
  instructor_name: string;
}

export interface Announcement {
  content: string;
  id: number;
  title: string;
  message: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  category: string;
}

export interface DepartmentStats {
  instructors: number;
  students: number;
  courses: number;
  announcements: number;
}
export interface InstructorStats {
  total_classes: number;
  unique_courses: number;
}

interface DashboardState {
  todaySchedules: TodaySchedule[];
  announcements: Announcement[];
  departmentStats: DepartmentStats | null;
  instructorStats: InstructorStats | null;
  scheduleLoading: boolean;
  announcementsLoading: boolean;
  statsLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  todaySchedules: [],
  announcements: [],
  departmentStats: null,
    instructorStats: null,
  scheduleLoading: false,
  announcementsLoading: false,
  statsLoading: false,
  error: null,
};

// types/dashboard.ts
export interface TodayScheduleParams {
  department_id?: number;
  batch_id?: number;
  semester_id?: number;
  section?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";




export const fetchTodayforStudentSchedule = createAsyncThunk(
  "dashboard/fetchTodaySchedule",
  async (params: TodayScheduleParams | undefined, { rejectWithValue }) => {
    try {
      const today = new Date()
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase();

      // Build query string safely
      const query = new URLSearchParams();
      if (params?.department_id) query.append("department_id", String(params.department_id));
      if (params?.batch_id) query.append("batch_id", String(params.batch_id));
      if (params?.semester_id) query.append("semester_id", String(params.semester_id));
      if (params?.section) query.append("section", params.section);

      const response = await fetch(
        `${API_URL}/api/schedules/today/${today}?${query.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch today's schedule");
      }

      return await response.json();
    } catch (error: any) {
      // ⚠ Development fallback (remove in production)
      const mockData: TodaySchedule[] = [
        {
          id: 1,
          course_name: "Mathematics 101",
          course_code: "MATH101",
          start_time: "09:00",
          end_time: "10:30",
          room: "Room 101",
          day_of_week: "monday",
          instructor_name: "Dr. Smith",
        },
        {
          id: 2,
          course_name: "Physics 201",
          course_code: "PHY201",
          start_time: "11:00",
          end_time: "12:30",
          room: "Room 202",
          day_of_week: "monday",
          instructor_name: "Dr. Johnson",
        },
      ];

      return mockData;
      // OR if you want strict failure:
      // return rejectWithValue(error.message);
    }
  }
);
// Async thunks
export const fetchTodaySchedule = createAsyncThunk(
  'dashboard/fetchTodaySchedule',
  async () => {
    try {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const response = await fetch(`${API_URL}/api/schedules/today/${today}`);
      
      if (!response.ok) throw new Error('Failed to fetch today\'s schedule');
      const data = await response.json();
      return data;
    } catch (error: any) {
      // Return mock data for development
      const mockData: TodaySchedule[] = [
        {
          id: 1,
          course_name: "Mathematics 101",
          course_code: "MATH101",
          start_time: "09:00",
          end_time: "10:30",
          room: "Room 101",
          day_of_week: "monday",
          instructor_name: "Dr. Smith"
        },
        {
          id: 2,
          course_name: "Physics 201",
          course_code: "PHY201",
          start_time: "11:00",
          end_time: "12:30",
          room: "Room 202",
          day_of_week: "monday",
          instructor_name: "Dr. Johnson"
        }
      ];
      return mockData;
    }
  }
);

export const fetchAnnouncements = createAsyncThunk(
  'dashboard/fetchAnnouncements',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/announcements`);
      
      if (!response.ok) throw new Error('Failed to fetch announcements');
      const data = await response.json();
      return data;
    } catch (error: any) {
      // Return mock data for development
      const mockData: Announcement[] = [
        {
          id: 1,
          title: "Important: Faculty Meeting",
          message: "There will be a faculty meeting this Friday at 3 PM in the main auditorium.",
          created_at: "2024-01-15T10:00:00Z",
          priority: "high",
          is_read: false,
          category: "general",
          content: ''
        },
        {
          id: 2,
          title: "New Course Materials Available",
          message: "Course materials for the spring semester are now available on the portal.",
          created_at: "2024-01-14T14:30:00Z",
          priority: "medium",
          is_read: false,
          category: "academic",
          content: ''
        }
      ];
      return mockData;
    }
  }
);

export const markAnnouncementAsRead = createAsyncThunk(
  'dashboard/markAnnouncementAsRead',
  async (announcementId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/announcements/${announcementId}/read`, {
        method: 'PATCH',
      });
      
      if (!response.ok) throw new Error('Failed to mark announcement as read');
      return announcementId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const refreshDashboardData = createAsyncThunk(
  'dashboard/refreshDashboardData',
  async (_, { dispatch }) => {
    await Promise.all([
      dispatch(fetchTodaySchedule()),
      dispatch(fetchAnnouncements())
    ]);
  }
);
export const fetchDepartmentStats = createAsyncThunk(
  'dashboard/fetchDepartmentStats',
  async (departmentId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/departments/${departmentId}/stats`);

      if (!response.ok) throw new Error('Failed to fetch department stats');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
export const fetchInstructorTodaySchedule = createAsyncThunk(
  'dashboard/fetchInstructorTodaySchedule',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/schedules/me/schedule`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch instructor schedule');
      const data = await response.json();

      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const todayClasses = data.schedules.filter((s: any) => s.day === today);

      // Transform to match TodaySchedule interface
      // Transform to match TodaySchedule interface
      const formattedClasses = todayClasses.map((s: any) => ({
        id: s.id,
        course_name: s.course_name,
        course_code: s.course_code,
        start_time: s.start_time,
        end_time: s.end_time,
        room: s.room,
        day_of_week: s.day,
        instructor_name: s.instructor_name, // Should be current user
        location: s.room
      }));

      return {
        todayClasses: formattedClasses,
        stats: {
          total_classes: data.stats.total_classes,
          unique_courses: data.stats.unique_courses
        }
      };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addAnnouncement: (state, action: PayloadAction<Announcement>) => {
      state.announcements.unshift(action.payload);
    },
    removeAnnouncement: (state, action: PayloadAction<number>) => {
      state.announcements = state.announcements.filter(ann => ann.id !== action.payload);
    },
    clearTodaySchedules: (state) => {
      state.todaySchedules = [];
    },
    clearAnnouncements: (state) => {
      state.announcements = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch today's schedule
      .addCase(fetchTodaySchedule.pending, (state) => {
        state.scheduleLoading = true;
        state.error = null;
      })
      .addCase(fetchTodaySchedule.fulfilled, (state, action) => {
        state.scheduleLoading = false;
        state.todaySchedules = action.payload;
      })
      .addCase(fetchTodaySchedule.rejected, (state, action) => {
        state.scheduleLoading = false;
        state.error = action.payload as string;
      })
      // Fetch announcements
      .addCase(fetchAnnouncements.pending, (state) => {
        state.announcementsLoading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.announcementsLoading = false;
        state.announcements = action.payload;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.announcementsLoading = false;
        state.error = action.payload as string;
      })
      // Mark announcement as read
      .addCase(markAnnouncementAsRead.fulfilled, (state, action) => {
        const announcement = state.announcements.find(ann => ann.id === action.payload);
        if (announcement) {
          announcement.is_read = true;
        }
      })
      // Fetch department stats
      .addCase(fetchDepartmentStats.pending, (state) => {
        state.statsLoading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.departmentStats = action.payload;
      })
      .addCase(fetchDepartmentStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload as string;
      })   .addCase(fetchInstructorTodaySchedule.pending, (state) => {
        state.scheduleLoading = true;
        state.error = null;
      })
      .addCase(fetchInstructorTodaySchedule.fulfilled, (state, action) => {
        state.scheduleLoading = false;
        state.todaySchedules = action.payload.todayClasses;
        state.instructorStats = action.payload.stats;
      })
      .addCase(fetchInstructorTodaySchedule.rejected, (state, action) => {
        state.scheduleLoading = false;
        state.error = action.payload as string;
      })
  },
});

export const {
  clearError,
  addAnnouncement,
  removeAnnouncement,
  clearTodaySchedules,
  clearAnnouncements,
} = dashboardSlice.actions;

// Selectors
export const selectTodaySchedules = (state: { dashboard: DashboardState }) => 
  state.dashboard.todaySchedules;

export const selectAnnouncements = (state: { dashboard: DashboardState }) => 
  state.dashboard.announcements;

export const selectUnreadAnnouncements = (state: { dashboard: DashboardState }) => 
  state.dashboard.announcements.filter(ann => !ann.is_read);

export const selectScheduleLoading = (state: { dashboard: DashboardState }) => 
  state.dashboard.scheduleLoading;

export const selectAnnouncementsLoading = (state: { dashboard: DashboardState }) => 
  state.dashboard.announcementsLoading;

export const selectDashboardError = (state: { dashboard: DashboardState }) => 
  state.dashboard.error;

export const selectDashboardLoading = (state: { dashboard: DashboardState }) => 
  state.dashboard.scheduleLoading || state.dashboard.announcementsLoading;


export const selectDepartmentStats = (state: { dashboard: DashboardState }) =>
  state.dashboard.departmentStats;

export const selectStatsLoading = (state: { dashboard: DashboardState }) =>
  state.dashboard.statsLoading;
export const selectInstructorStats = (state: { dashboard: DashboardState }) =>
  state.dashboard.instructorStats;


export default dashboardSlice.reducer;