/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Container,
  Paper,
  Text,
  Avatar,
  Badge,
  ScrollArea,
  Stack,
  TextInput,
  Textarea,
  Button,
  ActionIcon,
  Loader,
  Menu,
  Tabs,
  Select,
  Group,
  Notification,
  Modal,
  SimpleGrid,
  Card,
  SegmentedControl,
  Tooltip,
  Center,
  RingProgress,
  UnstyledButton,
  Box,
  rem,
} from "@mantine/core";
import {
  IconMessageCircle,
  IconSearch,
  IconSend,
  IconDotsVertical,
  IconPhone,
  IconVideo,
  IconInfoCircle,
  IconUsers,
  IconBuilding,
  IconShield,
  IconPin,
  IconArchive,
  IconTrash,
  IconBell,
  IconCalendar,
  IconCircleFilled,
  IconPencil,
  IconX,
  IconAlertCircle,
  IconUserPlus,
  IconCheck,
  IconUser,
  IconUserOff,
  IconUserCheck,
  IconRefresh,
  IconSortAscending,
  IconSortDescending,
  IconClock,
  IconMail,
  IconThumbUp,
  IconThumbDown,
  IconHandStop,
  IconChevronRight,
  IconStar,
  IconStarFilled,
  IconUserX,
} from "@tabler/icons-react";
import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchContacts,
  fetchMessages,
  sendMessage,
  setSelectedContact,
  setFilters,
  clearError,
  selectContacts,
  selectMessages,
  selectSelectedContact,
  selectChatLoading,
  selectChatSending,
  selectChatError,
  selectUnreadCount,
  selectChatFilters,
  updateMessage,
  deleteMessage,
  markAsRead,
  RootState,
  UserContact,
  createContact,
  respondToContactRequest,
  updateContactStatus,
} from "@/store/slices/chatSlice";
import { AppDispatch } from "@/store";
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  department_name: string;
  department_id: number;
  is_online: boolean;
  last_seen: string;
  avatar_url: string;
  contact_status: string;
  is_contact_initiated_by_me: boolean;
  is_favorite: boolean;
  is_blocked: boolean;
}

export default function UnifiedChatPage() {
  const dispatch = useDispatch<AppDispatch>();
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState<string | null>("all");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editMessageText, setEditMessageText] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [allUsersList, setAllUsersList] = useState<User[]>([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [joinModalOpened, setJoinModalOpened] = useState(false);
  const [userView, setUserView] = useState<'all' | 'connected' | 'pending' | 'not-connected'>('all');
  const [joinLoading, setJoinLoading] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'department'>('name');
  const [respondLoading, setRespondLoading] = useState<number | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redux selectors
  const contacts = useSelector((state: RootState) => selectContacts(state));
  const messages = useSelector((state: RootState) => selectMessages(state));
  const selectedContact = useSelector((state: RootState) => selectSelectedContact(state));
  const loading = useSelector((state: RootState) => selectChatLoading(state));
  const sending = useSelector((state: RootState) => selectChatSending(state));
  const error = useSelector((state: RootState) => selectChatError(state));
  const unreadCount = useSelector((state: RootState) => selectUnreadCount(state));
  const filters = useSelector((state: RootState) => selectChatFilters(state));

  // Current user state
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filter contacts based on status
  const pendingContacts = contacts.filter((contact: UserContact) => 
    contact.status === 'pending'
  );

  const requestedContacts = contacts.filter((contact: UserContact) => 
    contact.status === 'request'
  );

  const acceptedContacts = contacts.filter((contact: UserContact) => 
    contact.status === 'accepted'
  );

  // const favoriteContacts = contacts.filter((contact: UserContact) => 
  //   contact.is_favorite && contact.status === 'accepted'
  // );
  // Fetch all users for join functionality
  const fetchAllUsersList = useCallback(async () => {
    if (!currentUser) return;
    
    setAllUsersLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/chat/users/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAllUsersList(data);
      }
    } catch (err) {
      console.error('Failed to fetch all users:', err);
    } finally {
      setAllUsersLoading(false);
    }
  }, [currentUser]);

  // Auth check with session
