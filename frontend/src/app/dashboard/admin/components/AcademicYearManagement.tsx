/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Title,
  Card,
  Table,
  Button,
  Group,
  Text,
  LoadingOverlay,
  Badge,
  ActionIcon,
  Paper,
  Stack,
  ScrollArea,
  Box,
  Select,
  SegmentedControl,
  Tabs,
  Tooltip,
  Menu,
  Divider,
  Alert,
  SimpleGrid,
  ThemeIcon,
  Progress,
  TextInput,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconRefresh, 
  IconCalendar,
  IconClock,
  IconCheck,
  IconX,
  IconCalendarEvent,
  IconAlertCircle,
  IconInfoCircle,
  IconList,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerTrackNext,
  IconCheckbox,
  IconDotsVertical,
  IconEye,
  IconEyeOff,
  IconHistory,
  IconSearch,
  IconCalendarCheck,
  IconCalendarStats,
  IconChartBar,
} from '@tabler/icons-react';

// Import semester name management component
import SemesterNameManagement from './SemesterManagement';
import AcademicYearForm, { AcademicYear, Batch } from './AcademicYearForm';

// Import Redux actions
import { 
  fetchAcademicYears,
  deleteAcademicYear,
  updateAcademicYearStatus,
  autoUpdateExpiredAcademicYears,
  selectAllAcademicYears,
  selectAcademicYearsLoading,
  selectAcademicYearsError,
  selectAcademicYearsSuccessMessage,
  selectCompletedAcademicYears,
  selectActiveAcademicYears,
  selectUpcomingAcademicYears,
  selectInactiveAcademicYears,
  clearAcademicYearError,
  clearAcademicYearSuccessMessage
} from '../../../../store/slices/academicYearSlice';
import { fetchBatches, selectBatches } from '../../../../store/slices/batchSlice';

const STATUS_CONFIG = {
  active: { 
    color: 'green', 
    label: 'Active', 
    icon: IconCheck,
    description: 'Currently in use',
  },
  inactive: { 
    color: 'gray', 
    label: 'Inactive', 
    icon: IconX,
    description: 'Not in use',
  },
  completed: { 
    color: 'blue', 
    label: 'Completed', 
    icon: IconCalendar,
    description: 'Finished - read only',
  },
  upcoming: { 
    color: 'yellow', 
    label: 'Upcoming', 
    icon: IconClock,
    description: 'Scheduled for future',
  },
} as const;

type ViewType = 'grid' | 'table';

