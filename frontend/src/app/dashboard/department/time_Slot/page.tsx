/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/dashboard/department/time_Slot/page.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Button,
  Card,
  Group,
  Table,
  TextInput,
  Modal,
  Loader,
  Title,
  Container,
  ScrollArea,
  Alert,
  Box,
  Stack,
  Badge,
  Text,
  ActionIcon,
  Select,
  Avatar,
  ThemeIcon,
  Paper,
  Grid,
  Center,
  Tooltip,
  NumberInput,
} from "@mantine/core";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  ClockIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { notifications } from "@mantine/notifications";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Authentication, Found } from "@/app/auth/auth";

// Import slices
import { fetchDepartments, Department } from "@/store/slices/departmentsSlice";
import {
  fetchTimeSlots,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  clearError,
  clearSuccessMessage,
  TimeSlot,
  TimeSlotFormData,
} from "@/store/slices/timeSlotSlice";

// Styled components
const StatCard = ({ icon: Icon, title, value, color, description }: any) => (
  <Card 
    withBorder 
    radius="lg" 
    className={`bg-gradient-to-br from-white to-${color}-50 border-${color}-100`}
    padding="lg"
  >
    <Group gap="md" align="flex-start">
      <ThemeIcon size="lg" radius="md" color={color} variant="light">
        <Icon className="h-5 w-5" />
      </ThemeIcon>
      <div style={{ flex: 1 }}>
        <Text size="sm" c="dimmed" fw={500}>{title}</Text>
        <Title order={3} className={`text-${color}-700`}>{value}</Title>
        {description && (
          <Text size="xs" c="dimmed" mt={4}>{description}</Text>
        )}
      </div>
    </Group>
  </Card>
);

// Time Slot Modal Component
interface TimeSlotModalProps {
  opened: boolean;
  onClose: () => void;
  timeSlot: TimeSlot | null;
  onSave: (id: number | null, data: TimeSlotFormData) => Promise<void>;
  departments: Department[];
}

