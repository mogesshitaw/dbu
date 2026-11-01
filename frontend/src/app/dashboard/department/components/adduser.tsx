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
  Alert,
  Breadcrumbs,
  Anchor,
  Card,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";
import { fetchDepartments, clearError, clearSuccessMessage } from "@/store/slices/usersSlice";
import AddUserForm from "./AddUserForm";
import { ArrowLeftIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

const AddUserPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { departments, loading, error, successMessage } = useAppSelector((state) => state.users);
  
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Set client-side flag and check auth
  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
    setIsClient(true);
  }, []);

  // Fetch departments on component mount
  useEffect(() => {
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

  const handleBackClick = () => {
    router.push("dashboard/department/manageinstructor");
  };

  const handleUserAdded = () => {
    // Redirect back to manage users page after successful addition
    setTimeout(() => {
      router.push("/dashboard/department/manageinstructor");
    }, 2000);
  };

  if (user === null) {
    return <Authentication />;
  }
  if (user.role !== 'department_head') {
    return <UnauthorizedAccess />
  }
  if (!isClient || loading) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" radius="md" className="relative">
          <LoadingOverlay visible={true} />
          <Group justify="center">
            <Text>Loading...</Text>
          </Group>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Breadcrumbs */}
        <Breadcrumbs>
          <Text c="blue" size="sm">
            Head
          </Text>
          <Anchor href="dashboard/department/manageinstructor" size="sm">
            User Management
          </Anchor>
          <Text size="sm" c="blue">
            Add Instructor
          </Text>
        </Breadcrumbs>

        {/* Header */}
        <Group justify="space-between">
          <Box>
            <Group>
              <Button
                variant="subtle"
                leftSection={<ArrowLeftIcon className="h-4 w-4" />}
                onClick={handleBackClick}
                size="sm"
              >
                Back to Users
              </Button>
            </Group>
            <Title order={1} mt="sm">Add New User</Title>
            <Text c="dimmed">Create a new user account with appropriate permissions</Text>
          </Box>
        </Group>

        {/* Success Message */}
        {successMessage && (
          <Alert
            color="green"
            title="Success"
            icon={<CheckCircleIcon className="h-5 w-5" />}
          >
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert
            color="red"
            title="Error"
            icon={<ExclamationCircleIcon className="h-5 w-5" />}
          >
            {error}
          </Alert>
        )}

        {/* Add User Form */}
        <Card withBorder radius="md" shadow="sm">
          <Card.Section withBorder p="md" className="bg-blue-600">
            <Group justify="space-between">
              <Title order={2} size="h4" c="white">Create New User Account</Title>
            </Group>
          </Card.Section>
          
          <Box p="xl">
            <AddUserForm
              departments={departments || []}
              onUserAdded={handleUserAdded}
              loading={loading}
              error={error}
            />
          </Box>
        </Card>
      </Stack>
    </Container>
  );
};

export default AddUserPage;