/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo } from "react";
import {
  TextInput,
  Select,
  Button,
  Group,
  Stack,
  Box,
  Text,
  Paper,
  Grid,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAppDispatch } from "@/hooks/redux";
import { addUser } from "@/store/slices/usersSlice";
import { notifications } from "@mantine/notifications";
import { CheckCircleIcon, ExclamationCircleIcon, BuildingOfficeIcon } from "@heroicons/react/24/outline";

interface AddUserFormProps {
  departments: any[];
  onUserAdded: () => void;
  loading: boolean;
  error: string | null;
}

const AddUserForm: React.FC<AddUserFormProps> = ({
  departments,
  onUserAdded,
  loading,
  error,
}) => {
  const dispatch = useAppDispatch();

  const form = useForm({
    initialValues: {
      role: "instructor" as "admin" | "instructor",
      existingDepartment: "",
      email: "",
      name: "",
    },

    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      name: (value) => (value.trim().length < 2 ? 'Name must be at least 2 characters' : null),
      existingDepartment: (value, values) =>
        values.role !== "admin" && !value
          ? "Please select a department"
          : null,
    },
  });

  const handleSubmit = async (values: typeof form.values) => {
    let finalDepartment: number | null = null;
    if (values.role !== "admin") {
      if (values.existingDepartment) finalDepartment = Number(values.existingDepartment);
      else {
        notifications.show({
          title: 'Error',
          message: 'Please select a department.',
          color: 'red',
        });
        return;
      }
    }

    try {
      await dispatch(addUser({
        name: values.name.trim(),
        email: values.email.trim(),
        role: values.role,
        department: finalDepartment,
      })).unwrap();

      form.reset();
      onUserAdded();

      notifications.show({
        title: 'Success',
        message: 'User created successfully',
        color: 'green',
        icon: <CheckCircleIcon className="h-5 w-5" />,
      });
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.message || 'Failed to create user',
        color: 'red',
        icon: <ExclamationCircleIcon className="h-5 w-5" />,
      });
    }
  };

  const roleOptions = [
    { value: "admin", label: "Administrator" },
    { value: "instructor", label: "Instructor" },
  ];

  const departmentOptions = departments.map(dept => ({
    value: dept.department_id.toString(),
    label: dept.department_name,
  }));

  const roleDescription = useMemo(() => {
    switch (form.values.role) {
      case "admin":
        return "Administrators have full system access and can manage all users, departments, courses, and system settings.";
      case "instructor":
        return "Instructors can manage courses, schedules, view student information, and create announcements within their department.";
      default:
        return "Select a role to see detailed permissions and capabilities.";
    }
  }, [form.values.role]);

  return (
    <Box>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">

          {/* Role Selection */}
          <Paper withBorder p="md" radius="md">
            <Text fw={600} size="lg" mb="md">Account Type</Text>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="User Role"
                  placeholder="Select user role"
                  data={roleOptions}
                  required
                  {...form.getInputProps('role')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Box>
                  <Text fw={500} size="sm" mb="xs">Role Description</Text>
                  <Text size="sm" c="dimmed">{roleDescription}</Text>
                </Box>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Department Section */}
          {form.values.role !== "admin" && (
            <Paper withBorder p="md" radius="md">
              <Text fw={600} size="lg" mb="md">Department Assignment</Text>
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Select Department"
                    placeholder={departments.length === 0 ? "Loading departments..." : "Choose a department"}
                    data={departmentOptions}
                    required
                    leftSection={departments.length === 0 ? <Loader size="xs" /> : <BuildingOfficeIcon className="h-4 w-4 text-gray-500" />}
                    disabled={departments.length === 0}
                    {...form.getInputProps('existingDepartment')}
                  />
                  {departments.length === 0 && (
                    <Text size="xs" c="orange" mt="xs">No departments available.</Text>
                  )}
                </Grid.Col>
              </Grid>
            </Paper>
          )}

          {/* Personal Information */}
          <Paper withBorder p="md" radius="md">
            <Text fw={600} size="lg" mb="md">Personal Information</Text>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Full Name"
                  placeholder="Enter full name"
                  required
                  {...form.getInputProps('name')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Email Address"
                  placeholder="user@example.com"
                  type="email"
                  required
                  {...form.getInputProps('email')}
                />
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Form Actions */}
          <Group justify="flex-end" mt="lg">
            <Button variant="outline" onClick={() => window.history.back()} disabled={loading} size="md">
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={loading} 
              className="bg-blue-600 hover:bg-blue-700" 
              size="md"
              disabled={loading}
            >
              Create User Account
            </Button>
          </Group>

        </Stack>
      </form>
    </Box>
  );
};

export default AddUserForm;