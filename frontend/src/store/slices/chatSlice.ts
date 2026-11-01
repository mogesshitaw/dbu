/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/slices/chatSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Interfaces
export interface RootState {
  chat: ChatState;
  auth: any;
}

export interface UserContact {
  selectedContact(selectedContact: any): { payload: UserContact | null; type: "chat/setSelectedContact"; };
  name: any;
  role: string;
  id: number;
  type: any;
  user_id: number;
  status: string;
  contact_id: number;
  is_favorite: boolean;
  is_blocked: boolean;
  last_interaction: string;
  message_count: number;
  contact_name: string;
  contact_role: string;
  department_id: number;
  department_name: string;
  avatar_url: string;
  is_online: boolean;
  last_seen: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

export interface DirectMessage {
  id: number;
  sender_id: number;
  receiver_id: number;
  status: string;
  message_type: 'text' | 'image' | 'file';
  message: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  mime_type: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender_name: string;
  sender_avatar: string | null;
  sender_role: string;
  receiver_name: string;
  receiver_avatar: string | null;
  receiver_role: string;
}

export interface ChatState {
  contacts: UserContact[];
  messages: Record<number, DirectMessage[]>;
  selectedContact: UserContact | null;
  searchResults: any[];
  unreadCount: number;
  loading: boolean;
  sending: boolean;
  error: string | null;
  filters: {
    type: string | null;
    department: string | null;
    favorite: boolean | null;
    online: boolean | null;
    search: string;
  };
}

const initialState: ChatState = {
  contacts: [],
  messages: {},
  selectedContact: null,
  searchResults: [],
  unreadCount: 0,
  loading: false,
  sending: false,
  error: null,
  filters: {
    type: null,
    department: null,
    favorite: null,
    online: null,
    search: '',
  },
};

// Helper functions
const getApiUrl = () => {
  return `${process.env.NEXT_PUBLIC_API_URL}` || 'http://localhost:5000';
};

const getAuthHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
  };
};

// Async thunks - EACH ONE DEFINED ONLY ONCE
export const fetchContacts = createAsyncThunk(
  'chat/fetchContacts',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(
        `${getApiUrl()}/api/chat/contacts?${queryParams}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.error || `Failed to fetch contacts: ${response.status}`
        );
      }

      return await response.json();
    } catch (err: any) {
      console.error('Fetch contacts error:', err);
      return rejectWithValue(
        err.message || 'Network error. Please check your connection.'
      );
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (
    { contactId, page = 1 }: { contactId: number; page?: number },
    { rejectWithValue }
  ) => {
    try {
      const limit = 50;
      const offset = (page - 1) * limit;

      const response = await fetch(
        `${getApiUrl()}/api/chat/messages/${contactId}?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.error || `Failed to fetch messages: ${response.status}`
        );
      }

      const messages = await response.json();
      return {
        contactId,
        messages,
        page,
        hasMore: messages.length === limit,
      };
    } catch (err: any) {
      console.error('Fetch messages error:', err);
      return rejectWithValue(
        err.message || 'Network error. Please check your connection.'
      );
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    messageData: {
      receiver_id: number;
      message: string;
      message_type?: 'text' | 'image' | 'file';
      file_url?: string;
      file_name?: string;
      file_size?: number;
      mime_type?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/chat/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          message_type: 'text',
          ...messageData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.error || `Failed to send message: ${response.status}`
        );
      }

      return await response.json();
    } catch (err: any) {
      console.error('Send message error:', err);
      return rejectWithValue(
        err.message || 'Network error. Please check your connection.'
      );
    }
  }
);

export const markAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (contactId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/api/chat/messages/read/${contactId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.error || `Failed to mark as read: ${response.status}`
        );
      }

      return {
        contactId,
        ...(await response.json()),
      };
    } catch (err: any) {
      console.error('Mark as read error:', err);
      return rejectWithValue(
        err.message || 'Network error. Please check your connection.'
      );
    }
  }
);

