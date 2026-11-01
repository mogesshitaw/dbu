 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Title,
  Text,
  TextInput,
  Select,
  Button,
  Group,
  Alert,
  Stack,
  Grid,
  Loader,
  Badge,
  Paper,
  ThemeIcon,
  Center,
  Divider,
  SimpleGrid,
  Avatar,
  ActionIcon,
  Modal,
  ScrollArea,
  Pagination,
  Collapse,
  Table,
Tooltip,
  Textarea
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconUsers,
  IconEye,
  IconFilter,
  IconRefresh,
  IconSearch,
  IconList,
  IconLayoutGrid,
  IconCheck,
  IconX,
  IconStatusChange,
  IconDownload,
  IconSortAscending,
  IconUserCheck,
  IconUserX,
  IconUserOff,
  IconCertificate,
} from "@tabler/icons-react";

// Redux Imports
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchStudents,
  updateStudentStatus,
  fetchDepartments,
  fetchBatches,
  fetchSemesters,
  setSearchQuery,
  setFilters,
  setPage,
  exportStudents,
  Student,
} from "@/store/slices/studentSlice";
import { fetchAdmissionYears } from "@/store/slices/batchSlice";
import {
  selectStudents,
  selectLoading,
  selectTotalCount,
  selectPage,
  selectLimit,
  selectSearchQuery,
  selectFilters,
  selectDepartmentOptions,
  selectBatchOptions,
  selectSemesterOptions,
  selectAdmissionYearOptions,
  selectFilteredStudents,
} from "@/store/selectors/studentSelector";
import { Authentication, Found } from "@/app/auth/auth";

const ViewStudentsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  // Redux selectors
  const students = useAppSelector(selectStudents);
  const loading = useAppSelector(selectLoading);
  const totalCount = useAppSelector(selectTotalCount);
  const page = useAppSelector(selectPage);
  const limit = useAppSelector(selectLimit);
  const searchQuery = useAppSelector(selectSearchQuery);
  const filters = useAppSelector(selectFilters);
  const departmentOptions = useAppSelector(selectDepartmentOptions);
  const batchOptions = useAppSelector(selectBatchOptions);
  const admissionYearOptions = useAppSelector(selectAdmissionYearOptions);
  const semesterOptions = useAppSelector(selectSemesterOptions);
  const filteredStudents = useAppSelector(selectFilteredStudents);

  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
  const [statusModalOpened, { open: openStatusModal, close: closeStatusModal }] = useDisclosure(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const statusOptions = [
    { value: 'Active', label: 'Active', color: 'green', icon: <IconUserCheck size={16} /> },
    { value: 'Inactive', label: 'Inactive', color: 'gray', icon: <IconUserOff size={16} /> },
    { value: 'Graduated', label: 'Graduated', color: 'blue', icon: <IconCertificate size={16} /> },
    { value: 'Suspended', label: 'Suspended', color: 'red', icon: <IconUserX size={16} /> },
  ];

  const statusForm = useForm({
    initialValues: {
      status: '',
      reason: '',
    },
    validate: {
      status: (value) => !value ? 'Status is required' : null,
    },
  });

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchBatches());
    dispatch(fetchAdmissionYears());
    dispatch(fetchSemesters());
    dispatch(fetchStudents({ page, limit, search: searchQuery, filters }));
  }, [dispatch, page, limit, searchQuery, filters]);

  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);

  const handleSearch = (value: string) => {
    dispatch(setSearchQuery(value));
    dispatch(setPage(1));
  };

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value }));
    dispatch(setPage(1));
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    openDetailModal();
  };

  const handleStatusChange = (student: Student) => {
    setSelectedStudent(student);
    setSelectedStatus(student.status);
    statusForm.setValues({ status: student.status, reason: '' });
    openStatusModal();
  };

  // Update student status
const handleUpdateStatus = async (values: any) => {
  if (selectedStudent) {
    try {
      await dispatch(updateStudentStatus({
        studentId: selectedStudent.student_id,
        status: values.status,
        reason: values.reason || null,
      })).unwrap();

      notifications.show({
        title: "Success",
        message: `Status updated to ${values.status}`,
        color: "green",
        icon: <IconCheck size={20} />,
      });

      // Refresh the student list
      dispatch(fetchStudents({ page, limit, search: searchQuery, filters }));
      closeStatusModal();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to update status",
        color: "red",
        icon: <IconX size={20} />,
      });
    }
  }
};

