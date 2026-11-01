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
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

// Redux imports
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchCourses,
  updateCourse,
  deleteCourse,
  setEditingCourse,
  clearError
} from "@/store/slices/coursesSlice";
import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";

// Import components
import ViewCourses from "./course/ViewCourses";
import EditCourseModal from "./course/EditCourseModal";
import DeleteCourseModal from "./course/DeleteCourseModal";

const ManageCourse: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Redux selectors
  const courses = useAppSelector((state) => state.courses.courses);
  const loading = useAppSelector((state) => state.courses.loading);
  const error = useAppSelector((state) => state.courses.error);
  const editingCourse = useAppSelector((state) => state.courses.editingCourse);
  const submitting = useAppSelector((state) => state.courses.submitting);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>("all");
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Form state for editing
  const [editForm, setEditForm] = useState({
    course_code: "",
    course_name: "",
    credit_hour: 1,
    lec_hr: 0,
    lab_hr: 0,
    tut_hr: 0,
    category: "",
  });

  const categories = ['Major Course', 'Support Course', 'Common Course', 'Elective Course', 'Core Course'];
  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  if (user === null) {
    return <Authentication />;
  }
  if (user.role !== 'admin') {
   return <UnauthorizedAccess />
 }
  // Handle navigation to add course page
  const handleAddCourseClick = () => {
    router.push("/dashboard/admin/manageCourse/add");
  };

  // Handle edit course - Open modal
  const handleEditCourse = (course: any) => {
    dispatch(setEditingCourse(course));
    setEditForm({
      course_code: course.course_code,
      course_name: course.course_name,
      credit_hour: course.credit_hour,
      lec_hr: course.lec_hr || 0,
      lab_hr: course.lab_hr || 0,
      tut_hr: course.tut_hr || 0,
      category: course.category,
    });
    setEditModalOpened(true);
  };

  // Handle update course
  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    try {
      await dispatch(updateCourse({
        ...editingCourse,
        course_code: editForm.course_code,
        course_name: editForm.course_name,
        credit_hour: editForm.credit_hour,
        lec_hr: editForm.lec_hr,
        lab_hr: editForm.lab_hr,
        tut_hr: editForm.tut_hr,
        category: editForm.category,
      })).unwrap();

      notifications.show({
        title: "Success!",
        message: "Course updated successfully",
        color: "green",
        icon: <IconCertificate size={20} />,
      });

      setEditModalOpened(false);
      dispatch(setEditingCourse(null));
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to update course",
        color: "red",
        icon: <IconAlertCircle size={20} />,
      });
    }
  };

  // Handle delete course confirmation
  const handleDeleteConfirm = (courseId: number) => {
    setCourseToDelete(courseId);
    setDeleteModalOpened(true);
  };

  // Handle delete course
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    try {
      await dispatch(deleteCourse(courseToDelete)).unwrap();
      notifications.show({
        title: "Success!",
        message: "Course deleted successfully",
        color: "green",
        icon: <IconCertificate size={20} />,
      });
      setDeleteModalOpened(false);
      setCourseToDelete(null);
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to delete course",
        color: "red",
        icon: <IconAlertCircle size={20} />,
      });
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditModalOpened(false);
    dispatch(setEditingCourse(null));
    setEditForm({
      course_code: "",
      course_name: "",
      credit_hour: 1,
      lec_hr: 0,
      lab_hr: 0,
      tut_hr: 0,
      category: "",
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    dispatch(fetchCourses());
    notifications.show({
      title: "Refreshed!",
      message: "Course list updated",
      color: "blue",
      icon: <IconRefresh size={20} />,
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setCategoryFilter(null);
    setStatusFilter("all");
    setActiveTab("all");
  };

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

  // Calculate statistics
  const totalCourses = courses.length;
  const filteredCount = filteredCourses.length;
  const majorCourses = courses.filter(c => c.category === 'Major Course').length;
  const supportCourses = courses.filter(c => c.category === 'Support Course').length;
  const commonCourses = courses.filter(c => c.category === 'Common Course').length;
  const electiveCourses = courses.filter(c => c.category === 'Elective Course').length;
  const coreCourses = courses.filter(c => c.category === 'Core Course').length;

  // Get unique categories for filter dropdown
  const uniqueCategories = Array.from(new Set(courses.map(c => c.category).filter(Boolean)));

  // Loading state
  if (loading && courses.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Card className="min-h-[500px] flex items-center justify-center relative">
          <LoadingOverlay visible={loading} />
          <Center>
            <Stack align="center" gap="md">
              <ThemeIcon size="xl" radius="lg" color="blue" variant="light">
                <IconBooks size={32} className="animate-pulse" />
              </ThemeIcon>
              <div className="text-center">
                <Title order={3} c="blue" mb="sm">Loading Course Catalog</Title>
                <Text c="dimmed">Fetching your academic courses...</Text>
              </div>
              <Progress value={100} striped animated size="sm" className="w-64" />
            </Stack>
          </Center>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl" className="min-h-screen">
      <Stack gap="lg">
        {/* Header Section */}
        <Box className="relative overflow-hidden rounded-2xl ">
          <Stack gap="xs">
            <Group align="center" gap="sm">
              <ThemeIcon size="xl" radius="lg" variant="white" color="indigo">
                <IconBooks className="h-6 w-6" />
              </ThemeIcon>
              <Title order={1} className="text-blue">Course Management</Title>
            </Group>
            <Text className="text-indigo-100 max-w-2xl">
              Manage and organize your academic course catalog. Create, edit, and track all courses
              offered across different programs and semesters.
            </Text>
          </Stack>
        </Box>

        {/* Stats Dashboard */}
        <SimpleGrid cols={{ base: 2, sm: 3, lg: 5 }} spacing="lg">
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
                <IconSchool className="h-5 w-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" c="dimmed" fw={500}>Major Courses</Text>
                <Title order={3} className="text-green-700">{majorCourses}</Title>
              </div>
            </Group>
          </Card>

          <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-orange-50">
            <Group gap="md">
              <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                <IconCategory className="h-5 w-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" c="dimmed" fw={500}>Support Courses</Text>
                <Title order={3} className="text-orange-700">{supportCourses}</Title>
              </div>
            </Group>
          </Card>

          <Card withBorder radius="lg" className="bg-gradient-to-br from-white to-purple-50">
            <Group gap="md">
              <ThemeIcon size="lg" radius="md" color="purple" variant="light">
                <IconClock className="h-5 w-5" />
              </ThemeIcon>
              <div>
                <Text size="sm" c="dimmed" fw={500}>Common Courses</Text>
                <Title order={3} className="text-purple-700">{commonCourses}</Title>
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
                <Title order={3} className="text-pink-700">{filteredCount}</Title>
              </div>
            </Group>
          </Card>
        </SimpleGrid>

        {/* Search and Filters Section */}
        <Card withBorder radius="lg" shadow="sm" className="overflow-hidden">
          <Card.Section withBorder inheritPadding py="md" className="bg-gray-50">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon size="sm" radius="lg" color="blue" variant="light">
                  <IconSearch className="h-4 w-4" />
                </ThemeIcon>
                <Text fw={600} size="lg">Search & Filter Courses</Text>
                <Badge variant="light" color="blue" size="lg">
                  {filteredCount} found
                </Badge>
              </Group>

              <Group gap="xs">
                {(searchTerm || categoryFilter || statusFilter !== "all") && (
                  <Button
                    variant="subtle"
                    color="red"
                    size="sm"
                    leftSection={<IconTrash className="h-4 w-4" />}
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
                <Button
                  variant="light"
                  color="blue"
                  leftSection={<IconRefresh className="h-4 w-4" />}
                  onClick={handleRefresh}
                  size="sm"
                  loading={loading}
                >
                  Refresh
                </Button>
              </Group>
            </Group>
          </Card.Section>

          <Card.Section inheritPadding py="md">
            <Stack gap="md">
              {/* Tabs for quick filtering */}
              <Tabs value={activeTab} onChange={(value) => {
                setActiveTab(value || "all");
                if (value === "all") {
                  setCategoryFilter(null);
                } else if (value === "major") {
                  setCategoryFilter("Major Course");
                } else if (value === "support") {
                  setCategoryFilter("Support Course");
                } else if (value === "common") {
                  setCategoryFilter("Common Course");
                }
              }}>
                <Tabs.List>
                  <Tabs.Tab value="all" leftSection={<IconBooks size={16} />}>
                    All Courses
                  </Tabs.Tab>
                  <Tabs.Tab value="major" leftSection={<IconSchool size={16} />}>
                    Major Courses
                  </Tabs.Tab>
                  <Tabs.Tab value="support" leftSection={<IconCategory size={16} />}>
                    Support Courses
                  </Tabs.Tab>
                  <Tabs.Tab value="common" leftSection={<IconClock size={16} />}>
                    Common Courses
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>

              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                  <TextInput
                    placeholder="Search by course code, name, or category..."
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
                <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
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
                <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                  <Select
                    placeholder="Filter by status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    data={statuses}
                    leftSection={<IconChartBar size={18} />}
                    size="md"
                    radius="md"
                  />
                </Grid.Col>
              </Grid>

              {/* Active Filters Display */}
              {(searchTerm || categoryFilter || statusFilter !== "all") && (
                <Paper withBorder p="sm" radius="md" className="bg-blue-50">
                  <Group gap="xs">
                    <Text size="sm" fw={500}>Active Filters:</Text>
                    {searchTerm && (
                      <Badge variant="light" color="blue">
                        Search: {searchTerm}
                      </Badge>
                    )}
                    {categoryFilter && (
                      <Badge variant="light" color="green">
                        Category: {categoryFilter}
                      </Badge>
                    )}
                    {statusFilter && statusFilter !== "all" && (
                      <Badge variant="light" color="orange">
                        Status: {statuses.find(s => s.value === statusFilter)?.label}
                      </Badge>
                    )}
                  </Group>
                </Paper>
              )}
            </Stack>
          </Card.Section>
        </Card>

        {/* Action Bar */}
        <Card withBorder radius="lg" padding="md">
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon size="sm" radius="lg" color="indigo" variant="light">
                <IconCode className="h-4 w-4" />
              </ThemeIcon>
              <Text fw={600}>Course Catalog</Text>
              <Badge variant="light" color="indigo">
                {filteredCourses.length} courses
              </Badge>
            </Group>

            <Button
              leftSection={<IconPlus size={20} />}
              onClick={handleAddCourseClick}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              size="md"
              radius="md"
            >
              Add New Course
            </Button>
          </Group>
        </Card>

        {/* Error Message */}
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

        {/* Main Content Area */}
        {filteredCourses.length === 0 && !loading ? (
          <Card withBorder radius="lg" className="min-h-[400px]">
            <Center className="h-full">
              <Stack align="center" gap="md">
                <ThemeIcon size="xl" radius="lg" color="gray" variant="light">
                  <IconBook className="h-8 w-8" />
                </ThemeIcon>
                <div className="text-center">
                  <Title order={3} c="dimmed" mb="xs">
                    {searchTerm || categoryFilter || statusFilter !== "all"
                      ? "No courses match your filters"
                      : "No courses found"}
                  </Title>
                  <Text c="dimmed" size="sm">
                    {searchTerm || categoryFilter || statusFilter !== "all"
                      ? "Try adjusting your search criteria or clear filters"
                      : "Get started by adding your first course to the catalog"}
                  </Text>
                </div>
                <Group>
                  {(searchTerm || categoryFilter || statusFilter !== "all") && (
                    <Button
                      variant="light"
                      onClick={handleClearFilters}
                      leftSection={<IconTrash size={16} />}
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Button
                    onClick={handleAddCourseClick}
                    leftSection={<IconPlus size={16} />}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600"
                  >
                    Add First Course
                  </Button>
                </Group>
              </Stack>
            </Center>
          </Card>
        ) : (
          <Paper withBorder radius="lg" className="overflow-hidden">
            <ViewCourses
              courses={filteredCourses}
              totalCourses={courses.length}
              onEditClick={handleEditCourse}
              onDeleteClick={handleDeleteConfirm}
              searchTerm={searchTerm}
              categoryFilter={categoryFilter}
            />
          </Paper>
        )}

        {/* Edit Course Modal */}
        <EditCourseModal
          opened={editModalOpened}
          onClose={handleCancelEdit}
          editingCourse={editingCourse}
          editForm={editForm}
          setEditForm={setEditForm}
          onSubmit={handleUpdateCourse}
          submitting={submitting}
          categories={categories}
        />

        {/* Delete Confirmation Modal */}
        <DeleteCourseModal
          opened={deleteModalOpened}
          onClose={() => {
            setDeleteModalOpened(false);
            setCourseToDelete(null);
          }}
          onConfirm={handleDeleteCourse}
          submitting={submitting}
        />
      </Stack>
    </Container>
  );
};

export default ManageCourse;