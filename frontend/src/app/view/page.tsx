
"use client";

import React, { useEffect } from "react";
import {
  Container,
  Card,
  Title,
  Text,
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
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconCalendar,
  IconSchool,
  IconUsers,
  IconClock,
  IconBuilding,
  IconAlertCircle,
  IconSearch,
  IconBook,
  IconUser,
  IconMapPin,
  IconCoffee,
} from "@tabler/icons-react";

// Redux Imports - Updated with new selectors
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchDepartments,
  fetchBatchSchedules,
  setBatchFilters,
  clearError,
} from "@/store/slices/scheduleSlice";
import {
  selectBatchSchedules,
  selectDepartmentOptions,
  selectDeptLoading,
  selectError,
  selectBatchFilters,
  selectHasBatchSelection,
  selectCurrentSelectionInfo,
  selectIsScheduleEmpty,
  selectTimeSlots,
  selectScheduleForTimeSlot,
  selectBatchLoading,
  selectScheduleStats,
} from "@/store/selectors/scheduleSelectors";

import Header from "@/compnent/header";
import Footer from "@/compnent/footer";

const BatchSemesterSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Updated Redux selectors using new selector system
  const schedules = useAppSelector(selectBatchSchedules);
  const departmentOptions = useAppSelector(selectDepartmentOptions);
  const deptLoading = useAppSelector(selectDeptLoading);
  const error = useAppSelector(selectError);
  const filters = useAppSelector(selectBatchFilters);
  const hasSelection = useAppSelector(selectHasBatchSelection);
  const currentSelectionInfo = useAppSelector(selectCurrentSelectionInfo);
  const isEmptySchedule = useAppSelector(selectIsScheduleEmpty);
  const timeSlots = useAppSelector(selectTimeSlots);
  const getScheduleForTimeSlot = useAppSelector(selectScheduleForTimeSlot);
  const loading = useAppSelector(selectBatchLoading);
  const scheduleStats = useAppSelector(selectScheduleStats);

  const form = useForm({
    initialValues: {
      department: filters.department,
      batch: filters.batch,
      semester: filters.semester,
      section: filters.section,
    },
  });

  const batches = [
    { value: "First year", label: "First Year" },
    { value: "Second year", label: "Second Year" },
    { value: "Third Year", label: "Third Year" },
    { value: "Fourth Year", label: "Fourth Year" },
  ];

  const semesters = [
    { value: "First", label: "First Semester" },
    { value: "Second", label: "Second Semester" },
    { value: "Summer", label: "Summer Semester" },
  ];

  const sections = [
    { value: "1", label: "Single Class" },
    ...Array.from({ length: 26 }, (_, i) => ({
      value: String.fromCharCode(65 + i),
      label: `Section ${String.fromCharCode(65 + i)}`,
    })),
  ];

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Fetch departments on component mount
  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  // Update form when Redux filters change
  useEffect(() => {
    form.setValues({
      department: filters.department,
      batch: filters.batch,
      semester: filters.semester,
      section: filters.section,
    });
  }, [filters]);

  // Handle form field changes
  const handleFieldChange = (field: keyof typeof filters, value: string) => {
    dispatch(setBatchFilters({ [field]: value }));
  };

  // Fetch schedules
  const handleFetchSchedules = () => {
    if (!hasSelection) return;
    
    dispatch(fetchBatchSchedules({
      batch: filters.batch,
      semester: filters.semester,
      section: filters.section,
      department_id: filters.department,
    }));
  };

  // Get day color for visual distinction
  const getDayColor = (day: string) => {
    const colors: { [key: string]: string } = {
      Monday: "blue",
      Tuesday: "teal", 
      Wednesday: "violet",
      Thursday: "orange",
      Friday: "red",
      Saturday: "indigo",
      Sunday: "pink",
    };
    return colors[day] || "gray";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
      <Header isActive="/view"/>
      
      <Container size="xl" className="py-8">
        {/* Enhanced Header Section */}
        <Stack align="center" gap="md" mb={40}>
          <div className="relative">
            <ThemeIcon
              size={100}
              radius="xl"
              variant="gradient"
              gradient={{ from: 'blue', to: 'purple' }}
              className="shadow-lg animate-pulse-slow"
            >
              <IconCalendar size={48} />
            </ThemeIcon>
            <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          
          <Stack gap="xs" align="center">
            <Title
              order={1}
              className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent text-center"
            >
              Academic Schedule
            </Title>
            <Text c="dimmed" size="xl" ta="center" fw={500}>
              Manage and view your academic timetable with beautiful, intuitive design
            </Text>
          </Stack>
        </Stack>

        {/* Enhanced Main Card */}
        <Card
          shadow="xl"
          radius="xl"
          padding="xl"
          className="bg-white/90 backdrop-blur-lg border border-white/20 relative overflow-hidden"
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none"></div>

          {/* Enhanced Selectors Section */}
          <Stack gap="xl">
            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Select
                  label={
                    <Group gap="xs">
                      <ThemeIcon size="sm" color="green" variant="light">
                        <IconBuilding size={16} />
                      </ThemeIcon>
                      <Text fw={600}>Department</Text>
                    </Group>
                  }
                  placeholder="Select department"
                  data={deptLoading ? [{ value: "loading", label: "Loading departments...", disabled: true }] : departmentOptions}
                  value={form.values.department}
                  onChange={(value) => handleFieldChange('department', value || '')}
                  disabled={deptLoading}
                  size="md"
                  radius="lg"
                  styles={{
                    input: {
                      border: '2px solid #e2e8f0',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      transition: 'all 0.3s ease',
                      '&:focus': {
                        borderColor: '#10b981',
                        boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.1)',
                      },
                    }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Select
                  label={
                    <Group gap="xs">
                      <ThemeIcon size="sm" color="blue" variant="light">
                        <IconUsers size={16} />
                      </ThemeIcon>
                      <Text fw={600}>Batch</Text>
                    </Group>
                  }
                  placeholder="Select batch"
                  data={batches}
                  value={form.values.batch}
                  onChange={(value) => handleFieldChange('batch', value || '')}
                  size="md"
                  radius="lg"
                  styles={{
                    input: {
                      border: '2px solid #e2e8f0',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      transition: 'all 0.3s ease',
                      '&:focus': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                      },
                    }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Select
                  label={
                    <Group gap="xs">
                      <ThemeIcon size="sm" color="violet" variant="light">
                        <IconBook size={16} />
                      </ThemeIcon>
                      <Text fw={600}>Semester</Text>
                    </Group>
                  }
                  placeholder="Select semester"
                  data={semesters}
                  value={form.values.semester}
                  onChange={(value) => handleFieldChange('semester', value || '')}
                  size="md"
                  radius="lg"
                  styles={{
                    input: {
                      border: '2px solid #e2e8f0',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      transition: 'all 0.3s ease',
                      '&:focus': {
                        borderColor: '#8b5cf6',
                        boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.1)',
                      },
                    }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
                <Select
                  label={
                    <Group gap="xs">
                      <ThemeIcon size="sm" color="orange" variant="light">
                        <IconSchool size={16} />
                      </ThemeIcon>
                      <Text fw={600}>Section</Text>
                    </Group>
                  }
                  placeholder="Select section"
                  data={sections}
                  value={form.values.section}
                  onChange={(value) => handleFieldChange('section', value || '')}
                  size="md"
                  radius="lg"
                  styles={{
                    input: {
                      border: '2px solid #e2e8f0',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      transition: 'all 0.3s ease',
                      '&:focus': {
                        borderColor: '#f59e0b',
                        boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.1)',
                      },
                    }
                  }}
                />
              </Grid.Col>
            </Grid>

            {/* Search Button */}
            <Center>
              <Button
                onClick={handleFetchSchedules}
                leftSection={<IconSearch size={20} />}
                size="lg"
                radius="lg"
                loading={loading}
                disabled={!hasSelection}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transform transition-all duration-300 hover:scale-105"
                styles={{
                  root: {
                    border: 'none',
                    fontWeight: 700,
                  }
                }}
              >
                {loading ? "Loading Schedule..." : "View Schedule"}
              </Button>
            </Center>

            {/* Enhanced Current Selection Info */}
            {currentSelectionInfo && (
              <Paper
                radius="lg"
                p="lg"
                className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 border border-blue-200/50 backdrop-blur-sm"
              >
                <Group justify="center" gap="md">
                  <Text fw={600} c="dimmed">Currently viewing:</Text>
                  <Badge
                    variant="gradient"
                    gradient={{ from: 'green', to: 'teal' }}
                    size="lg"
                    leftSection={<IconBuilding size={14} />}
                  >
                    {currentSelectionInfo.departmentName}
                  </Badge>
                  <Badge
                    variant="gradient"
                    gradient={{ from: 'blue', to: 'cyan' }}
                    size="lg"
                    leftSection={<IconUsers size={14} />}
                  >
                    {currentSelectionInfo.batch}
                  </Badge>
                  <Badge
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'purple' }}
                    size="lg"
                    leftSection={<IconBook size={14} />}
                  >
                    {currentSelectionInfo.semester} Semester
                  </Badge>
                  <Badge
                    variant="gradient"
                    gradient={{ from: 'orange', to: 'red' }}
                    size="lg"
                    leftSection={<IconSchool size={14} />}
                  >
                    {currentSelectionInfo.section}
                  </Badge>
                </Group>
                
                {/* Schedule Statistics */}
                {schedules.length > 0 && (
                  <Group justify="center" mt="md" gap="xl">
                    <Badge variant="light" color="blue" size="sm">
                      {scheduleStats.totalClasses} Classes
                    </Badge>
                    <Badge variant="light" color="green" size="sm">
                      {scheduleStats.totalInstructors} Instructors
                    </Badge>
                    <Badge variant="light" color="violet" size="sm">
                      {scheduleStats.totalCourses} Courses
                    </Badge>
                    <Badge variant="light" color="orange" size="sm">
                      {scheduleStats.totalRooms} Rooms
                    </Badge>
                  </Group>
                )}
              </Paper>
            )}
          </Stack>

          {/* Enhanced Content Section */}
          <Box mt="xl">
            {error && (
              <Alert
                color="red"
                title="Error Loading Schedule"
                icon={<IconAlertCircle size={20} />}
                mb="lg"
                radius="lg"
                variant="light"
                withCloseButton
                onClose={() => dispatch(clearError())}
              >
                {error}
              </Alert>
            )}

            {!hasSelection ? (
              <Center py={80}>
                <Stack align="center" gap="lg">
                  <ThemeIcon
                    size={120}
                    color="blue"
                    variant="light"
                    radius="xl"
                  >
                    <IconCalendar size={48} />
                  </ThemeIcon>
                  <Stack gap="xs" align="center">
                    <Title order={3} c="gray.7">
                      Select Your Preferences
                    </Title>
                    <Text c="dimmed" ta="center" size="lg">
                      Choose department, batch, semester, and section to view your personalized schedule
                    </Text>
                  </Stack>
                </Stack>
              </Center>
            ) : loading ? (
              <Center py={80}>
                <Stack align="center" gap="lg">
                  <Loader size="xl" color="blue" />
                  <Stack gap="xs" align="center">
                    <Text fw={600} size="lg">Loading schedules...</Text>
                    <Text c="dimmed">Fetching your timetable data</Text>
                  </Stack>
                </Stack>
              </Center>
            ) : isEmptySchedule ? (
              <Center py={80}>
                <Stack align="center" gap="lg">
                  <ThemeIcon
                    size={120}
                    color="gray"
                    variant="light"
                    radius="xl"
                  >
                    <IconCalendar size={48} />
                  </ThemeIcon>
                  <Stack gap="xs" align="center">
                    <Title order={3} c="gray.7">
                      No Schedule Found
                    </Title>
                    <Text c="dimmed" ta="center" size="lg">
                      No classes scheduled for the selected criteria
                    </Text>
                  </Stack>
                </Stack>
              </Center>
            ) : (
              <Paper
                radius="lg"
                p="md"
                className="border border-gray-200/40 shadow-lg"
              >
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100/80">
                        <th className="border border-gray-200/60 px-6 py-4 text-left font-bold text-gray-700">
                          <Group gap="xs">
                            <IconClock size={18} />
                            Time
                          </Group>
                        </th>
                        {days.map(day => (
                          <th
                            key={day}
                            className={`border border-gray-200/60 px-4 py-4 text-center font-bold text-gray-700 bg-${getDayColor(day)}-50`}
                          >
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((timeSlot, index) => (
                        <tr
                          key={timeSlot.slot}
                          className={`border-b border-gray-200/50 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                          } hover:bg-blue-50/50 transition-colors duration-200`}
                        >
                          <td className="border border-gray-200/60 px-6 py-4 font-semibold bg-gray-50">
                            <Stack gap="xs" align="center">
                              <Text fw={700} size="sm">
                                {timeSlot.formattedStartTime}
                              </Text>
                              <Text size="xs" c="dimmed">to</Text>
                              <Text fw={700} size="sm">
                                {timeSlot.formattedEndTime}
                              </Text>
                              <Badge
                                size="sm"
                                color={timeSlot.isMorning ? "blue" : "orange"}
                                variant="light"
                              >
                                {timeSlot.isMorning ? "Morning" : "Afternoon"}
                              </Badge>
                            </Stack>
                          </td>
                          {days.map(day => {
                            const schedule = getScheduleForTimeSlot(day, timeSlot.slot);
                            return (
                              <td key={day} className="border border-gray-200/60 px-3 py-3">
                                {schedule ? (
                                  <Card
                                    padding="md"
                                    radius="md"
                                    className={`border-l-4 border-${getDayColor(day)}-500 bg-${getDayColor(day)}-50/30 hover:shadow-md transition-all duration-300`}
                                  >
                                    <Stack gap="xs">
                                      <Text fw={700} size="sm" lineClamp={2}> 
                                        {schedule.course_code} - {schedule.course_name}
                                      </Text>
                                      <Group gap="xs">
                                        <IconUser size={10} />
                                        <Text size="sm" c="dimmed">
                                          {schedule.instructor_name}
                                        </Text>
                                      </Group>
                                      <Group gap="xs">
                                        <IconMapPin size={10} />
                                        <Badge
                                          size="sm"
                                          variant="light"
                                          color="gray"
                                        >
                                          {schedule.room}
                                        </Badge>
                                      </Group>
                                    </Stack>
                                  </Card>
                                ) : (
                                  <Center h={120}>
                                    <Text c="dimmed" size="sm" fw={500}>
                                      Free Period
                                    </Text>
                                  </Center>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Lunch Break Banner */}
                <Paper
                  mt="md"
                  p="lg"
                  className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200"
                  radius="lg"
                >
                  <Group justify="center" gap="lg">
                    <IconCoffee size={24} className="text-orange-500" />
                    <Stack gap={0} align="center">
                      <Text fw={700} size="lg" c="orange.7">
                        Lunch Break
                      </Text>
                      <Text size="sm" c="orange.6">
                        12:00 PM - 1:00 PM • Time to recharge and refresh
                      </Text>
                    </Stack>
                    <IconCoffee size={24} className="text-orange-500" />
                  </Group>
                </Paper>
              </Paper>
            )}
          </Box>
        </Card>

      
      </Container>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
      <Footer />
    </div>
  );
};

export default BatchSemesterSelector;