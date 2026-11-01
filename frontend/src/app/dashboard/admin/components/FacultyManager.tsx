/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Menu,
  Select,
  Avatar,
  ThemeIcon,
  Paper,
  Grid,
  Center,
  MultiSelect,
  Divider,
  SimpleGrid,
  Tabs,
  Progress,
  rem,
  Tooltip,
} from "@mantine/core";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  BuildingLibraryIcon,
  AcademicCapIcon,
  EllipsisVerticalIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  MapIcon,
  CogIcon,
  WrenchScrewdriverIcon,
  UsersIcon,
  BookOpenIcon,
  ChartBarIcon,
  ChevronRightIcon,
  ArrowsPointingOutIcon,
  HomeModernIcon,
  UnderlineIcon,
} from "@heroicons/react/24/outline";
import { notifications } from "@mantine/notifications";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";

// Faculty imports
import {
  fetchFaculties,
  addFaculty,
  updateFaculty,
  deleteFaculty,
  fetchFacultyDepartments,
  assignDepartmentToFaculty,
  clearError,
  clearSuccessMessage,
  Faculty,
  clearAssignmentError,
  clearAssignmentSuccessMessage,
} from "@/store/slices/facultySlice";

// Department imports
import { fetchDepartments } from "@/store/slices/departmentsSlice";

// Room/Block imports (now from roomSlice)
import { 
  fetchBlocks, 
  assignBlocksToFaculty,
  fetchFacultyBlocks,
  removeBlockFromFaculty,
  Block 
} from "@/store/slices/roomsSlice";

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


interface FacultyModalProps {
  opened: boolean;
  onClose: () => void;
  faculty: Faculty | null;
  onSave: (id: number | null, name: string) => void;
}

