/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Container,
  Card,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Stack,
  Grid,
  Loader,
  Badge,
  Paper,
  ThemeIcon,
  Center,
  Box,
  Avatar,
  ScrollArea,
  Tooltip,
  Modal,
  Select,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconCalendar,
  IconUser,
  IconSearch,
  IconClock,
  IconMapPin,
  IconUsers,
  IconRefresh,
  IconCoffee,
  IconList,
  IconSelector,
} from "@tabler/icons-react";
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

const InstructorScheduleView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    schedules, 
    scheduleLoading, 
     
    scheduleError, 
    instructorInfo 
  } = useInstructor();
  
  const instructors = useInstructorsList();
  const instructorsLoading = useInstructorsLoading();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [statsModalOpened, setStatsModalOpened] = useState(false);
  const [instructorsModalOpened, setInstructorsModalOpened] = useState(false);
  const [searchMode, setSearchMode] = useState<'id' | 'list'>('id');

  const form = useForm({
    initialValues: {
      instructorId: "",
      selectedInstructor: null as string | null,
    },
    validate: {
      instructorId: (value, values) => 
        searchMode === 'id' && value.trim().length === 0 ? "Instructor ID is required" : null,
      selectedInstructor: (value, values) =>
        searchMode === 'list' && !value ? "Please select an instructor" : null,
    },
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const fetchUserSession =useCallback(async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.loggedIn) {
          setCurrentUser(data.user);
          // Auto-fill instructor ID if user is an instructor
          if (data.user.role === 'instructor' && data.user.id_number) {
            form.setFieldValue('instructorId', data.user.id_number);
            setSearchMode('id');
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch user session:', error);
    }
  } ,[]);
  // Fetch current user session and instructors list
  useEffect(() => {
    fetchUserSession();
    dispatch(fetchInstructors());
  }, [dispatch, fetchUserSession]);


 const handleRefreshSchedule = async () => {
    if (currentUser?.id) {
      //await handleAutoFetchSchedule(currentUser.id, currentUser);
    }
  };
  const handleSearch = async (values: { instructorId: string; selectedInstructor: string | null }) => {
    dispatch(clearAllErrors());
    
    const instructorId = searchMode === 'id' 
      ? values.instructorId 
      : values.selectedInstructor;

    if (!instructorId) return;

    dispatch(setCurrentInstructorId(instructorId));
    
    // Set selected instructor for list mode
    if (searchMode === 'list' && values.selectedInstructor) {
      const selected = instructors.find(inst => inst.id_number === values.selectedInstructor || inst.id.toString() === values.selectedInstructor);
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
    form.setFieldValue('selectedInstructor', instructor.id_number || instructor.id.toString());
    setInstructorsModalOpened(false);
    setSearchMode('list');
  };

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

  const getTimeSlots = () => {
    const uniqueSlots = [...new Set(schedules.map(s => s.time_slot))].sort();
    return uniqueSlots.map(slot => {
      const firstSchedule = schedules.find(s => s.time_slot === slot);
      return {
        slot,
        start_time: firstSchedule?.start_time || '',
        end_time: firstSchedule?.end_time || '',
        isMorning: firstSchedule?.start_time ? parseInt(firstSchedule.start_time.split(':')[0]) < 12 : true
      };
    });
  };

  const getScheduleForTimeSlot = (day: string, timeSlot: string) => {
    return schedules.find(schedule => 
      schedule.day === day && schedule.time_slot === timeSlot
    );
  };

  const calculateStats = () => {
    const totalClasses = schedules.length;
    const classesPerDay = days.reduce((acc, day) => {
      acc[day] = schedules.filter(s => s.day === day).length;
      return acc;
    }, {} as any);
    
    const uniqueCourses = [...new Set(schedules.map(s => s.course_name))].length;
    const uniqueBatches = [...new Set(schedules.map(s => s.batch))].length;
    
    return {
      totalClasses,
      classesPerDay,
      uniqueCourses,
      uniqueBatches,
      busiestDay: Object.keys(classesPerDay).reduce((a, b) => 
        classesPerDay[a] > classesPerDay[b] ? a : b
      ),
    };
  };

  const stats = calculateStats();

  if (!currentUser) {
    return (
      <Center className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
        <Card shadow="lg" radius="lg" p="xl" className="text-center">
          <ThemeIcon size={80} color="blue" variant="light" radius="xl" mb="md">
            <IconUser size={40} />
          </ThemeIcon>
          <Title order={2} mb="sm">Authentication Required</Title>
          <Text c="dimmed" mb="lg">Please log in to view instructor schedules</Text>
          <Button component="a" href="/login" size="lg">
            Go to Login
          </Button>
        </Card>
      </Center>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
      <Container size="xl" className="py-8">
        {/* Header Section */}
        <Stack align="center" gap="md" mb={40}>
          <div className="relative">
            <ThemeIcon
              size={100}
              radius="xl"
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
              className="shadow-lg animate-pulse-slow"
            >
              <IconUser size={48} />
            </ThemeIcon>
            <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
          </div>
          
          <Stack gap="xs" align="center">
            <Title
              order={1}
              className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent text-center"
            >
              Instructor Schedule
            </Title>
            <Text c="dimmed" size="xl" ta="center" fw={500}>
              View teaching schedules and class timetables
            </Text>
          </Stack>
        </Stack>

        {/* Main Card */}
        <Card
          shadow="xl"
          radius="xl"
          padding="xl"
          className="bg-white/90 backdrop-blur-lg border border-white/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-transparent pointer-events-none"></div>

          {/* Search Section */}
          <Stack gap="xl">
            <Card withBorder radius="lg" className="bg-white/80">
              <form onSubmit={form.onSubmit(handleSearch)}>
                <Stack gap="md">
                  {/* Search Mode Toggle */}
                  <Group justify="center">
                    <Button.Group>
                      <Button
                        variant={searchMode === 'id' ? 'filled' : 'outline'}
                        color="blue"
                        onClick={() => setSearchMode('id')}
                        leftSection={<IconSearch size={16} />}
                      >
                        Search by ID
                      </Button>
                      <Button
                        variant={searchMode === 'list' ? 'filled' : 'outline'}
                        color="violet"
                        onClick={() => setSearchMode('list')}
                        leftSection={<IconList size={16} />}
                      >
                        Select from List
                      </Button>
                    </Button.Group>
                  </Group>

                  <Grid gutter="lg" align="end">
                    <Grid.Col span={{ base: 12, md: 8 }}>
                      {searchMode === 'id' ? (
                        <TextInput
                          label={
                            <Group gap="xs">
                              <ThemeIcon size="sm" color="blue" variant="light">
                                <IconUser size={16} />
                              </ThemeIcon>
                              <Text fw={600}>Instructor ID</Text>
                            </Group>
                          }
                          placeholder="Enter instructor ID number..."
                          {...form.getInputProps('instructorId')}
                          size="md"
                          radius="lg"
                        />
                      ) : (
                        <Group gap="xs" align="end">
                          <Select
                            label={
                              <Group gap="xs">
                                <ThemeIcon size="sm" color="violet" variant="light">
                                  <IconList size={16} />
                                </ThemeIcon>
                                <Text fw={600}>Select Instructor</Text>
                              </Group>
                            }
                            placeholder="Choose an instructor..."
                            data={instructors.map(inst => ({
                              value: inst.id_number || inst.id.toString(),
                              label: `${inst.full_name} ${inst.id_number ? `(${inst.id_number})` : ''}`,
                            }))}
                            {...form.getInputProps('selectedInstructor')}
                            size="md"
                            radius="lg"
                            style={{ flex: 1 }}
                          />
                          <Tooltip label="View All Instructors">
                            <ActionIcon
                              variant="light"
                              color="violet"
                              size="lg"
                              onClick={() => setInstructorsModalOpened(true)}
                            >
                              <IconSelector size={20} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      )}
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <Button
                        type="submit"
                        leftSection={<IconSearch size={20} />}
                        size="md"
                        radius="lg"
                        loading={scheduleLoading}
                        disabled={
                          searchMode === 'id' 
                            ? !form.values.instructorId.trim()
                            : !form.values.selectedInstructor
                        }
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg transform transition-all duration-300 hover:scale-105 w-full"
                      >
                        {scheduleLoading ? "Searching..." : "View Schedule"}
                      </Button>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </form>
            </Card>

            {/* Rest of the component remains the same as before */}
            {/* Instructor Info, Schedule Table, etc. */}
            {/* ... (include all the previous JSX for instructor info and schedule table) */}
              {/* Schedule Content */}
            <Box mt="xl">
              {scheduleLoading ? (
                <Center py={80}>
                  <Stack align="center" gap="lg">
                    <Loader size="xl" color="blue" />
                    <Stack gap="xs" align="center">
                      <Text fw={600} size="lg">Loading your schedule...</Text>
                      <Text c="dimmed">Fetching your teaching timetable</Text>
                    </Stack>
                  </Stack>
                </Center>
              ) : schedules.length === 0 ? (
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
                        No Classes Scheduled
                      </Title>
                      <Text c="dimmed" ta="center" size="lg">
                        You don&apos;t have any classes scheduled for this period.
                      </Text>
                      <Button 
                        variant="light" 
                        leftSection={<IconRefresh size={16} />}
                        onClick={handleRefreshSchedule}
                      >
                        Refresh
                      </Button>
                    </Stack>
                  </Stack>
                </Center>
              ) : (
                <Paper
                  radius="lg"
                  p="md"
                  className="border border-gray-200/40 shadow-lg"
                >
                  <ScrollArea>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-gradient-to-r from-gray-50 to-cyan-100/50">
                            <th className="border border-gray-200/60 px-6 py-4 text-left font-bold text-gray-700 sticky left-0 bg-cyan-50/80 backdrop-blur-sm">
                              <Group gap="xs">
                                <IconClock size={18} />
                                <Text>Time</Text>
                              </Group>
                            </th>
                            {days.map(day => (
                              <th
                                key={day}
                                className={`border border-gray-200/60 px-4 py-4 text-center font-bold text-gray-700 bg-${getDayColor(day)}-50/80 backdrop-blur-sm`}
                              >
                                <Stack gap={4} align="center">
                                  <Text>{day}</Text>
                                  <Badge
                                    size="sm"
                                    color={getDayColor(day)}
                                    variant="light"
                                  >
                                    {stats.classesPerDay[day] || 0} classes
                                  </Badge>
                                </Stack>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {getTimeSlots().map((timeSlot, index) => (
                            <tr
                              key={timeSlot.slot}
                              className={`border-b border-gray-200/50 ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                              } hover:bg-cyan-50/30 transition-colors duration-200`}
                            >
                              <td className="border border-gray-200/60 px-6 py-4 font-semibold bg-cyan-50/50 sticky left-0 backdrop-blur-sm">
                                <Stack gap="xs" align="center">
                                  <Text fw={700} size="sm">
                                    {timeSlot.start_time}
                                  </Text>
                                  <Text size="xs" c="dimmed">to</Text>
                                  <Text fw={700} size="sm">
                                    {timeSlot.end_time}
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
                                        className={`border-l-4 border-${getDayColor(day)}-500 bg-${getDayColor(day)}-50/30 hover:shadow-md transition-all duration-300 cursor-pointer`}
                                      >
                                        <Stack gap="xs">
                                          <Badge
                                            color={getDayColor(day)}
                                            variant="light"
                                            size="xs"
                                          >
                                            {schedule.course_code}
                                          </Badge>
                                          <Text fw={700} size="sm" lineClamp={2}>
                                            {schedule.course_name}
                                          </Text>
                                          <Group gap="xs">
                                            <IconUsers size={0} />
                                            <Text size="sm" c="dimmed">
                                              {schedule.batch} - {schedule.semester} semester
                                            </Text>
                                          </Group>
                                          <Group gap="xs">
                                            <IconMapPin size={0} />
                                            <Badge
                                              size="sm"
                                              variant="light"
                                              color="gray"
                                            >
                                              {schedule.room}
                                            </Badge>
                                          </Group>
                                          <Group gap="xs">
                                            <Text size="xs" c="dimmed">
                                               {schedule.section !== "1" ? `Sec schedule.section` : ""}
                                            </Text>
                                          </Group>
                                        </Stack>
                                      </Card>
                                    ) : (
                                      <Center h={140}>
                                        <Text c="dimmed" size="sm" fw={500}>
                                          No Class
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
                  </ScrollArea>

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
                          12:00 PM - 1:00 PM • Time to recharge
                        </Text>
                      </Stack>
                      <IconCoffee size={24} className="text-orange-500" />
                    </Group>
                  </Paper>
                </Paper>
              )}
            </Box>
          </Stack>
        </Card>
      </Container>

      {/* Instructors List Modal */}
      <Modal
        opened={instructorsModalOpened}
        onClose={() => setInstructorsModalOpened(false)}
        title={
          <Group gap="xs">
            <IconList size={20} />
            <Text fw={600}>All Instructors</Text>
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
            instructors.map((instructor) => (
              <Card
                key={instructor.id}
                withBorder
                padding="md"
                radius="md"
                className="hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleInstructorSelect(instructor)}
              >
                <Group justify="space-between">
                  <Group gap="md">
                    <Avatar color="blue" radius="xl">
                      <IconUser size={20} />
                    </Avatar>
                    <Stack gap={2}>
                      <Text fw={600}>{instructor.full_name}</Text>
                      <Group gap="xs">
                        {instructor.id_number && (
                          <Badge variant="light" color="blue" size="sm">
                            ID: {instructor.id_number}
                          </Badge>
                        )}
                        {instructor.email && (
                          <Text size="sm" c="dimmed">
                            {instructor.email}
                          </Text>
                        )}
                      </Group>
                    </Stack>
                  </Group>
                  <Button variant="light" size="sm">
                    Select
                  </Button>
                </Group>
              </Card>
            ))
          )}
        </Stack>
      </Modal>

      {/* Statistics Modal */}
      {/* ... (include the previous stats modal JSX) */}
    </div>
  );
};

export default InstructorScheduleView;