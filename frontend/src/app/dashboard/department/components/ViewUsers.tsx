/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  BuildingOfficeIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  Title,
  Text,
  Table,
  Badge,
  Group,
  Box,
  Alert,
  ActionIcon,
  Select,
  Stack,
  Button,
  Grid,
  TextInput,
  Loader,
  Modal,
  PasswordInput,
  Pagination
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useAppDispatch } from "@/hooks/redux";
import { User } from "@/type/user";
import { addUser } from "@/store/slices/usersSlice";
import { Found } from "@/app/auth/auth";

interface ViewUsersProps {
  users: User[];
  departments: any[];
  error: string | null;
  successMessage: string | null;
  onEditClick: (user: User) => void;
  onDeactivateClick: (user: User) => void;
  onActivateClick: (user: User) => void;
  loading?: boolean;
  onUserAdded?: () => void; // New callback for when user is added
}

const ViewUsers: React.FC<ViewUsersProps> = ({
  users = [],
  error,
  successMessage,
  onEditClick,
  onDeactivateClick,
  onActivateClick,
  loading = false,
  onUserAdded,
}) => {
  const dispatch = useAppDispatch();
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [addUserModalOpened, setAddUserModalOpened] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [currentUser, setcurrentUserr] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setcurrentUserr(foundUser);
    };
    checkAuth();
  }, []);
  // Form for new user
  const newUserForm = useForm({
    initialValues: {
      role: "instructor" as User["role"],
      departmentType: "existing" as "existing" | "createNew",
      existingDepartment: "",
      newDepartmentName: "",
      idNumber: "",
      username: "",
      email: "",
      name: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      name: (value) => (value.trim().length < 2 ? 'Name must be at least 2 characters' : null),
      idNumber: (value) => (value.trim().length < 1 ? 'ID Number is required' : null),
      password: (value) => (value.length < 6 ? 'Password must be at least 6 characters' : null),
    },
  });

  // Safe filtering with null checks
  const filteredUsers = useMemo(() => {
    const usersfilter = users.filter(u => u.department_id == currentUser?.department_id && u.role !== currentUser?.role);
    if (!usersfilter || !Array.isArray(usersfilter)) return [];

    return usersfilter.filter((usersfilter) => {
      if (!usersfilter) return false;

      // Role filter
      const roleMatch = roleFilter === "all" || usersfilter.role === roleFilter;

      // Status filter
      const statusMatch = statusFilter === "all" || usersfilter.status === statusFilter;

      // Department filter
      const departmentMatch = departmentFilter.length === 0 ||
        (usersfilter.department_id && departmentFilter.includes(usersfilter.department_id.toString()));

      // Search filter
      const searchMatch = searchTerm === "" ||
        (usersfilter.idNumber && usersfilter.idNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (usersfilter.name && usersfilter.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (usersfilter.email && usersfilter.email.toLowerCase().includes(searchTerm.toLowerCase()));

      return roleMatch && statusMatch && departmentMatch && searchMatch;
    });
  }, [users, currentUser?.department_id, currentUser?.role, roleFilter, statusFilter, departmentFilter, searchTerm]);

  const paginatedUser = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const statusCounts = {
    all: users?.filter(user => user?.department_id === currentUser?.department_id && user?.role !== currentUser?.role).length || 0,
    Active: users?.filter(user => user?.status === "Active" && user?.department_id === currentUser?.department_id && user?.role !== currentUser?.role).length || 0,
    Deactivated: users?.filter(user => user?.status === "Deactivated" && user?.department_id === currentUser?.department_id && user?.role !== currentUser?.role).length || 0,
  };



  // Check for duplicate users
  const isDuplicateUser = (
    email: string,
    username: string,
    idNumber: string
  ) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedIdNumber = idNumber.trim();

    return users.some((user) => (
      user.email.toLowerCase() === trimmedEmail ||
      user.username.toLowerCase() === trimmedUsername ||
      user.idNumber === trimmedIdNumber
    ));
  };

  // Get specific duplicate field information
  const getDuplicateFields = (
    email: string,
    username: string,
    idNumber: string
  ) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedIdNumber = idNumber.trim();

    const duplicateFields: string[] = [];

    users.forEach((user) => {
      if (user.email.toLowerCase() === trimmedEmail) duplicateFields.push('email');
      if (user.username.toLowerCase() === trimmedUsername) duplicateFields.push('username');
      if (user.idNumber === trimmedIdNumber) duplicateFields.push('ID number');
    });

    return [...new Set(duplicateFields)];
  };

  // Handle add user
  const handleAddUser = async (values: typeof newUserForm.values) => {
    setAddUserLoading(true);

    const generatedUsername = values.email.split('@')[0];

    // Check for duplicates
    if (isDuplicateUser(values.email, generatedUsername, values.idNumber)) {
      const duplicateFields = getDuplicateFields(values.email, generatedUsername, values.idNumber);
      notifications.show({
        title: 'Error',
        message: `User with this ${duplicateFields.join(', ')} already exists.`,
        color: 'red',
      });
      setAddUserLoading(false);
      return;
    }

    try {
      // Dispatch the addUser action
      await dispatch(addUser({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password.trim(),
        role: values.role,
        department: currentUser?.department_id,
        idNumber: values.idNumber.trim(),
        username: generatedUsername,
      })).unwrap();

      // Success
      setAddUserModalOpened(false);
      newUserForm.reset();

      // Notify parent component
      if (onUserAdded) {
        onUserAdded();
      }

      notifications.show({
        title: 'Success',
        message: 'User created successfully',
        color: 'green',
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Error handled by slice
    } finally {
      setAddUserLoading(false);
    }
  };



  const clearFilters = () => {
    setRoleFilter("all");
    setStatusFilter("all");
    setDepartmentFilter([]);
    setSearchTerm("");
  };

  const hasActiveFilters = roleFilter !== "all" || statusFilter !== "all" || departmentFilter.length > 0 || searchTerm !== "";

  // Show loading state
  if (loading) {
    return (
      <Card withBorder radius="md" p={0}>
        <Box p="xl" style={{ textAlign: 'center' }}>
          <Loader size="lg" />
          <Text mt="md" c="dimmed">Loading users...</Text>
        </Box>
      </Card>
    );
  }

  return (
    <>
      <Card withBorder radius="md" p={0}>
        <Box p="md" className="bg-blue-600">
          <Group justify="space-between">
            <Title order={2} size="h4" c="white">Instructor List</Title>
            <Group>
              <Badge color="blue" variant="filled" size="lg">
                {filteredUsers.length} {filteredUsers.length === 1 ? 'Instructor' : 'Instructors'}
              </Badge>

            </Group>
          </Group>
        </Box>

        {/* Rest of the component remains the same */}
        <Box p="md" className="bg-gray-50 border-b">
          <Stack gap="sm">
            <Group justify="space-between">
              <Group gap="xs">
                <FunnelIcon className="h-5 w-5 text-gray-600" />
                <Text fw={500} size="sm">Filter & Search Users</Text>
              </Group>
              <Group>
                {hasActiveFilters && (
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={clearFilters}
                    color="gray"
                  >
                    Clear All
                  </Button>
                )}
                {(filteredUsers.length > 0 || users.length > 0) && (
                  <Text size="sm" c="dimmed">
                    {hasActiveFilters
                      ? `${filteredUsers.length} of ${filteredUsers.length} users`
                      : `${filteredUsers.length} total users`
                    }
                  </Text>
                )}
              </Group>
            </Group>
            <Grid gutter="md">
              {/* Search Bar */}
              <Grid.Col span={{ base: 12, sm: 6, md: 6 }}>
                {/* Search Bar */}
                <TextInput
                  label="Search"
                  placeholder="Search by ID, name, or email..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.currentTarget.value)}
                  leftSection={<MagnifyingGlassIcon className="h-4 w-4 text-gray-500" />}
                  rightSection={
                    searchTerm && (
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => setSearchTerm("")}
                      >
                        <XCircleIcon className="h-4 w-4" />
                      </ActionIcon>
                    )
                  }
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(value || "all")}
                  data={[
                    { value: "all", label: `All Status (${statusCounts.all})` },
                    { value: "Active", label: `Active (${statusCounts.Active})` },
                    { value: "Deactivated", label: `Deactivated (${statusCounts.Deactivated})` },
                  ]}
                  leftSection={<FunnelIcon className="h-4 w-4 text-gray-500" />}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Box style={{ paddingTop: '24px' }}>
                  <Stack gap="xs">
                    {hasActiveFilters && (
                      <Group gap="xs" wrap="wrap">
                        {searchTerm && (
                          <Badge color="blue" variant="light" size="sm">
                            Search: {searchTerm}
                          </Badge>
                        )}
                        {roleFilter !== "all" && (
                          <Badge color="blue" variant="light" size="sm">
                            Role: {roleFilter}
                          </Badge>
                        )}
                        {statusFilter !== "all" && (
                          <Badge
                            color={statusFilter === "Active" ? "green" : "red"}
                            variant="light"
                            size="sm"
                          >
                            Status: {statusFilter}
                          </Badge>
                        )}
                        {departmentFilter.length > 0 && (
                          <Badge color="orange" variant="light" size="sm">
                            Departments: {departmentFilter.length}
                          </Badge>
                        )}
                      </Group>
                    )}
                    {!hasActiveFilters && (
                      <Text size="sm" c="dimmed">No filters applied</Text>
                    )}
                  </Stack>
                </Box>
              </Grid.Col>
            </Grid>
          </Stack>
        </Box>

        {/* Error and Success Messages */}
        {error && (
          <Box p="md">
            <Alert color="red" title="Error" icon={<ExclamationCircleIcon className="h-5 w-5" />}>
              {error}
            </Alert>
          </Box>
        )}

        {successMessage && (
          <Box p="md">
            <Alert color="green" title="Success" icon={<CheckCircleIcon className="h-5 w-5" />}>
              {successMessage}
            </Alert>
          </Box>
        )}

        <Box style={{ overflowX: 'auto' }}>
          <Table.ScrollContainer minWidth={1300}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Full Name</Table.Th>
                  <Table.Th>ID Number</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Department</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {!paginatedUser || paginatedUser.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={8} style={{ textAlign: 'center' }} py="xl">
                      <Stack gap="xs" align="center">
                        <ExclamationCircleIcon className="h-12 w-12 text-gray-300" />
                        <Text c="dimmed">No users available</Text>
                        <Button
                          leftSection={<UserPlusIcon className="h-4 w-4" />}
                          onClick={() => setAddUserModalOpened(true)}
                        >
                          Add Your First User
                        </Button>
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ) : paginatedUser.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={8} style={{ textAlign: 'center' }} py="xl">
                      <Stack gap="xs" align="center">
                        <MagnifyingGlassIcon className="h-12 w-12 text-gray-300" />
                        <Text c="dimmed">No users found matching your criteria</Text>
                        {hasActiveFilters && (
                          <Button
                            variant="subtle"
                            size="sm"
                            onClick={clearFilters}
                          >
                            Clear all filters to see all users
                          </Button>
                        )}
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedUser.map((user, index) => (
                    <Table.Tr key={user.id}>
                      <Table.Td >{(currentPage - 1) * itemsPerPage + index + 1}</Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>{user.name || "N/A"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>{user.idNumber || "N/A"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{user.email || "N/A"}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <BuildingOfficeIcon className="h-4 w-4 text-blue-500" />
                          <Text size="sm">{user.department_name || "No Department"}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          variant="light"
                          color={
                            user.role === "instructor" ? "blue" : "green"
                          }
                        >
                          {user.role}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          color={user.status === "Active" ? "green" : "red"}
                          variant="light"
                        >
                          {user.status || "Unknown"}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" justify="center">
                          <ActionIcon
                            color="blue"
                            variant="light"
                            onClick={() => onEditClick(user)}
                            title="Edit User"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </ActionIcon>
                          {user.status === "Active" ? (
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => onDeactivateClick(user)}
                              title="Deactivate User"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </ActionIcon>
                          ) : (
                            <ActionIcon
                              color="green"
                              variant="light"
                              onClick={() => onActivateClick(user)}
                              title="Activate User"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                            </ActionIcon>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Box>
        {/* Pagination */}
        {totalPages > 1 && (
          <Box p="md" className="bg-gray-50 border-t">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, filteredUsers.filter(inst => inst.department_id == currentUser?.department_id).length)} of{' '}
                {filteredUsers.filter(inst => inst.department_id == currentUser?.department_id).length} departments
              </Text>
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={totalPages}
                radius="md"
                size="sm"
                withEdges
              />
            </Group>
          </Box>
        )}

      </Card>

      {/* Add User Modal */}
      <Modal
        opened={addUserModalOpened}
        onClose={() => {
          setAddUserModalOpened(false);
          newUserForm.reset();
        }}
        title="Create New User"
        size="xl"
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <form onSubmit={newUserForm.onSubmit(handleAddUser)}>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Select
                label="Role"
                data={[
                  { value: "instructor", label: "Instructor" },
                ]}
                {...newUserForm.getInputProps('role')}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="ID Number"
                placeholder="e.g. 2023-001"
                {...newUserForm.getInputProps('idNumber')}
                required
              />
            </Grid.Col>



            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Email"
                placeholder="example@gmail.com"
                type="email"
                {...newUserForm.getInputProps('email')}
                required
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Full Name"
                placeholder="Enter full name"
                {...newUserForm.getInputProps('name')}
                required
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <PasswordInput
                label="Password"
                placeholder="Enter password"
                {...newUserForm.getInputProps('password')}
                required
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Group justify="flex-end" mt="md">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddUserModalOpened(false);
                    newUserForm.reset();
                  }}
                  disabled={addUserLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  leftSection={<UserPlusIcon className="h-5 w-5" />}
                  loading={addUserLoading}
                >
                  Create User
                </Button>
              </Group>
            </Grid.Col>
          </Grid>
        </form>
      </Modal>
    </>
  );
};

export default ViewUsers;