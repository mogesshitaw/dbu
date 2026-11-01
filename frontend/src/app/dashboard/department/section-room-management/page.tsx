/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
  SimpleGrid,
} from "@mantine/core";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  AcademicCapIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  UsersIcon,
  MapPinIcon,
  HashtagIcon,
  BuildingOffice2Icon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import { notifications } from "@mantine/notifications";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Authentication, Found } from "@/app/auth/auth";

// Import slices
import { fetchBatches, Batch } from "@/store/slices/batchSlice";
import { 
  fetchSectionRooms, 
  createSectionRoom, 
  updateSectionRoom, 
  deleteSectionRoom,
  clearError,
  clearSuccessMessage,
  SectionRoom,
  SectionRoomFormData
} from "@/store/slices/sectionRoomSlice";

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

// Section Room Modal Component
interface SectionRoomModalProps {
  opened: boolean;
  onClose: () => void;
  sectionRoom: SectionRoom | null;
  onSave: (id: number | null, data: SectionRoomFormData) => Promise<void>;
  batches: Batch[];
  user: any;
  sectionRooms?: SectionRoom[]; // Add this prop
}

const SectionRoomModal: React.FC<SectionRoomModalProps> = ({
  opened,
  onClose,
  sectionRoom,
  onSave,
  batches,
  user,
  sectionRooms = [], // Default to empty array
}) => {
  const [formData, setFormData] = useState<SectionRoomFormData>({
    department_id: 0,
    batch_id: 0,
    section: '',
    room_id: 0,
    room_type: ''
  });

  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Initialize form when modal opens or sectionRoom changes
  useEffect(() => {
    if (sectionRoom) {
      setFormData({
        department_id: sectionRoom.department_id,
        batch_id: sectionRoom.batch_id,
        section: sectionRoom.section,
        room_id: sectionRoom.room_id,
        room_type: sectionRoom.room_type
      });
    } else {
      setFormData({
        department_id: user?.department_id || 0,
        batch_id: 0,
        section: '',
        room_id: 0,
        room_type: ''
      });
    }
  }, [sectionRoom, opened, user]);

  // Fetch available rooms when modal opens
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (!opened || !user?.department_id) return;

      setRoomLoading(true);

      try {
        // 1. Fetch all rooms for department
        const response = await fetch(
          `${API_URL}/api/departments/available?department_id=${user.department_id}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          notifications.show({
            color: "red",
            title: "Error",
            message: data.error || "Failed to load available rooms",
          });
          return;
        }

        // 2. Fetch already assigned rooms
        const sectionRoomsResponse = await fetch(
          `${API_URL}/api/section-rooms?department_id=${user.department_id}`
        );

        let assignedRoomIds: number[] = [];

        if (sectionRoomsResponse.ok) {
          const sectionRoomsData = await sectionRoomsResponse.json();
          assignedRoomIds = sectionRoomsData.data?.map((sr: any) => sr.room_id) || [];
        }

        // 3. Apply correct rule
        const filteredRooms = data.data.filter((room: any) => {
          // If editing, include the current room
          if (sectionRoom && room.room_id === sectionRoom.room_id) {
            return true;
          }
          
          // LAB rooms → always allowed
          if (room.room_type?.toLowerCase() === "lab") return true;

          // NON-LAB → only if not assigned
          return !assignedRoomIds.includes(room.room_id);
        });

        setAvailableRooms(filteredRooms);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        notifications.show({
          color: "red",
          title: "Error",
          message: "Failed to load available rooms. Please try again.",
        });
      } finally {
        setRoomLoading(false);
      }
    };

    fetchAvailableRooms();
  }, [opened, user?.department_id, API_URL, sectionRoom]);

  // Filter batches (show all batches for now, or filter by department if needed)
  const availableBatches = useMemo(() => {
    return batches.filter(batch => true); // Add department filter if needed
  }, [batches]);

  // Generate available sections - FIXED VERSION
// Generate available sections - FIXED VERSION
const availableSections = useMemo(() => {
  const allSections = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  // sectionRooms ባዶ ከሆነ ወይም ከሌለ
  if (!sectionRooms || !Array.isArray(sectionRooms)) {
    return allSections;
  }
  
  // If editing an existing assignment, allow all sections
  if (sectionRoom) {
    return allSections;
  }
  
  // If no batch selected, return all sections
  if (!formData.batch_id) {
    return allSections;
  }
  
  // ለዚህ ባች የተመደቡ ክፍሎችን አምጣ
  const assignedSectionsForBatch = sectionRooms.filter(sr => 
    sr && sr.batch_id === formData.batch_id
  ) || [];
  
  // ምን አይነት ክፍሎች ተመድበዋል?
  const assignedClassrooms = assignedSectionsForBatch
    .filter(sr => sr.room_type?.toLowerCase() !== 'lab')
    .map(sr => sr.section)
    .filter(Boolean);
    
  const assignedLabs = assignedSectionsForBatch
    .filter(sr => sr.room_type?.toLowerCase() === 'lab')
    .map(sr => sr.section)
    .filter(Boolean);
  
  console.log('📊 Section Status:', {
    batch: formData.batch_id,
    assignedClassrooms,
    assignedLabs,
    currentRoomType: formData.room_type,
    allSections
  });
  
 
  if (assignedClassrooms.length === allSections.length && 
      assignedLabs.length === allSections.length) {
    return [];
  }
  

  const availableForAnyType = allSections.filter(section => {
    const hasClassroom = assignedClassrooms.includes(section);
    const hasLab = assignedLabs.includes(section);
    

    if (hasClassroom && hasLab) return false;
    

    return true;
  });
  
  console.log('📋 Available sections (any type):', availableForAnyType);
  return availableForAnyType;
  
}, [sectionRoom, formData.batch_id, sectionRooms]); // እባክህ ልብ በል፦ formData.room_type ን አላስወገድነውም!
// ክፍል ሲመረጥ፣ የክፍል አይነቱን በራስ-ሰር አዘጋጅ
const handleRoomSelect = (roomId: number) => {
  const selectedRoom = availableRooms.find(room => room.room_id === roomId);
  setFormData({
    ...formData,
    room_id: roomId,
    room_type: selectedRoom?.room_type || ''
  });
};

  const handleSubmit = async () => {
    if (!user?.department_id || !formData.batch_id || !formData.section || !formData.room_id) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "All fields are required",
      });
      return;
    }

    // Ensure department_id is set to user's department
    const submissionData = {
      ...formData,
      department_id: user.department_id,
    };

    setLoading(true);
    try {
      if (sectionRoom) {
        // Update existing assignment
        await onSave(sectionRoom.id, submissionData);
      } else {
        // Create new assignment
        await onSave(null, submissionData);
      }
      onClose();
    } catch (error: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: error.message || "Failed to save section room assignment",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get selected room details
  const selectedRoom = useMemo(() => {
    return availableRooms.find(room => room.room_id === formData.room_id);
  }, [availableRooms, formData.room_id]);

  return (
    <Modal 
      opened={opened} 
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="lg" color="blue" variant="light">
            <BookOpenIcon className="h-5 w-5" />
          </ThemeIcon>
          <div>
            <Text fw={600} component="div">
              {sectionRoom ? "Edit Section Room Assignment" : "Assign Room to Section"}
            </Text>
            <Text size="sm" c="dimmed" component="div">
              {sectionRoom ? "Update section room details" : "Assign a room to a specific section and batch"}
            </Text>
          </div>
        </Group>
      }
      centered
      size="lg"
      radius="lg"
    >
      <Stack gap="lg">
        <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
          <Group gap="sm">
            <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
            <div>
              <Text size="sm" fw={500} c="blue" component="div">
                Department: {user?.department_name || `ID: ${user?.department_id}`}
              </Text>
              <Text size="xs" c="blue" component="div">
                Automatically assigned based on your department
              </Text>
            </div>
          </Group>
        </Paper>

        {/* Batch Selection */}
        <Select
          label={
            <Group gap="xs">
              <UsersIcon className="h-4 w-4" />
              <Text component="span">Batch</Text>
            </Group>
          }
          placeholder="Select batch"
          data={availableBatches.map(batch => ({
            value: batch.batch_id.toString(),
            label: `Batch ${batch.batch_year}`,
            description: `ID: ${batch.batch_id}`
          }))}
          value={formData.batch_id ? formData.batch_id.toString() : null}
          onChange={(value) => setFormData({...formData, batch_id: parseInt(value || '0'), section: ''})}
          required
          withAsterisk
          searchable
          clearable
          disabled={!user?.department_id}
          size="md"
        />

        {/* Section Selection */}
        <Select
          label={
            <Group gap="xs">
              <HashtagIcon className="h-4 w-4" />
              <Text component="span">Section</Text>
            </Group>
          }
          placeholder="Select section"
          data={availableSections.map(section => ({
            value: section,
            label: `Section ${section}`,
          }))}
          value={formData.section || null}
          onChange={(value) => setFormData({...formData, section: value || ''})}
          required
          withAsterisk
          searchable
          clearable
          disabled={!formData.batch_id}
          size="md"
          nothingFoundMessage={
            !formData.batch_id 
              ? "Please select a batch first" 
              : "No sections available for this batch"
          }
        />

        {/* Available Sections Info */}
        {formData.batch_id && availableSections.length === 0 && !sectionRoom && (
          <Alert color="yellow" title="No Sections Available">
            All sections (A-F) are already assigned rooms for this batch.
          </Alert>
        )}

        {/* Room Selection */}
        <div>
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              <BookOpenIcon className="h-4 w-4" />
              <Text fw={500} size="sm" component="span">
                Available Rooms
              </Text>
            </Group>
            {roomLoading && (
              <Loader size="xs" />
            )}
          </Group>
          
          {!user?.department_id ? (
            <Alert color="yellow" title="Authentication Required">
              Please log in to view available rooms.
            </Alert>
          ) : roomLoading ? (
            <Center py="md">
              <Stack align="center" gap="sm">
                <Loader size="sm" />
                <Text size="sm" c="dimmed">Loading available rooms...</Text>
              </Stack>
            </Center>
          ) : availableRooms.length === 0 ? (
            <Alert color="orange" title="No Rooms Available">
              No available rooms found for your department. Please add rooms to your department first.
            </Alert>
          ) : (
            <Select
              data={availableRooms.map(room => ({
                value: room.room_id.toString(),
                label: `${room.block_code}-${room.room_number} - ${room.room_type || 'No type'}`,
                description: `${room.room_type} • Capacity: ${room.capacity}`
              }))}
              value={formData.room_id ? formData.room_id.toString() : null}
              onChange={(value) => setFormData({...formData, room_id: parseInt(value || '0')})}
              placeholder="Select a room..."
              searchable
              clearable
              disabled={roomLoading}
              size="md"
              radius="md"
              nothingFoundMessage="No available rooms found"
            />
          )}
        </div>

        {/* Selected Room Details */}
        {selectedRoom && (
          <Paper withBorder p="md" radius="md" className="bg-green-50 border-green-100">
            <Text size="sm" fw={500} c="green" mb="xs" component="div">Room Details</Text>
            <SimpleGrid cols={2} spacing="xs">
              <div>
                <Text size="xs" c="dimmed" component="div">Room Number</Text>
                <Text size="sm" fw={500} component="div">{selectedRoom.room_number}</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed" component="div">Type</Text>
                <Badge color="blue" variant="light" size="sm">
                  {selectedRoom.room_type}
                </Badge>
              </div>
              <div>
                <Text size="xs" c="dimmed" component="div">Capacity</Text>
                <Text size="sm" fw={500} component="div">{selectedRoom.capacity} seats</Text>
              </div>
              <div>
                <Text size="xs" c="dimmed" component="div">Availability</Text>
                <Badge 
                  color={selectedRoom.is_available ? "green" : "red"} 
                  variant="light" 
                  size="sm"
                >
                  {selectedRoom.is_available ? "Available" : "Occupied"}
                </Badge>
              </div>
            </SimpleGrid>
            {selectedRoom.facilities && selectedRoom.facilities.length > 0 && (
              <div className="mt-2">
                <Text size="xs" c="dimmed" component="div">Facilities</Text>
                <Group gap={4}>
                  {selectedRoom.facilities.slice(0, 3).map((facility: string, idx: number) => (
                    <Badge key={idx} color="gray" variant="outline" size="xs">
                      {facility}
                    </Badge>
                  ))}
                  {selectedRoom.facilities.length > 3 && (
                    <Badge color="gray" variant="light" size="xs">
                      +{selectedRoom.facilities.length - 3} more
                    </Badge>
                  )}
                </Group>
              </div>
            )}
          </Paper>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={onClose} size="md">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            loading={loading}
            disabled={!user?.department_id || !formData.batch_id || !formData.section || !formData.room_id}
            size="md"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            leftSection={<BookOpenIcon className="h-5 w-5" />}
          >
            {loading ? "Saving..." : sectionRoom ? "Update Assignment" : "Assign Room"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
const SectionRoomManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const { sectionRooms, loading, error, successMessage } = useAppSelector((state) => state.sectionRooms || {
    sectionRooms: [],
    loading: false,
    error: null,
    successMessage: null,
  });
  
  const { batches } = useAppSelector((state) => state.batches);
  
  // Local state
  const [modalState, setModalState] = useState<{
    opened: boolean;
    sectionRoom: SectionRoom | null; 
  }>({
    opened: false,
    sectionRoom: null
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
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
     // dispatch(fetchSectionRooms({ department_id: user?.department_id }));
     // Fetch section rooms for user's department
      dispatch(fetchSectionRooms());
      dispatch(fetchBatches());
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

  // Filter section rooms for user's department
  const departmentSectionRooms = useMemo(() => {
    if (!user?.department_id) return [];
    return sectionRooms.filter((sr: { department_id: any; }) => sr.department_id === user.department_id);
  }, [sectionRooms, user]);

  // Filter section rooms based on search and batch filter
  const filteredSectionRooms = useMemo(() => {
    return departmentSectionRooms.filter((sr) => {
      const matchesSearch = searchTerm ? 
        sr.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sr.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sr.batch_year?.toString().includes(searchTerm)
        : true;
      
      const matchesBatch = selectedBatch ? 
        sr.batch_id.toString() === selectedBatch 
        : true;
      
      return matchesSearch && matchesBatch;
    });
  }, [departmentSectionRooms, searchTerm, selectedBatch]);

  // Calculate statistics for user's department only
  const totalAssignments = departmentSectionRooms.length;
  const uniqueBatches = [...new Set(departmentSectionRooms.map((sr: { batch_id: any; }) => sr.batch_id))].length;
  const uniqueRooms = [...new Set(departmentSectionRooms.map((sr: { room_id: any; }) => sr.room_id))].length;

  // Handle save
  const handleSave = useCallback(async (id: number | null, data: SectionRoomFormData) => {
    try {
      if (id === null) {
        await dispatch(createSectionRoom(data)).unwrap();
      } else {
        await dispatch(updateSectionRoom({ id, data })).unwrap();
      }
      // Refresh section rooms for user's department
      dispatch(fetchSectionRooms());
    } catch (err: any) {
      throw err;
    }
  }, [dispatch]);

  // Handle delete
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Are you sure you want to delete this section room assignment?")) {
      return;
    }
    
    try {
      await dispatch(deleteSectionRoom(id)).unwrap();
      // Refresh section rooms for user's department
      dispatch(fetchSectionRooms());
      notifications.show({
        color: "green",
        title: "Success",
        message: "Section room assignment deleted successfully",
      });
    } catch (err: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message || "Failed to delete assignment",
      });
    }
  }, [dispatch]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedBatch(null);
  }, []);

  const hasFilters = useMemo(() => {
    return !!(searchTerm || selectedBatch);
  }, [searchTerm, selectedBatch]);

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
                <BookOpenIcon className="h-6 w-6" />
              </ThemeIcon>
              <div>
                <Title order={1} c="blue" className="text-blue">Section Room Management</Title>
                <Group gap="sm" mt={4}>
                  <Badge color="blue" variant="light">
                    {user.department_name || `Department ID: ${user.department_id}`}
                  </Badge>
                  <Badge color="green" variant="light">
                    Department Head
                  </Badge>
                </Group>
              </div>
            </Group>
            <Text className="text-blue-100 max-w-2xl" component="div">
              Assign classrooms to specific sections and batches in your department. 
              Manage room allocation and ensure proper scheduling for academic activities.
            </Text>
          </Stack>
        </Box>

        {/* Stats Dashboard */}
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <StatCard 
              icon={BookOpenIcon}
              title="Total Assignments"
              value={totalAssignments}
              color="blue"
              description="Section-Room links in your department"
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <StatCard 
              icon={UsersIcon}
              title="Batches"
              value={uniqueBatches}
              color="orange"
              description="Batches with room assignments"
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
            <StatCard 
              icon={MapPinIcon}
              title="Rooms Assigned"
              value={uniqueRooms}
              color="purple"
              description="Unique rooms in use"
            />
          </Grid.Col>
        </Grid>

        {/* Search and Filters */}
        <Card withBorder radius="lg" shadow="sm">
          <Card.Section withBorder inheritPadding py="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size="sm" radius="lg" color="blue" variant="light">
                    <AcademicCapIcon className="h-4 w-4" />
                  </ThemeIcon>
                  <Text fw={600} component="div">Section Room Assignments</Text>
                  <Badge variant="light" color="blue">
                    {filteredSectionRooms.length} found
                  </Badge>
                </Group>
                
                <Button 
                  onClick={() => setModalState({ opened: true, sectionRoom: null })}
                  leftSection={<PlusCircleIcon className="h-5 w-5" />}
                  loading={loading}
                  disabled={!user?.department_id}
                  size="md"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Assign Room to Section
                </Button>
              </Group>

              <Group gap="md" align="flex-end">
                <TextInput
                  placeholder="Search sections, rooms, batch years..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftSection={<MagnifyingGlassIcon className="h-4 w-4" />}
                  size="md"
                  radius="md"
                  style={{ flex: 1 }}
                />
                
                <Select
                  placeholder="Filter by Batch"
                  data={batches.map(b => ({
                    value: b.batch_id.toString(),
                    label: `Batch ${b.batch_year}`
                  }))}
                  value={selectedBatch}
                  onChange={setSelectedBatch}
                  clearable
                  size="md"
                  style={{ width: 200 }}
                />
                
                {hasFilters && (
                  <Button
                    variant="subtle"
                    color="red"
                    leftSection={<XCircleIcon className="h-4 w-4" />}
                    onClick={clearFilters}
                    size="md"
                  >
                    Clear Filters
                  </Button>
                )}
              </Group>
            </Stack>
          </Card.Section>

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

          {/* Section Rooms Table */}
          <Card.Section inheritPadding py="md">
            {loading && departmentSectionRooms.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <Loader size="lg" color="blue" />
                  <Text c="dimmed" component="div">Loading section rooms...</Text>
                </Stack>
              </Center>
            ) : filteredSectionRooms.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <ThemeIcon size="xl" radius="lg" color="gray" variant="light">
                    <BookOpenIcon className="h-8 w-8" />
                  </ThemeIcon>
                  <Text size="lg" fw={500} c="dimmed" component="div">
                    {hasFilters ? "No assignments match your filters" : "No section room assignments found"}
                  </Text>
                  <Text c="dimmed" ta="center" maw={500} component="div">
                    {hasFilters 
                      ? "Try adjusting your search or filters"
                      : "Get started by creating your first section room assignment for your department"
                    }
                  </Text>
                  <Button 
                    onClick={() => setModalState({ opened: true, sectionRoom: null })}
                    leftSection={<PlusCircleIcon className="h-4 w-4" />}
                    size="md"
                    className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Create First Assignment
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
                            <UsersIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Batch</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <HashtagIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Section</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <BookOpenIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Room</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <MapPinIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Room Details</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <CalendarIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Assigned On</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th style={{ width: 100 }}>
                          <Text fw={600} component="div">Actions</Text>
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                      <Table.Tbody>
                      {filteredSectionRooms.map((sr, index)=>(
                        <Table.Tr key={sr.id} className="hover:bg-blue-50/50 transition-colors">
                          <Table.Td>
                            <Text fw={500} className="text-gray-700" component="div">{index + 1}</Text>
                          </Table.Td>
                          
                          <Table.Td>
                            <Badge 
                              color="orange"
                              variant="light" 
                              size="lg"
                              leftSection={<UsersIcon className="h-3 w-3 mr-1" />}
                            >
                               {sr.batch_year}
                            </Badge>
                          </Table.Td>
                          
                          <Table.Td>
                            <Badge 
                              color="blue"
                              variant="light" 
                              size="lg"
                              leftSection={<HashtagIcon className="h-3 w-3 mr-1" />}
                            >
                              Section {sr.section}
                            </Badge>
                          </Table.Td>
                          
                          <Table.Td>
                            <Group gap="sm">
                              <Avatar 
                                size="md" 
                                radius="md" 
                                color="green" 
                                variant="light"
                              >
                                {sr.room_number?.charAt(0) || 'R'}
                              </Avatar>
                              <div>
                                <Text fw={600} component="div">{sr.block_code }-{sr.room_number}</Text>
                                <Text size="sm" c="dimmed" lineClamp={1} component="div">
                                  {sr.room_name}
                                </Text>
                              </div>
                            </Group>
                          </Table.Td>
                          
                          <Table.Td>
                            <Stack gap={2}>
                              <Text size="sm" component="div">
                                <strong>Type:</strong>{" "}
                                <Badge color="blue" variant="light" size="xs">
                                  {sr.room_type}
                                </Badge>
                              </Text>
                              <Text size="sm" component="div">
                                <strong>Capacity:</strong> {sr.capacity} seats
                              </Text>
                            </Stack>
                          </Table.Td>
                          
                          <Table.Td>
                            <Text size="sm" c="dimmed" component="div">
                              {new Date(sr.created_at).toLocaleDateString()}
                            </Text>
                            <Text size="xs" c="dimmed" component="div">
                              {new Date(sr.created_at).toLocaleTimeString()}
                            </Text>
                          </Table.Td>
                          
                          <Table.Td>
                            <Group gap="xs">
                              <Tooltip label="Edit assignment">
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  onClick={() => setModalState({ opened: true, sectionRoom: sr })}
                                >
                                  <PencilSquareIcon className="h-4 w-4" />
                                </ActionIcon>
                              </Tooltip>
                              
                              <Tooltip label="Delete assignment">
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  onClick={() => handleDelete(sr.id)}
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

      {/* Section Room Modal */}
      <SectionRoomModal
  opened={modalState.opened}
  onClose={() => setModalState({ opened: false, sectionRoom: null })}
  sectionRoom={modalState.sectionRoom}
  onSave={handleSave}
  batches={batches}
  user={user}
  sectionRooms={departmentSectionRooms} // Pass the section rooms
/>
    </Container>
  );
};

export default SectionRoomManagement;