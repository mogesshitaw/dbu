/* eslint-disable @typescript-eslint/no-explicit-any */
// store/slices/announcementsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_name: string;
  department_id: number;
  department_name: string;
  priority: 'low' | 'medium' | 'high';
  is_published: boolean;
  created_at: string;
  updated_at: string;
  publish_at: string | null;
  expires_at: string | null;
}

interface AnnouncementsState {
  announcements: Announcement[];
  currentAnnouncement: Announcement | null;
  loading: boolean;
  error: string | null;
  submitting: boolean;
  currentUser: any | null;
}

const initialState: AnnouncementsState = {
  announcements: [],
  currentAnnouncement: null,
  loading: false,
  error: null,
  submitting: false,
  currentUser: null,
};

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Async thunks - FIXED VERSIONS
export const fetchAnnouncements = createAsyncThunk(
  'announcements/fetchAnnouncements',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching announcements from API...');
      const response = await fetch(`${API_URL}/api/announcements`, {
        credentials: 'include', // Add this for session
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched announcements:', data.length);
      return data;
    } catch (error: any) {
      console.error('Error in fetchAnnouncements:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const createAnnouncement = createAsyncThunk(
  'announcements/createAnnouncement',
  async (announcementData: Partial<Announcement>, { rejectWithValue }) => {
    try {
      console.log('Creating announcement with data:', announcementData);
      
      const response = await fetch(`${API_URL}/api/announcements`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // CRITICAL: Add this for session cookies
        body: JSON.stringify(announcementData),
      });
      
      // Get the response text first for debugging
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      if (!response.ok) {
        // Try to parse error message from response
        let errorMessage = 'Failed to create announcement';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      // Parse the successful response
      return JSON.parse(responseText);
    } catch (error: any) {
      console.error('Error in createAnnouncement:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const updateAnnouncement = createAsyncThunk(
  'announcements/updateAnnouncement',
  async ({ id, data }: { id: number; data: Partial<Announcement> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/announcements/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Add this
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to update announcement');
      }
      
      return response.json();
    } catch (error: any) {
      console.error('Error in updateAnnouncement:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAnnouncement = createAsyncThunk(
  'announcements/deleteAnnouncement',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/announcements/${id}`, {
        method: 'DELETE',
        credentials: 'include', // Add this
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete announcement');
      }
      
      return id;
    } catch (error: any) {
      console.error('Error in deleteAnnouncement:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const togglePublish = createAsyncThunk(
  'announcements/togglePublish',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/announcements/${id}/toggle-publish`, {
        method: 'PATCH',
        credentials: 'include', // Add this
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to toggle publish');
      }
      
      return response.json();
    } catch (error: any) {
      console.error('Error in togglePublish:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'announcements/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        credentials: 'include', // Important for session cookies
        // Remove Authorization header if using session cookies
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch user profile`);
      }
      
      const userData = await response.json();
      console.log('Fetched user profile:', userData);
      return userData;
    } catch (error: any) {
      console.error('Error in fetchUserProfile:', error);
      return rejectWithValue(error.message);
    }
  }
);

const announcementsSlice = createSlice({
  name: 'announcements',
  initialState,
  reducers: {
    setCurrentAnnouncement: (state, action: PayloadAction<Announcement | null>) => {
      state.currentAnnouncement = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAnnouncement: (state) => {
      state.currentAnnouncement = null;
    },
    setCurrentUser: (state, action: PayloadAction<any>) => {
      state.currentUser = action.payload;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch announcements
      .addCase(fetchAnnouncements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.loading = false;
        state.announcements = action.payload;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to fetch announcements';
      })
      // Create announcement
      .addCase(createAnnouncement.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(createAnnouncement.fulfilled, (state, action) => {
        state.submitting = false;
        state.announcements.unshift(action.payload);
        state.error = null;
      })
      .addCase(createAnnouncement.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string || 'Failed to create announcement';
      })
      // Update announcement
      .addCase(updateAnnouncement.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(updateAnnouncement.fulfilled, (state, action) => {
        state.submitting = false;
        const index = state.announcements.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.announcements[index] = action.payload;
        }
        if (state.currentAnnouncement?.id === action.payload.id) {
          state.currentAnnouncement = action.payload;
        }
        state.error = null;
      })
      .addCase(updateAnnouncement.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string || 'Failed to update announcement';
      })
      // Delete announcement
      .addCase(deleteAnnouncement.fulfilled, (state, action) => {
        state.announcements = state.announcements.filter(a => a.id !== action.payload);
        if (state.currentAnnouncement?.id === action.payload) {
          state.currentAnnouncement = null;
        }
      })
      .addCase(deleteAnnouncement.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to delete announcement';
      })
      // Fetch user profile
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.currentUser = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.currentUser = null;
        console.error('Failed to fetch user profile:', action.payload);
      })
      // Toggle publish
      .addCase(togglePublish.fulfilled, (state, action) => {
        const index = state.announcements.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.announcements[index] = action.payload;
        }
        if (state.currentAnnouncement?.id === action.payload.id) {
          state.currentAnnouncement = action.payload;
        }
      })
      .addCase(togglePublish.rejected, (state, action) => {
        state.error = action.payload as string || 'Failed to toggle publish';
      });
  },
});

export const { 
  setCurrentAnnouncement, 
  clearError, 
  clearCurrentAnnouncement,
  setCurrentUser,
  clearCurrentUser
} = announcementsSlice.actions;

export default announcementsSlice.reducer;