/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Group,
  Table,
  Modal,
  Select,
  Loader,
  Title,
  Container,
  ScrollArea,
  Alert,
  Box,
  Stack,
  Badge,
  Avatar,
  ThemeIcon,
  Text,
  Paper,
  Tooltip,
  Center,
} from "@mantine/core";
import { 
  UserPlusIcon, 
  UserIcon, 
  AcademicCapIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";
import {
  fetchDepartments,
  fetchInstructors,
  assignDepartmentHead,
  clearError,
  clearSuccessMessage,
  Department,
} from "@/store/slices/departmentsSlice";
import { notifications } from "@mantine/notifications";

interface AssignHeadModalProps {
  opened: boolean;
  onClose: () => void;
  department: Department | null;
  onAssign: (departmentId: number, instructorId: number) => void;
}

const AssignHeadModal: React.FC<AssignHeadModalProps> = ({
  opened,
  onClose,
  department,
  onAssign,
}) => {
  const dispatch = useAppDispatch();
  const { instructors, loading: instructorsLoading } = useAppSelector((state) => state.departments);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      dispatch(fetchInstructors());
      setSelected(null);
    }
  }, [dispatch, opened]);

  const handleAssign = () => {
    if (department && selected) {
      onAssign(department.department_id, Number(selected));
    }
  };

  const handleClose = () => {
    setSelected(null);
    onClose();
  };

  // Get the selected instructor for preview
  const selectedInstructor = selected 
    ? instructors.find(inst => inst.id.toString() === selected)
    : null;

  return (
    <Modal 
      opened={opened} 
      onClose={handleClose} 
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="lg" color="blue" variant="light">
            <UserPlusIcon className="h-5 w-5" />
          </ThemeIcon>
          <div>
            <Text fw={600}>Assign Department Head</Text>
            <Text size="sm" c="dimmed">{department?.department_name}</Text>
          </div>
        </Group>
      }
      centered
      size="lg"
      radius="lg"
    >
      <Stack gap="lg">
        {/* Current Department Info */}
        <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500} c="blue">Current Department</Text>
              <Text fw={600} size="lg">{department?.department_name}</Text>
              <Text size="sm" c="dimmed">
                {department?.head_name ? `Current Head: ${department.head_name}` : "No head assigned"}
              </Text>
            </div>
            <ThemeIcon size="xl" radius="lg" color="blue" variant="light">
              <BuildingOfficeIcon className="h-6 w-6" />
            </ThemeIcon>
          </Group>
        </Paper>

        {/* Instructor Selection */}
        <div>
          <Select
            label={
              <Group gap="xs">
                <UserIcon className="h-4 w-4" />
                <Text>Select Instructor</Text>
              </Group>
            }
            placeholder="Search for an instructor..."
            data={instructors.map((inst) => ({
              value: inst.id.toString(),
              label: `${inst.full_name} ${inst.department_name ? `(${inst.department_name})` : ""}`.trim(),
            }))}
            value={selected}
            onChange={setSelected}
            searchable
            clearable
            nothingFoundMessage="No instructors found"
            disabled={instructorsLoading}
            size="md"
            radius="md"
          />
          {instructorsLoading && (
            <Text size="sm" c="dimmed" mt="xs">Loading instructors...</Text>
          )}
        </div>

        {/* Selected Instructor Preview */}
        {selectedInstructor && (
          <Paper withBorder p="md" radius="md" className="bg-green-50 border-green-100">
            <Group justify="space-between">
              <Group gap="md">
                {/* <Avatar 
                  size="lg" 
                  radius="xl" 
                  color="green"
                  src={selectedInstructor.photo_url}
                > */}
                  {selectedInstructor.full_name.charAt(0).toUpperCase()}
                {/* </Avatar> */}
                <div>
                  <Text fw={600} size="lg">{selectedInstructor.full_name}</Text>
                  <Group gap="xs" mt={4}>
                    {selectedInstructor.department_name && (
                      <Badge size="sm" variant="light" color="blue">
                        {selectedInstructor.department_name}
                      </Badge>
                    )}
                    <Badge size="sm" variant="dot" color="green">
                      Instructor
                    </Badge>
                  </Group>
                </div>
              </Group>
              <ThemeIcon size="xl" radius="lg" color="green" variant="light">
                <CheckCircleIcon className="h-6 w-6" />
              </ThemeIcon>
            </Group>
          </Paper>
        )}

        {/* Assignment Confirmation */}
        {selectedInstructor && (
          <Paper withBorder p="md" radius="md" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-indigo-100">
            <Group justify="center" gap="lg">
              <div className="text-center">
                <Text size="sm" c="dimmed">Current Status</Text>
                <Badge 
                  size="lg" 
                  color={department?.head_name ? "orange" : "gray"} 
                  variant="light"
                  className="mt-1"
                >
                  {department?.head_name ? department.head_name : "No Head"}
                </Badge>
              </div>
              
              <ArrowRightIcon className="h-6 w-6 text-blue-500" />
              
              <div className="text-center">
                <Text size="sm" c="dimmed">New Assignment</Text>
                <Badge 
                  size="lg" 
                  color="green" 
                  variant="light"
                  className="mt-1"
                >
                  {selectedInstructor.full_name}
                </Badge>
              </div>
            </Group>
          </Paper>
        )}

        <Group justify="flex-end" gap="sm">
          <Button 
            variant="light" 
            color="gray" 
            onClick={handleClose}
            size="md"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!selected}
            size="md"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            leftSection={<UserPlusIcon className="h-5 w-5" />}
          >
            Assign as Head
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