const TimeSlotModal: React.FC<TimeSlotModalProps> = ({
  opened,
  onClose,
  timeSlot,
  onSave,
}) => {
  const [user, setUser] = useState<any>(null);
  const department_id = user?.department_id.toString();
  const [formData, setFormData] = useState<TimeSlotFormData>({
    start_time: "08:00",
    end_time: "09:30",
    department_id:department_id,
    lecture_duration: 0,
    labratory_duration: 0,

  });
  const [loading, setLoading] = useState(false);

useEffect(() => {
    const checkAuth = async () => {
      try {
        const foundUser = await Found();
        setUser(foundUser);
      } catch (error) {
        console.error("Auth error:", error);
        setUser(null);
      } 
    };
    checkAuth();
  }, []);

  // Initialize form when modal opens
  useEffect(() => {
    if (timeSlot) {
      setFormData({
        start_time: timeSlot.formatted_start_time || timeSlot.start_time,
        end_time: timeSlot.formatted_end_time || timeSlot.end_time,
        department_id: department_id,
         lecture_duration: timeSlot.lecture_duration,
         labratory_duration:  timeSlot.labratory_duration,
      });
    } else {
      setFormData({
        start_time: "08:00",
        end_time: "09:30",
        department_id:department_id,
        lecture_duration: 0,
        labratory_duration:0
      });
    }
  }, [timeSlot, opened, department_id]);


  const handleSubmit = async () => {
    if (!formData.start_time || !formData.end_time || 
        !department_id || !formData.lecture_duration) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "All fields are required",
      });
      return;
    }

    setLoading(true);
    try {
      if (timeSlot) {
        await onSave(timeSlot.id, formData);
      } else {
        await onSave(null, formData);
      }
      onClose();
    } catch (error: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: error.message || "Failed to save time slot",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    if (!formData.start_time || !formData.end_time) return 0;
    
    const start = new Date(`1970-01-01T${formData.start_time}:00`);
    const end = new Date(`1970-01-01T${formData.end_time}:00`);
    const diff = (end.getTime() - start.getTime()) / (1000 * 60);
    return diff;
  };

  const duration = calculateDuration();

  return (
    <Modal 
      opened={opened} 
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="lg" color="blue" variant="light">
            <ClockIcon className="h-5 w-5" />
          </ThemeIcon>
          <div>
            <Text fw={600} component="div">{timeSlot ? "Edit Time Slot" : "Create Time Slot"}</Text>
            <Text size="sm" c="dimmed" component="div">
              {timeSlot ? "Update time slot details" : "Define a new time period for scheduling"}
            </Text>
          </div>
        </Group>
      }
      centered
      size="md"
      radius="lg"
    >
      <Stack gap="lg">
        <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
          <Text size="sm" c="blue" fw={500} component="div">
            Time slots define when classes, labs, or breaks can be scheduled
          </Text>
        </Paper>

        {/* Department Selection */}
        
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Start Time"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              required
              withAsterisk
              size="md"
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="End Time"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              required
              withAsterisk
              size="md"
            />
          </Grid.Col>
        </Grid>

        {/* Duration Display */}
        {duration > 0 && (
          <Paper withBorder p="md" radius="md" className="bg-green-50 border-green-100">
            <Group justify="space-between">
              <Text size="sm" fw={500} c="green">Duration</Text>
              <Badge color="green" variant="light">
                {duration} minutes ({Math.floor(duration / 60)}h {duration % 60}m)
              </Badge>
            </Group>
          </Paper>
        )}

        {/* Slot Type */}
       <NumberInput
         label="Lecture Duration"
         placeholder="Enter duration for one day"
          value={formData?.lecture_duration}
          onChange={(value) => setFormData({...formData, lecture_duration: value as unknown as  number})}
          required
          min={0}
          max={20}
          withAsterisk
          size="md"
        />
      <NumberInput
         label="Labratory Duration"
         placeholder="Enter duration for one day"
          value={formData?.labratory_duration}
          onChange={(value) => setFormData({...formData, labratory_duration: value as unknown as  number})}
          min={0}
          max={20}
          required
          size="md"
        />

        {/* Summary */}
        {department_id && (
          <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
            <Text size="sm" fw={500} c="blue" mb="xs" component="div">Time Slot Summary</Text>
            <Stack gap="xs">
              <Text size="sm" component="div">
                <strong>Department:</strong> {user?.department_name}
              </Text>
              <Text size="sm" component="div">
                <strong>Time:</strong> {formData.start_time} - {formData.end_time}
              </Text>
              <Text size="sm" component="div">
                <strong>lecture duration:</strong> {formData.lecture_duration}
              </Text>
              <Text size="sm" component="div">
                <strong>labratory duration:</strong> {formData.labratory_duration}
              </Text>

            </Stack>
          </Paper>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={onClose} size="md">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            loading={loading}
            disabled={ !formData.start_time || !formData.end_time || !formData.lecture_duration ||
                     !department_id}
            size="md"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            leftSection={<ClockIcon className="h-5 w-5" />}
          >
            {loading ? "Saving..." : timeSlot ? "Update Time Slot" : "Create Time Slot"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};



const TimeSlotManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const { timeSlots, loading, error, successMessage } = useAppSelector((state) => state.timeSlots || {
    timeSlots: [],
    loading: false,
    error: null,
    successMessage: null,
  });
  
  const { departments } = useAppSelector((state) => state.departments);
  
  // Local state
  const [modalState, setModalState] = useState<{
    opened: boolean;
    timeSlot: TimeSlot | null; 
  }>({
    opened: false,
    timeSlot: null
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const foundUser = await Found();
        setUser(foundUser);
      } catch (error) {
        console.error("Auth error:", error);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    if (!authLoading && user) {
      dispatch(fetchTimeSlots());
      dispatch(fetchDepartments());
    }
  }, [dispatch, authLoading, user]);

  // Clear messages
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

  // Handle save
  const handleSave = useCallback(async (id: number | null, data: TimeSlotFormData) => {
    try {
      if (id === null) {
        await dispatch(createTimeSlot(data)).unwrap();
      } else {
        await dispatch(updateTimeSlot({ id, data })).unwrap();
      }
      dispatch(fetchTimeSlots());
    } catch (err: any) {
      throw err;
    }
  }, [dispatch]);


  // Handle delete
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Are you sure you want to delete this time slot?")) {
      return;
    }
    
    try {
      await dispatch(deleteTimeSlot(id)).unwrap();
      dispatch(fetchTimeSlots());
      notifications.show({
        color: "green",
        title: "Success",
        message: "Time slot deleted successfully",
      });
    } catch (err: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message || "Failed to delete time slot",
      });
    }
  }, [dispatch]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedDepartment(null);
    setSelectedDay(null);
    setSelectedType(null);
  }, []);

  const hasFilters = useMemo(() => {
    return !!(searchTerm || selectedDepartment || selectedDay || selectedType);
  }, [searchTerm, selectedDepartment, selectedDay, selectedType]);

 
  if (authLoading) {
    return (
      <Container size="xl" py="xl" className="min-h-screen">
        <Center h="100vh">
          <Loader size="xl" color="blue" />
        </Center>
      </Container>
    );
  }

  if (user === null) { 
    return <Authentication />;
  }

  return (
    <Container size="xl" py="xl" className="min-h-screen">
      <Stack gap="lg">
        {/* Header */}
        <Box className="relative overflow-hidden rounded-2xl from-blue-600 to-indigo-600 p-8">
          <Stack gap="xs">
            <Group align="center" gap="sm">
              <ThemeIcon size="xl" radius="lg" variant="blue" color="blue">
                <ClockIcon className="h-6 w-6" />
              </ThemeIcon>
              <Title order={1} c="blue" className="text-blue">Time Slot Management</Title>
            </Group>
            <Text className="text-blue-100 max-w-2xl" c="blue" component="div">
              Define and manage time periods for scheduling classes, labs, and breaks. 
              Configure availability across departments and days.
            </Text>
          </Stack>
        </Box>

        {/* Search and Filters */}
        <Card withBorder radius="lg" shadow="sm">
          {/* Error and Success Messages */}
          {(error || successMessage) && (
            <Card.Section inheritPadding py="md">
              <Stack gap="sm">
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
              </Stack>
            </Card.Section>
          )}

          {/* Time Slots Table */}
          <Card.Section inheritPadding py="md">
            {loading && timeSlots.filter((ts)=> ts.department_id=== user?.department_id).length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <Loader size="lg" color="blue" />
                  <Text c="dimmed" component="div">Loading time slots...</Text>
                </Stack>
              </Center>
            ) : timeSlots.filter((ts)=> ts.department_id=== user?.department_id).length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <ThemeIcon size="xl" radius="lg" color="gray" variant="light">
                    <ClockIcon className="h-8 w-8" />
                  </ThemeIcon>
                  <Text size="lg" fw={500} c="dimmed" component="div">
                    {hasFilters ? "No time slots match your filters" : "No time slots found"}
                  </Text>
                  <Text c="dimmed" ta="center" maw={500} component="div">
                    {hasFilters 
                      ? "Try adjusting your search or filters"
                      : "Get started by creating your first time slot"
                    }
                  </Text>
                  <Button 
                    onClick={() => setModalState({ opened: true, timeSlot: null })}
                    leftSection={<PlusCircleIcon className="h-4 w-4" />}
                    size="md"
                    className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Create First Time Slot
                  </Button>
                </Stack>
              </Center>
            ) : (
              <ScrollArea>
                <Table.ScrollContainer minWidth={1000}>
                  <Table verticalSpacing="md" highlightOnHover>
                    <Table.Thead className="bg-gray-50">
                      <Table.Tr>
                        <Table.Th style={{ width: 60 }}>
                          <Text fw={600} component="div">#</Text>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <BuildingOfficeIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Department</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <ClockIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Time</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <AdjustmentsHorizontalIcon className="h-4 w-4" />
                            <Text fw={600} component="span">lecture duration</Text>
                          </Group>
                            </Table.Th>
                            <Table.Th>
                          <Group gap="xs">
                            <AdjustmentsHorizontalIcon className="h-4 w-4" />
                            <Text fw={600} component="span">lab duration</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th style={{ width: 100 }}>
                          <Text fw={600} component="div">Actions</Text>
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {timeSlots.map((ts, index) => ts.department_id === user?.department_id && (
                        <Table.Tr key={ts.id} className="hover:bg-blue-50/50 transition-colors">
                          <Table.Td>
                            <Text fw={500} className="text-gray-700" component="div">{index + 1}</Text>
                          </Table.Td>
                          
                          <Table.Td>
                            <Group gap="sm">
                              <Avatar 
                                size="md" 
                                radius="md" 
                                color="blue" 
                                variant="light"
                              >
                                {ts.department_name?.charAt(0) || 'D'}
                              </Avatar>
                              <div>
                                <Text fw={600} component="div">{ts.department_name}</Text>
                              </div>
                            </Group>
                          </Table.Td>
                          
                          
                          <Table.Td>
                            <Badge 
                              color="blue"
                              variant="light" 
                              size="lg"
                              leftSection={<ClockIcon className="h-3 w-3 mr-1" />}
                            >
                              {ts.formatted_start_time} - {ts.formatted_end_time}
                            </Badge>
                          </Table.Td>
                          
                          <Table.Td>
                            <Badge 
                              color='yellow'
                              variant="light" 
                              size="lg"
                            >
                              {ts.lecture_duration}
                            </Badge>
                          </Table.Td>
                            <Table.Td>
                            <Badge 
                              color='yellow'
                              variant="light" 
                              size="lg"
                            >
                              {ts.labratory_duration}
                            </Badge>
                          </Table.Td>

                          <Table.Td>
                            <Group gap="xs">
                              <Tooltip label="Edit time slot">
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  onClick={() => setModalState({ opened: true, timeSlot: ts })}
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </ActionIcon>
                              </Tooltip>
                              
                              <Tooltip label="Delete time slot">
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  onClick={() => handleDelete(ts.id)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </ActionIcon>
                              </Tooltip>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </ScrollArea>
            )}
          </Card.Section>
        </Card> 
      </Stack>

      {/* Time Slot Modal */}
      <TimeSlotModal
        opened={modalState.opened}
        onClose={() => setModalState({ opened: false, timeSlot: null })}
        timeSlot={modalState.timeSlot}
        onSave={handleSave}
        departments={departments}
      />
    </Container>
  );
};

export default TimeSlotManagement;