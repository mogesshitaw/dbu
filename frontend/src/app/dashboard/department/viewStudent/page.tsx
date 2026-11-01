 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Textarea,
  Box,
  Tabs,
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
  IconUsersGroup,
  IconAlertCircle,
  IconRotate,
  IconClockHour4,
  IconThumbUp,
  IconThumbDown,
} from "@tabler/icons-react";

// Redux Imports
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchStudents,
  updateStudentStatus,
  updateBatchStudentStatus,
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
  selectPage,
  selectLimit,
  selectSearchQuery,
  selectFilters,
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
  const page = useAppSelector(selectPage);
  const limit = useAppSelector(selectLimit);
  const searchQuery = useAppSelector(selectSearchQuery);
  const filters = useAppSelector(selectFilters);
  const batchOptions = useAppSelector(selectBatchOptions);
  const admissionYearOptions = useAppSelector(selectAdmissionYearOptions);
  const semesterOptions = useAppSelector(selectSemesterOptions);
  const filteredStudent = useAppSelector(selectFilteredStudents);
  const [user, setUser] = useState<any>(null);
  const filteredStudents = filteredStudent.filter(s => s.department_id === user?.department_id);

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
  const [statusModalOpened, { open: openStatusModal, close: closeStatusModal }] = useDisclosure(false);
  const [batchStatusModalOpened, { open: openBatchStatusModal, close: closeBatchStatusModal }] = useDisclosure(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Semester Requests state
  const [activeTab, setActiveTab] = useState<string | null>('students');
  const [semRequests, setSemRequests] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [semReqFilter, setSemReqFilter] = useState('pending');
  const [semReqLoading, setSemReqLoading] = useState(false);
  const [rejectModalOpened, { open: openRejectModal, close: closeRejectModal }] = useDisclosure(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectRemark, setRejectRemark] = useState('');
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);
  const rawApi = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const API = rawApi.endsWith('/api') ? rawApi : `${rawApi}/api`;

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

  // Batch status form - simplified
  const batchStatusForm = useForm({
    initialValues: {
      selectedBatch: '',
      status: '',
      reason: '',
    },
    validate: {
      selectedBatch: (value) => !value ? 'Please select a batch' : null,
      status: (value) => !value ? 'Please select a status' : null,
    },
  });

  // Load just the pending count for the badge (fast)
  const loadPendingCount = async () => {
    try {
      const res = await fetch(`${API}/students/semester-requests/department?status=pending`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setPendingCount(data.data.length);
    } catch { /* non-fatal */ }
  };

  const loadSemRequests = async () => {
    setSemReqLoading(true);
    try {
      const res = await fetch(`${API}/students/semester-requests/department?status=${semReqFilter}`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setSemRequests(data.data);
        // Keep pending count fresh
        if (semReqFilter === 'pending') setPendingCount(data.data.length);
        else loadPendingCount();
      }
    } catch (e) {
      console.error('loadSemRequests error', e);
    } finally {
      setSemReqLoading(false);
    }
  };

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
    // Load pending count immediately on mount so badge shows in the tab
    loadPendingCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load semester requests whenever tab changes or filter changes
  useEffect(() => {
    if (activeTab === 'requests') {
      loadSemRequests();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, semReqFilter]);

  const handleReviewRequest = async (requestId: number, action: 'approve' | 'reject', remarks?: string) => {
    setReviewingId(requestId);
    try {
      const res = await fetch(`${API}/students/semester-requests/${requestId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, review_remarks: remarks || '' }),
      });
      const data = await res.json();
      if (data.success) {
        notifications.show({
          title: action === 'approve' ? 'Approved ✅' : 'Rejected',
          message: data.message,
          color: action === 'approve' ? 'green' : 'red',
          icon: action === 'approve' ? <IconThumbUp size={20} /> : <IconThumbDown size={20} />,
        });
        loadSemRequests();
        dispatch(fetchStudents({ page, limit, search: searchQuery, filters }));
        closeRejectModal();
        setRejectRemark('');
        setSelectedRequest(null);
      } else {
        notifications.show({ title: 'Error', message: data.message, color: 'red' });
      }
    } catch (e) {
      notifications.show({ title: 'Network Error', message: 'Failed to review request.', color: 'red' });
    } finally {
      setReviewingId(null);
    }
  };

  const handleApproveAll = async () => {
    if (pendingCount === 0) return;
    setApprovingAll(true);
    try {
      const res = await fetch(`${API}/students/semester-requests/department/approve-all`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        notifications.show({
          title: 'All Approved ✅',
          message: data.message,
          color: 'green',
          icon: <IconCheck size={20} />,
        });
        loadSemRequests();
        loadPendingCount();
        dispatch(fetchStudents({ page, limit, search: searchQuery, filters }));
      } else {
        notifications.show({ title: 'Error', message: data.message, color: 'red' });
      }
    } catch {
      notifications.show({ title: 'Network Error', message: 'Failed to approve all.', color: 'red' });
    } finally {
      setApprovingAll(false);
    }
  };

  // Get student count for selected batch
  const getStudentCountForBatch = useMemo(() => {
    if (!batchStatusForm.values.selectedBatch) return 0;
    return filteredStudents.filter(student => 
      student.batch_year === batchStatusForm.values.selectedBatch
    ).length;
  }, [filteredStudents, batchStatusForm.values.selectedBatch]);

  // Get batch name for display
  const getBatchName = () => {
    const batch = batchOptions.find(b =>
      b.value === batchStatusForm.values.selectedBatch);
    return batch?.label || batchStatusForm.values.selectedBatch;
  };

  // Handle batch status change submission
  const handleBatchStatusChange = async (values: any) => {
    try {
      await dispatch(updateBatchStudentStatus({
        batch_id: values.selectedBatch,
        status: values.status,
        reason: values.reason || null,
        department_id: user?.department_id,
      })).unwrap();

      notifications.show({
        title: "Success",
        message: `Updated status for all ${getBatchName()} batch students  to ${values.status} in ${user.department_name}`,
        color: "green",
        icon: <IconCheck size={20} />,
      });

      // Refresh the student list and requests badge
      dispatch(fetchStudents({ page, limit, search: searchQuery, filters }));
      loadPendingCount();
      loadSemRequests();
      closeBatchStatusModal();
      batchStatusForm.reset();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: typeof error === "string" ? error : "Failed to update batch status ",
        color: "red",
        icon: <IconX size={20} />,
      });
    }
  };

  const handleSearch = (value: string) => {
    dispatch(setSearchQuery(value));
    dispatch(setPage(1));
  };

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value }));
    dispatch(setPage(1));
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    openDetailModal();
  };

  const handleStatusChange = (student: Student) => {
    setSelectedStudent(student);
    statusForm.setValues({ status: student.status, reason: '' });
    openStatusModal();
  };

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
        dispatch(fetchStudents({ page, limit, search: searchQuery, filters }));
        loadPendingCount();
        loadSemRequests();
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
    const activeCount = students.filter(s => s.status === 'Active' && s.department_id === user?.department_id).length;
    const inactiveCount = students.filter(s => s.status === 'Inactive' && s.department_id === user?.department_id).length;
    const graduatedCount = students.filter(s => s.status === 'Graduated' && s.department_id === user?.department_id).length;
    const suspendedCount = students.filter(s => s.status === 'Suspended' && s.department_id === user?.department_id).length;

    return {
      total: students.filter(s => s.department_id === user?.department_id).length,
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

  const paginatedstudent = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedStudents, currentPage]);
  
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);

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
                variant="light"
                color="blue"
                gradient={{ from: 'blue', to: 'cyan' }}
                leftSection={<IconUsersGroup size={20} />}
                size="md"
                radius="lg"
                onClick={openBatchStatusModal}
              >
                Batch Status 
              </Button>
              <Button
                variant="outline"
                color="blue"
                leftSection={<IconDownload size={20} />}
                size="md"
                radius="lg"
                onClick={handleExport}
              >
                Export
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

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="md">
            <Tabs.Tab value="students" leftSection={<IconUsers size={16} />}>
              Students
            </Tabs.Tab>
            <Tabs.Tab
              value="requests"
              leftSection={<IconRotate size={16} />}
              rightSection={
                pendingCount > 0
                  ? <Badge size="xs" color="orange" variant="filled" circle>{pendingCount}</Badge>
                  : null
              }
            >
              Semester Update Requests
            </Tabs.Tab>
          </Tabs.List>

          {/* ── Students Tab ── */}
          <Tabs.Panel value="students">
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
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Select
                      placeholder="Batch Level"
                      data={[{ value: '', label: 'All Batches' }, ...batchOptions]}
                      value={filters.batch}
                      onChange={(value) => handleFilterChange('batch', value || '')}
                      radius="lg"
                      size="sm"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
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
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Select
                      placeholder="Semester"
                      data={[{ value: '', label: 'All Semesters' }, ...semesterOptions]}
                      value={filters.semester}
                      onChange={(value) => handleFilterChange('semester', value || '')}
                      radius="lg"
                      size="sm"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
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
                      {paginatedstudent.map((student) => (
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
            {totalPages > 1 && (
              <Box p="md" className="bg-gray-50 border-t">
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of{' '}
                    {filteredStudents.length} students
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
          </Stack>
        </Card>
          </Tabs.Panel>

          {/* ── Semester Requests Tab ── */}
          <Tabs.Panel value="requests">
            <Card shadow="xl" radius="xl" padding="xl" className="bg-white/90 backdrop-blur-lg">
              <Stack gap="lg">
                <Group justify="space-between">
                  <Group gap="sm">
                    <ThemeIcon color="orange" variant="light" size={40} radius="md">
                      <IconRotate size={22} />
                    </ThemeIcon>
                    <Stack gap={2}>
                      <Title order={3}>Student Semester Update Requests</Title>
                      <Text size="sm" c="dimmed">Review and approve or reject student re-registration requests</Text>
                    </Stack>
                  </Group>
                  <Group>
                    <Select
                      value={semReqFilter}
                      onChange={(v) => setSemReqFilter(v || 'pending')}
                      data={[
                        { value: 'pending', label: '🟡 Pending' },
                        { value: 'approved', label: '🟢 Approved' },
                        { value: 'rejected', label: '🔴 Rejected' },
                        { value: 'all', label: 'All Requests' },
                      ]}
                      w={180}
                      radius="lg"
                    />
                    {pendingCount > 0 && (
                      <Button
                        color="green"
                        variant="filled"
                        leftSection={<IconCheck size={16} />}
                        loading={approvingAll}
                        onClick={handleApproveAll}
                        radius="lg"
                      >
                        Approve All ({pendingCount})
                      </Button>
                    )}
                    <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={loadSemRequests}>
                      Refresh
                    </Button>
                  </Group>
                </Group>

                <Divider />

                {semReqLoading ? (
                  <Center py="xl"><Loader /></Center>
                ) : semRequests.length === 0 ? (
                  <Center py="xl">
                    <Stack align="center" gap="sm">
                      <ThemeIcon color="gray" variant="light" size={60} radius="xl">
                        <IconClockHour4 size={30} />
                      </ThemeIcon>
                      <Text c="dimmed">No {semReqFilter === 'all' ? '' : semReqFilter} requests found.</Text>
                    </Stack>
                  </Center>
                ) : (
                  <ScrollArea>
                    <Table striped highlightOnHover withTableBorder withColumnBorders>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Student</Table.Th>
                          <Table.Th>Student No.</Table.Th>
                          <Table.Th>Current</Table.Th>
                          <Table.Th>Requested</Table.Th>
                          <Table.Th>Type</Table.Th>
                          <Table.Th>Reason</Table.Th>
                          <Table.Th>Submitted</Table.Th>
                          <Table.Th>Status</Table.Th>
                          {(semReqFilter === 'pending' || semReqFilter === 'all') && <Table.Th>Actions</Table.Th>}
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {semRequests.map((req: any) => (
                          <Table.Tr key={req.id}>
                            <Table.Td>
                              <Stack gap={2}>
                                <Text size="sm" fw={600}>{req.student_name}</Text>
                                <Text size="xs" c="dimmed">{req.student_email}</Text>
                              </Stack>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{req.student_number}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Stack gap={4}>
                                <Badge size="xs" color="gray" variant="light">{req.current_batch_name || 'N/A'}</Badge>
                                <Badge size="xs" color="gray" variant="light">{req.current_semester_name || 'N/A'}</Badge>
                              </Stack>
                            </Table.Td>
                            <Table.Td>
                              <Stack gap={4}>
                                <Badge size="xs" color="blue" variant="light">{req.requested_batch_name}</Badge>
                                <Badge size="xs" color="teal" variant="light">{req.requested_semester_name}</Badge>
                              </Stack>
                            </Table.Td>
                            <Table.Td>
                              <Badge size="xs" color="grape" variant="dot">{req.request_type}</Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="xs" c="dimmed" lineClamp={2}>{req.reason || '—'}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="xs">{new Date(req.created_at).toLocaleDateString()}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={req.status === 'pending' ? 'orange' : req.status === 'approved' ? 'green' : 'red'}
                                variant="filled"
                                size="sm"
                              >
                                {req.status}
                              </Badge>
                              {req.review_remarks && (
                                <Tooltip label={req.review_remarks} multiline maw={200}>
                                  <Text size="xs" c="dimmed" lineClamp={1} mt={4}>{req.review_remarks}</Text>
                                </Tooltip>
                              )}
                            </Table.Td>
                            {(semReqFilter === 'pending' || semReqFilter === 'all') && (
                              <Table.Td>
                                {req.status === 'pending' ? (
                                  <Group gap="xs" wrap="nowrap">
                                    <Tooltip label="Approve — Update batch & semester">
                                      <Button
                                        size="xs"
                                        color="green"
                                        leftSection={<IconThumbUp size={14} />}
                                        loading={reviewingId === req.id}
                                        onClick={() => handleReviewRequest(req.id, 'approve')}
                                      >
                                        Approve
                                      </Button>
                                    </Tooltip>
                                    <Tooltip label="Reject with remarks">
                                      <Button
                                        size="xs"
                                        color="red"
                                        variant="light"
                                        leftSection={<IconThumbDown size={14} />}
                                        onClick={() => {
                                          setSelectedRequest(req);
                                          setRejectRemark('');
                                          openRejectModal();
                                        }}
                                      >
                                        Reject
                                      </Button>
                                    </Tooltip>
                                  </Group>
                                ) : (
                                  <Text size="xs" c="dimmed">Completed</Text>
                                )}
                              </Table.Td>
                            )}
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                )}
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Container>

      {/* Reject Request Modal */}
      <Modal
        opened={rejectModalOpened}
        onClose={() => { closeRejectModal(); setRejectRemark(''); setSelectedRequest(null); }}
        title={
          <Group gap="xs">
            <ThemeIcon color="red" variant="light" size={32} radius="md">
              <IconThumbDown size={18} />
            </ThemeIcon>
            <Text fw={700}>Reject Semester Request</Text>
          </Group>
        }
        size="md"
        radius="lg"
        centered
      >
        <Stack gap="md">
          {selectedRequest && (
            <Alert color="orange" variant="light" icon={<IconAlertCircle size={18} />}>
              <Text size="sm">Rejecting request for <strong>{selectedRequest.student_name}</strong>. They will remain Suspended and may resubmit a new request.</Text>
            </Alert>
          )}
          <Textarea
            label="Rejection Remarks (required)"
            placeholder="Explain why the request is rejected..."
            value={rejectRemark}
            onChange={(e) => setRejectRemark(e.currentTarget.value)}
            minRows={3}
            required
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { closeRejectModal(); setRejectRemark(''); setSelectedRequest(null); }}>Cancel</Button>
            <Button
              color="red"
              leftSection={<IconX size={16} />}
              disabled={!rejectRemark.trim()}
              loading={reviewingId === selectedRequest?.id}
              onClick={() => selectedRequest && handleReviewRequest(selectedRequest.id, 'reject', rejectRemark)}
            >
              Confirm Rejection
            </Button>
          </Group>
        </Stack>
      </Modal>

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

      {/* Batch Status Change Modal - SIMPLIFIED VERSION */}
      <Modal
        opened={batchStatusModalOpened}
        onClose={() => {
          closeBatchStatusModal();
          batchStatusForm.reset();
        }}
        title={
          <Group gap="xs">
            <IconUsersGroup size={20} />
            <Text fw={600}>Update Batch Status</Text>
          </Group>
        }
        size="md"
        radius="lg"
      >
        <form onSubmit={batchStatusForm.onSubmit(handleBatchStatusChange)}>
          <Stack gap="lg">
            <Alert color="blue" variant="light" icon={<IconAlertCircle size={16} />}>
              This will update the status for ALL students in the selected batch.
            </Alert>

            <Select
              label="Select Batch"
              placeholder="Choose a batch"
              data={batchOptions}
              {...batchStatusForm.getInputProps('selectedBatch')}
              radius="md"
              size="md"
              searchable
              clearable
              required
            />

            {batchStatusForm.values.selectedBatch && (
              <Alert color="cyan" variant="light">
                <Text size="sm">
                  Batch: <Text fw={600} span>{getBatchName()}</Text>
                  <br />
                  Students affected: <Text fw={600} span>{getStudentCountForBatch}</Text>
                </Text>
              </Alert>
            )}

            <Select
              label="New Status"
              placeholder="Select status for the batch"
              data={statusOptions}
              {...batchStatusForm.getInputProps('status')}
              leftSection={
                <ThemeIcon size="sm" variant="transparent">
                  {statusOptions.find(opt => opt.value === batchStatusForm.values.status)?.icon}
                </ThemeIcon>
              }
              radius="md"
              size="md"
              required
            />

            <Textarea
              label="Reason (Optional)"
              placeholder="Enter reason for status change"
              autosize
              minRows={3}
              {...batchStatusForm.getInputProps('reason')}
              radius="md"
              size="md"
            />

            {batchStatusForm.values.selectedBatch && batchStatusForm.values.status && (
              <Alert color="yellow" variant="light">
                <Text size="sm">
                  <Text fw={600}>Warning:</Text> This will change the status of all {getStudentCountForBatch} students 
                  in batch {getBatchName()} to &quot;{batchStatusForm.values.status}&ldquo;. This action cannot be undone.
                </Text>
              </Alert>
            )}

            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                onClick={() => {
                  closeBatchStatusModal();
                  batchStatusForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="blue"
                leftSection={<IconCheck size={16} />}
                loading={loading}
                disabled={!batchStatusForm.values.selectedBatch || !batchStatusForm.values.status}
              >
                Update Batch Status
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Reject Semester Update Request Modal */}
      <Modal
        opened={rejectModalOpened}
        onClose={() => {
          closeRejectModal();
          setSelectedRequest(null);
          setRejectRemark('');
        }}
        title={
          <Group gap="xs">
            <IconAlertCircle size={20} color="red" />
            <Text fw={600}>Reject Semester Update Request</Text>
          </Group>
        }
        radius="lg"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm">
            Rejecting request for student: <b>{selectedRequest?.student_name}</b> ({selectedRequest?.student_number})
          </Text>
          <Text size="xs" c="dimmed">
            Requested: Batch {selectedRequest?.requested_batch_name} / {selectedRequest?.requested_semester_name}
          </Text>
          <Textarea
            label="Rejection Reason / Remarks"
            placeholder="Please specify why this request is rejected (e.g. prerequisite courses not passed, invalid documentation)..."
            required
            minRows={3}
            value={rejectRemark}
            onChange={(e) => setRejectRemark(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              onClick={() => {
                closeRejectModal();
                setSelectedRequest(null);
                setRejectRemark('');
              }}
            >
              Cancel
            </Button>
            <Button
              color="red"
              loading={reviewingId === selectedRequest?.id}
              disabled={!rejectRemark.trim()}
              leftSection={<IconThumbDown size={16} />}
              onClick={() => {
                if (selectedRequest) {
                  handleReviewRequest(selectedRequest.id, 'reject', rejectRemark);
                }
              }}
            >
              Confirm Rejection
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default ViewStudentsPage;