const AssignHead: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    departments, 
    loading, 
    error, 
    successMessage 
  } = useAppSelector((state) => state.departments);
  
  const [assignModal, setAssignModal] = useState<Department | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch data on component mount
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
  
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);

  if (user === null) { 
    return <Authentication />;
  }
  if (user.role !== 'admin') {
    return <UnauthorizedAccess />
  }
   

const handleAssignHead = async (departmentId: number, instructorId: number) => {
  setActionLoading(true);
  try {
    await dispatch(
      assignDepartmentHead({ departmentId, instructorId })
    ).unwrap();

    notifications.show({
      title: "Success",
      message: "Department head assigned successfully",
      color: "green",
    });

    dispatch(fetchDepartments());
  } catch (err: any) {
    notifications.show({
      title: "Assignment Failed",
      message: typeof err === "string" ? err : "Failed to assign department head",
      color: "red",
    });
  } finally {
    setActionLoading(false);
    setAssignModal(null);
  }
};
  // Stats
  const assignedCount = departments.filter(d => d.head_name).length;
  const totalCount = departments.length;

  return (
    <Container size="xl" py="xl" className="min-h-screen">
      <Stack gap="lg">
        {/* Header */}
        <Box className="relative overflow-hidden rounded-2xl ">
          <Stack gap="xs">
            <Group align="center" gap="sm">
              <ThemeIcon size="xl" radius="lg" variant="blue" color="blue">
                <UserPlusIcon className="h-6 w-6 text-white-600" />
              </ThemeIcon>
              <Title order={1} className="text-blue" c='blue'>Assign Department Heads</Title>
            </Group>
            <Text className="text-indigo-100 max-w-2xl" c='blue'>
              Assign experienced instructors as department heads to provide leadership and academic guidance. 
              Each department should have one assigned head responsible for administration and coordination.
            </Text>
          </Stack>
        </Box>

        {/* Stats Cards */}
        <Group grow>
          <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-indigo-50">
            <Group gap="md">
              <ThemeIcon size="lg" radius="md" color="indigo" variant="light">
                <BuildingOfficeIcon className="h-5 w-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" c="dimmed" fw={500}>Total Departments</Text>
                <Title order={3} className="text-indigo-700">{totalCount}</Title>
              </div>
            </Group>
          </Card>
          
          <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-green-50">
            <Group gap="md">
              <ThemeIcon size="lg" radius="md" color="green" variant="light">
                <CheckCircleIcon className="h-5 w-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" c="dimmed" fw={500}>Heads Assigned</Text>
                <Title order={3} className="text-green-700">{assignedCount}</Title>
              </div>
            </Group>
          </Card>
          
          <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-orange-50">
            <Group gap="md">
              <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                <XCircleIcon className="h-5 w-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" c="dimmed" fw={500}>Without Heads</Text>
                <Title order={3} className="text-orange-700">{totalCount - assignedCount}</Title>
              </div>
            </Group>
          </Card>
        </Group>

        {/* Error and Success Messages */}
        {error && (
          <Alert 
            color="red" 
            title="Error" 
            withCloseButton 
            onClose={() => dispatch(clearError())}
            radius="md"
            icon={<XCircleIcon className="h-5 w-5" />}
          >
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert 
            color="green" 
            title="Success" 
            withCloseButton 
            onClose={() => dispatch(clearSuccessMessage())}
            radius="md"
            icon={<CheckCircleIcon className="h-5 w-5" />}
          >
            {successMessage}
          </Alert>
        )}

        {/* Departments Table */}
        <Card withBorder radius="lg" shadow="sm" className="overflow-hidden">
          <Card.Section withBorder inheritPadding py="md" className="bg-gray-50">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon size="sm" radius="lg" color="indigo" variant="light">
                  <AcademicCapIcon className="h-4 w-4" />
                </ThemeIcon>
                <Text fw={600} size="lg">Departments</Text>
                <Badge variant="light" color="indigo" size="lg">
                  {departments.length} total
                </Badge>
              </Group>
            </Group>
          </Card.Section>

          {loading ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <Loader size="lg" color="indigo" />
                <Text c="dimmed">Loading departments...</Text>
              </Stack>
            </Center>
          ) : departments.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <ThemeIcon size="xl" radius="lg" color="gray" variant="light">
                  <BuildingOfficeIcon className="h-8 w-8" />
                </ThemeIcon>
                <Text size="lg" fw={500} c="dimmed">No departments found</Text>
                <Text c="dimmed" ta="center">
                  Departments need to be created before you can assign heads
                </Text>
              </Stack>
            </Center>
          ) : (
            <ScrollArea>
              <Table verticalSpacing="md" highlightOnHover>
                <Table.Thead className="bg-gray-50">
                  <Table.Tr>
                    <Table.Th style={{ minWidth: 250 }}>
                      <Group gap="xs">
                        <BuildingOfficeIcon className="h-4 w-4" />
                        <Text fw={600}>Department</Text>
                      </Group>
                    </Table.Th>
                    <Table.Th style={{ minWidth: 200 }}>
                      <Group gap="xs">
                        <UserIcon className="h-4 w-4" />
                        <Text fw={600}>Current Head</Text>
                      </Group>
                    </Table.Th>
                    <Table.Th style={{ minWidth: 150 }}>
                      <Text fw={600} ta="center">Status</Text>
                    </Table.Th>
                    <Table.Th style={{ minWidth: 200, textAlign: 'center' }}>
                      <Text fw={600}>Actions</Text>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {departments.map((dept) => (
                    <Table.Tr 
                      key={dept.department_id} 
                      className="hover:bg-indigo-50/50 transition-colors"
                    >
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar 
                            size="md" 
                            radius="md" 
                            color="indigo" 
                            variant="light"
                          >
                            {dept.department_name.charAt(0).toUpperCase()}
                          </Avatar>
                          <div>
                            <Text fw={600} className="text-gray-900">
                              {dept.department_name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {dept.faculity_name || "No faculty assigned"}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>
                      
                      <Table.Td>
                        {dept.head_name ? (
                          <Group gap="sm">
                            <Avatar size="sm" radius="xl" color="green">
                              {dept.head_name.charAt(0).toUpperCase()}
                            </Avatar>
                            <div>
                              <Text fw={500}>{dept.head_name}</Text>
                              <Text size="xs" c="dimmed">Department Head</Text>
                            </div>
                          </Group>
                        ) : (
                          <Badge 
                            color="orange" 
                            variant="light" 
                            size="lg"
                            leftSection={<UserIcon className="h-3 w-3 mr-1" />}
                          >
                            Not Assigned
                          </Badge>
                        )}
                      </Table.Td>
                      
                      <Table.Td>
                        <Center>
                          <Badge 
                            color={dept.head_name ? "green" : "orange"}
                            variant="light"
                            size="lg"
                            radius="sm"
                            leftSection={dept.head_name ? 
                              <CheckCircleIcon className="h-3 w-3 mr-1" /> : 
                              <XCircleIcon className="h-3 w-3 mr-1" />
                            }
                          >
                            {dept.head_name ? "Assigned" : "Unassigned"}
                          </Badge>
                        </Center>
                      </Table.Td>
                      
                      <Table.Td>
                        <Center>
                          <Tooltip 
                            label={dept.head_name ? "Reassign head" : "Assign head"} 
                            position="top"
                          >
                            <Button
                              size="sm"
                              variant="light"
                              color={dept.head_name ? "indigo" : "green"}
                              onClick={() => setAssignModal(dept)}
                              leftSection={<UserPlusIcon className="h-4 w-4" />}
                              loading={actionLoading}
                              className={dept.head_name ? "" : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"}
                            >
                              {dept.head_name ? "Reassign" : "Assign"}
                            </Button>
                          </Tooltip>
                        </Center>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Card>

        {/* Assign Head Modal */}
        <AssignHeadModal
          opened={!!assignModal}
          onClose={() => setAssignModal(null)}
          department={assignModal}
          onAssign={handleAssignHead}
        />
      </Stack>
    </Container>
  );
};

export default AssignHead;