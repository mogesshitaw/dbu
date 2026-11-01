/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Container, Card, Title, Text,
  TextInput, Button, Group, Stack,
  Grid, Loader, Badge, Paper,
  ThemeIcon, Center, Avatar,
  ScrollArea, Modal, Select,
  ActionIcon, SegmentedControl, Tabs,
  SimpleGrid, Divider,
  RingProgress
  } from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconCalendar,
  IconSearch,
  IconClock,
  IconUsers,
  IconCoffee,
  IconList,
  IconCalendarStats,
  IconCalendarTime,
  IconLayoutGrid,
  IconLayoutList,
  IconChartBar,
  IconSchool,
  IconBuilding,
  IconRefresh,
  IconEye,
  IconDownload,
  IconFilter,
  IconSortAscending} from "@tabler/icons-react";
import { useAppDispatch } from "@/hooks/redux";
import { 
  useInstructor, 
  useInstructorsList,
  useInstructorsLoading 
} from "@/hooks/redux";
import {
  fetchInstructorSchedule,
  fetchInstructorInfo,
  fetchInstructors,
  setCurrentInstructorId,
  setSelectedInstructor,
  clearAllErrors,
} from "@/store/slices/instructorsSlice";
import { Authentication , Found } from "@/app/auth/auth";

const InstructorScheduleView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { schedules, scheduleLoading } = useInstructor();
  const instructors = useInstructorsList();
  const instructorsLoading = useInstructorsLoading();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [instructorsModalOpened, setInstructorsModalOpened] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [statsModalOpened, setStatsModalOpened] = useState(false);

  
  const form = useForm({
    initialValues: {
      instructorId: "",
      selectedInstructor: null as string | null,
    },
    
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    dispatch(fetchInstructors());
  }, [dispatch]);

  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setCurrentUser(foundUser);
    };
    checkAuth();
  }, []);

  const handleSearch = async (values: { instructorId: string; selectedInstructor: string | null }) => {
    dispatch(clearAllErrors());
    const instructorId = values.instructorId || values.selectedInstructor;
    if (!instructorId) return;
    
    dispatch(setCurrentInstructorId(instructorId));
    
    if (values.selectedInstructor) {
      const selected = instructors.find(inst => inst.id.toString() === values.selectedInstructor);
      if (selected) {
        dispatch(setSelectedInstructor(selected));
      }
    }

    try {
      await Promise.all([
        dispatch(fetchInstructorSchedule(instructorId)),
        dispatch(fetchInstructorInfo(instructorId)),
      ]);
    } catch (error) {
      console.error('Failed to fetch instructor data:', error);
    }
  };

  const handleInstructorSelect = (instructor: any) => {
    form.setFieldValue('instructorId', instructor.id_number || instructor.id.toString());
    form.setFieldValue('selectedInstructor', instructor.id.toString());
    setInstructorsModalOpened(false);
  };

  const calculateStats = () => {
    const totalClasses = schedules.length;
    const classesPerDay = days.reduce((acc, day) => {
      acc[day] = schedules.filter(s => s.day_of_week === day).length;
      return acc;
    }, {} as any);
    
    const uniqueCourses = [...new Set(schedules.map(s => s.course_name))];
    const uniqueBatches = [...new Set(schedules.map(s => s.batch))];
    const uniqueRooms = [...new Set(schedules.map(s => s.room))];
    
    const busiestDay = Object.keys(classesPerDay).reduce((a, b) => 
      classesPerDay[a] > classesPerDay[b] ? a : b, "Monday"
    );
    
    const totalHours = schedules.reduce((total, schedule) => {
      const start = parseInt(schedule.start_time.split(':')[0]);
      const end = parseInt(schedule.end_time.split(':')[0]);
      return total + (end - start);
    }, 0);

    return {
      totalClasses,
      classesPerDay,
      uniqueCourses,
      uniqueBatches,
      uniqueRooms,
      busiestDay,
      totalHours,
      teachingLoad: ((totalClasses / 30) * 100).toFixed(1) + '%',
    };
  };

  const stats = calculateStats();

  const getDayColor = (day: string) => {
    const colors: { [key: string]: string } = {
      Monday: "blue",
      Tuesday: "teal", 
      Wednesday: "violet",
      Thursday: "orange",
      Friday: "red",
      Saturday: "indigo",
    };
    return colors[day] || "gray";
  };

 const GridView = () => {
  // Sort days in correct order
  const sortedDays = [...days]; // Create a copy of days array
  
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
      {sortedDays.map(day => {
        // Create a copy of schedules before filtering with different property names
        const daySchedules = [...schedules].filter(s => {
          const scheduleDay = s.day_of_week || s.day ;
          return scheduleDay === day;
        });
        
        return (
          <Card
            key={day}
            shadow="sm"
            padding="lg"
            radius="lg"
            className={`border-l-4 border-${getDayColor(day)}-500 hover:shadow-xl transition-all duration-300`}
          >
            <Stack gap="md">
              <Group justify="space-between">
                <Badge
                  size="xl"
                  radius="sm"
                  color={getDayColor(day)}
                  variant="filled"
                  leftSection={<IconCalendar size={14} />}
                >
                  {day}
                </Badge>
                <Badge color="gray" variant="light">
                  {daySchedules.length} classes
                </Badge>
              </Group>
              
              <Divider />
              
              {daySchedules.length === 0 ? (
                <Center h={100}>
                  <Stack gap="xs" align="center">
                    <IconCalendar size={32} className="text-gray-300" />
                    <Text c="dimmed" size="sm">No classes scheduled</Text>
                  </Stack>
                </Center>
              ) : (
                <Stack gap="sm">
                  {daySchedules.map((schedule, index) => {
                    const scheduleDay = schedule.day_of_week || schedule.day  || day;
                    
                    return (
                      <Paper
                        key={index}
                        p="md"
                        radius="md"
                        className="border border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white hover:from-blue-50/30 transition-all"
                      >
                        <Stack gap="xs">
                          <Group justify="apart">
                            <Badge
                              color={getDayColor(scheduleDay)}
                              variant="light"
                              size="sm"
                            >
                              {(schedule.start_time || '')} - {(schedule.end_time || '')}
                            </Badge>
                            <Badge color="blue" variant="light" size="xs">
                              {schedule.course_code || ''}
                            </Badge>
                          </Group>
                          
                          <Text fw={600} size="sm" lineClamp={1}>
                            {schedule.course_name || ''}
                          </Text>
                          
                          <Group gap="xs" wrap="nowrap">
                            <IconSchool size={14} className="text-gray-500" />
                            <Text size="xs" c="dimmed">
                              {(schedule.batch || '')} • {(schedule.semester || '')}
                            </Text>
                          </Group>
                          
                          <Group gap="xs" wrap="nowrap">
                            <IconBuilding size={14} className="text-gray-500" />
                            <Text size="xs" c="dimmed">
                              {schedule.room ||''}
                            </Text>
                          </Group>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          </Card>
        );
      })}
    </SimpleGrid>
  );
};;

const ListView = () => {
  // Create a copy of schedules array before sorting
  const sortedSchedules = [...schedules].sort((a, b) => {
    // Debug: log schedule structure
    console.log("Schedule object keys:", Object.keys(a));
    console.log("Schedule object:", a);
    
    // Try different possible day property names
    const dayA = a.day_of_week || a.day || a.day_name || '';
    const dayB = b.day_of_week || b.day || b.day_name || '';
    
    const dayIndexA = days.indexOf(dayA);
    const dayIndexB = days.indexOf(dayB);
    
    // If same day, sort by time
    if (dayIndexA === dayIndexB) {
      return (a.start_time || '').localeCompare(b.start_time || '');
    }
    
    return dayIndexA - dayIndexB;
  });
  
  // Also debug the first schedule
  if (sortedSchedules.length > 0) {
    console.log("First schedule properties:", Object.keys(sortedSchedules[0]));
    console.log("First schedule values:", sortedSchedules[0]);
  }
  
  return (
    <Stack gap="md">
      {sortedSchedules.map((schedule, index) => {
        // Get the day using possible property names
        const day = schedule.day_of_week || schedule.day || schedule.day_name || 'Unknown';
        
        return (
          <Card
            key={index}
            shadow="xs"
            padding="lg"
            radius="lg"
            className="hover:shadow-md transition-all"
          >
            <Grid gutter="md" align="center">
              <Grid.Col span={{ base: 12, md: 2 }}>
                <Badge
                  size="lg"
                  color={getDayColor(day)}
                  variant="light"
                  fullWidth
                >
                  {day}
                </Badge>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 2 }}>
                <Badge
                  color="blue"
                  variant="filled"
                  size="lg"
                  leftSection={<IconClock size={14} />}
                  fullWidth
                >
                  {(schedule.start_time || '')} - {(schedule.end_time || '')}
                </Badge>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Stack gap={4}>
                  <Text fw={600}>{schedule.course_name || schedule.course}</Text>
                  <Text size="sm" c="dimmed">{schedule.course_code || ''}</Text>
                </Stack>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 2 }}>
                <Stack gap={4}>
                  <Group gap="xs">
                    <IconSchool size={14} className="text-gray-500" />
                    <Text size="sm">{schedule.batch || ''}</Text>
                  </Group>
                  <Text size="xs" c="dimmed">Sem {schedule.semester || ''}</Text>
                </Stack>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 2 }}>
                <Badge
                  color="teal"
                  variant="light"
                  size="md"
                  leftSection={<IconBuilding size={12} />}
                  fullWidth
                >
                  {schedule.room ||  ''}
                </Badge>
              </Grid.Col>
            </Grid>
          </Card>
        );
      })}
    </Stack>
  );
};
  const CalendarView = () => {
    const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 6 PM
    
    // Create a copy of schedules for filtering
    const schedulesCopy = [...schedules];
    
    return (
      <Card shadow="sm" padding="lg" radius="lg" withBorder>
        <ScrollArea>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <th className="border border-gray-200 px-6 py-4 text-left font-bold text-gray-700 sticky left-0 bg-white">
                    <Group gap="xs">
                      <IconClock size={18} />
                      <Text>Time</Text>
                    </Group>
                  </th>
                  {days.map(day => (
                    <th
                      key={day}
                      className="border border-gray-200 px-4 py-4 text-center font-bold text-gray-700"
                    >
                      <Stack gap={4} align="center">
                        <Text>{day}</Text>
                        <Badge
                          size="sm"
                          color={getDayColor(day)}
                          variant="light"
                        >
                          {stats.classesPerDay[day] || 0}
                        </Badge>
                      </Stack>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map(hour => (
                  <tr key={hour} className="border-b border-gray-200">
                    <td className="border border-gray-200 px-6 py-4 font-semibold bg-gray-50 sticky left-0">
                      <Center>
                        <Badge color="blue" variant="light">
                          {hour}:00 - {hour + 1}:00
                        </Badge>
                      </Center>
                    </td>
                    {days.map(day => {
                      const schedule = schedulesCopy.find(s => 
                        s.day_of_week === day && 
                        parseInt(s.start_time.split(':')[0]) === hour
                      );
                      return (
                        <td key={day} className="border border-gray-200 px-3 py-3">
                          {schedule ? (
                            <Card
                              padding="sm"
                              radius="md"
                              className={`bg-gradient-to-br from-${getDayColor(day)}-50 to-white border-l-4 border-${getDayColor(day)}-500`}
                            >
                              <Stack gap={2}>
                                <Text fw={700} size="xs" lineClamp={1}>
                                  {schedule.course_code}
                                </Text>
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {schedule.course_name}
                                </Text>
                                <Group gap={4}>
                                  <IconBuilding size={10} className="text-gray-500" />
                                  <Text size="xs">{schedule.room}</Text>
                                </Group>
                              </Stack>
                            </Card>
                          ) : hour === 12 ? (
                            <Center h="100%">
                              <Badge color="orange" variant="light" size="sm">
                                <Group gap={4}>
                                  <IconCoffee size={12} />
                                  <Text>Lunch</Text>
                                </Group>
                              </Badge>
                            </Center>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>
      </Card>
    );
  };

  if (currentUser === null) {
    return <Authentication />;
  }
const viewOptions = [
  { label: 'Grid', value: 'grid' as const, icon: <IconLayoutGrid size={16} /> },
  { label: 'List', value: 'list' as const, icon: <IconLayoutList size={16} /> },
  { label: 'Calendar', value: 'calendar' as const, icon: <IconCalendarTime size={16} /> },
];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
      <Container size="xl" className="py-8">
        {/* Header with Gradient */}
        <Card
          radius="xl"
          className="mb-8 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 shadow-xl"
        >
          <Stack align="center" gap="md" py={40}>
            <div className="relative">
              <ThemeIcon
                size={120}
                radius="xl"
                variant="white"
                className="shadow-2xl"
              >
                <IconCalendarStats size={48} className="text-blue-600" />
              </ThemeIcon>
              <div className="absolute -inset-4 bg-white/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            
            <Stack gap="xs" align="center">
              <Title
                order={1}
                className="text-4xl md:text-5xl font-black text-white text-center"
              >
                Instructor Schedule Dashboard
              </Title>
              <Text c="white" size="xl" ta="center" fw={500}>
                Track teaching hours and manage your academic timetable
              </Text>
            </Stack>
          </Stack>
        </Card>

        {/* Main Dashboard */}
        <Grid gutter="lg">
          {/* Left Sidebar */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <Stack gap="lg">
              {/* Search Card */}
              <Card shadow="sm" radius="lg" padding="lg" withBorder>
                <form onSubmit={form.onSubmit(handleSearch)}>
                  <Stack gap="md">
                    <Title order={3} className="text-blue-800">
                      Find Instructor
                    </Title>
                    
                    <TextInput
                      label="Instructor ID or Name"
                      placeholder="Enter ID or search by name..."
                      leftSection={<IconSearch size={16} />}
                      {...form.getInputProps('instructorId')}
                      radius="md"
                    />
                    
                    <Select
                      label="Or select from list"
                      placeholder="Choose instructor..."
                      leftSection={<IconList size={16} />}
                      data={instructors.map(inst => ({
                        value: inst.id.toString(),
                        label: `${inst.full_name} (${inst.id_number || 'No ID'})`,
                      }))}
                      {...form.getInputProps('selectedInstructor')}
                      radius="md"
                      searchable
                    />
                    
                    <Button
                      type="submit"
                      leftSection={<IconSearch size={20} />}
                      loading={scheduleLoading}
                      fullWidth
                      radius="md"
                      className="bg-gradient-to-r from-blue-500 to-cyan-500"
                    >
                      View Schedule
                    </Button>
                    
                    <Button
                      variant="light"
                      leftSection={<IconList size={20} />}
                      onClick={() => setInstructorsModalOpened(true)}
                      fullWidth
                      radius="md"
                    >
                      Browse All Instructors
                    </Button>
                  </Stack>
                </form>
              </Card>

              {/* Quick Stats */}
              {schedules.length > 0 && (
                <Card shadow="sm" radius="lg" padding="lg" withBorder>
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Title order={4} className="text-blue-800">
                        Quick Stats
                      </Title>
                      <ActionIcon
                        variant="light"
                        color="blue"
                        onClick={() => setStatsModalOpened(true)}
                      >
                        <IconChartBar size={18} />
                      </ActionIcon>
                    </Group>
                    
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text size="sm">Total Classes</Text>
                        <Badge color="blue" size="lg">{stats.totalClasses}</Badge>
                      </Group>
                      
                      <Group justify="space-between">
                        <Text size="sm">Teaching Hours</Text>
                        <Badge color="teal" size="lg">{stats.totalHours}h</Badge>
                      </Group>
                      
                      <Group justify="space-between">
                        <Text size="sm">Courses</Text>
                        <Badge color="violet" size="lg">{stats.uniqueCourses.length}</Badge>
                      </Group>
                      
                      <Group justify="space-between">
                        <Text size="sm">Busiest Day</Text>
                        <Badge color="orange" size="lg">{stats.busiestDay}</Badge>
                      </Group>
                    </Stack>
                    
                    <Divider />
                    
                    <Button
                      variant="light"
                      leftSection={<IconDownload size={18} />}
                      fullWidth
                      radius="md"
                    >
                      Export Schedule
                    </Button>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Grid.Col>

          {/* Main Content */}
          <Grid.Col span={{ base: 12, md: 9 }}>
            <Stack gap="lg">
              {/* View Controls */}
              {schedules.length > 0 && (
                <Card shadow="sm" radius="lg" padding="md" withBorder>
                  <Group justify="space-between">
                    <Group>
                    <SegmentedControl
                                      value={viewMode}
                                      onChange={(value) => setViewMode(value as 'grid' | 'list' | 'calendar')}
                                      data={viewOptions}
                                      radius="lg"
                                    />
                    </Group>
                    
                    <Group>
                      <ActionIcon variant="light" color="blue" radius="md">
                        <IconFilter size={18} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="blue" radius="md">
                        <IconSortAscending size={18} />
                      </ActionIcon>
                      <ActionIcon variant="light" color="blue" radius="md">
                        <IconRefresh size={18} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Card>
              )}

              {/* Schedule Content */}
              {scheduleLoading ? (
                <Center py={80}>
                  <Stack align="center" gap="lg">
                    <Loader size="xl" color="blue" />
                    <Stack gap="xs" align="center">
                      <Text fw={600} size="lg">Loading schedule...</Text>
                      <Text c="dimmed">Fetching teaching timetable</Text>
                    </Stack>
                  </Stack>
                </Center>
              ) : schedules.length === 0 ? (
                <Card
                  shadow="sm"
                  radius="lg"
                  className="border-dashed border-2 border-gray-300"
                >
                  <Center py={60}>
                    <Stack align="center" gap="lg">
                      <ThemeIcon size={80} color="gray" variant="light" radius="xl">
                        <IconCalendar size={40} />
                      </ThemeIcon>
                      <Stack gap="xs" align="center">
                        <Title order={3} c="gray.7">
                          No Schedule Found
                        </Title>
                        <Text c="dimmed" ta="center">
                          Search for an instructor to view their teaching schedule
                        </Text>
                      </Stack>
                    </Stack>
                  </Center>
                </Card>
              ) : (
                <>
                  {/* View Toggle */}
                  <Tabs defaultValue="grid" value={viewMode} onChange={(value) => setViewMode(value as 'grid' | 'list' | 'calendar')} >
                    <Tabs.Panel value="grid">
                      <GridView />
                    </Tabs.Panel>
                    
                    <Tabs.Panel value="list">
                      <ListView />
                    </Tabs.Panel>
                    
                    <Tabs.Panel value="calendar">
                      <CalendarView />
                    </Tabs.Panel>
                  </Tabs>
                </>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>

      {/* Instructors Modal */}
      <Modal
        opened={instructorsModalOpened}
        onClose={() => setInstructorsModalOpened(false)}
        title={
          <Group gap="xs">
            <IconUsers size={20} />
            <Text fw={600}>Instructors Directory</Text>
          </Group>
        }
        size="lg"
        radius="lg"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="md">
          {instructorsLoading ? (
            <Center py="xl">
              <Loader size="lg" />
            </Center>
          ) : instructors.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed">No instructors found</Text>
            </Center>
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              {instructors.map((instructor) => (
                <Card
                  key={instructor.id}
                  withBorder
                  padding="md"
                  radius="md"
                  className="hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                  onClick={() => handleInstructorSelect(instructor)}
                >
                  <Stack gap="sm">
                    <Group gap="md">
                      <Avatar color="blue" radius="xl" size="lg">
                        {instructor.full_name?.charAt(0) || 'I'}
                      </Avatar>
                      <Stack gap={2}>
                        <Text fw={600} lineClamp={1}>
                          {instructor.full_name}
                        </Text>
                        {instructor.id_number && (
                          <Text size="sm" c="dimmed">
                            ID: {instructor.id_number}
                          </Text>
                        )}
                      </Stack>
                    </Group>
                    
                    {instructor.email && (
                      <Text size="xs" c="blue" lineClamp={1}>
                        {instructor.email}
                      </Text>
                    )}
                    
                    <Button
                      variant="light"
                      size="xs"
                      fullWidth
                      leftSection={<IconEye size={14} />}
                    >
                      View Schedule
                    </Button>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Stack>
      </Modal>

      {/* Statistics Modal */}
      <Modal
        opened={statsModalOpened}
        onClose={() => setStatsModalOpened(false)}
        title={
          <Group gap="xs">
            <IconChartBar size={20} />
            <Text fw={600}>Schedule Analytics</Text>
          </Group>
        }
        size="md"
        radius="lg"
      >
        <Stack gap="lg">
          <SimpleGrid cols={2}>
            <Paper p="md" radius="md" className="bg-blue-50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl">{stats.totalClasses}</Text>
                <Text size="sm" c="dimmed">Total Classes</Text>
              </Stack>
            </Paper>
            
            <Paper p="md" radius="md" className="bg-teal-50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl">{stats.totalHours}h</Text>
                <Text size="sm" c="dimmed">Teaching Hours</Text>
              </Stack>
            </Paper>
            
            <Paper p="md" radius="md" className="bg-violet-50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl">{stats.uniqueCourses.length}</Text>
                <Text size="sm" c="dimmed">Courses</Text>
              </Stack>
            </Paper>
            
            <Paper p="md" radius="md" className="bg-orange-50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl">{stats.uniqueBatches.length}</Text>
                <Text size="sm" c="dimmed">Batches</Text>
              </Stack>
            </Paper>
          </SimpleGrid>
          
          <Divider />
          
          <Stack gap="md">
            <Text fw={600}>Classes per Day</Text>
            {days.map(day => (
              <Group key={day} justify="space-between">
                <Text size="sm">{day}</Text>
                <Badge color={getDayColor(day)} variant="light">
                  {stats.classesPerDay[day] || 0} classes
                </Badge>
              </Group>
            ))}
          </Stack>
          
          <Divider />
          
          <Stack gap="sm">
            <Text fw={600}>Teaching Load Distribution</Text>
            <RingProgress
              size={120}
              thickness={12}
              roundCaps
              label={
                <Text ta="center" fw={700}>
                  {stats.teachingLoad}
                </Text>
              }
              sections={[
                { value: 40, color: 'blue', tooltip: 'Monday-Friday' },
                { value: 30, color: 'teal', tooltip: 'Morning Sessions' },
                { value: 30, color: 'violet', tooltip: 'Afternoon Sessions' },
              ]}
            />
          </Stack>
        </Stack>
      </Modal>
    </div>
  );
};

export default InstructorScheduleView;