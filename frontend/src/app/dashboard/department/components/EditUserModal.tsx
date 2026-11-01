/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect } from "react";
import {
  Modal,
  TextInput,
  Select,
  Group,
  Button,
  Stack,
  Text,
  Alert,
  Loader,
  Badge,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { User } from "@/type/user";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface EditUserModalProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
  departments: any[];
  users: User[];
  onSave: (userData: any) => void;
  loading?: boolean;
  error?: string | null;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  opened,
  onClose,
  user,
  departments,
  users,
  onSave,
  loading = false,
  error = null,
}) => {
  const editUserForm = useForm({
    initialValues: {
      name: "",
      email: "",
      role: "instructor" as User["role"],
      department: null as number | null,
      idNumber: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      name: (value) => (value.trim().length < 2 ? 'Name must be at least 2 characters' : null),
      idNumber: (value) => (value.trim().length < 1 ? 'ID Number is required' : null),
    },
  });

  // Check for duplicate users
  const isDuplicateUser = (
    email: string,
    idNumber: string,
    excludeId: number | null = null
  ) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedIdNumber = idNumber.trim();

    return users.some((user) => {
      if (user.id === excludeId) return false;
      return (
        user.email.toLowerCase() === trimmedEmail ||
        user.idNumber === trimmedIdNumber
      );
    });
  };

  // Get specific duplicate field information
  const getDuplicateFields = (
    email: string,
    idNumber: string,
    excludeId: number | null = null
  ) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedIdNumber = idNumber.trim();

    const duplicateFields: string[] = [];

    users.forEach((user) => {
      if (user.id === excludeId) return;
      if (user.email.toLowerCase() === trimmedEmail) duplicateFields.push('email');
      if (user.idNumber === trimmedIdNumber) duplicateFields.push('ID number');
    });

    return [...new Set(duplicateFields)];
  };

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      editUserForm.setValues({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department_id,
        idNumber: user.idNumber,
      });
    }
  }, [editUserForm, user]);

  const handleSave = async (values: typeof editUserForm.values) => {
    if (!user) return;

    // Check for duplicates
    if (isDuplicateUser(values.email, values.idNumber, user.id)) {
      const duplicateFields = getDuplicateFields(values.email, values.idNumber, user.id);
      notifications.show({
        title: 'Error',
        message: `Another user with this ${duplicateFields.join(', ')} already exists.`,
        color: 'red',
      });
      return;
    }

    onSave({
      id: user.id,
      userData: {
        name: values.name.trim(),
        email: values.email.trim(),
        department: values.department,
        role: values.role,
        idNumber: values.idNumber.trim(),
        username: values.idNumber.trim() // Use idNumber as username
      }
    });
  };

  const handleClose = () => {
    editUserForm.reset();
    onClose();
  };

  if (!user) return null;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={`Edit User - ${user.name}`}
      size="lg"
      centered
    >
      <Stack>
        {error && (
          <Alert color="red" title="Error" icon={<ExclamationCircleIcon className="h-5 w-5" />}>
            {error}
          </Alert>
        )}

        <form onSubmit={editUserForm.onSubmit(handleSave)}>
          <Group grow mb="md">
            <Select
              label="Role"
              data={[
                { value: "admin", label: "Admin" },
                { value: "instructor", label: "Instructor" },
              ]}
              {...editUserForm.getInputProps('role')}
              required
            />

            {editUserForm.values.role !== "admin" && (
              <Select
                label="Department"
                data={departments.map(dept => ({
                  value: dept.department_id.toString(),
                  label: dept.department_name
                }))}
                {...editUserForm.getInputProps('department')}
                required
                clearable
                placeholder="Select department"
              />
            )}
          </Group>

          <Group grow mb="md">
            <TextInput
              label="ID Number"
              placeholder="e.g., 2023-001"
              {...editUserForm.getInputProps('idNumber')}
              required
            />
          </Group>

          <TextInput
            label="Email"
            type="email"
            placeholder="user@example.com"
            mb="md"
            {...editUserForm.getInputProps('email')}
            required
          />

          <TextInput
            label="Full Name"
            placeholder="John Doe"
            mb="md"
            {...editUserForm.getInputProps('name')}
            required
          />

          {/* Current Status Display */}
          <Box p="sm" bg="gray.0" style={{ borderRadius: 'var(--mantine-radius-sm)' }} mb="md">
            <Text size="sm" fw={500}>Current Status: </Text>
            <Badge
              color={user.status === "Active" ? "green" : "red"}
              variant="light"
            >
              {user.status}
            </Badge>
          </Box>

          <Group justify="flex-end" mt="lg">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              color="blue"
              disabled={loading}
              leftSection={loading ? <Loader size="sm" /> : null}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </Group>
        </form>
      </Stack>
    </Modal>
  );
};

export default EditUserModal;