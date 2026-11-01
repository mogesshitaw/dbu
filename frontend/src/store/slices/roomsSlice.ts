/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Block interface extended with faculty info
export interface Block {
  block_id: number;
  block_name: string;
  block_code: string;
  floor_capacity: number;
  description?: string;
  building_name?: string;
  location?: string;
  status?: string;
  faculity_id?: number;
  faculity_name?: string;
  floor_count?: number;
  room_count?: number;
}

export interface Floor {
  room_count: number;
  floor_id: number;
  block_id: number;
  floor_number: number;
  room_capacity: number;
  block_name?: string;
  block_code?: string;
}

export interface Room {
  block_code: string;
  room_id: number;
  room_number: string;
  room_type: string;
  capacity?: number;
  is_available: boolean;
  floor_id: number;
  floor_number?: number;
  block_name?: string;
  block_id?: number;
}

// Interface for creating/updating rooms (without auto-generated and joined fields)
export interface RoomFormData {
  floor_id: number;
  room_number: string;
  room_type: string;
  capacity?: number;
  is_available: boolean;
}

interface RoomState {
  blocks: Block[];
  floors: Floor[];
  rooms: Room[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  facultyBlocks: Block[]; // Blocks assigned to a specific faculty
}

const initialState: RoomState = {
  blocks: [],
  floors: [],
  rooms: [],
  loading: false,
  error: null,
  successMessage: null,
  facultyBlocks: [],
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Async Thunks
export const fetchBlocks = createAsyncThunk(
  'rooms/fetchBlocks',
  async () => {
    const response = await fetch(`${API_URL}/api/blocks`);
    if (!response.ok) throw new Error('Failed to fetch blocks');
    return response.json();
  }
);

export const fetchFloors = createAsyncThunk(
  'rooms/fetchFloors',
  async (blockId?: number) => {
    let url = `${API_URL}/api/floors`;
    if (blockId) {
      url += `?block_id=${blockId}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch floors');
    return response.json();
  }
);
export const fetchFloorsByBlock = createAsyncThunk(
  'rooms/fetchFloors',
  async (blockId?: number) => {
    const  url = `${API_URL}/api/floors/block/${blockId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch floors');
    return response.json();
  }
);
export const addFloor = createAsyncThunk(
  "rooms/addFloor",
  async (floorData: Omit<Floor, "floor_id">, { rejectWithValue }) => {
    const response = await fetch(`${API_URL}/api/floors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(floorData),
    });

    const data = await response.json();

    // ✅ Handle expected conflicts gracefully
    if (response.status === 409) {
      return rejectWithValue(data.error);
    }

    if (!response.ok) {
      return rejectWithValue(data.error || "Failed to add floor");
    }

    return data;
  }
);

export const updateFloor = createAsyncThunk(
  'rooms/updateFloor',
  async ({ floorId, floorData }: { floorId: number; floorData: Partial<Floor> }) => {
    const response = await fetch(`${API_URL}/api/floors/${floorId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(floorData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update floor');
    }
    return response.json();
  }
);

export const deleteFloor = createAsyncThunk(
  'rooms/deleteFloor',
  async (floorId: number) => {
    const response = await fetch(`${API_URL}/api/floors/${floorId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete floor');
    }
    return { floorId };
  }
);

export const fetchRooms = createAsyncThunk(
  'rooms/fetchRooms',
  async (filters?: { blockId?: number; }) => {
    const params = new URLSearchParams();
    if (filters?.blockId) params.append('block_id', filters.blockId.toString());

    const url = `${API_URL}/api/rooms?${params.toString()}`;
    console.log('Fetching rooms from URL:', url);

    const response = await fetch(url);
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch rooms. Status:', response.status, 'Response:', errorText);
      throw new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Rooms data received:', data);
    return data;
  }
);
export const fetchRoomsWithDepBlocks = createAsyncThunk(
  'rooms/fetchRooms',
  async (filters?: { blockId?: number; }) => {
    const params = new URLSearchParams();
    if (filters?.blockId) params.append('block_id', filters.blockId.toString());

    const url = `${API_URL}/api/rooms?${params.toString()}`;
    console.log('Fetching rooms from URL:', url);

    const response = await fetch(url);
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch rooms. Status:', response.status, 'Response:', errorText);
      throw new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Rooms data received:', data);
    return data;
  }
);

export const addBlock = createAsyncThunk(
  'rooms/addBlock',
  async (blockData: Omit<Block, 'block_id'>) => {
    const response = await fetch(`${API_URL}/api/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blockData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add block');
    }
    return response.json();
  }
);

export const updateBlock = createAsyncThunk(
  'rooms/updateBlock',

  async ({ blockId, blockData }: { blockId: number; blockData: Partial<Block> }) => {
    console.log('Updating block with ID:', blockId);

    if (!blockId || isNaN(blockId)) {
      throw new Error('Invalid block ID');
    }

    const response = await fetch(`${API_URL}/api/blocks/${blockId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blockData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update block');
    }

    return response.json();
  }
);

export const deleteBlock = createAsyncThunk(
  'rooms/deleteBlock',
  async (blockId: number) => {
    console.log('Deleting block with ID:', blockId);

    if (!blockId || isNaN(blockId)) {
      throw new Error('Invalid block ID');
    }

    const response = await fetch(`${API_URL}/api/blocks/${blockId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete block');
    }

    return { blockId };
  }
);
// FIXED: Use RoomFormData instead of Omit<Room, 'room_id'>
export const addRoom = createAsyncThunk(
  'rooms/addRoom',
  async (roomData: RoomFormData) => {
    const response = await fetch(`${API_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add room ');
    } return response.json();
  }
);

// FIXED: Use Partial<RoomFormData> for updates instead of Partial<Room>
export const updateRoom = createAsyncThunk(
  'rooms/updateRoom',
  async ({ roomId, roomData }: { roomId: number; roomData: Partial<RoomFormData> }) => {
    const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update room');
    }
    return response.json();
  }
);

export const deleteRoom = createAsyncThunk(
  'rooms/deleteRoom',
  async (roomId: number) => {
    console.log('Deleting room with ID:', roomId);

    if (!roomId || isNaN(roomId)) {
      throw new Error('Invalid room ID');
    }

    const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete room');
    }

    return { roomId };
  }
);
// Get blocks assigned to a specific faculty
export const fetchFacultyBlocks = createAsyncThunk(
  'rooms/fetchFacultyBlocks',
  async (facultyId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/faculties/${facultyId}/blocks`);
      if (!response.ok) throw new Error('Failed to fetch faculty blocks');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
// Assign multiple blocks to a faculty
export const assignBlocksToFaculty = createAsyncThunk(
  'rooms/assignBlocksToFaculty',
  async (
    { facultyId, blockIds, status = 'active' }:
      { facultyId: number; blockIds: number[]; status?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/faculties/${facultyId}/blocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          block_ids: blockIds,
          status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign blocks ');
      }

      const data = await response.json();
      return { facultyId, blockIds, data };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
// Remove a block from faculty
export const removeBlockFromFaculty = createAsyncThunk(
  'rooms/removeBlockFromFaculty',
  async (
    { facultyId, blockId }:
      { facultyId: number; blockId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/faculties/${facultyId}/blocks/${blockId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove block');
      }

      return { facultyId, blockId };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
// Get all blocks with faculty info
export const fetchAllBlocksWithFaculty = createAsyncThunk(
  'rooms/fetchAllBlocksWithFaculty',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/blocks/with-faculty`);
      if (!response.ok) throw new Error('Failed to fetch blocks with faculty info');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
// Assign all rooms in a floor to a department
 export const assignFloorRoomsToDepartment = createAsyncThunk(
    'rooms/assignFloorRoomsToDepartment',
    async ({ departmentId, floorId, minCapacity }: { 
      departmentId: number; 
      floorId: number; 
      minCapacity?: number 
    },    { rejectWithValue }
    ) => {
    try {
      const response = await fetch(`${API_URL}/api/departments/${departmentId}/assign-floor/${floorId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        department_id: departmentId,
        floor_id: floorId,
        min_capacity: minCapacity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign rooms to department');
      }

      return response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
// Assign specific rooms to a department (existing - keep this)
export const assignRoomToDepartment = createAsyncThunk(
  'rooms/assignRoomToDepartment',
  async (
    { departmentId, roomIds, status = 'active' }:
      { departmentId: number; roomIds: number[]; status?: string },
    { rejectWithValue }
  ) => {
    try {
      console.log("array2", roomIds);
      const response = await fetch(`${API_URL}/api/departments/${departmentId}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          room_ids: roomIds,
          status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign rooms to department');
      }

      return response.json();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
export const fetchRoomsByFloorBlock = createAsyncThunk(
  'rooms/fetchRoomsByFloor',
  async ({floorId, blockId  }:{floorId: number, blockId :number },{ rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${floorId}/with/${blockId}/rooms`);
      if (!response.ok) throw new Error('Failed to fetch floor rooms');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
// Fetch rooms for a specific floor
export const fetchRoomsByFloor = createAsyncThunk(
  'rooms/fetchRoomsByFloor',
  async (floorId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/floors/${floorId}/rooms`);
      if (!response.ok) throw new Error('Failed to fetch floor rooms');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);
// Add these to your roomsSlice async thunks
export const fetchDepartmentRooms = createAsyncThunk(
  'rooms/fetchDepartmentRooms',
  async (departmentId: number, { rejectWithValue }) => {
    try {
      console.log(`Fetching rooms for department ID: ${departmentId}`);
      console.log(`Request URL: ${API_URL}/api/departments/${departmentId}/rooms`);

      const response = await fetch(`${API_URL}/api/departments/${departmentId}/rooms`);

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);

        // Try to parse as JSON if possible
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: errorText };
        }

        throw new Error(errorData.message || errorData.error || `Failed to fetch department rooms: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Successfully fetched ${data.length} rooms`);
      return data;
    } catch (error: any) {
      console.error('Error in fetchDepartmentRooms:', error);
      return rejectWithValue(error.message);
    }
  }
);
export const fetchRoomDepartment = createAsyncThunk(
  'rooms/fetchDepartmentRooms',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/api/departments/roomstodep`);
      const data = await response.json();
      if (!response.ok) return rejectWithValue(data.error || "Failed to fetch rooms");
      return data.rooms; // ✅ array of all rooms
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);


export const removeRoomFromDepartment = createAsyncThunk(
  'rooms/removeRoomFromDepartment',
  async (
    { departmentId, roomId }:
      { departmentId: number; roomId: number },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/departments/${departmentId}/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove room from department');
      }

      return { departmentId, roomId };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const roomSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    resetFacultyBlocks: (state) => {
      state.facultyBlocks = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // ================ EXISTING REDUCERS ================
      // Fetch blocks
      .addCase(fetchBlocks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBlocks.fulfilled, (state, action: PayloadAction<Block[]>) => {
        state.loading = false;
        state.blocks = action.payload;
      })
      .addCase(fetchBlocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch blocks';
      })

      // Fetch floors
      .addCase(fetchFloors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFloors.fulfilled, (state, action: PayloadAction<Floor[]>) => {
        state.loading = false;
        state.floors = action.payload;
      })
      .addCase(fetchFloors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch floors';
      })

      // Add floor
      .addCase(addFloor.fulfilled, (state, action: PayloadAction<Floor>) => {
        state.floors.push(action.payload);
        state.successMessage = 'Floor added successfully';
      })
      .addCase(addFloor.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add floor';
      })

      // Update floor
      .addCase(updateFloor.fulfilled, (state, action: PayloadAction<Floor>) => {
        const updatedFloor = action.payload;
        const index = state.floors.findIndex(f => f.floor_id === updatedFloor.floor_id);
        if (index !== -1) {
          state.floors[index] = updatedFloor;
        }
        state.successMessage = 'Floor updated successfully';
      })
      .addCase(updateFloor.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update floor';
      })

      // Delete floor
      .addCase(deleteFloor.fulfilled, (state, action: PayloadAction<{ floorId: number }>) => {
        state.floors = state.floors.filter(f => f.floor_id !== action.payload.floorId);
        state.successMessage = 'Floor deleted successfully';
      })
      .addCase(deleteFloor.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete floor';
      })

      // Fetch rooms
      .addCase(fetchRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRooms.fulfilled, (state, action: PayloadAction<Room[]>) => {
        state.loading = false;
        state.rooms = action.payload;
        state.error = null;
        console.log('Rooms set in state:', action.payload.length);
      })
      .addCase(fetchRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch rooms';
      })

      // Add block
      .addCase(addBlock.fulfilled, (state, action: PayloadAction<Block>) => {
        state.blocks.push(action.payload);
        state.successMessage = 'Block added successfully';
      })
      .addCase(addBlock.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add block';
      })
      // Add these to your roomsSlice extraReducers
      .addCase(fetchDepartmentRooms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentRooms.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(fetchDepartmentRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(removeRoomFromDepartment.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = 'Room removed from department successfully';
      })
      .addCase(removeRoomFromDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update block
      .addCase(updateBlock.fulfilled, (state, action: PayloadAction<Block>) => {
        const updatedBlock = action.payload;
        const index = state.blocks.findIndex(block => block.block_id === updatedBlock.block_id);
        if (index !== -1) {
          state.blocks[index] = updatedBlock;
        }
        state.successMessage = 'Block updated successfully';
      })
      .addCase(updateBlock.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update block';
      })

      // Delete block
      .addCase(deleteBlock.fulfilled, (state, action: PayloadAction<{ blockId: number }>) => {
        state.blocks = state.blocks.filter(block => block.block_id !== action.payload.blockId);
        state.successMessage = 'Block deleted successfully';
      })
      .addCase(deleteBlock.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete block';
      })

      // Add room
      .addCase(addRoom.fulfilled, (state, action: PayloadAction<Room>) => {
        state.rooms.push(action.payload);
        state.successMessage = 'Room added successfully';
      })
      .addCase(addRoom.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to add room';
      })

      // Update room
      .addCase(updateRoom.fulfilled, (state, action: PayloadAction<Room>) => {
        const updatedRoom = action.payload;
        const index = state.rooms.findIndex(room => room.room_id === updatedRoom.room_id);
        if (index !== -1) {
          state.rooms[index] = updatedRoom;
        }
        state.successMessage = 'Room updated successfully';
      })
      .addCase(updateRoom.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to update room';
      })

      // Delete room
      .addCase(deleteRoom.fulfilled, (state, action: PayloadAction<{ roomId: number }>) => {
        state.rooms = state.rooms.filter(room => room.room_id !== action.payload.roomId);
        state.successMessage = 'Room deleted successfully';
      })
      .addCase(deleteRoom.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete room';
      })

      // ================ NEW BLOCK-FACULTY REDUCERS ================
      // Fetch faculty blocks
      .addCase(fetchFacultyBlocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFacultyBlocks.fulfilled, (state, action: PayloadAction<Block[]>) => {
        state.loading = false;
        state.facultyBlocks = action.payload;
      })
      .addCase(fetchFacultyBlocks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Assign blocks to faculty
      .addCase(assignBlocksToFaculty.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(assignBlocksToFaculty.fulfilled, (state, action: PayloadAction<{ facultyId: number; blockIds: number[]; data: any }>) => {
        state.loading = false;
        state.successMessage = `Successfully assigned ${action.payload.blockIds.length} block(s) to faculty`;
      })
      .addCase(assignBlocksToFaculty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })

      // Remove block from faculty
      .addCase(removeBlockFromFaculty.pending, (state) => {
        state.loading = true;
        state.successMessage = null;
      })
      .addCase(removeBlockFromFaculty.fulfilled, (state, action: PayloadAction<{ facultyId: number; blockId: number }>) => {
        state.loading = false;
        state.facultyBlocks = state.facultyBlocks.filter(
          block => block.block_id !== action.payload.blockId
        );
        state.successMessage = 'Block removed from faculty';
      })
      .addCase(removeBlockFromFaculty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.successMessage = null;
      })

      // Fetch all blocks with faculty info
      .addCase(fetchAllBlocksWithFaculty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllBlocksWithFaculty.fulfilled, (state, action: PayloadAction<Block[]>) => {
        state.loading = false;
        state.blocks = action.payload;
      })
      .addCase(fetchAllBlocksWithFaculty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add this to your roomsSlice extraReducers
      .addCase(assignRoomToDepartment.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = 'Room assigned to department successfully';
      })
      .addCase(assignRoomToDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccessMessage, resetFacultyBlocks } = roomSlice.actions;
export default roomSlice.reducer;