import { io } from 'socket.io-client';
import { store } from '../store';
import { addMessage, updateMessageStatus } from '../store/slices/chatSlice';

class SocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
  }

  connect(userId, token) {
    if (this.socket) {
      this.disconnect();
    }

    this.userId = userId;
    this.socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    this.setupListeners();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  setupListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      store.dispatch(updateOnlineStatus({ onlineStatus: true }));
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      store.dispatch(updateOnlineStatus({ onlineStatus: false, statusMessage: 'Offline' }));
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Chat events
    this.socket.on('new_message', (message) => {
      store.dispatch(addMessage({
        contactId: message.sender_id,
        message: {
          ...message,
          is_read: false
        }
      }));
    });

    this.socket.on('message_read', ({ messageId, readAt }) => {
      const state = store.getState();
      const currentContactId = state.chat.currentConversation?.contact_id;
      
      if (currentContactId) {
        store.dispatch(updateMessageStatus({
          contactId: currentContactId,
          messageId,
          updates: { is_read: true, read_at: readAt }
        }));
      }
    });

    this.socket.on('user_status_change', ({ userId, onlineStatus, statusMessage }) => {
      // Update conversation status
      const state = store.getState();
      const conversationIndex = state.chat.conversations.findIndex(
        c => c.contact_id === userId
      );
      
      if (conversationIndex !== -1) {
        // You might want to create a separate action for this
        const conversations = [...state.chat.conversations];
        conversations[conversationIndex] = {
          ...conversations[conversationIndex],
          online_status: onlineStatus,
          status_message: statusMessage
        };
        // Dispatch an action to update conversations
      }
    });

    this.socket.on('typing', ({ userId, isTyping }) => {
      // Handle typing indicator
      console.log(`User ${userId} is ${isTyping ? 'typing' : 'not typing'}`);
    });
  }

  sendMessage(message) {
    if (this.socket) {
      this.socket.emit('send_message', message);
    }
  }

  markAsRead(contactId) {
    if (this.socket) {
      this.socket.emit('mark_read', { contactId });
    }
  }

  updateTyping(contactId, isTyping) {
    if (this.socket) {
      this.socket.emit('typing', { contactId, isTyping });
    }
  }

  updateStatus(status) {
    if (this.socket) {
      this.socket.emit('update_status', status);
    }
  }
}

export default new SocketService();