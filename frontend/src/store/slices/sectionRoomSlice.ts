/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
  import { ReactNode } from 'react';
export interface SectionRoom {
  block_code: ReactNode;
  id: number;
  department_id: number | undefined;
  batch_id: number;
  section: string;
  room_id: number;
  created_at: string;
  updated_at: string;
  department_name?: string;
  batch_year?: number;
  room_number?: string;
  room_name?: string;
  room_type?: string;
  capacity?: number;
  facilities?: string[];
}

export interface SectionRoomFormData {
  room_type: any;
  department_id: number | undefined;
  batch_id: number;
  section: string;
  room_id: number;
}

interface SectionRoomState {
  sectionRooms: SectionRoom[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: SectionRoomState = {
  sectionRooms: [],
  loading: false,
  error: null,
  successMessage: null,
};
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Async thunks
export const fetchSectionRooms = createAsyncThunk(
  'sectionRooms/fetchSectionRooms',
  async () => {
    const response = await fetch(`${API_URL}/api/section-rooms`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch section rooms');
    }
    
    return data.data;
  }
);

export const createSectionRoom = createAsyncThunk(
  'sectionRooms/createSectionRoom',
  async (formData: SectionRoomFormData) => {
    const response = await fetch(`${API_URL}/api/section-rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create section room');
    }
    
    return data.data;
  }
);

export const updateSectionRoom = createAsyncThunk(
  'sectionRooms/updateSectionRoom',
  async ({ id, data }: { id: number; data: SectionRoomFormData }) => {
    const response = await fetch(`${API_URL}/api/section-rooms/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const responseData = await response.json();
    
    if (!responseData.success) {
      throw new Error(responseData.error || 'Failed to update section room');
    }
    
    return responseData.data;
  }
);

export const deleteSectionRoom = createAsyncThunk(
  'sectionRooms/deleteSectionRoom',
  async (id: number) => {
    const response = await fetch(`${API_URL}/api/section-rooms/${id}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete section room');
    }
    
    return id;
  }
);

const sectionRoomSlice = createSlice({
  name: ' ',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch section rooms
      .addCase(fetchSectionRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSectionRooms.fulfilled, (state, action: PayloadAction<SectionRoom[]>) => {
        state.loading = false;
        state.sectionRooms = action.payload;
      })
      .addCase(fetchSectionRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch section rooms';
      })
      
      // Create section room
      .addCase(createSectionRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSectionRoom.fulfilled, (state, action: PayloadAction<SectionRoom>) => {
        state.loading = false;
        state.sectionRooms = [action.payload, ...state.sectionRooms];
        state.successMessage = 'Section room assignment created successfully';
      })
      .addCase(createSectionRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create section room';
      })
      
      // Update section room
      .addCase(updateSectionRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSectionRoom.fulfilled, (state, action: PayloadAction<SectionRoom>) => {
        state.loading = false;
        const index = state.sectionRooms.findIndex(sr => sr.id === action.payload.id);
        if (index !== -1) {
          state.sectionRooms[index] = action.payload;
        }
        state.successMessage = 'Section room assignment updated successfully';
      })
      .addCase(updateSectionRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update section room';
      })
      
      // Delete section room
      .addCase(deleteSectionRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSectionRoom.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        state.sectionRooms = state.sectionRooms.filter(sr => sr.id !== action.payload);
        state.successMessage = 'Section room assignment deleted successfully';
      })
      .addCase(deleteSectionRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete section room';
      });
  },
});

export const { clearError, clearSuccessMessage } = sectionRoomSlice.actions;
export default sectionRoomSlice.reducer;