export const updateMessage = createAsyncThunk(
  'chat/updateMessage',
  async (
    { messageId, message }: { messageId: number; message: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/api/chat/messages/${messageId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({ message }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.error || `Failed to update message: ${response.status}`
        );
      }

      return await response.json();
    } catch (err: any) {
      console.error('Update message error:', err);
      return rejectWithValue(
        err.message || 'Network error. Please check your connection.'
      );
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/api/chat/messages/${messageId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.error || `Failed to delete message: ${response.status}`
        );
      }

      return {
        messageId,
        ...(await response.json()),
      };
    } catch (err: any) {
      console.error('Delete message error:', err);
      return rejectWithValue(
        err.message || 'Network error. Please check your connection.'
      );
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/api/chat/messages/unread/count`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.error || `Failed to fetch unread count: ${response.status}`
        );
      }

      return await response.json();
    } catch (err: any) {
      console.error('Fetch unread count error:', err);
      return rejectWithValue(
        err.message || 'Network error. Please check your connection.'
      );
    }
  }
);

export const searchContacts = createAsyncThunk(
  'chat/searchContacts',
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/api/chat/contacts/search?query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.error || `Failed to search contacts: ${response.status}`
        );
      }

      return await response.json();
    } catch (err: any) {
      console.error('Search contacts error:', err);
      return rejectWithValue(
        err.message || 'Network error. Please check your connection.'
      );
    }
  }
);

export const updateContact = createAsyncThunk(
  'chat/updateContact',
  async (
    { contactId, updates }: { contactId: number; updates: Partial<UserContact> },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/api/chat/contacts/${contactId}`,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.error || `Failed to update contact: ${response.status}`
        );
      }

      return await response.json();
    } catch (err: any) {
      console.error('Update contact error:', err);
      return rejectWithValue(
        err.message || 'Network error. Please check your connection.'
      );
    }
  }
);

export const deleteContact = createAsyncThunk(
  'chat/deleteContact',
  async (contactId: number, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/api/chat/contacts/${contactId}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.error || `Failed to delete contact: ${response.status}`
        );
      }

      return {
        contactId,
        ...(await response.json()),
      };
    } catch (err: any) {
      console.error('Delete contact error:', err);
      return rejectWithValue(
        err.message || 'Network error. Please check your connection.'
      );
    }
  }
);

export const createContact = createAsyncThunk(
  'chat/createContact',
  async (
    contactData: {
      contact_id: number;
      is_favorite?: boolean;
      message?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/chat/contacts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          is_favorite: false,
          ...contactData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.error || `Failed to create contact: ${response.status}`
        );
      }

      return await response.json();
    } catch (err: any) {
      console.error('Create contact error:', err);
      return rejectWithValue(
        err.message || 'Network error. Please check your connection.'
      );
    }
  }
);
export const respondToContactRequest = createAsyncThunk(
  'chat/respondToContactRequest',
  async (
    { contactId, action }: { contactId: number; action: 'accept' | 'reject' | 'cancel' },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(
        `${getApiUrl()}/api/chat/contacts/${contactId}/respond`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return rejectWithValue(
          errorData?.error || `Failed to respond to contact request: ${response.status}`
        );
      }

      return {
        contactId,
        action,
        ...(await response.json()),
      };
    } catch (err: any) {
      console.error('Respond to contact request error:', err);
      return rejectWithValue(
        err.message || 'Network error. Please check your connection.'
      );
    }
  }
);

