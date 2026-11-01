/* eslint-disable @typescript-eslint/no-explicit-any */
// store/slices/feedbackSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface FeedbackItem {
  id: number;
  student_id?: number;
  id_number?: string;
  department_id?: string;
  name: string;
  message: string;
  role_type: 'student' | 'instructor';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  mes_category?: string;
}

interface FeedbackState {
  feedbacks: FeedbackItem[];
  loading: boolean;
  error: string | null;
  filters: {
    status: 'all' | 'pending' | 'approved' | 'rejected';
    role: 'all' | 'student' | 'instructor';
  };
  searchResults: FeedbackItem[];
}

const initialState: FeedbackState = {
  feedbacks: [],
  loading: false,
  error: null,
  filters: {
    status: 'all',
    role: 'all',
  },
  searchResults: [],
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchFeedbacks = createAsyncThunk(
  'feedback/fetchFeedbacks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/feedback`, {
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

export const updateFeedbackStatus = createAsyncThunk(
  'feedback/updateStatus',
  async ({ id, status }: { id: number; status: FeedbackItem['status'] }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/feedback/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
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

export const deleteFeedback = createAsyncThunk(
  'feedback/deleteFeedback',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/feedback/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const submitFeedback = createAsyncThunk(
  'feedback/submitFeedback',
  async (feedbackData: { id_number: string; category: string; message: string; role: string; }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(feedbackData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    setStatusFilter: (state, action: PayloadAction<FeedbackState['filters']['status']>) => {
      state.filters.status = action.payload;
    },
    setRoleFilter: (state, action: PayloadAction<FeedbackState['filters']['role']>) => {
      state.filters.role = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    searchFeedbacks: (state, action: PayloadAction<string>) => {
      const query = action.payload.toLowerCase();
      state.searchResults = state.feedbacks.filter(feedback => 
        feedback.name.toLowerCase().includes(query) ||
        feedback.message.toLowerCase().includes(query) ||
        (feedback.id_number && feedback.id_number.toLowerCase().includes(query)) ||
        (feedback.mes_category && feedback.mes_category.toLowerCase().includes(query))
      );
    },
    clearSearch: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch feedbacks
      .addCase(fetchFeedbacks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeedbacks.fulfilled, (state, action) => {
        state.loading = false;
        state.feedbacks = action.payload;
        state.searchResults = [];
      })
      .addCase(fetchFeedbacks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update status
      .addCase(updateFeedbackStatus.fulfilled, (state, action) => {
        const index = state.feedbacks.findIndex(f => f.id === action.payload.id);
        if (index !== -1) {
          state.feedbacks[index] = action.payload;
        }
        // Also update in search results if exists
        const searchIndex = state.searchResults.findIndex(f => f.id === action.payload.id);
        if (searchIndex !== -1) {
          state.searchResults[searchIndex] = action.payload;
        }
      })
      .addCase(updateFeedbackStatus.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete feedback
      .addCase(deleteFeedback.fulfilled, (state, action) => {
        state.feedbacks = state.feedbacks.filter(f => f.id !== action.payload);
        state.searchResults = state.searchResults.filter(f => f.id !== action.payload);
      })
      .addCase(deleteFeedback.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Submit feedback
      .addCase(submitFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
     // In your feedbackSlice - ensure no infinite updates
.addCase(submitFeedback.fulfilled, (state, action) => {
  state.loading = false;
  // Only add if not already present to prevent duplicates
  const exists = state.feedbacks.some(f => f.id === action.payload.id);
  if (!exists) {
    state.feedbacks.unshift(action.payload);
  }
})
      .addCase(submitFeedback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  setStatusFilter, 
  setRoleFilter, 
  clearError, 
  searchFeedbacks, 
  clearSearch 
} = feedbackSlice.actions;

export default feedbackSlice.reducer;