export default function AcademicYearManagement() {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<'academic-years' | 'semesters'>('academic-years');
  const [viewType, setViewType] = useState<ViewType>('table');
  
  // For academic years tab
  const [formOpened, setFormOpened] = useState(false);
  const [editingAcademicYear, setEditingAcademicYear] = useState<AcademicYear | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all'); // ቀላል string ተጠቀም
  const [periodFilter, setPeriodFilter] = useState<string>('all'); // ቀላል string ተጠቀም
  const [selectedBatch, setSelectedBatch] = useState<string | null>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Redux selectors
  const allAcademicYears: AcademicYear[] = useSelector(selectAllAcademicYears);
  const completedAcademicYears: AcademicYear[] = useSelector(selectCompletedAcademicYears);
  const activeAcademicYears: AcademicYear[] = useSelector(selectActiveAcademicYears);
  const upcomingAcademicYears: AcademicYear[] = useSelector(selectUpcomingAcademicYears);
  const inactiveAcademicYears: AcademicYear[] = useSelector(selectInactiveAcademicYears);
  
  const batches: Batch[] = useSelector(selectBatches);
  const loading = useSelector(selectAcademicYearsLoading);
  const error = useSelector(selectAcademicYearsError);
  const successMessage = useSelector(selectAcademicYearsSuccessMessage);

  const safeBatches: Batch[] = Array.isArray(batches) ? batches : [];

  // Get academic years based on status filter
  const getFilteredAcademicYears = useCallback((): AcademicYear[] => {
    // ቀላል ንጽጽር በማድረግ
    if (statusFilter === 'completed') {
      return completedAcademicYears;
    } else if (statusFilter === 'active') {
      return activeAcademicYears;
    } else if (statusFilter === 'upcoming') {
      return upcomingAcademicYears;
    } else if (statusFilter === 'inactive') {
      return inactiveAcademicYears;
    }
    return allAcademicYears;
  }, [statusFilter, allAcademicYears, completedAcademicYears, activeAcademicYears, upcomingAcademicYears, inactiveAcademicYears]);

  // Apply period filter
  const applyPeriodFilter = useCallback((years: AcademicYear[]): AcademicYear[] => {
    if (periodFilter === 'all') return years;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    
    if (periodFilter === 'current') {
      return years.filter(ay => {
        const startYear = parseInt(ay.academic_year.split('-')[0]);
        return startYear === currentYear || startYear === currentYear - 1;
      });
    } else if (periodFilter === 'upcoming') {
      return years.filter(ay => {
        const startYear = parseInt(ay.academic_year.split('-')[0]);
        return startYear > currentYear;
      });
    } else if (periodFilter === 'past') {
      return years.filter(ay => {
        const endYear = parseInt(ay.academic_year.split('-')[1]);
        return endYear < currentYear;
      });
    }
    
    return years;
  }, [periodFilter]);

  // Apply search filter
  const applySearchFilter = useCallback((years: AcademicYear[]): AcademicYear[] => {
    if (!searchTerm) return years;
    
    const term = searchTerm.toLowerCase();
    return years.filter(ay => 
      ay.semester_name?.toLowerCase().includes(term) ||
      ay.academic_year?.toLowerCase().includes(term) ||
      ay.batch_year?.toString().includes(term) ||
      ay.status?.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Apply batch filter
  const applyBatchFilter = useCallback((years: AcademicYear[]): AcademicYear[] => {
    if (!selectedBatch || selectedBatch === 'all') return years;
    return years.filter(ay => ay.batch_id === parseInt(selectedBatch));
  }, [selectedBatch]);

  // Combine all filters
  const filteredAcademicYears = useMemo((): AcademicYear[] => {
    const statusFiltered = getFilteredAcademicYears();
    const periodFiltered = applyPeriodFilter(statusFiltered);
    const batchFiltered = applyBatchFilter(periodFiltered);
    const searchFiltered = applySearchFilter(batchFiltered);
    return searchFiltered;
  }, [getFilteredAcademicYears, applyPeriodFilter, applyBatchFilter, applySearchFilter]);

  // Load data
  useEffect(() => {
    if (activeTab === 'academic-years') {
      dispatch(fetchAcademicYears() as any);
      dispatch(fetchBatches() as any);
    }
  }, [dispatch, activeTab]);

  // Handle messages
  useEffect(() => {
    if (successMessage) {
      notifications.show({ 
        title: 'Success', 
        message: successMessage, 
        color: 'green',
        icon: <IconCheck size={16} />
      });
      dispatch(clearAcademicYearSuccessMessage());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      notifications.show({ 
        title: 'Error', 
        message: error, 
        color: 'red',
        icon: <IconX size={16} />
      });
      dispatch(clearAcademicYearError());
    }
  }, [error, dispatch]);

  // DELETE FUNCTION
  const handleDelete = useCallback(async (id: number) => {
    try {
      await dispatch(deleteAcademicYear(id) as any);
      notifications.show({
        title: 'Success',
        message: 'Academic year deleted successfully',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to delete academic year',
        color: 'red',
      });
    }
  }, [dispatch]);

  // UPDATE STATUS FUNCTION
  const handleStatusUpdate = useCallback(async (id: number, newStatus: 'active' | 'inactive' | 'completed' | 'upcoming') => {
    try {
      await dispatch(
        updateAcademicYearStatus({
          academicYearId: id,
          status: newStatus,
        }) as any
      );
      notifications.show({
        title: 'Success',
        message: `Status updated to ${newStatus}`,
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Failed to update status',
        color: 'red',
      });
    }
  }, [dispatch]);

  // AUTO UPDATE EXPIRED FUNCTION
  const handleAutoUpdateExpired = useCallback(async () => {
    const expiredCount = allAcademicYears.filter(ay => {
      const endDate = new Date(ay.end_date);
      const today = new Date();
      return endDate < today && ay.status !== 'completed';
    }).length;

    if (expiredCount === 0) {
      notifications.show({
        title: 'No Updates Needed',
        message: 'No expired academic years found.',
        color: 'blue',
      });
      return;
    }
    
    modals.openConfirmModal({
      title: 'Update Expired Academic Years',
      children: (
        <Stack gap="sm">
          <Text size="sm">
            Found <strong>{expiredCount}</strong> expired academic year(s) that will be marked as completed.
          </Text>
          <Alert color="yellow" icon={<IconAlertCircle size={16} />}>
            This action cannot be undone. Completed academic years become read-only.
          </Alert>
        </Stack>
      ),
      labels: { confirm: 'Update All', cancel: 'Cancel' },
      onConfirm: async () => {
        try {
          await dispatch(autoUpdateExpiredAcademicYears() as any);
          notifications.show({
            title: 'Success',
            message: `Updated ${expiredCount} expired academic year(s)`,
            color: 'green',
          });
        } catch (err) {
          console.error('Error updating expired academic years:', err);
        }
      },
    });
  }, [dispatch, allAcademicYears]);

  // MARK AS COMPLETED FUNCTION
  const handleMarkCompleted = useCallback(async (academicYear: AcademicYear) => {
    if (academicYear.status === 'completed') {
      notifications.show({
        title: 'Already Completed',
        message: 'This academic year is already marked as completed.',
        color: 'blue',
      });
      return;
    }

    const endDate = new Date(academicYear.end_date);
    const today = new Date();
    
    if (endDate > today) {
      notifications.show({
        title: 'Cannot Complete',
        message: 'This academic year has not ended yet. End date is in the future.',
        color: 'orange',
      });
      return;
    }

    await handleStatusUpdate(academicYear.id, 'completed');
  }, [handleStatusUpdate]);

  // TOGGLE ACTIVE/INACTIVE FUNCTION
  const handleToggleActive = useCallback(async (academicYear: AcademicYear) => {
    if (academicYear.status === 'completed') {
      notifications.show({
        title: 'Cannot Toggle',
        message: 'Completed academic years cannot be toggled.',
        color: 'orange',
      });
      return;
    }

    const newStatus = academicYear.status === 'active' ? 'inactive' : 'active';
    await handleStatusUpdate(academicYear.id, newStatus);
  }, [handleStatusUpdate]);

  // MARK AS UPCOMING FUNCTION
  const handleMarkUpcoming = useCallback(async (academicYear: AcademicYear) => {
    if (academicYear.status === 'upcoming') {
      notifications.show({
        title: 'Already Upcoming',
        message: 'This academic year is already marked as upcoming.',
        color: 'blue',
      });
      return;
    }

    const startDate = new Date(academicYear.start_date);
    const today = new Date();
    
    if (startDate < today) {
      notifications.show({
        title: 'Cannot Mark as Upcoming',
        message: 'Start date is in the past. This academic year should be active or completed.',
        color: 'orange',
      });
      return;
    }

    await handleStatusUpdate(academicYear.id, 'upcoming');
  }, [handleStatusUpdate]);

  // EDIT FUNCTION
  const handleEdit = useCallback((academicYear: AcademicYear) => {
    if (academicYear.status === 'completed') {
      notifications.show({
        title: 'Cannot Edit',
        message: 'Completed academic years cannot be edited.',
        color: 'orange',
      });
      return;
    }
    setEditingAcademicYear(academicYear);
    setFormOpened(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpened(false);
    setEditingAcademicYear(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    handleFormClose();
    dispatch(fetchAcademicYears() as any);
  }, [dispatch, handleFormClose]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchAcademicYears() as any);
    dispatch(fetchBatches() as any);
  }, [dispatch]);

  const handleAddNew = useCallback(() => {
    setEditingAcademicYear(null);
    setFormOpened(true);
  }, []);

  const handleClearFilters = useCallback(() => {
    setStatusFilter('all');
    setPeriodFilter('all');
    setSelectedBatch('all');
    setSearchTerm('');
  }, []);

  // Batch options for filter
  const batchOptions = [
    { value: 'all', label: 'All Batches' },
    ...safeBatches.map(batch => ({
      value: batch.batch_id.toString(),
      label: `Batch ${batch.batch_year}`
    }))
  ];

  // Calculate statistics
  const stats = {
    total: allAcademicYears.length,
    active: activeAcademicYears.length,
    completed: completedAcademicYears.length,
    upcoming: upcomingAcademicYears.length,
    inactive: inactiveAcademicYears.length,
    expired: allAcademicYears.filter(ay => {
      const endDate = new Date(ay.end_date);
      const today = new Date();
      return endDate < today && ay.status !== 'completed';
    }).length,
  };

  // Calculate progress
  const completionPercentage = stats.total > 0 
    ? Math.round((stats.completed / stats.total) * 100) 
    : 0;

  const getStatusConfig = (status: string) => {
    if (status === 'active') return STATUS_CONFIG.active;
    if (status === 'inactive') return STATUS_CONFIG.inactive;
    if (status === 'completed') return STATUS_CONFIG.completed;
    if (status === 'upcoming') return STATUS_CONFIG.upcoming;
    return STATUS_CONFIG.upcoming; // default
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isAcademicYearEnded = (academicYear: AcademicYear) => {
    const endDate = new Date(academicYear.end_date);
    const today = new Date();
    return endDate < today;
  };

  const isAcademicYearStarted = (academicYear: AcademicYear) => {
    const startDate = new Date(academicYear.start_date);
    const today = new Date();
    return startDate <= today;
  };

  const getDaysRemaining = (academicYear: AcademicYear) => {
    const endDate = new Date(academicYear.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgress = (academicYear: AcademicYear) => {
    const start = new Date(academicYear.start_date).getTime();
    const end = new Date(academicYear.end_date).getTime();
    const now = new Date().getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    return Math.round(((now - start) / (end - start)) * 100);
  };

  const hasActiveFilters = statusFilter !== 'all' || periodFilter !== 'all' || selectedBatch !== 'all' || searchTerm !== '';

  return (
    <Box className="w-full h-full p-4">
      <Stack gap="md" className="w-full h-full">
        {/* Header with Tabs */}
        <Card withBorder padding="md" radius="lg">
          <Group justify="space-between">
            <div>
              <Title order={1} className="text-2xl font-bold">Academic Management</Title>
              <Text c="dimmed">Manage semesters and academic years</Text>
            </div>
            <Group>
              <Tooltip label={viewType === 'table' ? 'Switch to grid view' : 'Switch to table view'}>
                <Button
                  variant="light"
                  onClick={() => setViewType(viewType === 'table' ? 'grid' : 'table')}
                  leftSection={viewType === 'table' ? <IconCalendarStats size={16} /> : <IconList size={16} />}
                >
                  {viewType === 'table' ? 'Grid View' : 'Table View'}
                </Button>
              </Tooltip>
            </Group>
          </Group>
          
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value as any)} className="mt-4">
            <Tabs.List>
              <Tabs.Tab 
                value="academic-years" 
                leftSection={<IconCalendarEvent size={16} />}
              >
                Academic Years
              </Tabs.Tab>
              <Tabs.Tab 
                value="semesters" 
                leftSection={<IconList size={16} />}
              >
                Semester Names
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Card>

        {/* Content based on active tab */}
        {activeTab === 'semesters' ? (
          <SemesterNameManagement />
        ) : (
          /* Academic Years Tab */
          <>
            {/* Stats Dashboard */}
            <SimpleGrid cols={{ base: 2, sm: 3, md: 6 }}>
              <Card withBorder padding="md" radius="md">
                <Group>
                  <ThemeIcon color="blue" variant="light" size="lg">
                    <IconCalendar size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">Total</Text>
                    <Title order={4}>{stats.total}</Title>
                  </div>
                </Group>
              </Card>
              
              <Card withBorder padding="md" radius="md">
                <Group>
                  <ThemeIcon color="green" variant="light" size="lg">
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">Active</Text>
                    <Title order={4}>{stats.active}</Title>
                  </div>
                </Group>
              </Card>
              
              <Card withBorder padding="md" radius="md">
                <Group>
                  <ThemeIcon color="yellow" variant="light" size="lg">
                    <IconClock size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">Upcoming</Text>
                    <Title order={4}>{stats.upcoming}</Title>
                  </div>
                </Group>
              </Card>
              
              <Card withBorder padding="md" radius="md">
                <Group>
                  <ThemeIcon color="blue" variant="light" size="lg">
                    <IconCalendarCheck size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">Completed</Text>
                    <Title order={4}>{stats.completed}</Title>
                  </div>
                </Group>
              </Card>
              
              <Card withBorder padding="md" radius="md">
                <Group>
                  <ThemeIcon color="gray" variant="light" size="lg">
                    <IconEyeOff size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">Inactive</Text>
                    <Title order={4}>{stats.inactive}</Title>
                  </div>
                </Group>
              </Card>
              
              <Card withBorder padding="md" radius="md">
                <Group>
                  <ThemeIcon color="red" variant="light" size="lg">
                    <IconAlertCircle size={20} />
                  </ThemeIcon>
                  <div>
                    <Text size="xs" c="dimmed">Expired</Text>
                    <Title order={4}>{stats.expired}</Title>
                  </div>
                </Group>
              </Card>
            </SimpleGrid>

            {/* Progress Bar */}
            <Card withBorder padding="md" radius="md">
              <Group justify="space-between" mb="xs">
                <Group>
                  <IconChartBar size={20} className="text-gray-600" />
                  <Text fw={500}>Overall Completion Progress</Text>
                </Group>
                <Text size="sm" c="dimmed">{stats.completed}/{stats.total} completed</Text>
              </Group>
              <Progress 
                value={completionPercentage} 
                color="blue" 
                size="lg" 
                radius="xl"
                animated
              />
            </Card>

            {/* Action Bar */}
            <Card withBorder padding="md" radius="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Group>
                    <Button 
                      variant="light" 
                      leftSection={<IconRefresh size={16} />} 
                      onClick={handleRefresh} 
                      loading={loading}
                    >
                      Refresh
                    </Button>
                    
                    <Select
                      value={selectedBatch}
                      onChange={setSelectedBatch}
                      data={batchOptions}
                      placeholder="Filter by batch"
                      className="w-48"
                      clearable
                    />
                    
                    <Select
                      value={periodFilter}
                      onChange={(value) => setPeriodFilter(value || 'all')}
                      data={[
                        { value: 'all', label: 'All Periods' },
                        { value: 'current', label: 'Current Year' },
                        { value: 'upcoming', label: 'Upcoming Years' },
                        { value: 'past', label: 'Past Years' },
                      ]}
                      placeholder="Filter by period"
                      className="w-48"
                    />
                    
                    <SegmentedControl
                      value={statusFilter}
                      onChange={(value) => setStatusFilter(value)}
                      data={[
                        { label: 'All', value: 'all' },
                        { label: 'Active', value: 'active' },
                        { label: 'Upcoming', value: 'upcoming' },
                        { label: 'Completed', value: 'completed' },
                        { label: 'Inactive', value: 'inactive' },
                      ]}
                    />
                    
                    {hasActiveFilters && (
                      <Button
                        variant="subtle"
                        color="gray"
                        onClick={handleClearFilters}
                        leftSection={<IconX size={16} />}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </Group>
                  
                  <Group>
                    <Button
                      variant="light"
                      color="orange"
                      leftSection={<IconHistory size={16} />}
                      onClick={handleAutoUpdateExpired}
                      loading={loading}
                    >
                      Update Expired ({stats.expired})
                    </Button>
                    
                    <Button 
                      leftSection={<IconPlus size={16} />} 
                      onClick={handleAddNew}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      disabled={safeBatches.length === 0}
                    >
                      Add Academic Year
                    </Button>
                  </Group>
                </Group>

                {/* Search Input */}
                <TextInput
                  placeholder="Search by semester, academic year, batch, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftSection={<IconSearch size={16} />}
                  className="flex-1"
                />

                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    Showing {filteredAcademicYears.length} of {allAcademicYears.length} academic years
                  </Text>
                  {hasActiveFilters && (
                    <Badge color="blue" variant="light">
                      Filters Applied
                    </Badge>
                  )}
                </Group>
              </Stack>
            </Card>

            {/* Show warning if no batches available */}
            {safeBatches.length === 0 && (
              <Alert color="yellow" icon={<IconAlertCircle size={20} />}>
                No batches available. Please create batches first in the Batch Management section.
              </Alert>
            )}

            {/* Academic Years Display */}
            {filteredAcademicYears.length === 0 && !loading ? (
              <Paper className="text-center py-12" withBorder>
                <ThemeIcon size={60} color="gray" variant="light" className="mx-auto mb-4">
                  <IconCalendar size={30} />
                </ThemeIcon>
                {/* <Text c="dimmed" size="lg" className="mb-4">
                  {hasActiveFilters 
                    ? 'No academic years match your filters' 
                    : statusFilter === 'completed' 
                    ? 'No completed academic years found'
                    : statusFilter === 'active'
                    ? 'No active academic years found'
                    : statusFilter === 'upcoming'
                    ? 'No upcoming academic years found'
                    : statusFilter === 'inactive'
                    ? 'No inactive academic years found'
                    : 'No academic years found'}
                </Text> */}
                {hasActiveFilters && (
                  <Button onClick={handleClearFilters} variant="subtle" className="mb-4">
                    Clear filters to see all academic years
                  </Button>
                )}
                <Button 
                  onClick={handleAddNew} 
                  leftSection={<IconPlus size={16} />}
                  disabled={safeBatches.length === 0}
                >
                  Create your first academic year
                </Button>
                {safeBatches.length === 0 && (
                  <Text c="red" size="sm" className="mt-2">
                    You need to create batches first
                  </Text>
                )}
              </Paper>
            ) : viewType === 'table' ? (
              /* Table View */
              <Card shadow="sm" padding="lg" radius="md" withBorder className="flex-1">
                <LoadingOverlay visible={loading} />
                <ScrollArea>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>#</Table.Th>
                        <Table.Th>Semester</Table.Th>
                        <Table.Th>Academic Year</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Batch</Table.Th>
                        <Table.Th>Start Date</Table.Th>
                        <Table.Th>End Date</Table.Th>
                        <Table.Th>Progress</Table.Th>
                        <Table.Th>Actions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredAcademicYears.map((academicYear: AcademicYear, index: number) => {
                        const statusConfig = getStatusConfig(academicYear.status);
                        const isEnded = isAcademicYearEnded(academicYear);
                        const isStarted = isAcademicYearStarted(academicYear);
                        const daysRemaining = getDaysRemaining(academicYear);
                        const progress = getProgress(academicYear);
                        const isEditable = academicYear.status !== 'completed';
                        
                        return (
                          <Table.Tr key={academicYear.id}>
                            <Table.Td>{index + 1}</Table.Td>
                            <Table.Td>
                              <Badge color="blue" variant="light">
                                {academicYear.semester}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge color="indigo" variant="light">
                                {academicYear.academic_year}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Tooltip label={statusConfig.description}>
                                <Badge color={statusConfig.color} variant="light">
                                  {statusConfig.label}
                                </Badge>
                              </Tooltip>
                            </Table.Td>
                            <Table.Td>
                              <Badge color="teal" variant="light">
                                Batch {academicYear.batch_year}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">
                                {formatDate(academicYear.start_date)}
                              </Text>
                              {!isStarted && academicYear.status !== 'completed' && (
                                <Text size="xs" c="yellow" className="mt-1">
                                  Not started
                                </Text>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <div>
                                <Text size="sm" className={isEnded ? 'text-gray-500' : ''}>
                                  {formatDate(academicYear.end_date)}
                                </Text>
                                {isEnded && academicYear.status !== 'completed' && (
                                  <Text size="xs" c="red" className="mt-1">
                                    Expired - needs update
                                  </Text>
                                )}
                                {!isEnded && isStarted && academicYear.status === 'active' && (
                                  <Text size="xs" c="green" className="mt-1">
                                    {daysRemaining} days remaining
                                  </Text>
                                )}
                              </div>
                            </Table.Td>
                            <Table.Td style={{ width: 120 }}>
                              <Tooltip label={`${progress}% complete`}>
                                <Progress 
                                  value={progress} 
                                  color={progress === 100 ? 'green' : 'blue'} 
                                  size="sm"
                                  radius="xl"
                                />
                              </Tooltip>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Menu position="bottom-end" withinPortal>
                                  <Menu.Target>
                                    <ActionIcon variant="subtle" color="gray">
                                      <IconDotsVertical size={16} />
                                    </ActionIcon>
                                  </Menu.Target>
                                  <Menu.Dropdown>
                                    <Menu.Label>Actions</Menu.Label>
                                    
                                    <Menu.Item
                                      leftSection={<IconEdit size={14} />}
                                      onClick={() => handleEdit(academicYear)}
                                      disabled={!isEditable}
                                    >
                                      {isEditable ? 'Edit' : 'Cannot Edit'}
                                    </Menu.Item>
                                    
                                    <Menu.Item
                                      leftSection={<IconTrash size={14} />}
                                      color="red"
                                      onClick={() => handleDelete(academicYear.id)}
                                      disabled={!isEditable}
                                    >
                                      {isEditable ? 'Delete' : 'Cannot Delete'}
                                    </Menu.Item>
                                    
                                    <Menu.Divider />
                                    
                                    <Menu.Label>Status Management</Menu.Label>
                                    
                                    <Menu.Item
                                      leftSection={<IconPlayerPlay size={14} />}
                                      onClick={() => handleStatusUpdate(academicYear.id, 'active')}
                                      disabled={academicYear.status === 'active' || academicYear.status === 'completed'}
                                      color="green"
                                    >
                                      {academicYear.status === 'active' ? '✓ Active' : 'Set Active'}
                                    </Menu.Item>
                                    
                                    <Menu.Item
                                      leftSection={<IconPlayerPause size={14} />}
                                      onClick={() => handleStatusUpdate(academicYear.id, 'inactive')}
                                      disabled={academicYear.status === 'inactive' || academicYear.status === 'completed'}
                                      color="gray"
                                    >
                                      {academicYear.status === 'inactive' ? '✓ Inactive' : 'Set Inactive'}
                                    </Menu.Item>
                                    
                                    <Menu.Item
                                      leftSection={<IconPlayerTrackNext size={14} />}
                                      onClick={() => handleStatusUpdate(academicYear.id, 'upcoming')}
                                      disabled={academicYear.status === 'upcoming' || academicYear.status === 'completed'}
                                      color="yellow"
                                    >
                                      {academicYear.status === 'upcoming' ? '✓ Upcoming' : 'Set Upcoming'}
                                    </Menu.Item>
                                    
                                    <Menu.Item
                                      leftSection={<IconCheckbox size={14} />}
                                      onClick={() => handleMarkCompleted(academicYear)}
                                      disabled={academicYear.status === 'completed'}
                                      color="blue"
                                    >
                                      {academicYear.status === 'completed' ? '✓ Completed' : 'Mark Completed'}
                                    </Menu.Item>
                                    
                                    <Menu.Divider />
                                    
                                    <Menu.Item
                                      leftSection={academicYear.status === 'active' ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                                      onClick={() => handleToggleActive(academicYear)}
                                      disabled={academicYear.status === 'completed'}
                                    >
                                      {academicYear.status === 'active' ? 'Deactivate' : 'Activate'}
                                    </Menu.Item>
                                    
                                    <Menu.Item
                                      leftSection={<IconClock size={14} />}
                                      onClick={() => handleMarkUpcoming(academicYear)}
                                      disabled={academicYear.status === 'upcoming' || academicYear.status === 'completed'}
                                    >
                                      Mark as Upcoming
                                    </Menu.Item>
                                  </Menu.Dropdown>
                                </Menu>

                                {/* Quick status toggles */}
                                <Tooltip label={academicYear.status === 'active' ? 'Active' : 'Set Active'}>
                                  <ActionIcon 
                                    variant={academicYear.status === 'active' ? "filled" : "subtle"}
                                    color="green" 
                                    onClick={() => handleStatusUpdate(academicYear.id, 'active')}
                                    disabled={academicYear.status === 'completed' || academicYear.status === 'active'}
                                    size="sm"
                                  >
                                    <IconCheck size={14} />
                                  </ActionIcon>
                                </Tooltip>
                                
                                <Tooltip label={academicYear.status === 'completed' ? 'Completed' : 'Mark Completed'}>
                                  <ActionIcon 
                                    variant={academicYear.status === 'completed' ? "filled" : "subtle"}
                                    color="blue" 
                                    onClick={() => handleMarkCompleted(academicYear)}
                                    disabled={academicYear.status === 'completed'}
                                    size="sm"
                                  >
                                    <IconCalendar size={14} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Card>
            ) : (
              /* Grid View */
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {filteredAcademicYears.map((academicYear: AcademicYear) => {
                  const statusConfig = getStatusConfig(academicYear.status);
                  const isEnded = isAcademicYearEnded(academicYear);
                  const isStarted = isAcademicYearStarted(academicYear);
                  const progress = getProgress(academicYear);
                  const daysRemaining = getDaysRemaining(academicYear);
                  const isEditable = academicYear.status !== 'completed';
                  
                  return (
                    <Paper
                      key={academicYear.id}
                      withBorder
                      p="lg"
                      radius="lg"
                      className={`border-2 ${
                        academicYear.status === 'active' 
                          ? 'border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50' 
                          : academicYear.status === 'upcoming'
                          ? 'border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-amber-50/50'
                          : academicYear.status === 'completed'
                          ? 'border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/50'
                          : 'border-gray-200 bg-gradient-to-br from-gray-50/50 to-slate-50/50'
                      } hover:shadow-lg transition-all duration-200`}
                    >
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Badge color={statusConfig.color} size="lg" variant="light">
                            {statusConfig.label}
                          </Badge>
                          <Group gap="xs">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => handleEdit(academicYear)}
                              disabled={!isEditable}
                              size="sm"
                            >
                              <IconEdit size={16} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(academicYear.id)}
                              disabled={!isEditable}
                              size="sm"
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Group>

                        <div>
                          <Text fw={600} size="lg">
                            {academicYear.semester_name}
                          </Text>
                          <Group gap="xs" mt={4}>
                            <Badge color="indigo" variant="light" size="sm">
                              {academicYear.academic_year}
                            </Badge>
                            <Badge color="teal" variant="light" size="sm">
                              Batch {academicYear.batch_year}
                            </Badge>
                          </Group>
                        </div>

                        <Divider />

                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">Start Date:</Text>
                            <Text size="sm" fw={500}>{formatDate(academicYear.start_date)}</Text>
                          </Group>
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">End Date:</Text>
                            <Text size="sm" fw={500}>{formatDate(academicYear.end_date)}</Text>
                          </Group>
                        </Stack>

                        <Progress 
                          value={progress} 
                          color={progress === 100 ? 'green' : 'blue'} 
                          size="md"
                          radius="xl"
                        />

                        <Group justify="space-between" mt="xs">
                          {isStarted ? (
                            <Text size="xs" c="dimmed">
                              {progress}% complete
                            </Text>
                          ) : (
                            <Text size="xs" c="yellow">
                              Not started yet
                            </Text>
                          )}
                          
                          {isEnded && academicYear.status !== 'completed' && (
                            <Badge color="red" size="sm" variant="light">
                              Expired
                            </Badge>
                          )}
                          
                          {!isEnded && isStarted && academicYear.status === 'active' && (
                            <Text size="xs" c="green">
                              {daysRemaining} days left
                            </Text>
                          )}
                        </Group>

                        <Divider />

                        <Group justify="apart" gap="xs">
                          <Tooltip label="Quick Status Update">
                            <Group gap={4}>
                              <ActionIcon
                                variant={academicYear.status === 'active' ? "filled" : "light"}
                                color="green"
                                size="sm"
                                onClick={() => handleStatusUpdate(academicYear.id, 'active')}
                                disabled={!isEditable || academicYear.status === 'active'}
                              >
                                <IconCheck size={14} />
                              </ActionIcon>
                              <ActionIcon
                                variant={academicYear.status === 'upcoming' ? "filled" : "light"}
                                color="yellow"
                                size="sm"
                                onClick={() => handleStatusUpdate(academicYear.id, 'upcoming')}
                                disabled={!isEditable || academicYear.status === 'upcoming'}
                              >
                                <IconClock size={14} />
                              </ActionIcon>
                              <ActionIcon
                                variant={academicYear.status === 'completed' ? "filled" : "light"}
                                color="blue"
                                size="sm"
                                onClick={() => handleMarkCompleted(academicYear)}
                                disabled={!isEditable || academicYear.status === 'completed'}
                              >
                                <IconCalendarCheck size={14} />
                              </ActionIcon>
                              <ActionIcon
                                variant={academicYear.status === 'inactive' ? "filled" : "light"}
                                color="gray"
                                size="sm"
                                onClick={() => handleToggleActive(academicYear)}
                                disabled={!isEditable}
                              >
                                {academicYear.status === 'active' ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                              </ActionIcon>
                            </Group>
                          </Tooltip>
                          
                          <Menu position="bottom-end" withinPortal>
                            <Menu.Target>
                              <ActionIcon variant="subtle" color="gray" size="sm">
                                <IconDotsVertical size={14} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item
                                leftSection={<IconEdit size={14} />}
                                onClick={() => handleEdit(academicYear)}
                                disabled={!isEditable}
                              >
                                Edit
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconTrash size={14} />}
                                color="red"
                                onClick={() => handleDelete(academicYear.id)}
                                disabled={!isEditable}
                              >
                                Delete
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Group>
                      </Stack>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            )}

            {/* Info Banner for completed academic years */}
            {statusFilter === 'completed' && completedAcademicYears.length > 0 && (
              <Alert color="blue" icon={<IconInfoCircle size={20} />}>
                Completed academic years are automatically updated when their end date passes. 
                They cannot be edited or deleted to preserve historical data.
              </Alert>
            )}

            {/* Academic Year Form Modal */}
            <AcademicYearForm
              opened={formOpened}
              onClose={handleFormClose}
              onSuccess={handleFormSuccess}
              batches={safeBatches}
              academicYear={editingAcademicYear}
              onDelete={handleDelete}
              onStatusChange={handleStatusUpdate}
            />
          </>
        )}
      </Stack>
    </Box>
  );
}


