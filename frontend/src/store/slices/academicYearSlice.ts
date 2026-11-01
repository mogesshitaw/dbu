 
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

export interface AcademicYear {
  id: number;
  batch_id: number;
  semester_id: number;
  academic_year: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'completed' | 'upcoming';
  created_at: string;
  updated_at: string;
  semester: string;
  batch_year: string;
}

export interface AcademicYearFormData {
  semester_id: number;
  batch_id: number;
  academic_year: string;
  start_date: string;
  end_date: string;
  status?: string;
}

interface AcademicYearState {
  academicYears: AcademicYear[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  currentAcademicYear: AcademicYear | null;
  expiredCount: number;
}

const initialState: AcademicYearState = {
  academicYears: [],
  loading: false,
  error: null,
  successMessage: null,
  currentAcademicYear: null,
  expiredCount: 0,
};

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Helper function to handle errors
const handleError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Async Thunks
export const fetchAcademicYears = createAsyncThunk(
  'academicYears/fetchAcademicYears',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/academic-years`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch academic years');
      }
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const createAcademicYear = createAsyncThunk(
  'academicYears/createAcademicYear',
  async (academicYearData: AcademicYearFormData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/academic-years`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(academicYearData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create academic year');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const updateAcademicYear = createAsyncThunk(
  'academicYears/updateAcademicYear',
  async ({ 
    academicYearId, 
    academicYearData 
  }: { 
    academicYearId: number; 
    academicYearData: Partial<AcademicYearFormData> 
  }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/academic-years/${academicYearId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(academicYearData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update academic year');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const updateAcademicYearStatus = createAsyncThunk(
  'academicYears/updateAcademicYearStatus',
  async (
    { academicYearId, status }: { 
      academicYearId: number; 
      status: 'active' | 'inactive' | 'completed' | 'upcoming' 
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/api/academic-years/${academicYearId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update academic year status');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const deleteAcademicYear = createAsyncThunk(
  'academicYears/deleteAcademicYear',
  async (academicYearId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/academic-years/${academicYearId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete academic year');
      }
      
      return { academicYearId };
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const autoUpdateExpiredAcademicYears = createAsyncThunk(
  'academicYears/autoUpdateExpiredAcademicYears',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/academic-years/update-expired`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update expired academic years');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

export const getCurrentAcademicYear = createAsyncThunk(
  'academicYears/getCurrentAcademicYear',
  async (_, { rejectWithValue }) => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${API_URL}/api/academic-years/current?date=${currentDate}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch current academic year');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(handleError(error));
    }
  }
);

const academicYearSlice = createSlice({
  name: 'academicYears',
  initialState,
  reducers: {
    clearAcademicYearError: (state) => {
      state.error = null;
    },
    clearAcademicYearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setCurrentAcademicYear: (state, action) => {
      state.currentAcademicYear = action.payload;
    },
    clearCurrentAcademicYear: (state) => {
      state.currentAcademicYear = null;
    },
    resetAcademicYears: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch academic years
      .addCase(fetchAcademicYears.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAcademicYears.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears = action.payload.data || [];
        state.error = null;
        
        // Calculate expired count
        const today = new Date().toISOString().split('T')[0];
        state.expiredCount = state.academicYears.filter(ay => 
          ay.end_date < today && ay.status !== 'completed'
        ).length;
      })
      .addCase(fetchAcademicYears.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create academic year
      .addCase(createAcademicYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.data) {
          state.academicYears.push(action.payload.data);
        }
        state.successMessage = 'Academic year created successfully';
        state.error = null;
      })
      .addCase(createAcademicYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update academic year
      .addCase(updateAcademicYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        const updatedAcademicYear = action.payload.data;
        if (updatedAcademicYear) {
          const index = state.academicYears.findIndex(
            ay => ay.id === updatedAcademicYear.id
          );
          if (index !== -1) {
            state.academicYears[index] = updatedAcademicYear;
          }
        }
        state.successMessage = 'Academic year updated successfully';
        state.error = null;
      })
      .addCase(updateAcademicYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update academic year status
      .addCase(updateAcademicYearStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAcademicYearStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updatedAcademicYear = action.payload.data;
        if (updatedAcademicYear) {
          const index = state.academicYears.findIndex(
            ay => ay.id === updatedAcademicYear.id
          );
          if (index !== -1) {
            state.academicYears[index] = updatedAcademicYear;
          }
        }
        state.successMessage = 'Academic year status updated successfully';
        state.error = null;
      })
      .addCase(updateAcademicYearStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Auto-update expired academic years
      .addCase(autoUpdateExpiredAcademicYears.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(autoUpdateExpiredAcademicYears.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update all academic years in state
        if (action.payload.data) {
          action.payload.data.forEach((updatedAcademicYear: AcademicYear) => {
            const index = state.academicYears.findIndex(
              ay => ay.id === updatedAcademicYear.id
            );
            if (index !== -1) {
              state.academicYears[index] = updatedAcademicYear;
            }
          });
        }
        
        state.successMessage = action.payload.message || 'Expired academic years updated successfully';
        state.error = null;
        state.expiredCount = 0;
      })
      .addCase(autoUpdateExpiredAcademicYears.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete academic year
      .addCase(deleteAcademicYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.academicYears = state.academicYears.filter(
          academicYear => academicYear.id !== action.payload.academicYearId
        );
        state.successMessage = 'Academic year deleted successfully';
        state.error = null;
      })
      .addCase(deleteAcademicYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get current academic year
      .addCase(getCurrentAcademicYear.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrentAcademicYear.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAcademicYear = action.payload.data || null;
        state.error = null;
      })
      .addCase(getCurrentAcademicYear.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearAcademicYearError, 
  clearAcademicYearSuccessMessage,
  setCurrentAcademicYear,
  clearCurrentAcademicYear,
  resetAcademicYears
} = academicYearSlice.actions;

// Base selectors
const selectAcademicYearsState = (state: { academicYears: AcademicYearState }) => state.academicYears;

// Memoized selectors using createSelector
export const selectAllAcademicYears = createSelector(
  [selectAcademicYearsState],
  (academicYearsState) => academicYearsState.academicYears
);

export const selectAcademicYearsLoading = createSelector(
  [selectAcademicYearsState],
  (academicYearsState) => academicYearsState.loading
);

export const selectAcademicYearsError = createSelector(
  [selectAcademicYearsState],
  (academicYearsState) => academicYearsState.error
);

export const selectAcademicYearsSuccessMessage = createSelector(
  [selectAcademicYearsState],
  (academicYearsState) => academicYearsState.successMessage
);

export const selectCurrentAcademicYear = createSelector(
  [selectAcademicYearsState],
  (academicYearsState) => academicYearsState.currentAcademicYear
);

export const selectExpiredAcademicYearsCount = createSelector(
  [selectAcademicYearsState],
  (academicYearsState) => academicYearsState.expiredCount
);

// Memoized selectors for filtered academic years
export const selectCompletedAcademicYears = createSelector(
  [selectAllAcademicYears],
  (academicYears) => academicYears.filter(ay => ay.status === 'completed')
);

export const selectActiveAcademicYears = createSelector(
  [selectAllAcademicYears],
  (academicYears) => academicYears.filter(ay => ay.status === 'active')
);

export const selectUpcomingAcademicYears = createSelector(
  [selectAllAcademicYears],
  (academicYears) => academicYears.filter(ay => ay.status === 'upcoming')
);

export const selectInactiveAcademicYears = createSelector(
  [selectAllAcademicYears],
  (academicYears) => academicYears.filter(ay => ay.status === 'inactive')
);

// Selector for expired academic years (end date passed but not completed)
export const selectExpiredAcademicYears = createSelector(
  [selectAllAcademicYears],
  (academicYears) => {
    const today = new Date().toISOString().split('T')[0];
    return academicYears.filter(ay => 
      ay.end_date < today && ay.status !== 'completed'
    );
  }
);

// Selector for academic years by batch
export const selectAcademicYearsByBatch = (batchId: number) => 
  createSelector(
    [selectAllAcademicYears],
    (academicYears) => academicYears.filter(ay => ay.batch_id === batchId)
  );

// Selector for academic years by semester
export const selectAcademicYearsBySemester = (semesterId: number) => 
  createSelector(
    [selectAllAcademicYears],
    (academicYears) => academicYears.filter(ay => ay.semester_id === semesterId)
  );

// Selector for active or upcoming academic years
export const selectActiveOrUpcomingAcademicYears = createSelector(
  [selectAllAcademicYears],
  (academicYears) => academicYears.filter(ay => 
    ay.status === 'active' || ay.status === 'upcoming'
  )
);

// Selector for academic years by academic year string (e.g., "2023-2024")
export const selectAcademicYearsByYear = (academicYear: string) => 
  createSelector(
    [selectAllAcademicYears],
    (academicYears) => academicYears.filter(ay => ay.academic_year === academicYear)
  );

// Selector for academic years that are currently active (based on date)
export const selectCurrentlyActiveAcademicYears = createSelector(
  [selectAllAcademicYears],
  (academicYears) => {
    const today = new Date().toISOString().split('T')[0];
    return academicYears.filter(ay => 
      ay.start_date <= today && ay.end_date >= today && ay.status === 'active'
    );
  }
);

// Selector for academic year options (for dropdowns)
export const selectAcademicYearOptions = createSelector(
  [selectAllAcademicYears],
  (academicYears) => 
    academicYears.map(ay => ({
      value: ay.id.toString(),
      label: `${ay.semester} - ${ay.academic_year} (Batch ${ay.batch_year})`,
      semester_name: ay.semester,
      academic_year: ay.academic_year,
      batch_year: ay.batch_year
    }))
);

// Selector for unique academic year strings
export const selectUniqueAcademicYearStrings = createSelector(
  [selectAllAcademicYears],
  (academicYears) => {
    const years = academicYears.map(ay => ay.academic_year);
    return [...new Set(years)].sort((a, b) => b.localeCompare(a));
  }
);

// Selector for academic years grouped by academic year
export const selectAcademicYearsGroupedByYear = createSelector(
  [selectAllAcademicYears],
  (academicYears) => {
    const grouped: Record<string, AcademicYear[]> = {};
    
    academicYears.forEach(ay => {
      if (!grouped[ay.academic_year]) {
        grouped[ay.academic_year] = [];
      }
      grouped[ay.academic_year].push(ay);
    });
    
    return grouped;
  }
);

// Selector for academic years that need attention (expired but not completed)
export const selectAcademicYearsNeedingAttention = createSelector(
  [selectAllAcademicYears],
  (academicYears) => {
    const today = new Date().toISOString().split('T')[0];
    return academicYears.filter(ay => 
      ay.end_date < today && ay.status !== 'completed'
    );
  }
);

export default academicYearSlice.reducer;