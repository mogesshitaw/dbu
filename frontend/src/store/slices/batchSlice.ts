/* eslint-disable @typescript-eslint/no-unused-vars */
 
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

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

export interface AdmissionYear {
  id?: number;
  year: string;
  description?: string;
}

interface BatchState {
  batches: Batch[];
  admissionYears: AdmissionYear[];
  currentBatch: Batch | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: BatchState = {
  batches: [],
  admissionYears: [],
  currentBatch: null,
  loading: false,
  error: null,
  successMessage: null,
};

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Async Thunks
export const fetchBatches = createAsyncThunk(
  'batches/fetchBatches',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/batches`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch batches');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue('Network error: Failed to fetch batches');
    }
  }
);

export const fetchAdmissionYears = createAsyncThunk(
  'batches/fetchAdmissionYears',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/batches/admission-years`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch admission years');
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue('Network error: Failed to fetch admission years');
    }
  }
);

export const fetchBatchById = createAsyncThunk(
  'batches/fetchBatchById',
  async (batchId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/batches/${batchId}`);
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to fetch batch');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue('Network error: Failed to fetch batch');
    }
  }
);

export const createBatch = createAsyncThunk(
  'batches/createBatch',
  async (batchData: BatchFormData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to create batch');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue('Network error: Failed to create batch');
    }
  }
);

export const updateBatch = createAsyncThunk(
  'batches/updateBatch',
  async ({ batchId, batchData }: { batchId: number; batchData: Partial<BatchFormData> }, { rejectWithValue }) => {
    try {
      if (!batchId || isNaN(batchId)) {
        return rejectWithValue('Invalid batch ID');
      }

      const response = await fetch(`${API_URL}/api/batches/${batchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to update batch');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue('Network error: Failed to update batch');
    }
  }
);

export const deleteBatch = createAsyncThunk(
  'batches/deleteBatch',
  async (batchId: number, { rejectWithValue }) => {
    try {
      if (!batchId || isNaN(batchId)) {
        return rejectWithValue('Invalid batch ID');
      }

      const response = await fetch(`${API_URL}/api/batches/${batchId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || 'Failed to delete batch');
      }
      
      return { batchId };
    } catch (error) {
      return rejectWithValue('Network error: Failed to delete batch');
    }
  }
);

const batchesSlice = createSlice({
  name: 'batches',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setCurrentBatch: (state, action) => {
      state.currentBatch = action.payload;
    },
    clearCurrentBatch: (state) => {
      state.currentBatch = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch batches
      .addCase(fetchBatches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatches.fulfilled, (state, action) => {
        state.loading = false;
        state.batches = action.payload.data;
        state.error = null;
      })
      .addCase(fetchBatches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch batch by ID
      .addCase(fetchBatchById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatchById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBatch = action.payload;
        state.error = null;
      })
      .addCase(fetchBatchById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create batch
      .addCase(createBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBatch.fulfilled, (state, action) => {
        state.loading = false;
        state.batches.push(action.payload.data);
        state.successMessage = 'Batch created successfully';
        state.error = null;
        state.currentBatch = action.payload.data;
      })
      .addCase(createBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update batch
      .addCase(updateBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBatch.fulfilled, (state, action) => {
        state.loading = false;
        const updatedBatch = action.payload.data;
        const index = state.batches.findIndex(batch => batch.batch_id === updatedBatch.batch_id);
        if (index !== -1) {
          state.batches[index] = updatedBatch;
        }
        state.currentBatch = updatedBatch;
        state.successMessage = 'Batch updated successfully';
        state.error = null;
      })
      .addCase(updateBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete batch
      .addCase(deleteBatch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBatch.fulfilled, (state, action) => {
        state.loading = false;
        state.batches = state.batches.filter(batch => batch.batch_id !== action.payload.batchId);
        if (state.currentBatch && state.currentBatch.batch_id === action.payload.batchId) {
          state.currentBatch = null;
        }
        state.successMessage = 'Batch deleted successfully';
        state.error = null;
      })
      .addCase(deleteBatch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch admission years
      .addCase(fetchAdmissionYears.fulfilled, (state, action) => {
        state.admissionYears = action.payload.data || [];
      });
  },
});

export const { clearError, clearSuccessMessage, setCurrentBatch, clearCurrentBatch } = batchesSlice.actions;

// Selectors with proper typing
export const selectBatches = (state: { batches: BatchState }) => state.batches.batches;
export const selectAdmissionYears = (state: { batches: BatchState }) => state.batches.admissionYears;
export const selectBatchesLoading = (state: { batches: BatchState }) => state.batches.loading;
export const selectBatchesError = (state: { batches: BatchState }) => state.batches.error;
export const selectBatchesSuccessMessage = (state: { batches: BatchState }) => state.batches.successMessage;
export const selectCurrentBatch = (state: { batches: BatchState }) => state.batches.currentBatch;
export const selectBatchById = (batchId: number) => (state: { batches: BatchState }) => 
  state.batches.batches.find((batch: Batch) => batch.batch_id === batchId);

export default batchesSlice.reducer;