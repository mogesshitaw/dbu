 
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

export interface Semester {
  id: number;
  semester: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SemesterFormData {
   semester: string;
  description?: string;
}

interface SemesterState {
  semesters: Semester[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: SemesterState = {
  semesters: [],
  loading: false,
  error: null,
  successMessage: null,
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function to handle errors
const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Async Thunks
export const fetchSemesters = createAsyncThunk(
  'semesters/fetchSemesters',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/semesters`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch semesters');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const createSemester = createAsyncThunk(
  'semesters/createSemester',
  async (semesterData: SemesterFormData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/semesters`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(semesterData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create semester');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const updateSemester = createAsyncThunk(
  'semesters/updateSemester',
  async ({ semesterId, semesterData }: { 
    semesterId: number; 
    semesterData: Partial<SemesterFormData> 
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/semesters/${semesterId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(semesterData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update semester');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const deleteSemester = createAsyncThunk(
  'semesters/deleteSemester',
  async (semesterId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/semesters/${semesterId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete semester');
      }
      
      return { semesterId };
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

const semesterSlice = createSlice({
  name: 'semesters',
  initialState,
  reducers: {
    clearSemesterError: (state) => {
      state.error = null;
    },
    clearSemesterSuccessMessage: (state) => {
      state.successMessage = null;
    },
    resetSemesters: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch semesters
      .addCase(fetchSemesters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSemesters.fulfilled, (state, action) => {
        state.loading = false;
        state.semesters = action.payload.data || [];
        state.error = null;
      })
      .addCase(fetchSemesters.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create semester
      .addCase(createSemester.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSemester.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.semesters.push(action.payload.data);
        }
        state.successMessage = 'Semester created successfully';
        state.error = null;
      })
      .addCase(createSemester.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update semester
      .addCase(updateSemester.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSemester.fulfilled, (state, action) => {
        state.loading = false;
        const updatedSemester = action.payload.data;
        if (updatedSemester) {
          const index = state.semesters.findIndex(semester => semester.id === updatedSemester.id);
          if (index !== -1) {
            state.semesters[index] = updatedSemester;
          }
        }
        state.successMessage = 'Semester updated successfully';
        state.error = null;
      })
      .addCase(updateSemester.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete semester
      .addCase(deleteSemester.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSemester.fulfilled, (state, action) => {
        state.loading = false;
        state.semesters = state.semesters.filter(
          semester => semester.id !== action.payload.semesterId
        );
        state.successMessage = 'Semester deleted successfully';
        state.error = null;
      })
      .addCase(deleteSemester.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearSemesterError, 
  clearSemesterSuccessMessage,
  resetSemesters 
} = semesterSlice.actions;

// Base selectors
const selectSemestersState = (state: { semesters: SemesterState }) => state.semesters;

// Memoized selectors using createSelector
export const selectAllSemesters = createSelector(
  [selectSemestersState],
  (semestersState) => semestersState.semesters
);

export const selectSemestersLoading = createSelector(
  [selectSemestersState],
  (semestersState) => semestersState.loading
);

export const selectSemestersError = createSelector(
  [selectSemestersState],
  (semestersState) => semestersState.error
);

export const selectSemestersSuccessMessage = createSelector(
  [selectSemestersState],
  (semestersState) => semestersState.successMessage
);

// ADD THIS SELECTOR TO FIX THE ERROR:
export const selectUpcomingSemesters = createSelector(
  [selectAllSemesters],
  (semesters) => semesters
);

// Also add these other selectors if needed:
export const selectActiveSemesters = createSelector(
  [selectAllSemesters],
  (semesters) => semesters
);

export const selectCompletedSemesters = createSelector(
  [selectAllSemesters],
  (semesters) => semesters
);

export const selectInactiveSemesters = createSelector(
  [selectAllSemesters],
  (semesters) => semesters
);

// Memoized selectors for filtered semesters
export const selectSemestersByName = (name: string) => 
  createSelector(
    [selectAllSemesters],
    (semesters) => semesters.filter(semester => 
      semester. semester.toLowerCase().includes(name.toLowerCase())
    )
  );

export const selectSemesterById = (id: number) => 
  createSelector(
    [selectAllSemesters],
    (semesters) => semesters.find(semester => semester.id === id)
  );

export const selectSemesterOptions = createSelector(
  [selectAllSemesters],
  (semesters) => semesters.map(semester => ({
    value: semester.id.toString(),
    label: semester. semester,
    description: semester.description
  }))
);

// Selector for semester names array (for dropdowns)
export const selectSemesterNames = createSelector(
  [selectAllSemesters],
  (semesters) => semesters.map(semester => semester. semester)
);

export default semesterSlice.reducer;