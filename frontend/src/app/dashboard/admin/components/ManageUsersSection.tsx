/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  LoadingOverlay,
  Box,
  Stack,
  Tabs,
  Alert,
  Badge,
} from "@mantine/core";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { User } from "@/type/user";
import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";
import {
  fetchUsers,
  fetchDepartments,
  updateUser,
  updateUserStatus,
  clearError,
  clearSuccessMessage,
} from "@/store/slices/usersSlice";
import ViewUsers from "../components/user/ViewUsers";
import EditUserModal from "../components/user/EditUserModal";
import ConfirmationModal from "../components/user/ConfirmationModal";
import { CheckCircleIcon, ExclamationCircleIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

const ManageUsersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { users, departments, loading, error, successMessage } = useAppSelector((state) => state.users);
  
  const [isClient, setIsClient] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [confirmationModalOpened, setConfirmationModalOpened] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"deactivate" | "activate" | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");

  // Set client-side flag and check auth
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
    setIsClient(true);
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchDepartments());
  }, [dispatch]);

  // Clear messages after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  // Handlers
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditModalOpened(true);
  };

  const handleSaveEdit = async (userData: any) => {
    setActionLoading(true);
    try {
      await dispatch(updateUser(userData)).unwrap();
      setEditModalOpened(false);
      setSelectedUser(null);
      // Refresh users list
      dispatch(fetchUsers());
    } catch (err) {
      // Error handled by slice
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateClick = (user: User) => {
    setSelectedUser(user);
    setActionType("deactivate");
    setConfirmationModalOpened(true);
  };

  const handleActivateClick = (user: User) => {
    setSelectedUser(user);
    setActionType("activate");
    setConfirmationModalOpened(true);
  };

  const handleActionConfirm = async () => {
    if (!selectedUser || !actionType) return;
    
    setActionLoading(true);
    try {
      const newStatus = actionType === "deactivate" ? "Deactivated" : "Active";
      await dispatch(updateUserStatus({
        id: selectedUser.id,
        status: newStatus
      })).unwrap();
      
      setConfirmationModalOpened(false);
      setSelectedUser(null);
      setActionType(null);
      // Refresh users list
      dispatch(fetchUsers());
    } catch (err) {
      return err;// Error handled by slice
    } finally {
      setActionLoading(false);
    }
  };

  // Handle add user success from ViewUsers component
  const handleAddUserSuccess = () => {
    // Refresh users list when new user is added successfully
    dispatch(fetchUsers());
    setActiveTab("view");
  };

  // Handle navigation to add user page
  const handleAddUserClick = () => {
    router.push("/dashboard/admin/manageuser/add");
  };

  // Statistics
  const activeUsers = users.filter(user => user.status === "Active").length;
  const adminUsers = users.filter(user => user.role === "admin").length;
  const instructorUsers = users.filter(user => user.role === "instructor").length;
  const studentUsers = users.filter(user => user.role === "student").length;

  if (user === null) {
    return <Authentication />;
  }
    if (user?.role !== 'admin') {
      return <UnauthorizedAccess />
    }

  if (!isClient || loading) {
    return (
      <Container size="xl" py="xl">
        <Paper p="xl" radius="md" className="relative">
          <LoadingOverlay visible={true} />
          <Group justify="center">
            <Text>Loading users...</Text>
          </Group>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Header with Add Button */}
        <Group justify="space-between">
          <Box>
            <Title order={1} mb="xs">User Management</Title>
            <Text c="dimmed">Manage user accounts, permissions, and status</Text>
          </Box>
          <Button
            leftSection={<PlusIcon className="h-5 w-5" />}
            onClick={handleAddUserClick}
            className="bg-blue-600 hover:bg-blue-700"
            size="md"
          >
            Add New User
          </Button>
        </Group>

        {/* Statistics Cards */}
        <Group grow>
          <Paper withBorder p="md" radius="md">
            <Group justify="apart">
              <div>
                <Text c="dimmed" size="sm">Total Users</Text>
                <Text fw={700} size="xl">{users.length}</Text>
              </div>
              <Badge color="blue" variant="light">{activeUsers} Active</Badge>
            </Group>
          </Paper>
          
          <Paper withBorder p="md" radius="md">
            <Group justify="apart">
              <div>
                <Text c="dimmed" size="sm">Admins</Text>
                <Text fw={700} size="xl">{adminUsers}</Text>
              </div>
              <Badge color="red" variant="light">Admin</Badge>
            </Group>
          </Paper>
          
          <Paper withBorder p="md" radius="md">
            <Group justify="apart">
              <div>
                <Text c="dimmed" size="sm">Instructors</Text>
                <Text fw={700} size="xl">{instructorUsers}</Text>
              </div>
              <Badge color="blue" variant="light">Instructor</Badge>
            </Group>
          </Paper>
        </Group>

        {/* Main Users Table */}
        <ViewUsers
          users={users}
          departments={departments || []}
          error={error}
          successMessage={successMessage}
          onEditClick={handleEditClick}
          onDeactivateClick={handleDeactivateClick}
          onActivateClick={handleActivateClick}
          loading={loading || actionLoading}
          onUserAdded={handleAddUserSuccess}
        />
      </Stack>

      {/* Edit User Modal */}
      <EditUserModal
        opened={editModalOpened}
        onClose={() => {
          setEditModalOpened(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        departments={departments}
        users={users}
        onSave={handleSaveEdit}
        loading={actionLoading}
        error={error}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        opened={confirmationModalOpened}
        onClose={() => {
          setConfirmationModalOpened(false);
          setSelectedUser(null);
          setActionType(null);
        }}
        message={
          actionType === "deactivate"
            ? `Are you sure you want to deactivate ${selectedUser?.name}? They will not be able to access the system.`
            : `Are you sure you want to activate ${selectedUser?.name}? They will regain system access.`
        }
        onConfirm={handleActionConfirm}
        loading={actionLoading}
        error={error}
        actionType={actionType}
      />
    </Container>
  );
};

export default ManageUsersPage;