// Slice definition
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearLoading: (state) => {
      state.loading = false;
      state.sending = false;
    },
     updateContactStatus: (state, action: PayloadAction<{ 
      contactId: number; 
      status: string;
      updatedBy?: number;
    }>) => {
      const { contactId, status } = action.payload;
      
      // Update in contacts list
      const contactIndex = state.contacts.findIndex(c => 
        c.contact_id === contactId || c.id === contactId
      );
      if (contactIndex !== -1) {
        state.contacts[contactIndex].status = status;
      }
      
      // Update selected contact if applicable
      if (state.selectedContact && 
          (state.selectedContact.contact_id === contactId || 
           state.selectedContact.id === contactId)) {
        state.selectedContact.status = status;
      }
    },
  
    setSelectedContact: (state, action: PayloadAction<UserContact | null>) => {
      state.selectedContact = action.payload;
      
      // Mark messages as read locally
      if (action.payload) {
        const contactId = action.payload.contact_id || action.payload.id;
        if (contactId && state.messages[contactId]) {
          state.messages[contactId] = state.messages[contactId].map(msg => ({
            ...msg,
            is_read: true,
          }));
          
          // Update unread count in contacts
          const contactIndex = state.contacts.findIndex(c => 
            c.contact_id === contactId || c.id === contactId
          );
          if (contactIndex !== -1) {
            state.contacts[contactIndex].unread_count = 0;
          }
        }
      }
    },
    setFilters: (state, action: PayloadAction<Partial<ChatState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    
    addNewMessage: (state, action: PayloadAction<{ contactId: number; message: DirectMessage }>) => {
      const { contactId, message } = action.payload;
      
      if (!state.messages[contactId]) {
        state.messages[contactId] = [];
      }
      
      state.messages[contactId].unshift(message);
      
      // Update contact
      const contactIndex = state.contacts.findIndex(c => 
        c.contact_id === contactId || c.id === contactId
      );
      if (contactIndex !== -1) {
        state.contacts[contactIndex].last_message = message.message;
        state.contacts[contactIndex].last_message_time = message.created_at;
        state.contacts[contactIndex].last_interaction = new Date().toISOString();
        
        if (message.sender_id === contactId) {
          state.contacts[contactIndex].unread_count = (state.contacts[contactIndex].unread_count || 0) + 1;
          state.unreadCount += 1;
        }
      }
    },
    resetChatState: (state) => {
      Object.assign(state, initialState);
    },
  },
  
  extraReducers: (builder) => {
    // Fetch Contacts
    builder.addCase(fetchContacts.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchContacts.fulfilled, (state, action) => {
      state.loading = false;
      state.contacts = action.payload;
    });
    builder.addCase(fetchContacts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Messages
    builder.addCase(fetchMessages.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      state.loading = false;
      const { contactId, messages } = action.payload;
      state.messages[contactId] = messages;
    });
    builder.addCase(fetchMessages.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Send Message
    builder.addCase(sendMessage.pending, (state) => {
      state.sending = true;
      state.error = null;
    });
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.sending = false;
      const message = action.payload;
      const contactId = message.receiver_id;
      
      if (!state.messages[contactId]) {
        state.messages[contactId] = [];
      }
      
      state.messages[contactId].unshift(message);
      
      // Update contact
      const contactIndex = state.contacts.findIndex(c => 
        c.contact_id === contactId || c.id === contactId
      );
      if (contactIndex !== -1) {
        state.contacts[contactIndex].last_message = message.message;
        state.contacts[contactIndex].last_message_time = message.created_at;
        state.contacts[contactIndex].last_interaction = new Date().toISOString();
      }
    });
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.sending = false;
      state.error = action.payload as string;
    });

    // Mark as Read
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const { contactId } = action.payload;
      
      // Update unread count
      const contactIndex = state.contacts.findIndex(c => 
        c.contact_id === contactId || c.id === contactId
      );
      if (contactIndex !== -1) {
        state.contacts[contactIndex].unread_count = 0;
      }
      
      // Update messages
      if (state.messages[contactId]) {
        state.messages[contactId] = state.messages[contactId].map(msg => ({
          ...msg,
          is_read: true,
        }));
      }
    });

    // Update Message
    builder.addCase(updateMessage.fulfilled, (state, action) => {
      const updatedMessage = action.payload;
      
      // Find and update the message
      Object.keys(state.messages).forEach(key => {
        const contactId = parseInt(key);
        const messageIndex = state.messages[contactId].findIndex(m => m.id === updatedMessage.id);
        if (messageIndex !== -1) {
          state.messages[contactId][messageIndex] = updatedMessage;
        }
      });
    });

    // Create Contact
    builder.addCase(createContact.pending, (state) => {
      state.sending = true;
      state.error = null;
    });
    builder.addCase(createContact.fulfilled, (state, action) => {
      state.sending = false;
      const newContact = action.payload;
      
      // Add to contacts if not already there
      const existingIndex = state.contacts.findIndex(c => 
        c.contact_id === newContact.contact_id || c.id === newContact.id
      );
      
      if (existingIndex === -1) {
        state.contacts.unshift(newContact);
      } else {
        state.contacts[existingIndex] = newContact;
      }
    });
    builder.addCase(createContact.rejected, (state, action) => {
      state.sending = false;
      state.error = action.payload as string;
    });
    
    // Respond to Contact Request
    builder.addCase(respondToContactRequest.pending, (state) => {
      state.sending = true;
      state.error = null;
    });
    builder.addCase(respondToContactRequest.fulfilled, (state, action) => {
      state.sending = false;
      const { contactId, action: requestAction } = action.payload;
      
      // Remove contact if rejected or cancelled
      if (requestAction === 'reject' || requestAction === 'cancel') {
        state.contacts = state.contacts.filter(c => 
          c.contact_id !== contactId && c.id !== contactId
        );
        
        // Clear selected contact if it was the rejected one
        if (state.selectedContact && 
            (state.selectedContact.contact_id === contactId || 
             state.selectedContact.id === contactId)) {
          state.selectedContact = null;
        }
      } else if (requestAction === 'accept') {
        // Update status to 'accepted'
        const contactIndex = state.contacts.findIndex(c => 
          c.contact_id === contactId || c.id === contactId
        );
        if (contactIndex !== -1) {
          state.contacts[contactIndex].status = 'accepted';
        }
        
        // Update selected contact if applicable
        if (state.selectedContact && 
            (state.selectedContact.contact_id === contactId || 
             state.selectedContact.id === contactId)) {
          state.selectedContact.status = 'accepted';
        }
      }
    });
    builder.addCase(respondToContactRequest.rejected, (state, action) => {
      state.sending = false;
      state.error = action.payload as string;
    });
  