// Export students
const handleExport = async () => {
  try {
    await dispatch(exportStudents(filters)).unwrap();
    notifications.show({
      title: "Success",
      message: "Export completed successfully",
      color: "green",
      icon: <IconCheck size={20} />,
    });
  } catch (error: any) {
    notifications.show({
      title: "Error",
      message: error.message || "Failed to export",
      color: "red",
      icon: <IconX size={20} />,
    });
  }
};

  const handleClearFilters = () => {
    dispatch(setFilters({}));
    dispatch(setSearchQuery(''));
    setShowAdvancedFilters(false);
  };

  const calculateStatistics = () => {
    const activeCount = students.filter(s => s.status === 'Active').length;
    const inactiveCount = students.filter(s => s.status === 'Inactive').length;
    const graduatedCount = students.filter(s => s.status === 'Graduated').length;
    const suspendedCount = students.filter(s => s.status === 'Suspended').length;
    
    return {
      total: students.length,
      activeCount,
      inactiveCount,
      graduatedCount,
      suspendedCount,
    };
  };

  const stats = calculateStatistics();

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return sortOrder === 'asc' 
          ? a.full_name.localeCompare(b.full_name)
          : b.full_name.localeCompare(a.full_name);
      case 'date':
        return sortOrder === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'status':
        return sortOrder === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      default:
        return 0;
    }
  });

  if (user === null) {
    return <Authentication />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
      <Container size="xl" className="py-8">
        {/* Header */}
        <Stack gap="lg" mb="xl">
          <Group justify="space-between">
            <Stack gap="xs">
              <Title order={1} className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Student Management
              </Title>
              <Text c="dimmed" size="lg">
                View and manage student status as Department Head
              </Text>
            </Stack>
            <Group>
              <Button
                variant="outline"
                color="blue"
                leftSection={<IconDownload size={20} />}
                size="md"
                radius="lg"
                onClick={handleExport}
              >
                Export Students
              </Button>
              <Button
                variant="light"
                color="blue"
                leftSection={<IconRefresh size={20} />}
                size="md"
                radius="lg"
                onClick={() => dispatch(fetchStudents({ page, limit, search: searchQuery, filters }))}
              >
                Refresh
              </Button>
            </Group>
          </Group>

          {/* Statistics Cards */}
          <SimpleGrid cols={{ base: 2, md: 3, lg: 5 }} spacing="lg">
            <Card radius="lg" className="bg-gradient-to-br from-blue-50 to-blue-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-blue-600">
                  {stats.total}
                </Text>
                <Text size="sm" c="dimmed">Total Students</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-green-50 to-green-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-green-600">
                  {stats.activeCount}
                </Text>
                <Text size="sm" c="dimmed">Active</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-gray-50 to-gray-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-gray-600">
                  {stats.inactiveCount}
                </Text>
                <Text size="sm" c="dimmed">Inactive</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-blue-50 to-blue-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-blue-600">
                  {stats.graduatedCount}
                </Text>
                <Text size="sm" c="dimmed">Graduated</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-red-50 to-red-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-red-600">
                  {stats.suspendedCount}
                </Text>
                <Text size="sm" c="dimmed">Suspended</Text>
              </Stack>
            </Card>
          </SimpleGrid>
        </Stack>

        {/* Main Content */}
        <Card
          shadow="xl"
          radius="xl"
          padding="xl"
          className="bg-white/90 backdrop-blur-lg border border-white/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none"></div>

          <Stack gap="lg">
            {/* Search and Filter Bar */}
            <Paper p="lg" radius="lg" className="bg-gradient-to-r from-gray-50 to-blue-50/30">
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    placeholder="Search students by name, email, or student number..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    leftSection={<IconSearch size={18} />}
                    radius="lg"
                    size="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <Button
                    variant={showAdvancedFilters ? "filled" : "light"}
                    color="blue"
                    leftSection={<IconFilter size={18} />}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    fullWidth
                    radius="lg"
                    size="md"
                  >
                    Filters
                  </Button>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <Select
                    placeholder="Sort by"
                    data={[
                      { value: 'name', label: 'Name' },
                      { value: 'date', label: 'Date Added' },
                      { value: 'status', label: 'Status' },
                    ]}
                    value={sortBy}
                    onChange={(value) => setSortBy(value || 'name')}
                    leftSection={<IconSortAscending size={16} />}
                    radius="lg"
                    size="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <Select
                    placeholder="View Mode"
                    data={[
                      { value: 'list', label: 'List View' },
                      { value: 'grid', label: 'Grid View' },
                    ]}
                    value={viewMode}
                    onChange={(value) => setViewMode(value as 'list' | 'grid')}
                    leftSection={viewMode === 'list' ? <IconList size={16} /> : <IconLayoutGrid size={16} />}
                    radius="lg"
                    size="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <Button
                    variant="light"
                    color="red"
                    onClick={handleClearFilters}
                    fullWidth
                    radius="lg"
                    size="md"
                  >
                    Clear Filters
                  </Button>
                </Grid.Col>
              </Grid>

              {/* Advanced Filters */}
              <Collapse in={showAdvancedFilters}>
                <Grid gutter="md" mt="md">
                  <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                    <Select
                      placeholder="Department"
                      data={[{ value: '', label: 'All Departments' }, ...departmentOptions]}
                      value={filters.department}
                      onChange={(value) => handleFilterChange('department', value || '')}
                      radius="lg"
                      size="sm"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                    <Select
                      placeholder="Batch Level"
                      data={[{ value: '', label: 'All Batches' }, ...batchOptions]}
                      value={filters.batch}
                      onChange={(value) => handleFilterChange('batch', value || '')}
                      radius="lg"
                      size="sm"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                    <Select
                      placeholder="Entrance Year"
                      data={[{ value: '', label: 'All Entrance Years' }, ...admissionYearOptions]}
                      value={filters.admission_year || ''}
                      onChange={(value) => handleFilterChange('admission_year', value || '')}
                      radius="lg"
                      size="sm"
                      clearable
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                    <Select
                      placeholder="Semester"
                      data={[{ value: '', label: 'All Semesters' }, ...semesterOptions]}
                      value={filters.semester}
                      onChange={(value) => handleFilterChange('semester', value || '')}
                      radius="lg"
                      size="sm"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                    <Select
                      placeholder="Status"
                      data={[{ value: '', label: 'All Status' }, ...statusOptions]}
                      value={filters.status}
                      onChange={(value) => handleFilterChange('status', value || '')}
                      radius="lg"
                      size="sm"
                    />
                  </Grid.Col>
                </Grid>
              </Collapse>
            </Paper>

            {/* Students List/Grid */}
            {loading ? (
              <Center py={80}>
                <Stack align="center" gap="lg">
                  <Loader size="xl" color="blue" />
                  <Stack gap="xs" align="center">
                    <Text fw={600} size="lg">Loading students...</Text>
                    <Text c="dimmed">Fetching student records</Text>
                  </Stack>
                </Stack>
              </Center>
            ) : sortedStudents.length === 0 ? (
              <Center py={80}>
                <Stack align="center" gap="lg">
                  <ThemeIcon size={120} color="gray" variant="light" radius="xl">
                    <IconUsers size={48} />
                  </ThemeIcon>
                  <Stack gap="xs" align="center">
                    <Title order={3} c="gray.7">No Students Found</Title>
                    <Text c="dimmed" ta="center" size="lg">
                      {searchQuery || Object.values(filters).some(f => f) 
                        ? "Try adjusting your search terms or filters"
                        : "No students found in this department"}
                    </Text>
                  </Stack>
                </Stack>
              </Center>
            ) : viewMode === 'list' ? (
           <ScrollArea>
         <Table.ScrollContainer minWidth={1300}>
            <Table verticalSpacing="sm">
                {/* <Table className="w-full border-collapse"> */}
                  <Table.Thead>
                    <Table.Tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                      <Table.Th className="border border-gray-200 px-6 py-4 text-left font-bold text-gray-700">Student</Table.Th>
                      <Table.Th className="border border-gray-200 px-4 py-4 text-left font-bold text-gray-700">Contact</Table.Th>
                      <Table.Th className="border border-gray-200 px-4 py-4 text-left font-bold text-gray-700">Academic Info</Table.Th>
                      <Table.Th className="border border-gray-200 px-4 py-4 text-left font-bold text-gray-700">Status</Table.Th>
                      <Table.Th className="border border-gray-200 px-4 py-4 text-left font-bold text-gray-700">Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {sortedStudents.map((student) => (
                      <Table.Tr key={student.student_id} className="border-b border-gray-200 hover:bg-blue-50/30">
                        <Table.Td className="border border-gray-200 px-6 py-4">
                          <Group gap="md">
                            <Avatar
                              size="lg"
                              radius="xl"
                              src={student.profile_image_url}
                              alt={student.full_name}
                            >
                              {student.full_name.charAt(0)}
                            </Avatar>
                            <Stack gap={2}>
                              <Text fw={600}>{student.full_name}</Text>
                              <Text size="sm" c="dimmed">{student.student_number}</Text>
                            </Stack>
                          </Group>
                        </Table.Td>
                        <Table.Td className="border border-gray-200 px-4 py-4">
                          <Stack gap={2}>
                            <Group gap="xs">
                              <IconMail size={14} className="text-gray-500" />
                              <Text size="sm">{student.email}</Text>
                            </Group>
                            {student.phone && (
                              <Group gap="xs">
                                <IconPhone size={14} className="text-gray-500" />
                                <Text size="sm">{student.phone}</Text>
                              </Group>
                            )}
                          </Stack>
                        </Table.Td>
                        <Table.Td className="border border-gray-200 px-4 py-4">
                          <Stack gap={2}>
                            <Badge color="blue" variant="light" size="sm">
                              {student.department_name}
                            </Badge>
                            <Group gap="xs">
                              <Text size="sm">
                                Batch: {student.batch_full_label || (student.admission_year ? `${student.batch_year} / ${student.admission_year}` : student.batch_year)}
                              </Text>
                              <Text size="sm" c="dimmed">• Sem: {student.semester_name}</Text>
                            </Group>
                            {student.section && (
                              <Badge color="orange" variant="light" size="xs">
                                Sec {student.section}
                              </Badge>
                            )}
                          </Stack>
                        </Table.Td>
                        <Table.Td className="border border-gray-200 px-4 py-4">
                          <Badge
                            color={
                              student.status === 'Active' ? 'green' :
                              student.status === 'Inactive' ? 'gray' :
                              student.status === 'Graduated' ? 'blue' : 'red'
                            }
                            variant="light"
                            size="md"
                          >
                            {student.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td className="border border-gray-200 px-4 py-4">
                          <Group gap="xs">
                            <Tooltip label="View Details">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="lg"
                                onClick={() => handleViewStudent(student)}
                              >
                                <IconEye size={18} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Change Status">
                              <ActionIcon
                                variant="light"
                                color="orange"
                                size="lg"
                                onClick={() => handleStatusChange(student)}
                              >
                                <IconStatusChange size={18} />
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
            ) : (
              <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                {sortedStudents.map((student) => (
                  <Card
                    key={student.student_id}
                    shadow="md"
                    padding="lg"
                    radius="lg"
                    className="border-2 border-gray-200/50 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
                  >
                    <Stack gap="md">
                      {/* Header */}
                      <Group justify="space-between">
                        <Avatar
                          size="lg"
                          radius="xl"
                          src={student.profile_image_url}
                          alt={student.full_name}
                        >
                          {student.full_name.charAt(0)}
                        </Avatar>
                        <Badge
                          color={
                            student.status === 'Active' ? 'green' :
                            student.status === 'Inactive' ? 'gray' :
                            student.status === 'Graduated' ? 'blue' : 'red'
                          }
                          variant="light"
                        >
                          {student.status}
                        </Badge>
                      </Group>

                      {/* Student Info */}
                      <Stack gap="xs">
                        <Text fw={600} size="lg">{student.full_name}</Text>
                        <Text size="sm" c="dimmed">{student.student_number}</Text>
                        <Text size="sm">{student.email}</Text>
                        {student.phone && (
                          <Text size="sm">{student.phone}</Text>
                        )}
                      </Stack>

                      {/* Academic Info */}
                      <Stack gap="xs">
                        <Badge color="blue" variant="light">
                          {student.department_name}
                        </Badge>
                        <Group>
                          <Badge color="teal" variant="light" size="sm">
                            {student.batch_full_label || `Batch ${student.batch_year}`}
                          </Badge>
                          <Badge color="violet" variant="light" size="sm">
                            Sem {student.semester_name}
                          </Badge>
                          {student.section && (
                            <Badge color="orange" variant="light" size="sm">
                              Sec {student.section}
                            </Badge>
                          )}
                        </Group>
                      </Stack>

                      {/* Actions */}
                      <Group justify="space-between" mt="md">
                        <Text size="xs" c="dimmed">
                          Since: {new Date(student.created_at).toLocaleDateString()}
                        </Text>
                        <Group gap="xs">
                          <Tooltip label="View Details">
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="sm"
                              onClick={() => handleViewStudent(student)}
                            >
                              <IconEye size={16} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Change Status">
                            <ActionIcon
                              variant="light"
                              color="orange"
                              size="sm"
                              onClick={() => handleStatusChange(student)}
                            >
                              <IconStatusChange size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>
                    </Stack>
                  </Card>
                ))}
              </SimpleGrid>
            )}

            {/* Pagination */}
            {totalCount > limit && (
              <Center mt="xl">
                <Pagination
                  value={page}
                  onChange={handlePageChange}
                  total={Math.ceil(totalCount / limit)}
                  radius="lg"
                  withEdges
                  size="md"
                />
              </Center>
            )}
          </Stack>
        </Card>
      </Container>

      {/* Student Detail Modal */}
      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title={
          <Group gap="xs">
            <IconUser size={20} />
            <Text fw={600}>Student Details</Text>
          </Group>
        }
        size="lg"
        radius="lg"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {selectedStudent && (
          <Stack gap="lg">
            {/* Header */}
            <Group gap="lg">
              <Avatar
                size="xl"
                radius="xl"
                src={selectedStudent.profile_image_url}
                alt={selectedStudent.full_name}
              >
                {selectedStudent.full_name.charAt(0)}
              </Avatar>
              <Stack gap={2}>
                <Title order={3}>{selectedStudent.full_name}</Title>
                <Group>
                  <Badge color="blue" variant="light">{selectedStudent.student_number}</Badge>
                  <Badge
                    color={
                      selectedStudent.status === 'Active' ? 'green' :
                      selectedStudent.status === 'Inactive' ? 'gray' :
                      selectedStudent.status === 'Graduated' ? 'blue' : 'red'
                    }
                    variant="light"
                  >
                    {selectedStudent.status}
                  </Badge>
                </Group>
              </Stack>
            </Group>

            <Divider />

            {/* Personal Info */}
            <Stack gap="md">
              <Title order={4}>Personal Information</Title>
              <SimpleGrid cols={2} spacing="md">
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Email</Text>
                  <Text>{selectedStudent.email}</Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Phone</Text>
                  <Text>{selectedStudent.phone || 'N/A'}</Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Gender</Text>
                  <Text>{selectedStudent.gender}</Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Date of Birth</Text>
                  <Text>{selectedStudent.date_of_birth || 'N/A'}</Text>
                </Stack>
                {selectedStudent.address && (
                  <Stack gap={2}>
                    <Text fw={500} size="sm" c="dimmed">Address</Text>
                    <Text>{selectedStudent.address}</Text>
                  </Stack>
                )}
              </SimpleGrid>
            </Stack>

            <Divider />

            {/* Academic Info */}
            <Stack gap="md">
              <Title order={4}>Academic Information</Title>
              <SimpleGrid cols={2} spacing="md">
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Department</Text>
                  <Badge color="blue" variant="light">
                    {selectedStudent.department_name}
                  </Badge>
                </Stack>
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Batch / Entrance Year</Text>
                  <Text>{selectedStudent.batch_full_label || (selectedStudent.admission_year ? `${selectedStudent.batch_year} / ${selectedStudent.admission_year}` : selectedStudent.batch_year)}</Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Semester</Text>
                  <Text>{selectedStudent.semester_name}</Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Section</Text>
                  <Text>{selectedStudent.section || 'N/A'}</Text>
                </Stack>
              </SimpleGrid>
            </Stack>
          </Stack>
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        opened={statusModalOpened}
        onClose={closeStatusModal}
        title={
          <Group gap="xs">
            <IconStatusChange size={20} />
            <Text fw={600}>Update Student Status</Text>
          </Group>
        }
        size="md"
        radius="lg"
      >
        {selectedStudent && (
          <form onSubmit={statusForm.onSubmit(handleUpdateStatus)}>
            <Stack gap="lg">
              <Alert color="blue" variant="light">
                Updating status for: <Text fw={600}>{selectedStudent.full_name}</Text>
              </Alert>

              <Select
                label="New Status"
                placeholder="Select status"
                data={statusOptions}
                {...statusForm.getInputProps('status')}
                leftSection={
                  <ThemeIcon size="sm" variant="transparent">
                    {statusOptions.find(opt => opt.value === statusForm.values.status)?.icon}
                  </ThemeIcon>
                }
                radius="md"
                size="md"
              />

              <Textarea
                label="Reason (Optional)"
                placeholder="Enter reason for status change"
                autosize
                minRows={3}
                {...statusForm.getInputProps('reason')}
                radius="md"
                size="md"
              />

              <Group justify="flex-end" mt="md">
                <Button variant="light" onClick={closeStatusModal}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="blue"
                  leftSection={<IconCheck size={16} />}
                >
                  Update Status
                </Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ViewStudentsPage;