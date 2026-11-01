/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
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
  Grid,
  Card,
  Badge,
  TextInput,
  Select,
  ThemeIcon,
  Avatar,
  Divider,
  ActionIcon,
  Tooltip,
  Center,
  Progress,
  Tabs,
  SimpleGrid,
  Menu,
  Modal,
  MultiSelect,
  Table,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import {
  IconBooks,
  IconPlus,
  IconRefresh,
  IconAlertCircle,
  IconSearch,
  IconFilter,
  IconCategory,
  IconClock,
  IconCode,
  IconTrash,
  IconEdit,
  IconChartBar,
  IconSortAscending,
  IconEye,
  IconBook,
  IconSchool,
  IconCertificate,
  IconSparkles,
  IconUser,
  IconUserPlus,
  IconUsers,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

// Redux imports
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { 
  fetchCourses, 
  clearError 
} from "@/store/slices/coursesSlice";

// CORRECTED IMPORTS - Use the Redux thunks instead of direct API functions
import {
  fetchAvailableInstructors,
  assignInstructorsToCourse,
  fetchCourseInstructors,
  removeInstructorAssignment,
  fetchAllAssignments,
  updateAssignmentStatus,
  setSelectedCourseForAssignment,
  clearAssignmentError,
  clearAssignmentSuccessMessage
} from "@/store/slices/coursesSlice";

import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";

interface Instructor {
  instructor_id: number;
  full_name: string;
  email: string;
  department?: string;
}

interface CourseAssignment {
  department_name: string;
  course_id: number;
  instructor_id: number;
  full_name: string;
  email: string;
  course_status: string;
  created_at: string;
  updated_at: string;
  instructor?: Instructor;
}

const ManageInstructorAssignment: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  // Redux selectors - updated to access the new state properties
  const courses = useAppSelector((state) => state.courses.courses);
  const loading = useAppSelector((state) => state.courses.loading);
  const error = useAppSelector((state) => state.courses.error);
  
  // New state selectors for instructor assignment
  const assignments = useAppSelector((state) => state.courses.assignments);
  const availableInstructors = useAppSelector((state) => state.courses.availableInstructors);
  const selectedCourseForAssignment = useAppSelector((state) => state.courses.selectedCourseForAssignment);
  const assignmentLoading = useAppSelector((state) => state.courses.assignmentLoading);
  const assignmentError = useAppSelector((state) => state.courses.assignmentError);
  const assignmentSuccessMessage = useAppSelector((state) => state.courses.assignmentSuccessMessage);
  const submitting = useAppSelector((state) => state.courses.submitting);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [assignModalOpened, setAssignModalOpened] = useState(false);
  const [viewModalOpened, setViewModalOpened] = useState(false);
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
  const [courseStatus, setCourseStatus] = useState<string>("active");
  const [courseAssignments, setCourseAssignments] = useState<CourseAssignment[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchAvailableInstructors());
    dispatch(fetchAllAssignments());
  }, [dispatch]);

  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);

  // Clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

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

  if (user === null) {
    return <Authentication />;
  }
  if (user.role !== 'admin') {
    return <UnauthorizedAccess />
  }

  // Filter courses based on search term and category
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchTerm ? 
      (course.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       course.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       course.category?.toLowerCase().includes(searchTerm.toLowerCase())) 
      : true;
    
    const matchesCategory = categoryFilter ? course.category === categoryFilter : true;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(courses.map(c => c.category).filter(Boolean)));

  // Handle opening assignment modal
  const handleOpenAssignModal = async (course: any) => {
    dispatch(setSelectedCourseForAssignment(course));
    setSelectedInstructors([]);
    setCourseStatus("active");
    
    try {
      // Fetch current assignments for this course
      const result = await dispatch(fetchCourseInstructors(course.course_id)).unwrap();
      
      // Pre-select currently assigned instructors
      const assignedInstructorIds = result.data.map((a: CourseAssignment) => a.instructor_id.toString());
      setSelectedInstructors(assignedInstructorIds);
      
      // Store assignments in local state for the modal
      setCourseAssignments(result.data);
      
      setAssignModalOpened(true);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: "Failed to load instructor data",
        color: "red",
        icon: <IconAlertCircle size={20} />,
      });
    }
  };

  // Handle opening view modal
  const handleOpenViewModal = async (course: any) => {
    dispatch(setSelectedCourseForAssignment(course));
    
    try {
      const result = await dispatch(fetchCourseInstructors(course.course_id)).unwrap();
      setCourseAssignments(result.data);
      setViewModalOpened(true);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: "Failed to load assigned instructors",
        color: "red",
        icon: <IconAlertCircle size={20} />,
      });
    }
  };

  // Handle instructor assignment
  const handleAssignInstructors = async () => {
    if (!selectedCourseForAssignment || selectedInstructors.length === 0) {
      notifications.show({
        title: "Warning",
        message: "Please select at least one instructor",
        color: "yellow",
        icon: <IconAlertCircle size={20} />,
      });
      return;
    }

    try {
      const instructorIds = selectedInstructors.map(id => parseInt(id));
      await dispatch(assignInstructorsToCourse({
        courseId: selectedCourseForAssignment.course_id,
        instructorIds,
        status: courseStatus
      })).unwrap();

      notifications.show({
        title: "Success!",
        message: `${instructorIds.length} instructor(s) assigned successfully`,
        color: "green",
        icon: <IconCheck size={20} />,
      });

      // Refresh assignments for this course
      const result = await dispatch(fetchCourseInstructors(selectedCourseForAssignment.course_id)).unwrap();
      setCourseAssignments(result.data);
      
      setAssignModalOpened(false);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to assign instructors",
        color: "red",
        icon: <IconAlertCircle size={20} />,
      });
    }
  };

  // Handle removing an instructor assignment
  const handleRemoveAssignment = async (courseId: number, instructorId: number) => {
    try {
      await dispatch(removeInstructorAssignment({ courseId, instructorId })).unwrap();
      
      notifications.show({
        title: "Success!",
        message: "Instructor removed from course",
        color: "green",
        icon: <IconCheck size={20} />,
      });

      // Refresh assignments
      const result = await dispatch(fetchCourseInstructors(courseId)).unwrap();
      setCourseAssignments(result.data);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to remove instructor",
        color: "red",
        icon: <IconAlertCircle size={20} />,
      });
    }
  };

  // Format instructor name
  const formatInstructorName = (instructor: Instructor) => {
    return `${instructor.full_name}` ;
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'Major Course': return 'blue';
      case 'Support Course': return 'green';
      case 'Common Course': return 'purple';
      case 'Elective Course': return 'orange';
      case 'Core Course': return 'red';
      default: return 'gray';
    }
  };

  // Calculate statistics
  const totalCourses = courses.length;
  const coursesWithAssignments = assignments.length;

  return (
    <Container size="xl" py="xl" className="min-h-screen">
      <Stack gap="lg">
        {/* Header Section */}
        <Box className="relative overflow-hidden rounded-2xl ">
          <Stack gap="xs">
            <Group align="center" gap="sm">
              <ThemeIcon size="xl" radius="lg" variant="white" color="indigo">
                <IconUserPlus className="h-6 w-6" />
              </ThemeIcon>
              <Title order={1} className="text-blue">Instructor Assignment</Title>
            </Group>
            <Text className="text-indigo-100 max-w-2xl">
              Assign instructors to courses. Manage teaching assignments and track instructor-course relationships.
            </Text>
          </Stack>
        </Box>

        {/* Stats Dashboard */}
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="lg">
          <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-blue-50">
            <Group gap="md">
              <ThemeIcon size="lg" radius="md" color="blue" variant="light">
                <IconBook className="h-5 w-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" c="dimmed" fw={500}>Total Courses</Text>
                <Title order={3} className="text-blue-700">{totalCourses}</Title>
              </div>
            </Group>
          </Card>
          
          <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-green-50">
            <Group gap="md">
              <ThemeIcon size="lg" radius="md" color="green" variant="light">
                <IconUsers className="h-5 w-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" c="dimmed" fw={500}>Instructors Available</Text>
                <Title order={3} className="text-green-700">{availableInstructors.length}</Title>
              </div>
            </Group>
          </Card>
          
          <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-purple-50">
            <Group gap="md">
              <ThemeIcon size="lg" radius="md" color="purple" variant="light">
                <IconUserPlus className="h-5 w-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" c="dimmed" fw={500}>Assignments Made</Text>
                <Title order={3} className="text-purple-700">{coursesWithAssignments}</Title>
              </div>
            </Group>
          </Card>
          
          <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-pink-50">
            <Group gap="md">
              <ThemeIcon size="lg" radius="md" color="pink" variant="light">
                <IconSparkles className="h-5 w-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" c="dimmed" fw={500}>Filtered</Text>
                <Title order={3} className="text-pink-700">{filteredCourses.length}</Title>
              </div>
            </Group>
          </Card>
        </SimpleGrid>

        {/* Error Messages */}
        {error && (
          <Alert 
            icon={<IconAlertCircle size={24} />} 
            title="Error Loading Courses" 
            color="red" 
            variant="light"
            radius="md"
            withCloseButton
            onClose={() => dispatch(clearError())}
          >
            {error}
          </Alert>
        )}

        {assignmentError && (
          <Alert 
            icon={<IconAlertCircle size={24} />} 
            title="Error with Assignments" 
            color="red" 
            variant="light"
            radius="md"
            withCloseButton
            onClose={() => dispatch(clearAssignmentError())}
          >
            {assignmentError}
          </Alert>
        )}

        {assignmentSuccessMessage && (
          <Alert 
            icon={<IconCheck size={24} />} 
            title="Success" 
            color="green" 
            variant="light"
            radius="md"
            withCloseButton
            onClose={() => dispatch(clearAssignmentSuccessMessage())}
          >
            {assignmentSuccessMessage}
          </Alert>
        )}

        {/* Search and Filters Section */}
        <Card withBorder radius="lg" shadow="sm" className="overflow-hidden">
          <Card.Section withBorder inheritPadding py="md" className="bg-gray-50">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon size="sm" radius="lg" color="blue" variant="light">
                  <IconSearch className="h-4 w-4" />
                </ThemeIcon>
                <Text fw={600} size="lg">Search Courses for Assignment</Text>
                <Badge variant="light" color="blue" size="lg">
                  {filteredCourses.length} found
                </Badge>
              </Group>
              
              <Group gap="xs">
                {(searchTerm || categoryFilter) && (
                  <Button
                    variant="subtle"
                    color="red"
                    size="sm"
                    leftSection={<IconTrash className="h-4 w-4" />}
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button
                  variant="light"
                  color="blue"
                  leftSection={<IconRefresh className="h-4 w-4" />}
                  onClick={() => {
                    dispatch(fetchCourses());
                    dispatch(fetchAvailableInstructors());
                    dispatch(fetchAllAssignments());
                  }}
                  size="sm"
                  loading={loading || assignmentLoading}
                >
                  Refresh
                </Button>
              </Group>
            </Group>
          </Card.Section>

          <Card.Section inheritPadding py="md">
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 8, lg: 6 }}>
                <TextInput
                  placeholder="Search courses by code, name, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftSection={<IconSearch size={18} />}
                  size="md"
                  radius="md"
                  rightSection={
                    searchTerm && (
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        onClick={() => setSearchTerm("")}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    )
                  }
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
                <Select
                  placeholder="Filter by category"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  data={uniqueCategories.map(cat => ({ value: cat, label: cat }))}
                  clearable
                  leftSection={<IconFilter size={18} />}
                  size="md"
                  radius="md"
                />
              </Grid.Col>
            </Grid>
          </Card.Section>
        </Card>

        {/* Courses Table */}
        <Card withBorder radius="lg" className="overflow-hidden">
          <Card.Section withBorder inheritPadding py="md" className="bg-gray-50">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon size="sm" radius="lg" color="indigo" variant="light">
                  <IconBooks className="h-4 w-4" />
                </ThemeIcon>
                <Text fw={600}>Available Courses</Text>
                <Badge variant="light" color="indigo">
                  {filteredCourses.length} courses
                </Badge>
              </Group>
            </Group>
          </Card.Section>

          {filteredCourses.length === 0 ? (
            <Card.Section inheritPadding py="xl">
              <Center className="min-h-[200px]">
                <Stack align="center" gap="md">
                  <ThemeIcon size="xl" radius="lg" color="gray" variant="light">
                    <IconBooks className="h-8 w-8" />
                  </ThemeIcon>
                  <div className="text-center">
                    <Title order={3} c="dimmed" mb="xs">
                      {searchTerm || categoryFilter 
                        ? "No courses match your filters" 
                        : "No courses available"}
                    </Title>
                    <Text c="dimmed" size="sm">
                      {searchTerm || categoryFilter
                        ? "Try adjusting your search criteria"
                        : "All courses have been assigned or no courses exist"}
                    </Text>
                  </div>
                </Stack>
              </Center>
            </Card.Section>
          ) : (
            <Table.ScrollContainer minWidth={800}>
              <Table verticalSpacing="md" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Course Code</Table.Th>
                    <Table.Th>Course Name</Table.Th>
                    <Table.Th>Category</Table.Th>
                    <Table.Th>Credit Hours</Table.Th>
                    <Table.Th>Assigned Instructors</Table.Th>
                    <Table.Th className="text-center">Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filteredCourses.map((course) => {
                    // Count assignments for this course
                    const courseAssignmentCount = assignments.filter(
                      a => a.course_id === course.course_id
                    ).length;

                    return (
                      <Table.Tr key={course.course_id}>
                        <Table.Td>
                          <Text fw={600} className="font-mono">
                            {course.course_code}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text>{course.course_name}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge 
                            color={getCategoryColor(course.category)} 
                            variant="light"
                          >
                            {course.category}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="outline" color="blue">
                            {course.credit_hour}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Badge 
                              color={courseAssignmentCount > 0 ? "green" : "gray"} 
                              variant="light"
                            >
                              {courseAssignmentCount} assigned
                            </Badge>
                            {courseAssignmentCount > 0 && (
                              <Text size="sm" c="dimmed">
                                Click &quot;View&quot; to see details
                              </Text>
                            )}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" justify="center">
                            <Tooltip label="View assigned instructors">
                              <Button
                                variant="light"
                                color="blue"
                                size="xs"
                                leftSection={<IconEye size={14} />}
                                onClick={() => handleOpenViewModal(course)}
                                disabled={courseAssignmentCount === 0}
                              >
                                View
                              </Button>
                            </Tooltip>
                            <Tooltip label="Assign instructors">
                              <Button
                                variant="filled"
                                color="indigo"
                                size="xs"
                                leftSection={<IconUserPlus size={14} />}
                                onClick={() => handleOpenAssignModal(course)}
                              >
                                Assign
                              </Button>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Card>
      </Stack>

      {/* Assign Instructors Modal */}
      <Modal
        opened={assignModalOpened}
        onClose={() => setAssignModalOpened(false)}
        title={
          <Group gap="sm">
            <ThemeIcon size="md" color="blue" variant="light">
              <IconUserPlus size={18} />
            </ThemeIcon>
            <Title order={3}>Assign Instructors</Title>
          </Group>
        }
        size="xl"
        radius="lg"
      >
        {selectedCourseForAssignment && (
          <Stack gap="lg">
            {/* Course Info */}
            <Card withBorder radius="md">
              <Group gap="md">
                <Avatar color="blue" variant="light" radius="lg">
                  <IconBook size={24} />
                </Avatar>
                <div>
                  <Text fw={600} size="lg">{selectedCourseForAssignment.course_code}</Text>
                  <Text c="dimmed">{selectedCourseForAssignment.course_name}</Text>
                  <Group gap="xs" mt={4}>
                    <Badge color={getCategoryColor(selectedCourseForAssignment.category)} variant="light">
                      {selectedCourseForAssignment.category}
                    </Badge>
                    <Badge variant="outline" color="blue">
                      {selectedCourseForAssignment.credit_hour} credits
                    </Badge>
                  </Group>
                </div>
              </Group>
            </Card>

            {/* Instructor Selection */}
            <div>
              <Group justify="space-between" mb="md">
                <Text fw={600}>Select Instructors</Text>
                <Badge variant="light" color="blue">
                  {selectedInstructors.length} selected
                </Badge>
              </Group>
              
              {assignmentLoading ? (
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <LoadingOverlay visible />
                    <Text>Loading instructors...</Text>
                  </Stack>
                </Center>
              ) : (
                <MultiSelect
                  data={availableInstructors.map(instructor => ({
                    value: instructor.instructor_id.toString(),
                    label: `${instructor.full_name}  (${instructor.email})`,
                  }))}
                  value={selectedInstructors}
                  onChange={setSelectedInstructors}
                  placeholder="Search and select instructors..."
                  searchable
                  clearable
                  hidePickedOptions
                  maxDropdownHeight={200}
                  size="md"
                  radius="md"
                  nothingFoundMessage="No instructors found"
                />
              )}
            </div>

            {/* Status Selection */}
            <div>
              <Text fw={600} mb="sm">Assignment Status</Text>
              <Select
                value={courseStatus}
                onChange={(value) => setCourseStatus(value || "active")}
                data={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'completed', label: 'Completed' },
                ]}
                size="md"
                radius="md"
              />
            </div>

            {/* Currently Assigned Instructors */}
            {courseAssignments.length > 0 && (
              <div>
                <Text fw={600} mb="sm">Currently Assigned</Text>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Instructor</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {courseAssignments.map((assignment) => (
                      <Table.Tr key={assignment.instructor_id}>
                        <Table.Td>
                            <Text>
                              {assignment.full_name}
                            </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {assignment.email}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge 
                            color={assignment.course_status === 'active' ? 'green' : 'gray'}
                            variant="light"
                          >
                            {assignment.course_status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => handleRemoveAssignment(
                              assignment.course_id, 
                              assignment.instructor_id
                            )}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            )}

            {/* Action Buttons */}
            <Group justify="right" mt="lg">
              <Button
                variant="light"
                onClick={() => setAssignModalOpened(false)}
              >
                Cancel
              </Button>
              <Button
                leftSection={<IconUserPlus size={18} />}
                onClick={handleAssignInstructors}
                loading={submitting}
                disabled={selectedInstructors.length === 0}
                className="bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                Assign {selectedInstructors.length} Instructor(s)
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* View Assigned Instructors Modal */}
      <Modal
        opened={viewModalOpened}
        onClose={() => setViewModalOpened(false)}
        title={
          <Group gap="sm">
            <ThemeIcon size="md" color="blue" variant="light">
              <IconUsers size={18} />
            </ThemeIcon>
            <Title order={3}>Assigned Instructors</Title>
          </Group>
        }
        size="lg"
        radius="lg"
      >
        {selectedCourseForAssignment && (
          <Stack gap="lg">
            {/* Course Info */}
            <Group gap="md">
              <Avatar color="blue" variant="light" radius="lg">
                <IconBook size={24} />
              </Avatar>
              <div>
                <Text fw={600} size="lg">{selectedCourseForAssignment.course_code}</Text>
                <Text c="dimmed">{selectedCourseForAssignment.course_name}</Text>
              </div>
            </Group>

            {/* Instructors List */}
            {assignmentLoading ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <LoadingOverlay visible />
                  <Text>Loading assigned instructors...</Text>
                </Stack>
              </Center>
            ) : courseAssignments.length === 0 ? (
              <Card withBorder>
                <Center py="xl">
                  <Stack align="center" gap="md">
                    <ThemeIcon size="xl" color="gray" variant="light">
                      <IconUser size={32} />
                    </ThemeIcon>
                    <Text fw={600}>No Instructors Assigned</Text>
                    <Text c="dimmed" size="sm">
                      This course has no assigned instructors yet.
                    </Text>
                    <Button
                      leftSection={<IconUserPlus size={16} />}
                      onClick={() => {
                        setViewModalOpened(false);
                        handleOpenAssignModal(selectedCourseForAssignment);
                      }}
                      variant="light"
                      color="blue"
                    >
                      Assign Instructors
                    </Button>
                  </Stack>
                </Center>
              </Card>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Instructor</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Assigned Date</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {courseAssignments.map((assignment) => (
                    <Table.Tr key={assignment.instructor_id}>
                      <Table.Td>
                          <Group gap="sm">
                            <Avatar size="sm" radius="xl" color="blue">
                              {assignment.full_name}
                              
                            </Avatar>
                            <div>
                              <Text fw={500}>
                                {assignment.full_name}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {assignment.department_name}
                              </Text>
                            </div>
                          </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{assignment.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          color={assignment.course_status === 'active' ? 'green' : 'gray'}
                          variant="light"
                        >
                          {assignment.course_status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {new Date(assignment.created_at).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}

            {/* Action Buttons */}
            <Group justify="right" mt="lg">
              <Button
                variant="light"
                onClick={() => setViewModalOpened(false)}
              >
                Close
              </Button>
              <Button
                leftSection={<IconUserPlus size={18} />}
                onClick={() => {
                  setViewModalOpened(false);
                  handleOpenAssignModal(selectedCourseForAssignment);
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                Manage Assignment
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

export default ManageInstructorAssignment;