// Auth check with session
useEffect(() => {
  const checkAuth = async () => {
    try {
      const foundUser = await Found();
      setCurrentUser(foundUser);
      
      if (foundUser) {
        setConnectionStatus('connected');
        // fetch users only if user exists
        const response = await fetch(`${API_URL}/api/chat/users/all`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setAllUsersList(data);
        }
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setConnectionStatus('disconnected');
    }
  };

  checkAuth();
}, []); // ✅ empty dependency array
  // Fetch contacts on mount and when filters change
 useEffect(() => {
  if (currentUser && connectionStatus === 'connected') {
    const filtersString = JSON.stringify(filters);
    dispatch(fetchContacts({
      ...JSON.parse(filtersString),
      department: filterDepartment === "all" ? null : filterDepartment,
    }))
      .unwrap()
      .catch((err: unknown) => {
        // ...
      });
  }
}, [dispatch, currentUser, filterDepartment, connectionStatus, JSON.stringify(filters)]);
  // Fetch messages when contact is selected
  useEffect(() => {
    if (selectedContact && connectionStatus === 'connected') {
      const contactId = selectedContact.contact_id || selectedContact.id;
      
      if (contactId && selectedContact.status === 'accepted') {
        dispatch(fetchMessages({ contactId })).catch((err: any) => {
          console.error('Failed to fetch messages:', err);
        });
        
        dispatch(markAsRead(contactId)).catch((err: any) => {
          console.error('Failed to mark as read:', err);
        });
      }
    }
  }, [dispatch, selectedContact, connectionStatus]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedContact]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Handle join chat (send contact request)
  const handleJoinChat = async (userId: number) => {
    setJoinLoading(userId);
    try {
      await dispatch(createContact({
        contact_id: userId,
        is_favorite: false,
      })).unwrap();
      
      // Update local state
      dispatch(updateContactStatus({ 
        contactId: userId, 
        status: 'request',
        updatedBy: currentUser.id
      }));
      
      // Update all users list
      setAllUsersList(prev => prev.map(user => 
        user.id === userId ? { 
          ...user, 
          contact_status: 'request',
          is_contact_initiated_by_me: true 
        } : user
      ));
      
      // Show success notification
      dispatch(clearError());
      
    } catch (err: any) {
      console.error('Failed to send contact request:', err);
    } finally {
      setJoinLoading(null);
    }
  };

  // Handle accept contact request
  const handleAcceptRequest = async (contactId: number) => {
    setRespondLoading(contactId);
    try {
      await dispatch(respondToContactRequest({ 
        contactId, 
        action: 'accept' 
      })).unwrap();
      
      // Update local state
      dispatch(updateContactStatus({ 
        contactId, 
        status: 'accepted' 
      }));
      
      // Update all users list
      setAllUsersList(prev => prev.map(user => 
        user.id === contactId ? { 
          ...user, 
          contact_status: 'accepted',
          is_contact: true 
        } : user
      ));
      
    } catch (err: any) {
      console.error('Failed to accept request:', err);
    } finally {
      setRespondLoading(null);
    }
  };

  // Handle reject contact request
  const handleRejectRequest = async (contactId: number) => {
    setRespondLoading(contactId);
    try {
      await dispatch(respondToContactRequest({ 
        contactId, 
        action: 'reject' 
      })).unwrap();
      
      // Remove from local contacts list (Redux will handle this)
      // Update all users list
      setAllUsersList(prev => prev.map(user => 
        user.id === contactId ? { 
          ...user, 
          contact_status: 'not_contact',
          is_contact: false 
        } : user
      ));
      
    } catch (err: any) {
      console.error('Failed to reject request:', err);
    } finally {
      setRespondLoading(null);
    }
  };

  // Handle cancel request (when user wants to cancel their own request)
  const handleCancelRequest = async (contactId: number) => {
    setRespondLoading(contactId);
    try {
      await dispatch(respondToContactRequest({ 
        contactId, 
        action: 'cancel' 
      })).unwrap();
      
      // Remove from local contacts list (Redux will handle this)
      // Update all users list
      setAllUsersList(prev => prev.map(user => 
        user.id === contactId ? { 
          ...user, 
          contact_status: 'not_contact',
          is_contact: false 
        } : user
      ));
      
    } catch (err: any) {
      console.error('Failed to cancel request:', err);
    } finally {
      setRespondLoading(null);
    }
  };

  // Handle leave chat (remove accepted contact)
  const handleLeaveChat = async (contactId: number) => {
    if (confirm("Are you sure you want to remove this contact? You won't be able to message them until you send a new request.")) {
      try {
        const response = await fetch(`http://localhost:5000/api/chat/contacts/${contactId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          // Refresh contacts list
          dispatch(fetchContacts({
            ...filters,
            department: filterDepartment === "all" ? null : filterDepartment,
          }));
          
          // Update all users list
          setAllUsersList(prev => prev.map(user => 
            user.id === contactId ? { 
              ...user, 
              contact_status: 'not_contact',
              is_contact: false 
            } : user
          ));
        }
      } catch (err) {
        console.error('Leave chat error:', err);
      }
    }
  };

  // Filter users based on various criteria
  const filteredUsers = contacts.filter((user: { 
    contact_name: string; 
    contact_role: string; 
    department_name: string; 
    status: string;
    is_favorite: boolean;
  }) => {
    const matchesSearch = 
      user.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.contact_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department_name && user.department_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTab = 
      activeTab === "all" ? true :
      activeTab === "favorites" ? user.is_favorite && user.status === 'accepted' :
      activeTab === "connected" ? user.status === 'accepted' :
      activeTab === "pending" ? user.status === 'pending' :
      activeTab === "requested" ? user.status === 'request' :
      activeTab === "instructors" ? user.contact_role === "instructor" :
      activeTab === "department_heads" ? user.contact_role === "department_head" :
      activeTab === "admins" ? user.contact_role === "admin" : true;
    
    return matchesSearch && matchesTab;
  });

  // Filter all users for join modal
  const filteredAllUsers = allUsersList.filter((user: User) => {
    // Apply search filter
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.department_name && user.department_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Apply view filter
    const matchesView = 
      userView === 'all' ? true :
      userView === 'connected' ? user.contact_status === 'accepted' :
      userView === 'pending' ? (user.contact_status === 'pending' || user.contact_status === 'request') :
      userView === 'not-connected' ? (user.contact_status === 'not_contact' || !user.contact_status) : true;
    
    return matchesSearch && matchesView;
  }).sort((a, b) => {
    // Apply sorting
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.full_name || '';
        bValue = b.full_name || '';
        break;
      case 'role':
        aValue = a.role || '';
        bValue = b.role || '';
        break;
      case 'department':
        aValue = a.department_name || '';
        bValue = b.department_name || '';
        break;
      default:
        aValue = a.full_name || '';
        bValue = b.full_name || '';
    }
    
    const comparison = aValue.localeCompare(bValue);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const departments = ["all", ...new Set(contacts.map((user: { department_name: any; }) => user.department_name).filter(Boolean))];

const handleSendMessage = () => {
  if (newMessage.trim() && selectedContact && currentUser) {
    const contactId = selectedContact.contact_id || selectedContact.id;

    if (contactId && selectedContact.status === 'accepted') {
      dispatch(sendMessage({
        receiver_id: contactId,
        message: newMessage.trim(),
      })).then(() => {
        setNewMessage("");
        
        // Find and update the contact in the filteredUsers list
        const updatedContact = filteredUsers.find((user: UserContact) => 
          user.contact_id === contactId || user.id === contactId
        );
        
        if (updatedContact) {
          // Update the selected contact with latest data
          dispatch(setSelectedContact({
            ...updatedContact,
            last_message: newMessage.trim(),
            last_message_time: new Date().toISOString(),
            last_interaction: new Date().toISOString(),
          }));
        }
        
      }).catch((err: any) => {
        console.error('Failed to send message:', err);
      });
    }
  }
};
  const handleEditMessage = (messageId: number, currentText: string) => {
    setEditingMessageId(messageId);
    setEditMessageText(currentText);
  };

  const handleSaveEdit = () => {
    if (editingMessageId && editMessageText.trim()) {
      dispatch(updateMessage({
        messageId: editingMessageId,
        message: editMessageText.trim(),
      })).then(() => {
        setEditingMessageId(null);
        setEditMessageText("");
      }).catch((err: any) => {
        console.error('Failed to update message:', err);
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditMessageText("");
  };

  const handleDeleteMessage = (messageId: number) => {
    if (confirm("Are you sure you want to delete this message?")) {
      dispatch(deleteMessage(messageId)).catch((err: any) => {
        console.error('Failed to delete message:', err);
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'instructor': return 'blue';
      case 'department_head': return 'green';
      case 'admin': return 'violet';
      case 'student': return 'orange';
      default: return 'gray';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'instructor': return <IconUsers size={14} />;
      case 'department_head': return <IconBuilding size={14} />;
      case 'admin': return <IconShield size={14} />;
      case 'student': return <IconUser size={14} />;
      default: return <IconUser size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'teal';
      case 'pending': return 'yellow';
      case 'request': return 'blue';
      case 'rejected': return 'red';
      case 'not_contact': return 'gray';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <IconCheck size={14} />;
      case 'pending': return <IconClock size={14} />;
      case 'request': return <IconMail size={14} />;
      case 'rejected': return <IconThumbDown size={14} />;
      default: return <IconUserOff size={14} />;
    }
  };

  const getStatusText = (status: string, isInitiatedByMe?: boolean) => {
    switch (status) {
      case 'accepted':
        return 'Connected';
      case 'pending':
        return isInitiatedByMe ? 'Request Sent' : 'Request Received';
      case 'request':
        return isInitiatedByMe ? 'Request Sent' : 'Request Received';
      case 'rejected':
        return 'Rejected';
      case 'not_contact':
        return 'Not Connected';
      default:
        return 'Unknown';
    }
  };

  const getActionButton = (user: User) => {
    const status = user.contact_status || 'not_contact';
    const isInitiatedByMe = user.is_contact_initiated_by_me;

    switch (status) {
      case 'accepted':
        return (
          <Group gap="xs">
            <Badge color="teal" variant="light" size="xs" leftSection={<IconCheck size={10} />}>
              Connected
            </Badge>
            <Tooltip label="Remove contact">
              <ActionIcon
                color="red"
                variant="subtle"
                size="sm"
                onClick={() => handleLeaveChat(user.id)}
              >
                <IconUserX size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      
      case 'request':
        if (isInitiatedByMe) {
          return (
            <Button
              size="xs"
              leftSection={<IconHandStop size={14} />}
              onClick={() => handleCancelRequest(user.id)}
              loading={respondLoading === user.id}
              variant="light"
              color="orange"
            >
              Cancel
            </Button>
          );
        } else {
          return (
            <Group gap="xs">
              <Button
                size="xs"
                leftSection={<IconThumbUp size={14} />}
                onClick={() => handleAcceptRequest(user.id)}
                loading={respondLoading === user.id}
                variant="light"
                color="green"
              >
                Accept
              </Button>
              <Button
                size="xs"
                leftSection={<IconThumbDown size={14} />}
                onClick={() => handleRejectRequest(user.id)}
                loading={respondLoading === user.id}
                variant="light"
                color="red"
              >
                Reject
              </Button>
            </Group>
          );
        }
      
      case 'pending':
        if (isInitiatedByMe) {
          return (
            <Button
              size="xs"
              leftSection={<IconHandStop size={14} />}
              onClick={() => handleCancelRequest(user.id)}
              loading={respondLoading === user.id}
              variant="light"
              color="orange"
            >
              Cancel
            </Button>
          );
        } else {
          return (
            <Group gap="xs">
              <Button
                size="xs"
                leftSection={<IconThumbUp size={14} />}
                onClick={() => handleAcceptRequest(user.id)}
                loading={respondLoading === user.id}
                variant="light"
                color="green"
              >
                Accept
              </Button>
              <Button
                size="xs"
                leftSection={<IconThumbDown size={14} />}
                onClick={() => handleRejectRequest(user.id)}
                loading={respondLoading === user.id}
                variant="light"
                color="red"
              >
                Reject
              </Button>
            </Group>
          );
        }
      
      case 'rejected':
        return (
          <Button
            size="xs"
            leftSection={<IconUserPlus size={14} />}
            onClick={() => handleJoinChat(user.id)}
            loading={joinLoading === user.id}
            variant="light"
            color="blue"
          >
            Request Again
          </Button>
        );
      
      case 'not_contact':
      default:
        return (
          <Button
            size="xs"
            leftSection={<IconUserPlus size={14} />}
            onClick={() => handleJoinChat(user.id)}
            loading={joinLoading === user.id}
            variant="light"
            color="blue"
          >
            Connect
          </Button>
        );
    }
  };

  const handleTabChange = (value: string | null) => {
    if (value) {
      setActiveTab(value);
      if (value === 'pending' || value === 'requested' || value === 'connected' || value === 'favorites') {
        dispatch(setFilters({ type: null }));
      } else {
        dispatch(setFilters({ 
          type: value === "all" ? null : value.slice(0, -1) 
        }));
      }
    }
  };

  const refreshChat = () => {
    if (currentUser) {
      dispatch(fetchContacts({
        ...filters,
        department: filterDepartment === "all" ? null : filterDepartment,
      }));
      fetchAllUsersList();
    }
  };

  if (currentUser === null) {
    return <Authentication />;
  }
  if (currentUser.role === 'Student' ) {
    return <UnauthorizedAccess />
  }

  // Get messages for selected contact
  const contactId = selectedContact?.contact_id || selectedContact?.id;
  const contactMessages = contactId ? messages[contactId] || [] : [];

  // Calculate stats for modal
  const connectedCount = allUsersList.filter(u => u.contact_status === 'accepted').length;
  const pendingCount = allUsersList.filter(u => u.contact_status === 'pending' || u.contact_status === 'request').length;
  const notConnectedCount = allUsersList.filter(u => u.contact_status === 'not_contact' || !u.contact_status).length;
  const rejectedCount = allUsersList.filter(u => u.contact_status === 'rejected').length;

  const sidebarWidth = isSidebarCollapsed ? rem(80) : rem(320);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
      {/* Connection Status Banner */}
      {connectionStatus === 'disconnected' && (
        <div className="sticky top-0 z-50">
          <Notification 
            icon={<IconAlertCircle size={18} />} 
            color="red" 
            title="Authentication Required"
            withCloseButton={false}
            className="rounded-none"
          >
            Your session has expired. Please refresh the page or login again.
          </Notification>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="sticky top-0 z-50 p-4 bg-red-50 border-b border-red-200">
          <Container size="xl">
            <Group justify="space-between">
              <Text className="text-red-700">{error}</Text>
              <ActionIcon onClick={() => dispatch(clearError())}>
                <IconX size={16} />
              </ActionIcon>
            </Group>
          </Container>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <Container size="xl" className="px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 via-violet-500 to-teal-500 rounded-lg shadow-sm">
                <IconMessageCircle size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  Unified Communication Hub
                </h1>
                <p className="text-sm text-gray-600">Connect, collaborate, and communicate seamlessly</p>
              </div>
            </div>
            
            <Group gap="sm">
              <Badge 
                color="teal" 
                variant="light" 
                leftSection={<IconUserCheck size={14} />}
                className="shadow-sm"
              >
                  {acceptedContacts.length} Connected
              </Badge>
              {pendingCount > 0 && (
                <Badge 
                  color="yellow" 
                  variant="light" 
                  leftSection={<IconClock size={14} />}
                  className="shadow-sm"
                >
                  {pendingCount} Pending
                </Badge>
              )}
              {unreadCount > 0 && (
                <Badge 
                  color="blue" 
                  variant="filled" 
                  leftSection={<IconBell size={14} />}
                  className="shadow-sm"
                >
                  {unreadCount} Unread
                </Badge>
              )}
              <Button
                leftSection={<IconUserPlus size={18} />}
                variant="gradient"
                gradient={{ from: 'blue', to: 'violet' }}
                onClick={() => setJoinModalOpened(true)}
                className="shadow-sm"
              >
                Connect
              </Button>
              <ActionIcon
                variant="light"
                color="blue"
                size="lg"
                onClick={refreshChat}
                title="Refresh"
                className="shadow-sm"
              >
                <IconRefresh size={20} />
              </ActionIcon>
            </Group>
          </div>

          {/* Tabs under header */}
          <div className="border-t border-gray-100 pt-2 pb-3">
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="pills"
              classNames={{
                root: "w-full",
                list: "justify-start gap-1",
                tab: "data-[active=true]:bg-gradient-to-r data-[active=true]:from-blue-500 data-[active=true]:to-violet-500 data-[active=true]:text-white data-[active=true]:shadow-sm rounded-full px-4 py-2",
              }}
            >
              <Tabs.List>
                <Tabs.Tab 
                  value="all" 
                  leftSection={<IconUsers size={16} />}
                  rightSection={
                    <Badge size="xs" color="gray" variant="light" className="ml-1">
                      {contacts.length}
                    </Badge>
                  }
                >
                  All
                </Tabs.Tab>
                {/* <Tabs.Tab 
                  value="favorites" 
                  leftSection={<IconStarFilled size={16} />}
                  rightSection={
                    favoriteContacts.length > 0 && (
                      <Badge size="xs" color="yellow" variant="light" className="ml-1">
                        {favoriteContacts.length}
                      </Badge>
                    )
                  }
                >
                  Favorites
                </Tabs.Tab> */}
                <Tabs.Tab 
                  value="connected" 
                  leftSection={<IconUserCheck size={16} />}
                  rightSection={
                    acceptedContacts.length > 0 && (
                      <Badge size="xs" color="teal" variant="light" className="ml-1">
                        {acceptedContacts.length}
                      </Badge>
                    )
                  }
                >
                  Connected
                </Tabs.Tab>
                <Tabs.Tab 
                  value="pending" 
                  leftSection={<IconClock size={16} />}
                  rightSection={
                    pendingContacts.length > 0 && (
                      <Badge size="xs" color="yellow" variant="light" className="ml-1">
                        {pendingContacts.length}
                      </Badge>
                    )
                  }
                >
                  Pending
                </Tabs.Tab>
                <Tabs.Tab 
                  value="requested" 
                  leftSection={<IconMail size={16} />}
                  rightSection={
                    requestedContacts.length > 0 && (
                      <Badge size="xs" color="blue" variant="light" className="ml-1">
                        {requestedContacts.length}
                      </Badge>
                    )
                  }
                >
                  Requested
                </Tabs.Tab>
                <Tabs.Tab 
                  value="instructors" 
                  leftSection={<IconUsers size={16} />}
                >
                  Instructors
                </Tabs.Tab>
                <Tabs.Tab 
                  value="department_heads" 
                  leftSection={<IconBuilding size={16} />}
                >
                  Heads
                </Tabs.Tab>
                <Tabs.Tab 
                  value="admins" 
                  leftSection={<IconShield size={16} />}
                >
                  Admins
                </Tabs.Tab>
              </Tabs.List>
            </Tabs>
          </div>
        </Container>
      </header>

      {/* Connect Modal */}
      <Modal
        opened={joinModalOpened}
        onClose={() => setJoinModalOpened(false)}
        title={
          <Group>
            <IconUserPlus size={20} />
            <Text fw={600}>Connect with Users</Text>
          </Group>
        }
        size="xl"
        radius="lg"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <div className="space-y-6">
          {/* Stats Overview */}
          <Card withBorder radius="md" className="bg-gradient-to-r from-blue-50/50 to-violet-50/50 border-blue-100">
            <Group justify="space-between">
              <div>
                <Text fw={600} size="lg" className="text-gray-900">
                  Connection Status
                </Text>
                <Text size="sm" className="text-gray-600">
                  Overview of your connections
                </Text>
              </div>
              <div className="text-center">
                <RingProgress
                  size={80}
                  thickness={8}
                  roundCaps
                  sections={[
                    { value: (connectedCount / allUsersList.length) * 100, color: 'teal', tooltip: `${connectedCount} Connected` },
                    { value: (pendingCount / allUsersList.length) * 100, color: 'yellow', tooltip: `${pendingCount} Pending` },
                    { value: (rejectedCount / allUsersList.length) * 100, color: 'red', tooltip: `${rejectedCount} Rejected` },
                    { value: (notConnectedCount / allUsersList.length) * 100, color: 'gray', tooltip: `${notConnectedCount} Not Connected` },
                  ]}
                  label={
                    <Center>
                      <div className="text-center">
                        <Text fw={700} size="lg">
                          {allUsersList.length}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Total
                        </Text>
                      </div>
                    </Center>
                  }
                />
              </div>
            </Group>
            
            <SimpleGrid cols={4} mt="md">
              <div className="text-center">
                <Badge color="teal" variant="light" size="lg" leftSection={<IconUserCheck size={14} />}>
                  {connectedCount}
                </Badge>
                <Text size="sm" c="dimmed" mt={4}>Connected</Text>
              </div>
              <div className="text-center">
                <Badge color="yellow" variant="light" size="lg" leftSection={<IconClock size={14} />}>
                  {pendingCount}
                </Badge>
                <Text size="sm" c="dimmed" mt={4}>Pending</Text>
              </div>
              <div className="text-center">
                <Badge color="gray" variant="light" size="lg" leftSection={<IconUserOff size={14} />}>
                  {notConnectedCount}
                </Badge>
                <Text size="sm" c="dimmed" mt={4}>Not Connected</Text>
              </div>
              <div className="text-center">
                <Badge color="red" variant="light" size="lg" leftSection={<IconThumbDown size={14} />}>
                  {rejectedCount}
                </Badge>
                <Text size="sm" c="dimmed" mt={4}>Rejected</Text>
              </div>
            </SimpleGrid>
          </Card>

          {/* Filters and Search */}
          <Card withBorder radius="md" className="border-gray-100">
            <div className="space-y-4">
              <Group>
                <TextInput
                  placeholder="Search users by name, email, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.currentTarget.value)}
                  leftSection={<IconSearch size={18} />}
                  className="flex-1"
                  radius="md"
                />
                
                <SegmentedControl
                  value={userView}
                  onChange={(value) => setUserView(value as 'all' | 'connected' | 'pending' | 'not-connected')}
                  data={[
                    { label: 'All', value: 'all' },
                    { label: 'Connected', value: 'connected' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Not Connected', value: 'not-connected' },
                  ]}
                  radius="md"
                />
              </Group>
              
              <Group>
                <Select
                  placeholder="Sort by"
                  value={sortBy}
                  onChange={(value) => setSortBy(value as 'name' | 'role' | 'department')}
                  data={[
                    { value: 'name', label: 'Name' },
                    { value: 'role', label: 'Role' },
                    { value: 'department', label: 'Department' },
                  ]}
                  leftSection={<IconSortAscending size={16} />}
                  radius="md"
                />
                
                <ActionIcon
                  variant="light"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  radius="md"
                >
                  {sortOrder === 'asc' ? <IconSortAscending size={18} /> : <IconSortDescending size={18} />}
                </ActionIcon>
                
                <Button
                  variant="light"
                  leftSection={<IconRefresh size={16} />}
                  onClick={fetchAllUsersList}
                  loading={allUsersLoading}
                  size="sm"
                  radius="md"
                >
                  Refresh
                </Button>
              </Group>
            </div>
          </Card>

          {/* Users List */}
          <Card withBorder radius="md" className="border-gray-100">
            <ScrollArea h={400}>
              {allUsersLoading ? (
                <Center h={200}>
                  <Loader size="md" />
                </Center>
              ) : filteredAllUsers.length === 0 ? (
                <Center h={200}>
                  <div className="text-center">
                    <IconUsers size={48} className="text-gray-400 mx-auto mb-4" />
                    <Text fw={500} c="dimmed">No users found</Text>
                    <Text size="sm" c="dimmed">Try changing your search or filters</Text>
                  </div>
                </Center>
              ) : (
                <Stack gap="sm">
                  {filteredAllUsers.map((user) => {
                    const status = user.contact_status || 'not_contact';
                    const isInitiatedByMe = user.is_contact_initiated_by_me;
                    
                    return (
                      <Paper
                        key={user.id}
                        withBorder
                        p="md"
                        radius="md"
                        className={`transition-all hover:shadow-sm ${
                          status === 'accepted' ? 'bg-teal-50/50 border-teal-100' :
                          status === 'request' || status === 'pending' ? 'bg-yellow-50/50 border-yellow-100' :
                          status === 'rejected' ? 'bg-red-50/50 border-red-100' :
                          'bg-white border-gray-100'
                        }`}
                      >
                        <Group justify="space-between">
                          <Group>
                            <Avatar
                              size="md"
                              radius="xl"
                              src={user.avatar_url}
                              color={getRoleColor(user.role)}
                              className="border-2 border-white shadow-sm"
                            >
                              {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </Avatar>
                            
                            <div>
                              <Text fw={600} size="sm" className="text-gray-900">
                                {user.full_name}
                              </Text>
                              <Group gap="xs" mt={4}>
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color={getRoleColor(user.role)}
                                  leftSection={getRoleIcon(user.role)}
                                  radius="sm"
                                >
                                  {user.role?.replace('_', ' ') || 'User'}
                                </Badge>
                                {user.department_name && (
                                  <Badge size="xs" variant="outline" color="gray" radius="sm">
                                    {user.department_name}
                                  </Badge>
                                )}
                                <Badge
                                  size="xs"
                                  variant="light"
                                  color={getStatusColor(status)}
                                  leftSection={getStatusIcon(status)}
                                  radius="sm"
                                >
                                  {getStatusText(status, isInitiatedByMe)}
                                </Badge>
                                {isInitiatedByMe && (status === 'request' || status === 'pending') && (
                                  <Badge size="xs" variant="dot" color="blue" radius="sm">
                                    You initiated
                                  </Badge>
                                )}
                              </Group>
                              <Text size="xs" c="dimmed" mt={2}>
                                {user.email}
                              </Text>
                            </div>
                          </Group>
                          
                          <div>
                            {getActionButton(user)}
                          </div>
                        </Group>
                        
                        <Group gap={4} mt="sm">
                          <IconCircleFilled 
                            size={8} 
                            className={user.is_online ? 'text-green-500' : 'text-gray-400'} 
                          />
                          <Text size="xs" c={user.is_online ? "green" : "dimmed"}>
                            {user.is_online ? 'Online now' : `Last seen ${user.last_seen ? new Date(user.last_seen).toLocaleTimeString() : 'unknown'}`}
                          </Text>
                        </Group>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </ScrollArea>
          </Card>
        </div>
      </Modal>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-10rem)]">
        <ScrollArea className="max-h-250 px-1 py-2"> 

        {/* Sidebar - Contacts List */}
        <Box 
          style={{ 
            width: sidebarWidth,
            transition: 'width 300ms ease',
          }}
          className="border-r border-gray-200 bg-white/50 backdrop-blur-sm"
        >
          <Paper className="h-full rounded-none border-0 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-100">
              <Group justify="space-between">
                {!isSidebarCollapsed && (
                  <div>
                    <Text className="text-sm font-semibold text-gray-900">Contacts</Text>
                    <Text className="text-xs text-gray-500">
                      {filteredUsers.length} {filteredUsers.length === 1 ? 'contact' : 'contacts'}
                    </Text>
                  </div>
                )}
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="ml-auto"
                >
                  <IconChevronRight 
                    size={18} 
                    style={{ 
                      transform: isSidebarCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 300ms ease'
                    }}
                  />
                </ActionIcon>
              </Group>
              
              {!isSidebarCollapsed && (
                <>
                  <TextInput
                    placeholder="Search contacts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                    leftSection={<IconSearch size={16} className="text-gray-400" />}
                    className="mt-3"
                    size="sm"
                    radius="md"
                  />
                  
                  <div className="mt-3">
                    <Select
                      placeholder="Department"
                      value={filterDepartment}
                      onChange={setFilterDepartment}
                      data={departments.map(dept => ({ 
                        value: dept, 
                        label: dept === "all" ? "All Departments" : dept 
                      }))}
                      size="sm"
                      radius="md"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Contacts List */}
            <ScrollArea className="flex-1 p-4 ">
              {loading ? (
                <Center className="h-32">
                  <Loader size="md" />
                </Center>
              ) : connectionStatus !== 'connected' ? (
                <Center className="h-32 flex-col">
                  <IconAlertCircle size={32} className="text-gray-400 mb-2" />
                  <Text className="text-gray-600 text-sm text-center">Authentication required</Text>
                </Center>
              ) : filteredUsers.length === 0 ? (
                <Center className="h-32 flex-col">
                  <IconUsers size={32} className="text-gray-400 mb-2" />
                  <Text className="text-gray-600 text-sm text-center">No contacts found</Text>
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconUserPlus size={12} />}
                    onClick={() => setJoinModalOpened(true)}
                    className="mt-2"
                  >
                    Connect
                  </Button>
                </Center>
              ) : (
                <Stack gap="xs">
                  {filteredUsers.map((user: UserContact) => (
                    <UnstyledButton
                      key={user.id}
                      className={`w-full p-3 rounded-lg transition-all ${
                        (selectedContact?.contact_id === user.contact_id || 
                        selectedContact?.id === user.id)
                          ? 'bg-gradient-to-r from-blue-50 to-violet-50 border border-blue-200 shadow-sm' 
                          : user.status === 'pending' || user.status === 'request'
                          ? 'bg-yellow-50 border border-yellow-100'
                          : user.is_favorite
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100'
                          : 'bg-white border border-gray-100 hover:bg-gray-50'
                      }`}
                      onClick={() => dispatch(setSelectedContact(user))}
                    >
                      <Group wrap="nowrap" align="center">
                        <div className="relative">
                          <Avatar 
                            size={isSidebarCollapsed ? "md" : "sm"}
                            radius="xl"
                            className={`border-2 ${
                              user.is_online 
                                ? 'border-green-300' 
                                : user.status === 'pending' || user.status === 'request'
                                ? 'border-yellow-300'
                                : user.is_favorite
                                ? 'border-amber-300'
                                : 'border-gray-200'
                            }`}
                          >
                            {user.avatar_url || user.contact_name?.charAt(0) || "U"}
                          </Avatar>
                          {user.is_online && (
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white" />
                          )}
                          {user.is_favorite && (
                            <div className="absolute -top-1 -right-1">
                              <IconStarFilled size={12} className="text-amber-500" />
                            </div>
                          )}
                        </div>
                        
                        {!isSidebarCollapsed && (
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <Text className="font-medium text-gray-900 text-sm truncate">
                                {user.contact_name || "Unknown"}
                               
                              </Text>
                                <div className="flex items-center gap-1">
                                 {user.unread_count >=0 && user.status === 'accepted' && (
                                  <Badge size="xs" color="blue" radius="xl" variant="filled">
                                    {user.unread_count}
                                  </Badge>
                                )}
                              </div>
                               <Text 
                                size="xs" 
                                variant="dot"
                                color={getStatusColor(user.status)}
                                className="capitalize"
                              >
                                {user.status === 'accepted' ? 'Connected' :
                                 user.status === 'pending' ? 'Pending' :
                                 user.status === 'request' ? 'Requested' :
                                 user.status}
                              </Text>
                            
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <IconCircleFilled 
                                size={6} 
                                className={
                                  user.is_online ? 'text-green-500' :
                                  user.status === 'pending' || user.status === 'request' ? 'text-yellow-500' :
                                  'text-gray-400'
                                } 
                              />
                              <Text className="text-xs text-gray-500 truncate">
                                {user.is_online ? 'Online' : 
                                 user.status === 'pending' ? 'Pending' :
                                 user.status === 'request' ? 'Requested' :
                                 user.contact_role?.replace('_', ' ')}
                              </Text>
                            </div>
                          </div>
                        )}
                      </Group>
                    </UnstyledButton>
                  ))}
                </Stack>
              )}
            </ScrollArea>

            {/* Sidebar Footer */}
            {!isSidebarCollapsed && (
              <div className="p-4 border-t border-gray-100">
                <Group justify="space-between" className="text-xs text-gray-500">
                  <Text>Active: {contacts.filter(c => c.is_online).length}</Text>
                  <Badge variant="light" color="gray" size="xs">
                    v1.0.0
                  </Badge>
                </Group>
              </div>
            )}
          </Paper>
        </Box>
     </ScrollArea>
        {/* Main Chat Area */}
        <div className="flex-1">
          <Paper className="h-full rounded-none border-0 flex flex-col bg-gradient-to-b from-white to-gray-50/50">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-gray-100 p-4 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <Group>
                      <Avatar 
                        size="lg" 
                        radius="xl"
                        src={selectedContact.avatar_url}
                        className="border-2 border-white shadow-sm"
                      >
                        {selectedContact.contact_name?.charAt(0) || selectedContact.name?.charAt(0) || "U"}
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <Text className="text-lg font-semibold text-gray-900">
                            {selectedContact.contact_name || selectedContact.name || "Unknown User"}
                          </Text>
                          <Badge 
                            size="sm" 
                            variant="light"
                            color={getRoleColor(selectedContact.contact_role || selectedContact.role || selectedContact.type)}
                            leftSection={getRoleIcon(selectedContact.contact_role || selectedContact.role || selectedContact.type)}
                            radius="sm"
                          >
                            {(selectedContact.contact_role || selectedContact.role || selectedContact.type || "user").replace('_', ' ')}
                          </Badge>
                          <Badge 
                            size="sm"
                            variant={selectedContact.status === 'accepted' ? 'light' : 'filled'}
                            color={getStatusColor(selectedContact.status)}
                            leftSection={getStatusIcon(selectedContact.status)}
                            radius="sm"
                          >
                            {selectedContact.status === 'accepted' ? 'Connected' :
                             selectedContact.status === 'request' ? 'Request Sent' :
                             selectedContact.status === 'pending' ? 'Request Received' :
                             selectedContact.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          {selectedContact.department_name && (
                            <>
                              <IconBuilding size={14} />
                              <span>{selectedContact.department_name}</span>
                              <span className="text-gray-300">•</span>
                            </>
                          )}
                          <Group gap={4}>
                            <IconCircleFilled size={8} className={selectedContact.is_online ? 'text-green-500' : 'text-gray-400'} />
                            <span>
                              {selectedContact.is_online ? 'Online now' : 
                               selectedContact.status === 'pending' ? 'Waiting for your response' :
                               selectedContact.status === 'request' ? 'Waiting for their response' :
                               `Last seen ${selectedContact.last_seen ? new Date(selectedContact.last_seen).toLocaleTimeString() : 'unknown'}`}
                            </span>
                          </Group>
                        </div>
                      </div>
                    </Group>
                    
                    <Group>
                      {selectedContact.status === 'accepted' && (
                        <>
                          <Tooltip label="Voice Call">
                            <ActionIcon variant="light" color="blue" size="lg" radius="md">
                              <IconPhone size={20} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Video Call">
                            <ActionIcon variant="light" color="violet" size="lg" radius="md">
                              <IconVideo size={20} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      )}
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="light" color="gray" size="lg" radius="md">
                            <IconDotsVertical size={20} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<IconInfoCircle size={16} />}>
                            View Profile
                          </Menu.Item>
                          {selectedContact.status === 'accepted' && (
                            <>
                              <Menu.Item leftSection={<IconStar size={16} />}>
                                Add to Favorites
                              </Menu.Item>
                              <Menu.Item leftSection={<IconPin size={16} />}>
                                Pin Conversation
                              </Menu.Item>
                              <Menu.Item leftSection={<IconArchive size={16} />}>
                                Archive Chat
                              </Menu.Item>
                              <Menu.Divider />
                            </>
                          )}
                          <Menu.Item 
                            leftSection={<IconUserX size={16} />} 
                            color="red"
                            onClick={() => {
                              if (selectedContact.status === 'accepted') {
                                handleLeaveChat(selectedContact.contact_id || selectedContact.id);
                              } else if (selectedContact.status === 'request') {
                                handleCancelRequest(selectedContact.contact_id || selectedContact.id);
                              } else if (selectedContact.status === 'pending') {
                                handleRejectRequest(selectedContact.contact_id || selectedContact.id);
                              }
                            }}
                          >
                            {selectedContact.status === 'accepted' ? 'Remove Contact' :
                             selectedContact.status === 'request' ? 'Cancel Request' :
                             'Reject Request'}
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </div>
                </div>
                 
                {/* Messages Area */}
                <div className="flex-1 flex flex-col p-4 flex h-[calc(100vh-10rem)]">
                  <ScrollArea className="flex-1 p-4 px-1 py-2 " > 
                    {selectedContact.status === 'request' ? (
                      <Center className="h-full">
                        <div className="text-center max-w-md">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-violet-100 flex items-center justify-center">
                            <IconMail size={40} className="text-blue-500" />
                          </div>
                          <Text className="text-xl font-bold text-gray-800 mb-2">
                            Request Sent
                          </Text>
                          <Text className="text-gray-600 mb-6">
                            Your connection request to {selectedContact.contact_name || selectedContact.name} has been sent.
                            You&apos;ll be able to chat once they accept your request.
                          </Text>
                          <Button
                            leftSection={<IconHandStop size={18} />}
                            onClick={() => handleCancelRequest(selectedContact.contact_id || selectedContact.id)}
                            loading={respondLoading === (selectedContact.contact_id || selectedContact.id)}
                            color="orange"
                            variant="light"
                            radius="md"
                          >
                            Cancel Request
                          </Button>
                        </div>
                      </Center>
                    ) : selectedContact.status === 'pending' ? (
                      <Center className="h-full">
                        <div className="text-center max-w-md">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 flex items-center justify-center">
                            <IconClock size={40} className="text-yellow-500" />
                          </div>
                          <Text className="text-xl font-bold text-gray-800 mb-2">
                            Request Received
                          </Text>
                          <Text className="text-gray-600 mb-6">
                            {selectedContact.contact_name || selectedContact.name} wants to connect with you.
                            Accept the request to start chatting.
                          </Text>
                          <Group justify="center">
                            <Button
                              leftSection={<IconThumbUp size={18} />}
                              onClick={() => handleAcceptRequest(selectedContact.contact_id || selectedContact.id)}
                              loading={respondLoading === (selectedContact.contact_id || selectedContact.id)}
                              color="green"
                              variant="light"
                              radius="md"
                            >
                              Accept Request
                            </Button>
                            <Button
                              leftSection={<IconThumbDown size={18} />}
                              onClick={() => handleRejectRequest(selectedContact.contact_id || selectedContact.id)}
                              loading={respondLoading === (selectedContact.contact_id || selectedContact.id)}
                              color="red"
                              variant="light"
                              radius="md"
                            >
                              Reject Request
                            </Button>
                          </Group>
                        </div>
                      </Center>
                    ) : selectedContact.status === 'rejected' ? (
                      <Center className="h-full">
                        <div className="text-center max-w-md">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-red-100 to-pink-100 flex items-center justify-center">
                            <IconThumbDown size={40} className="text-red-500" />
                          </div>
                          <Text className="text-xl font-bold text-gray-800 mb-2">
                            Connection Rejected
                          </Text>
                          <Text className="text-gray-600 mb-6">
                            Your connection with {selectedContact.contact_name || selectedContact.name} has been rejected.
                            You can send a new request to try again.
                          </Text>
                          <Button
                            leftSection={<IconUserPlus size={18} />}
                            onClick={() => handleJoinChat(selectedContact.contact_id || selectedContact.id)}
                            loading={joinLoading === (selectedContact.contact_id || selectedContact.id)}
                            color="blue"
                            variant="light"
                            radius="md"
                          >
                            Send New Request
                          </Button>
                        </div>
                      </Center>
                    ) : selectedContact.status === 'accepted' ? (
                      <>
                        {loading ? (
                          <Center className="h-full">
                            <Loader size="md" />
                          </Center>
                        ) : contactMessages.length === 0 ? (
                          <Center className="h-full">
                            <div className="text-center max-w-md">
                              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-violet-100 flex items-center justify-center">
                                <IconMessageCircle size={40} className="text-blue-500" />
                              </div>
                              <Text className="text-xl font-bold text-gray-800 mb-2">
                                Start a conversation
                              </Text>
                              <Text className="text-gray-600 mb-6">
                                Send your first message to {selectedContact.contact_name || selectedContact.name}.
                                You can discuss {selectedContact.contact_role === 'instructor' ? 'course materials and schedules' :
                                  selectedContact.contact_role === 'department_head' ? 'departmental matters' :
                                  'administrative issues and support'}.
                              </Text>
                            </div>
                          </Center>
                                ) : (
                           <Stack gap="xl" className="pb-4">
                            {contactMessages.map((msg, index) => {
                              const showDate = index === 0 ||
                                new Date(contactMessages[index - 1].created_at).toDateString() !==
                                new Date(msg.created_at).toDateString();
                            
                              const isFromCurrentUser = msg.sender_id === currentUser?.id;
                              return (
                                <React.Fragment key={msg.id}>
                                  {showDate && (
                                    <Center>
                                      <Badge variant="light" color="gray" size="sm" radius="xl">
                                        <IconCalendar size={12} className="mr-1" />
                                        {new Date(msg.created_at).toLocaleDateString('en-US', {
                                          weekday: 'long',
                                          month: 'short',
                                          day: 'numeric'
                                        })}
                                      </Badge>
                                    </Center>
                                  )}
                                
                                  <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] ${isFromCurrentUser ? 'order-2' : 'order-1'}`}>
                                      <div className={`rounded-2xl p-4 shadow-sm ${isFromCurrentUser
                                        ? 'bg-gradient-to-r from-blue-500 to-violet-500 text-white'
                                        : 'bg-white border border-gray-200'
                                        }`}>
                                        {!isFromCurrentUser && (
                                          <div className="flex items-center gap-2 mb-2">
                                            <Text className="text-sm font-semibold text-gray-700">
                                              {msg.sender_name || selectedContact.contact_name || selectedContact.name}
                                            </Text>
                                            <Badge size="xs" variant="light" color={getRoleColor(selectedContact.contact_role || selectedContact.role)}>
                                              {selectedContact.contact_role || selectedContact.role}
                                            </Badge>
                                          </div>
                                        )}
                                      
                                        {editingMessageId === msg.id ? (
                                          <div className="flex flex-col gap-2">
                                            <Textarea
                                              value={editMessageText}
                                              onChange={(e) => setEditMessageText(e.currentTarget.value)}
                                              autoFocus
                                              autosize
                                              minRows={1}
                                              maxRows={4}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                  e.preventDefault();
                                                  handleSaveEdit();
                                                } else if (e.key === 'Escape') {
                                                  handleCancelEdit();
                                                }
                                              }}
                                            />
                                            <div className="flex gap-2">
                                              <Button size="xs" color="green" onClick={handleSaveEdit}>
                                                Save
                                              </Button>
                                              <Button size="xs" color="red" onClick={handleCancelEdit}>
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <Text className="whitespace-pre-wrap break-words">
                                              {msg.is_deleted ? (
                                                <span className="italic text-gray-500">This message was deleted</span>
                                              ) : (
                                                msg.message
                                              )}
                                            </Text>
                                            {msg.is_edited && (
                                              <Text className={`text-xs mt-2 ${isFromCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
                                                (edited)
                                              </Text>
                                            )}
                                          </>
                                        )}
                                      
                                        {isFromCurrentUser && !msg.is_deleted && !editingMessageId && (
                                          <div className="flex gap-1 mt-2">
                                            <ActionIcon
                                              size="xs"
                                              variant="subtle"
                                              color="white"
                                              onClick={() => handleEditMessage(msg.id, msg.message)}
                                            >
                                              <IconPencil size={12} />
                                            </ActionIcon>
                                            <ActionIcon
                                              size="xs"
                                              variant="subtle"
                                              color="white"
                                              onClick={() => handleDeleteMessage(msg.id)}
                                            >
                                              <IconTrash size={12} />
                                            </ActionIcon>
                                          </div>
                                        )}
                                      </div>
                                    
                                      <div className="flex items-center justify-between mt-1.5 px-1">
                                        <Text className={`text-xs ${isFromCurrentUser ? 'text-right text-gray-500' : 'text-gray-400'}`}>
                                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          {msg.is_edited && " • Edited"}
                                        </Text>
                                      
                                        {isFromCurrentUser && (
                                          <div className="flex gap-1">
                                            {msg.is_read ? (
                                              <IconCheck size={12} className="text-green-500" />
                                            ) : (
                                              <IconCheck size={12} className="text-gray-400" />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    </div>
                                </React.Fragment>
                              );
                            })}
                            <div ref={messagesEndRef} />
                          </Stack>
                        )}
                      </>
                    ) : (
                      <Center className="h-full">
                        <div className="text-center max-w-md">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center">
                            <IconUserOff size={40} className="text-gray-500" />
                          </div>
                          <Text className="text-xl font-bold text-gray-800 mb-2">
                            Not Connected
                          </Text>
                          <Text className="text-gray-600 mb-6">
                            You&apos;re not connected with {selectedContact.contact_name || selectedContact.name} yet.
                            Send a connection request to start chatting.
                          </Text>
                          <Button
                            leftSection={<IconUserPlus size={18} />}
                            onClick={() => handleJoinChat(selectedContact.contact_id || selectedContact.id)}
                            loading={joinLoading === (selectedContact.contact_id || selectedContact.id)}
                            color="blue"
                            variant="light"
                            radius="md"
                          >
                            Send Connection Request
                          </Button>
                        </div>
                      </Center>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  {selectedContact.status === 'accepted' && (
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <Textarea
                            placeholder={`Type your message to ${selectedContact.contact_name || selectedContact.name}...`}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.currentTarget.value)}
                            onKeyDown={handleKeyPress}
                            autosize
                            minRows={1}
                            maxRows={4}
                            disabled={sending || connectionStatus !== 'connected'}
                            radius="md"
                            classNames={{
                              input: "bg-white border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                            }}
                          />
                        </div>
                        
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sending || connectionStatus !== 'connected'}
                          variant="gradient"
                          gradient={{ from: 'blue', to: 'violet' }}
                          radius="md"
                          size="md"
                          leftSection={<IconSend size={18} />}
                          loading={sending}
                          className="shadow-sm"
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Center className="h-full">
                <div className="text-center max-w-2xl">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-100 via-violet-100 to-teal-100 flex items-center justify-center shadow-sm">
                    <IconMessageCircle size={64} className="text-blue-500" />
                  </div>
                  <Text className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-4">
                    Welcome to Unified Communication
                  </Text>
                  <Text className="text-gray-600 text-lg mb-8 max-w-xl mx-auto">
                    Select a contact to start chatting, connect with colleagues, or explore new connections.
                    Your professional network is just a click away.
                  </Text>
                  
                  <Group justify="center">
                    <Button
                      size="lg"
                      leftSection={<IconUserPlus size={20} />}
                      onClick={() => setJoinModalOpened(true)}
                      variant="gradient"
                      gradient={{ from: 'blue', to: 'violet' }}
                      radius="md"
                      className="shadow-sm"
                    >
                      Connect with Users
                    </Button>
                  </Group>
                </div>
              </Center>
            )}
          </Paper>
        </div>
      </div>
    </div>
  );
}