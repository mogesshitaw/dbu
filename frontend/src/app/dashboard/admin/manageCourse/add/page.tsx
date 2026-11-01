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
import { clearError, clearSuccessMessage } from "@/store/slices/coursesSlice";
import AddCourseForm from "../../components/course/AddCourseForm";
import { ArrowLeftIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

const AddCoursePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error, successMessage } = useAppSelector((state) => state.courses);
  
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Set client-side flag and check auth
  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
    setIsClient(true);
  }, []);

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
    router.push("/dashboard/admin/managecourse");
  };

  const handleCourseAdded = () => {
    // Redirect back to manage courses page after successful addition
    setTimeout(() => {
      router.push("/dashboard/admin/managecourse");
    }, 2000);
  };

  if (user === null) {
    return <Authentication />;
  }
  if (user.role !== 'admin') {
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
          <Anchor href="/dashboard/admin" size="sm">
            Admin
          </Anchor>
          <Anchor href="/dashboard/admin/managecourse" size="sm">
            Course Management
          </Anchor>
          <Text size="sm" c="blue">
            Add Course
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
                Back to Courses
              </Button>
            </Group>
            <Title order={1} mt="sm">Add New Course</Title>
            <Text c="dimmed">Create a new course for your academic catalog</Text>
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

        {/* Add Course Form */}
        <Card withBorder radius="md" shadow="sm">
          <Card.Section withBorder p="md" className="bg-gradient-to-r from-blue-600 to-blue-700">
            <Group justify="space-between">
              <Title order={2} size="h4" c="white">Create New Course</Title>
            </Group>
          </Card.Section>
          
          <Box p="xl">
            <AddCourseForm
              onCourseAdded={handleCourseAdded}
              loading={submitLoading}
              setLoading={setSubmitLoading}
              error={error}
            />
          </Box>
        </Card>
      </Stack>
    </Container>
  );
};

export default AddCoursePage;