const FacultyModal: React.FC<FacultyModalProps> = ({
  opened,
  onClose,
  faculty,
  onSave,
}) => {
  const [facultyName, setFacultyName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (faculty) {
      setFacultyName(faculty.faculity_name);
    } else {
      setFacultyName("");
    }
  }, [faculty, opened]);

  const handleSave = async () => {
    if (!facultyName.trim()) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "Faculty name is required",
      });
      return;
    }
    
    setLoading(true);
    try {
      await onSave(faculty ? faculty.faculity_id : null, facultyName.trim());
      notifications.show({
        color: "green",
        title: "Success",
        message: faculty ? "Faculty updated successfully" : "Faculty created successfully",
      });
    } catch (error) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "Failed to save faculty",
      });
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleClose = () => {
    setFacultyName("");
    onClose();
  };

  return (
    <Modal 
      opened={opened} 
      onClose={handleClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="lg" color="blue" variant="light">
            <BuildingLibraryIcon className="h-5 w-5" />
          </ThemeIcon>
          <div>
            <Text fw={600}>{faculty ? "Edit Faculty" : "Create New Faculty"}</Text>
            <Text size="sm" c="dimmed">{faculty ? "Update faculty details" : "Add a new faculty to the system"}</Text>
          </div>
        </Group>
      }
      centered
      size="md"
      radius="lg"
      overlayProps={{ blur: 3 }}
    >
      <Stack gap="lg">
        <Paper withBorder p="md" radius="md" className="bg-blue-50/50 border-blue-100">
          <Text size="sm" c="blue" fw={500}>
            {faculty 
              ? "Update the faculty information. This will affect all associated departments and blocks." 
              : "Create a new faculty to organize academic departments and building blocks."}
          </Text>
        </Paper>
        
        <TextInput
          label={
            <Group gap="xs">
              <AcademicCapIcon className="h-4 w-4" />
              <Text>Faculty Name</Text>
            </Group>
          }
          placeholder="Enter faculty name (e.g., Faculty of Engineering)"
          value={facultyName}
          onChange={(e) => setFacultyName(e.currentTarget.value)}
          required
          size="md"
          withAsterisk
          description="Provide a clear and descriptive name for the faculty"
          radius="md"
        />
        
        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={handleClose} size="md">
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            size="md"
            loading={loading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            leftSection={faculty ? <PencilSquareIcon className="h-4 w-4" /> : <PlusCircleIcon className="h-4 w-4" />}
          >
            {loading ? "Saving..." : faculty ? "Update Faculty" : "Create Faculty"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};



interface AssignBlocksModalProps {
  opened: boolean;
  onClose: () => void;
  faculty: Faculty | null;
  onAssign: (facultyId: number, blockIds: number[], status?: string) => void;
  assignedBlocks?: Block[];
}

const AssignBlocksModal: React.FC<AssignBlocksModalProps> = ({
  opened,
  onClose,
  faculty,
  onAssign,
  assignedBlocks = [],
}) => {
  const dispatch = useAppDispatch();
  const roomsState = useAppSelector((state) => state.rooms);
  const blocks = roomsState.blocks;
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [blockStatus, setBlockStatus] = useState<string>("active");
  const [loading, setLoading] = useState(false);
  const [availableBlocks, setAvailableBlocks] = useState<Block[]>([]);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Only run when modal opens and faculty exists
    if (opened && faculty && faculty.faculity_id && !hasFetchedRef.current) {
      setLoading(true);
      
      const fetchBlocksData = async () => {
        try {
          // Fetch blocks only if not already loaded in parent
          if (blocks.length === 0) {
            await dispatch(fetchBlocks());
          }
          
          // Use current values
          const currentAssignedBlocks = assignedBlocks || [];
          const currentBlocks = blocks || [];
          
          const assignedBlockIds = currentAssignedBlocks.map(b => b.block_id);
          setAvailableBlocks(currentBlocks.filter(block => 
            !assignedBlockIds.includes(block.block_id)
          ));
          setSelectedBlocks(assignedBlockIds.map(id => id.toString()));
          
          hasFetchedRef.current = true;
        } catch (error) {
          console.error("Error fetching blocks:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchBlocksData();
    }
    
    // Reset when modal closes
    if (!opened) {
      hasFetchedRef.current = false;
      setAvailableBlocks([]);
      setSelectedBlocks([]);
    }
  }, [dispatch, opened, faculty?.faculity_id, blocks.length, faculty, blocks, assignedBlocks]); // Add null check for faculty

  const handleAssign = async () => {
    // Check if faculty exists before assigning
    if (!faculty || !faculty.faculity_id || selectedBlocks.length === 0) {
      notifications.show({
        title: "Error",
        message: "Faculty information is missing",
        color: "red",
      });
      return;
    }
    
    setLoading(true);
      const blockIds = selectedBlocks.map(id => Number(id));
      await onAssign(faculty.faculity_id, blockIds, blockStatus);
      onClose();
   
  };

  const handleClose = () => {
    setSelectedBlocks([]);
    setBlockStatus("active");
    onClose();
  };

  const selectedBlocksData = selectedBlocks.map(id => 
    blocks.find(block => block.block_id.toString() === id)
  ).filter(Boolean) as Block[];

  // Early return if no faculty
  if (!faculty) {
    return (
      <Modal 
        opened={opened} 
        onClose={handleClose}
        title="Error"
        centered
        size="md"
        radius="lg"
      >
        <Alert color="red" title="Faculty Not Found">
          Faculty information is missing. Please try again.
        </Alert>
      </Modal>
    );
  }

  return (
    <Modal 
      opened={opened} 
      onClose={handleClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="lg" color="orange" variant="light">
            <BuildingStorefrontIcon className="h-5 w-5" />
          </ThemeIcon>
          <div>
            <Text fw={600}>Assign Building Blocks</Text>
            <Text size="sm" c="dimmed">Manage building blocks for this faculty</Text>
          </div>
        </Group>
      }
      centered
      size="xl"
      radius="lg"
    >
      <Stack gap="lg">
        <Paper withBorder p="md" radius="md" className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100">
          <Group justify="space-between">
            <div>
              <Text size="sm" fw={500} c="orange">Assigning to</Text>
              <Group gap="md" mt="xs">
                <Avatar size="lg" radius="md" color="orange">
                  {faculty.faculity_name?.charAt(0).toUpperCase() || 'F'}
                </Avatar>
                <div>
                  <Text fw={600} size="lg">{faculty.faculity_name || 'Unknown Faculty'}</Text>
                  <Text size="sm" c="dimmed">Faculty • {faculty.department_count || 0} departments</Text>
                </div>
              </Group>
            </div>
            <Badge size="lg" color="orange" variant="light">
              {selectedBlocks.length} selected
            </Badge>
          </Group>
        </Paper>

        {/* Rest of the modal content remains the same */}
        <Tabs defaultValue="select" variant="outline">
          <Tabs.List grow>
            <Tabs.Tab value="select" leftSection={<PlusCircleIcon className="h-4 w-4" />}>
              Select Blocks
            </Tabs.Tab>
            <Tabs.Tab value="assigned" leftSection={<CheckCircleIcon className="h-4 w-4" />}>
              Already Assigned ({assignedBlocks.length})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="select" pt="md">
            <Stack gap="md">
              <div>
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Available Blocks</Text>
                  <Badge variant="light" color="blue">
                    {availableBlocks.length} available
                  </Badge>
                </Group>
                
                {loading ? (
                  <Center py="xl">
                    <Stack align="center" gap="md">
                      <Loader size="md" color="orange" />
                      <Text c="dimmed">Loading blocks...</Text>
                    </Stack>
                  </Center>
                ) : availableBlocks.length === 0 ? (
                  <Paper withBorder p="xl" radius="md" className="text-center">
                    <BuildingStorefrontIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <Text fw={500} mb="xs">No Blocks Available</Text>
                    <Text size="sm" c="dimmed" mb="md">
                      All blocks are already assigned to this faculty.
                    </Text>
                  </Paper>
                ) : (
                  <MultiSelect
                    data={availableBlocks.map(block => ({
                      value: block.block_id.toString(),
                      label: block.block_name,
                      description: `${block.building_name || 'No building'} • ${block.block_code}`
                    }))}
                    value={selectedBlocks}
                    onChange={setSelectedBlocks}
                    placeholder="Search and select blocks..."
                    searchable
                    clearable
                    hidePickedOptions
                    maxDropdownHeight={300}
                    size="md"
                    radius="md"
                    nothingFoundMessage="No blocks found"
                  />
                )}
              </div>

              <div>
                <Text fw={600} mb="sm">Assignment Status</Text>
                <Select
                  value={blockStatus}
                  onChange={(value) => setBlockStatus(value || "active")}
                  data={[
                    { value: 'active', label: 'Active - Operational' },
                    { value: 'maintenance', label: 'Under Maintenance' },
                    { value: 'reserved', label: 'Reserved' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                  size="md"
                  radius="md"
                />
              </div>

              {selectedBlocksData.length > 0 && (
                <Paper withBorder p="md" radius="md">
                  <Group justify="space-between" mb="md">
                    <Text fw={600}>Selected Blocks ({selectedBlocksData.length})</Text>
                    <Badge color="green" variant="light">Ready to assign</Badge>
                  </Group>
                  <ScrollArea h={200}>
                    <Stack gap="sm">
                      {selectedBlocksData.map((block) => (
                        <Paper key={block.block_id} withBorder p="sm" radius="md" className="bg-green-50/50">
                          <Group justify="space-between">
                            <Group gap="sm">
                              <Avatar size="sm" radius="md" color="green" variant="light">
                                <BuildingStorefrontIcon className="h-3 w-3" />
                              </Avatar>
                              <div>
                                <Text fw={500}>{block.block_name}</Text>
                                <Text size="xs" c="dimmed">
                                  {block.block_code} • {block.building_name || 'No building'}
                                </Text>
                              </div>
                            </Group>
                            <Badge size="sm" color={blockStatus === 'active' ? 'green' : 'orange'} variant="light">
                              {blockStatus}
                            </Badge>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </ScrollArea>
                </Paper>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="assigned" pt="md">
            {assignedBlocks.length === 0 ? (
              <Paper withBorder p="xl" radius="md" className="text-center">
                <HomeModernIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <Text fw={500} mb="xs">No Blocks Assigned</Text>
                <Text size="sm" c="dimmed">
                  This faculty doesn&apos;t have any building blocks assigned yet.
                </Text>
              </Paper>
            ) : (
              <ScrollArea h={350}>
                <Stack gap="sm">
                  {assignedBlocks.map((block) => (
                    <Paper key={block.block_id} withBorder p="md" radius="md">
                      <Group justify="space-between">
                        <Group gap="sm">
                          <Avatar size="md" radius="md" color="blue" variant="light">
                            <BuildingStorefrontIcon className="h-4 w-4" />
                          </Avatar>
                          <div>
                            <Text fw={500}>{block.block_name}</Text>
                            <Text size="sm" c="dimmed">
                              {block.block_code} • {block.building_name || 'No building specified'}
                            </Text>
                            {block.location && (
                              <Text size="xs" c="dimmed" mt={2}>
                                <MapIcon className="h-3 w-3 inline mr-1" />
                                {block.location}
                              </Text>
                            )}
                          </div>
                        </Group>
                        <Badge color="blue" variant="light">Assigned</Badge>
                      </Group>
                    </Paper>
                  ))}
                </Stack>
              </ScrollArea>
            )}
          </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={handleClose} size="md">
            Cancel
          </Button>
          <Button 
            onClick={handleAssign}
            disabled={!faculty?.faculity_id || selectedBlocks.length === 0 || loading}
            loading={loading}
            size="md"
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            leftSection={<PlusIcon className="h-5 w-5" />}
          >
            {loading ? "Assigning..." : `Assign ${selectedBlocks.length} Block(s)`}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

const FacultyManager: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors - FACULTY
  const { 
    faculties, 
    facultyDepartments,
    loading: facultyLoading, 
    error, 
    successMessage,
    assignmentError,
    assignmentSuccessMessage  } = useAppSelector((state) => state.faculty);
  
  // Redux selectors - ROOMS (which includes blocks)
  const roomsState = useAppSelector((state) => state.rooms);
  const blocks = roomsState.blocks || [];
  const facultyBlocks = roomsState.facultyBlocks || [];
  
  // Local state
  const [facultyModal, setFacultyModal] = useState<{
    opened: boolean;
    faculty: Faculty | null;
  }>({
    opened: false,
    faculty: null
  });

  const [assignModal, setAssignModal] = useState<Faculty | null>(null);
  const [assignBlocksModal, setAssignBlocksModal] = useState<Faculty | null>(null);
  const [viewModal, setViewModal] = useState<{
    faculty: Faculty | null;
    showBlocks: boolean;
  }>({
    faculty: null,
    showBlocks: false
  });
  
  const [viewLoading, setViewLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchFaculties());
    dispatch(fetchBlocks());
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

  useEffect(() => {
    if (assignmentError) {
      const timer = setTimeout(() => {
        dispatch(clearAssignmentError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [assignmentError, dispatch]);

  useEffect(() => {
    if (assignmentSuccessMessage) {
      const timer = setTimeout(() => {
        dispatch(clearAssignmentSuccessMessage());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [assignmentSuccessMessage, dispatch]);
  
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
  // Filter faculties based on search
  const filteredFaculties = faculties.filter(faculty => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      faculty.faculity_name.toLowerCase().includes(searchLower) ||
      (faculty.department_names && faculty.department_names.toLowerCase().includes(searchLower))
    );
  });

  // Filter by active tab
  const filteredByTab = filteredFaculties.filter(faculty => {
    if (activeTab === "all") return true;
    if (activeTab === "with-departments") return (faculty.department_count || 0) > 0;
    if (activeTab === "without-departments") return (faculty.department_count || 0) ==0;
    if (activeTab === "with-blocks") return true; // This would need actual block count
    return true;
  });

  // Calculate statistics
  const totalFaculties = faculties.length;
  const facultiesWithDepartments = faculties.filter(f => (f.department_count || 0) > 0).length;
  const facultiesWithoutDepartments = faculties.filter(f => !f.department_count || f.department_count === 0).length;
  const totalBlocks = blocks.length;

  // View faculty details
  const handleViewFaculty = async (faculty: Faculty, showBlocks = false) => {
    setViewModal({ faculty, showBlocks });
    setViewLoading(true);
    try {
      await dispatch(fetchFacultyDepartments(faculty.faculity_id));
      if (showBlocks) {
        await dispatch(fetchFacultyBlocks(faculty.faculity_id));
      }
    } catch (error) {
      console.error("Error fetching faculty details:", error);
    } finally {
      setViewLoading(false);
    }
  };

  // Save faculty (add or edit)
  const handleSaveFaculty = async (id: number | null, name: string) => {
    try {
      if (id === null) {
        await dispatch(addFaculty(name)).unwrap();
      } else {
        await dispatch(updateFaculty({ id, faculity_name: name })).unwrap();
      }
      dispatch(fetchFaculties());
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "Failed to save faculty",
        color: "red",
      });
      throw err;
    }
  };

  // Delete faculty
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this faculty? This will remove all department and block associations.")) {
      return;
    }
    
    try {
      await dispatch(deleteFaculty(id)).unwrap();
      dispatch(fetchFaculties());
      notifications.show({
        title: "Success",
        message: "Faculty deleted successfully",
        color: "green",
      });
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "Failed to delete faculty",
        color: "red",
      });
    }
  };

  // Assign department to faculty
  const handleAssignDepartment = async (facultyId: number, departmentId: number) => {
    try {
      await dispatch(assignDepartmentToFaculty({ facultyId, departmentId })).unwrap();
      dispatch(fetchFaculties());
      if (viewModal.faculty?.faculity_id === facultyId) {
        dispatch(fetchFacultyDepartments(facultyId));
      }
    } catch (err: any) {
      throw new Error(err.message || "Failed to assign department");
    }
  };

  // Assign blocks to faculty
  const handleAssignBlocks = async (facultyId: number, blockIds: number[], status = 'active') => {
    try {
      await dispatch(assignBlocksToFaculty({ facultyId, blockIds, status })).unwrap();
      if (viewModal.faculty?.faculity_id === facultyId && viewModal.showBlocks) {
        await dispatch(fetchFacultyBlocks(facultyId));
      }
         notifications.show({
            title: "Success",
            message: "Block assigned successfully",
            color: "green",
          });
    } catch (err: any) {
       notifications.show({
        title: "Error",
        message: typeof err === "string" ? err : "Failed to assign blocks ",
        color: "red",
      });
    }
  };

  // Remove block from faculty
  const handleRemoveBlock = async (facultyId: number, blockId: number) => {
    if (!confirm("Are you sure you want to remove this block from the faculty?")) {
      return;
    }
    
    try {
      await dispatch(removeBlockFromFaculty({ facultyId, blockId })).unwrap();
      if (viewModal.faculty?.faculity_id === facultyId && viewModal.showBlocks) {
        await dispatch(fetchFacultyBlocks(facultyId));
      }
      notifications.show({
        title: "Success",
        message: "Block removed from faculty",
        color: "green",
      });
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "Failed to remove block",
        color: "red",
      });
    }
  };

  const handleCloseModal = () => {
    setFacultyModal({
      opened: false,
      faculty: null
    });
  };

  return (
    <Container size="xl" py="xl" className="min-h-screen">
      <Stack gap="lg">
        {/* Header */}
        <Box className="relative overflow-hidden rounded-2xl  to-pink-600 p-8">
          <Stack gap="xs">
            <Group align="center" gap="sm">
              <ThemeIcon size="xl" radius="lg" variant="blue" color="blue">
                <BuildingLibraryIcon className="h-6 w-6" />
              </ThemeIcon>
              <Title order={1}  className="text-blue">Faculty Management</Title>
            </Group>
            <Text className="text-blue/90 max-w-2xl">
              Organize academic departments and building blocks into faculties for better administration. 
              Manage departments, assign building blocks, and coordinate faculty resources.
            </Text>
          </Stack>
        </Box>

        {/* Stats Dashboard */}
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="lg">
          <StatCard 
            icon={BuildingLibraryIcon}
            title="Total Faculties"
            value={totalFaculties}
            color="purple"
            description="Academic faculties"
          />
          
          <StatCard 
            icon={CheckCircleIcon}
            title="With Departments"
            value={facultiesWithDepartments}
            color="green"
            description="Faculties with departments"
          />
          
          <StatCard 
            icon={BuildingStorefrontIcon}
            title="Building Blocks"
            value={totalBlocks}
            color="orange"
            description="Available blocks"
          />
          
          <StatCard 
            icon={XCircleIcon}
            title="Without Departments"
            value={facultiesWithoutDepartments}
            color="red"
            description="Need department assignment"
          />
        </SimpleGrid>

        {/* Search and Filters */}
        <Card withBorder radius="lg" shadow="sm">
          <Card.Section withBorder inheritPadding py="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size="sm" radius="lg" color="blue" variant="light">
                    <AcademicCapIcon className="h-4 w-4" />
                  </ThemeIcon>
                  <Text fw={600}>Manage Faculties</Text>
                  <Badge variant="light" color="blue">
                    {filteredByTab.length} found
                  </Badge>
                </Group>
                
                <Button 
                  onClick={() => setFacultyModal({ opened: true, faculty: null })}
                  leftSection={<PlusCircleIcon className="h-5 w-5" />}
                  loading={facultyLoading}
                  size="md"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  New Faculty
                </Button>
              </Group>

              <Group gap="md">
                <TextInput
                  placeholder="Search faculties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.currentTarget.value)}
                  leftSection={<AcademicCapIcon className="h-4 w-4" />}
                  size="md"
                  radius="md"
                  style={{ flex: 1 }}
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

                <Tabs value={activeTab} onChange={(value)=>setActiveTab(value || 'all'||'with-departments' ||'without-departments' )}>
                  <Tabs.List>
                    <Tabs.Tab value="all">All</Tabs.Tab>
                    <Tabs.Tab value="with-departments">With Departments</Tabs.Tab>
                    <Tabs.Tab value="without-departments">Without Departments</Tabs.Tab>
                  </Tabs.List>
                </Tabs>
              </Group>
            </Stack>
          </Card.Section>

          {/* Error and Success Messages */}
          {(error || assignmentError || successMessage || assignmentSuccessMessage) && (
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
                
                {assignmentError && (
                  <Alert 
                    color="red" 
                    title="Assignment Error" 
                    withCloseButton 
                    onClose={() => dispatch(clearAssignmentError())}
                    radius="md"
                    icon={<XCircleIcon className="h-5 w-5" />}
                  >
                    {assignmentError}
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
                
                {assignmentSuccessMessage && (
                  <Alert 
                    color="green" 
                    title="Success" 
                    withCloseButton 
                    onClose={() => dispatch(clearAssignmentSuccessMessage())}
                    radius="md"
                    icon={<CheckCircleIcon className="h-5 w-5" />}
                  >
                    {assignmentSuccessMessage}
                  </Alert>
                )}
              </Stack>
            </Card.Section>
          )}

          {/* Faculties Table */}
          <Card.Section inheritPadding py="md">
            {facultyLoading && filteredByTab.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <Loader size="lg" color="purple" />
                  <Text c="dimmed">Loading faculties...</Text>
                </Stack>
              </Center>
            ) : filteredByTab.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <ThemeIcon size="xl" radius="lg" color="gray" variant="light">
                    <BuildingLibraryIcon className="h-8 w-8" />
                  </ThemeIcon>
                  <Text size="lg" fw={500} c="dimmed">No faculties found</Text>
                  <Text c="dimmed" ta="center" maw={500}>
                    {searchTerm ? "No faculties match your search" : "Create your first faculty to get started"}
                  </Text>
                  <Button 
                    onClick={() => setFacultyModal({ opened: true, faculty: null })}
                    leftSection={<PlusCircleIcon className="h-4 w-4" />}
                    size="md"
                    className="mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Create First Faculty
                  </Button>
                </Stack>
              </Center>
            ) : (
               <ScrollArea>
                 <Table.ScrollContainer minWidth={1250}>                <Table verticalSpacing="md" highlightOnHover>
                  <Table.Thead className="bg-gray-50">
                    <Table.Tr>
                      <Table.Th style={{ width: 60 }}>
                        <Text fw={600}>#</Text>
                      </Table.Th>
                      <Table.Th>
                        <Group gap="xs">
                          <AcademicCapIcon className="h-4 w-4" />
                          <Text fw={600}>Faculty</Text>
                        </Group>
                      </Table.Th>
                      <Table.Th>
                        <Group gap="xs">
                          <BuildingOfficeIcon className="h-4 w-4" />
                          <Text fw={600}>Departments</Text>
                        </Group>
                      </Table.Th>
                      <Table.Th>
                        <Group gap="xs">
                          <BuildingStorefrontIcon className="h-4 w-4" />
                          <Text fw={600}>Blocks</Text>
                        </Group>
                      </Table.Th>
                      <Table.Th>
                        <Text fw={600} ta="center">Status</Text>
                      </Table.Th>
                      <Table.Th style={{ width: 150 }}>
                        <Text fw={600}>Actions</Text>
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredByTab.map((faculty, index) => (
                      <Table.Tr 
                        key={faculty.faculity_id} 
                        className="hover:bg-purple-50/50 transition-colors"
                      >
                        <Table.Td>
                          <Text fw={500} className="text-gray-700">{index + 1}</Text>
                        </Table.Td>
                        
                        <Table.Td>
                          <Group gap="sm">
                            <Avatar 
                              size="md" 
                              radius="md" 
                              color="purple" 
                              variant="light"
                              className="border border-purple-200"
                            >
                              {faculty.faculity_name.charAt(0).toUpperCase()}
                            </Avatar>
                            <div>
                              <Text fw={600} className="text-gray-900">
                                {faculty.faculity_name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                ID: {faculty.faculity_id}
                              </Text>
                            </div>
                          </Group>
                        </Table.Td>
                        
                        <Table.Td>
                          <Stack gap={4}>
                            <Badge 
                              color={faculty.department_count || 0 > 0 ? "blue" : "gray"}
                              variant="light" 
                              size="lg"
                              leftSection={<BuildingOfficeIcon className="h-3 w-3 mr-1" />}
                            >
                              {faculty.department_count || 0} departments
                            </Badge>
                            {faculty.department_names && (
                              <Text size="xs" c="dimmed" lineClamp={1}>
                                {faculty.department_names.split(',').slice(0, 2).join(', ')}
                                {faculty.department_names.split(',').length > 2 && '...'}
                              </Text>
                            )}
                          </Stack>
                        </Table.Td>
                        
                        <Table.Td>
                          <Badge 
                            color="orange"
                            variant="light" 
                            size="lg"
                            leftSection={<BuildingStorefrontIcon className="h-3 w-3 mr-1" />}
                          >
                            Manage blocks
                          </Badge>
                        </Table.Td>
                        
                        <Table.Td>
                          <Center>
                            <Badge 
                              color={(faculty.department_count || 0) > 0 ? "green" : "orange"}
                              variant="light"
                              size="lg"
                              radius="sm"
                              leftSection={(faculty.department_count || 0) > 0 ? 
                                <CheckCircleIcon className="h-3 w-3 mr-1" /> : 
                                <XCircleIcon className="h-3 w-3 mr-1" />
                              }
                            >
                              {(faculty.department_count || 0) > 0 ? "Active" : "Setup Required"}
                            </Badge>
                          </Center>
                        </Table.Td>
                        
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label="View details">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                onClick={() => handleViewFaculty(faculty, false)}
                              >
                                <EyeIcon className="h-4 w-4" />
                              </ActionIcon>
                            </Tooltip>                            
                            <Tooltip label="Assign blocks">
                              <ActionIcon
                                variant="light"
                                color="orange"
                                onClick={() => setAssignBlocksModal(faculty)}
                              >
                                <BuildingStorefrontIcon className="h-4 w-4" />
                              </ActionIcon>
                            </Tooltip>
                            
                            <Menu shadow="md" width={200} position="bottom-end">
                              <Menu.Target>
                                <ActionIcon variant="subtle" color="gray">
                                  <EllipsisVerticalIcon className="h-4 w-4" />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item
                                  leftSection={<PencilSquareIcon className="h-4 w-4" />}
                                  onClick={() => setFacultyModal({ opened: true, faculty })}
                                >
                                  Edit Faculty
                                </Menu.Item>
                                <Menu.Item
                                  leftSection={<BuildingStorefrontIcon className="h-4 w-4" />}
                                  onClick={() => handleViewFaculty(faculty, true)}
                                >
                                  View Blocks
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item
                                  color="red"
                                  leftSection={<TrashIcon className="h-4 w-4" />}
                                  onClick={() => handleDelete(faculty.faculity_id)}
                                >
                                  Delete Faculty
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
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

      {/* Modals */}
      <FacultyModal
        opened={facultyModal.opened}
        onClose={handleCloseModal}
        faculty={facultyModal.faculty}
        onSave={handleSaveFaculty}
      />

      <AssignBlocksModal
        opened={!!assignBlocksModal}
        onClose={() => setAssignBlocksModal(null)}
        faculty={assignBlocksModal}
        onAssign={handleAssignBlocks}
        assignedBlocks={facultyBlocks}
      />

      {/* View Faculty Details Modal */}
      <Modal
        opened={!!viewModal.faculty}
        onClose={() => setViewModal({ faculty: null, showBlocks: false })}
        title={
          <Group gap="sm">
            <ThemeIcon size="md" radius="lg" color={viewModal.showBlocks ? "orange" : "blue"} variant="light">
              {viewModal.showBlocks ? 
                <BuildingStorefrontIcon className="h-5 w-5" /> : 
                <BuildingLibraryIcon className="h-5 w-5" />
              }
            </ThemeIcon>
            <div>
              <Text fw={600}>
                {viewModal.showBlocks ? "Faculty Blocks" : "Faculty Details"}
              </Text>
              <Text size="sm" c="dimmed">{viewModal.faculty?.faculity_name}</Text>
            </div>
          </Group>
        }
        size={viewModal.showBlocks ? "xl" : "lg"}
        centered
        radius="lg"
      >
        {viewModal.faculty && (
          <Stack gap="lg">
            {/* Faculty Header */}
            <Paper withBorder p="md" radius="md" className={
              viewModal.showBlocks ? "bg-gradient-to-r from-orange-50 to-amber-50" : "bg-gradient-to-r from-blue-50 to-indigo-50"
            }>
              <Group justify="space-between">
                <Group gap="md">
                  <Avatar 
                    size="xl" 
                    radius="lg" 
                    color={viewModal.showBlocks ? "orange" : "blue"}
                    variant="light"
                    className={`border-2 ${viewModal.showBlocks ? 'border-orange-200' : 'border-blue-200'}`}
                  >
                    {viewModal.faculty.faculity_name.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <Text fw={600} size="xl">{viewModal.faculty.faculity_name}</Text>
                    <Group gap="lg" mt="xs">
                      <Badge size="lg" color={viewModal.showBlocks ? "orange" : "blue"} variant="light">
                        ID: {viewModal.faculty.faculity_id}
                      </Badge>
                      {viewModal.showBlocks ? (
                        <Badge size="lg" color="orange" variant="light">
                          {facultyBlocks.length} Blocks
                        </Badge>
                      ) : (
                        <Badge size="lg" color="green" variant="light">
                          {facultyDepartments.length} Departments
                        </Badge>
                      )}
                    </Group>
                  </div>
                </Group>
              </Group>
            </Paper>

            {/* Toggle View Button */}
            <Group justify="center">
              <Button
                variant="light"
                color={viewModal.showBlocks ? "blue" : "orange"}
                onClick={() => handleViewFaculty(viewModal.faculty! , !viewModal.showBlocks)}
                leftSection={viewModal.showBlocks ? <BuildingOfficeIcon className="h-4 w-4" /> : <BuildingStorefrontIcon className="h-4 w-4" />}
              >
                {viewModal.showBlocks ? "View Departments" : "View Building Blocks"}
              </Button>
            </Group>

            {/* Content */}
            {viewLoading ? (
              <Center py="xl">
                <Loader size="md" color={viewModal.showBlocks ? "orange" : "blue"} />
              </Center>
            ) : viewModal.showBlocks ? (
              /* Blocks Section */
              <div>
                <Group justify="space-between" mb="md">
                  <Text fw={600} size="lg">Assigned Building Blocks</Text>
                  <Badge variant="light" color="orange">
                    {facultyBlocks.length} total
                  </Badge>
                </Group>
                
                {facultyBlocks.length === 0 ? (
                  <Paper withBorder p="xl" radius="md" className="text-center">
                    <BuildingStorefrontIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <Text fw={500} mb="xs">No Blocks Assigned</Text>
                    <Text size="sm" c="dimmed" mb="md">
                      This faculty doesn&apos;t have any building blocks assigned yet.
                    </Text>
                  </Paper>
                ) : (
                  <ScrollArea h={400}>
                    <Stack gap="sm">
                      {facultyBlocks.map((block) => (
                        <Paper key={block.block_id} withBorder p="md" radius="md">
                          <Group justify="space-between">
                            <Group gap="sm">
                              <Avatar 
                                size="md" 
                                radius="md" 
                                color="orange"
                                variant="light"
                              >
                                <BuildingStorefrontIcon className="h-4 w-4" />
                              </Avatar>
                              <div>
                                <Text fw={600}>{block.block_name}</Text>
                                <Text size="sm" c="dimmed">
                                  {block.building_name && `Building: ${block.building_name}`}
                                  {block.location && ` • Location: ${block.location}`}
                                </Text>
                                {block.description && (
                                  <Text size="xs" c="dimmed" mt={2}>{block.description}</Text>
                                )}
                              </div>
                            </Group>
                            <Group gap="xs">
                              <Badge 
                                color={block.status === 'active' ? 'green' : 'orange'} 
                                variant="light"
                              >
                                {block.status || 'active'}
                              </Badge>
                              <ActionIcon
                                color="red"
                                variant="subtle"
                                size="sm"
                                onClick={() => handleRemoveBlock(viewModal.faculty!.faculity_id, block.block_id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </ActionIcon>
                            </Group>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </ScrollArea>
                )}
              </div>
            ) : (
              /* Departments Section */
              <div>
                <Group justify="space-between" mb="md">
                  <Text fw={600} size="lg">Departments</Text>
                  <Badge variant="light" color="blue">
                    {facultyDepartments.length} total
                  </Badge>
                </Group>
                
                {facultyDepartments.length === 0 ? (
                  <Paper withBorder p="xl" radius="md" className="text-center">
                    <BuildingOfficeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <Text fw={500} mb="xs">No Departments Assigned</Text>
                    <Text size="sm" c="dimmed" mb="md">
                      This faculty doesn&apos;t have any departments yet.
                    </Text>
                  </Paper>
                ) : (
                  <ScrollArea h={400}>
                    <Stack gap="sm">
                      {facultyDepartments.map((dept) => (
                        <Paper key={dept.department_id} withBorder p="md" radius="md">
                          <Group justify="space-between">
                            <Group gap="sm">
                              <Avatar 
                                size="md" 
                                radius="md" 
                                color="blue"
                                variant="light"
                              >
                                {dept.department_name.charAt(0).toUpperCase()}
                              </Avatar>
                              <div>
                                <Text fw={600}>{dept.department_name}</Text>
                                <Text size="sm" c="dimmed">
                                  {dept.head_name ? `Head: ${dept.head_name}` : "No head assigned"}
                                </Text>
                              </div>
                            </Group>
                            <Badge 
                              color={dept.head_name ? "green" : "yellow"} 
                              variant="light"
                            >
                              {dept.head_name ? "Has Head" : "No Head"}
                            </Badge>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </ScrollArea>
                )}
              </div>
            )}
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

export default FacultyManager;