// Export new action

    // Delete Message
    builder.addCase(deleteMessage.fulfilled, (state, action) => {
      const { messageId } = action.payload;
      
      // Find and mark as deleted
      Object.keys(state.messages).forEach(key => {
        const contactId = parseInt(key);
        const messageIndex = state.messages[contactId].findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          state.messages[contactId][messageIndex] = {
            ...state.messages[contactId][messageIndex],
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            message: 'This message was deleted',
          };
        }
      });
    });

    // Fetch Unread Count
    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload.unread_count || 0;
    });

    // Search Contacts
    builder.addCase(searchContacts.fulfilled, (state, action) => {
      state.searchResults = action.payload;
    });

    // Update Contact
    builder.addCase(updateContact.fulfilled, (state, action) => {
      const updatedContact = action.payload;
      const contactIndex = state.contacts.findIndex(c => c.id === updatedContact.id);
      if (contactIndex !== -1) {
        state.contacts[contactIndex] = updatedContact;
      }
    });

    // Delete Contact
    builder.addCase(deleteContact.fulfilled, (state, action) => {
      const { contactId } = action.payload;
      state.contacts = state.contacts.filter(c => c.id !== contactId);
      
      // Clear selected if deleted
      if (state.selectedContact?.id === contactId) {
        state.selectedContact = null;
      }
    });
  },
});

// Export actions
export const {
  clearError,
  clearLoading,
  setSelectedContact,
  setFilters,
  clearSearchResults,
  addNewMessage,
  resetChatState,
  updateContactStatus,

} = chatSlice.actions;

// Selectors
export const selectContacts = (state: RootState) => state.chat.contacts;
export const selectMessages = (state: RootState) => state.chat.messages;
export const selectSelectedContact = (state: RootState) => state.chat.selectedContact;
export const selectSearchResults = (state: RootState) => state.chat.searchResults;
export const selectUnreadCount = (state: RootState) => state.chat.unreadCount;
export const selectChatLoading = (state: RootState) => state.chat.loading;
export const selectChatSending = (state: RootState) => state.chat.sending;
export const selectChatError = (state: RootState) => state.chat.error;
export const selectChatFilters = (state: RootState) => state.chat.filters;

// Export reducer
export default chatSlice.reducer;