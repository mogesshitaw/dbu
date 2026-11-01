/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import {
  IconBook,
  IconCalendar,
  IconBell,
  IconEdit,
  IconDownload,
  IconUserCircle,
  IconChevronRight,
  IconSparkles,
  IconClock,
  IconAlertCircle,
  IconCalendarEvent,
  IconCalendarTime,
  IconCalendarStats,
  IconFileDownload,
  IconUser,
  IconBook2,
  IconBellRinging,
} from "@tabler/icons-react";
import {
  Card,
  Text,
  Group,
  Stack,
  Grid,
  Badge,
  Button,
  Skeleton,
  Container,
  Title,
  Paper,
  Divider,
  Avatar,
  Progress,
  SimpleGrid,
  ThemeIcon,
  Box,
} from "@mantine/core";
import { useShallowEffect } from "@mantine/hooks";

// Redux Imports
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchTodaySchedule,
  fetchInstructorTodaySchedule,
  fetchAnnouncements,
  selectTodaySchedules,
  selectAnnouncements,
  selectScheduleLoading,
  selectInstructorStats,
} from "@/store/slices/dashboardSlice";
import { setActiveSection } from "@/store/slices/uiSlice"; // Import this directly
import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";

// Remove the Props interface - Next.js page components don't accept custom props

const DashboardSection = () => { // Remove Props here
  const dispatch = useAppDispatch();

  // Redux selectors with safe defaults
  const todaySchedules = useAppSelector(selectTodaySchedules);
  const announcements = useAppSelector(selectAnnouncements);
  const scheduleLoading = useAppSelector(selectScheduleLoading);
  const instructorStats = useAppSelector(selectInstructorStats);

  // Fetch today's schedule and announcements on component mount
  useShallowEffect(() => {
    dispatch(fetchInstructorTodaySchedule());
    dispatch(fetchAnnouncements());
  }, [dispatch]);

  const [user, setUser] = useState<any>(null);
  useShallowEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);

  if (user === null) {
    return <Authentication />;
  }

  if (user.role !== "instructor") {
    return <UnauthorizedAccess />;
  }

  // Update this to use Redux dispatch directly
  const handleClick = (section: string) => {
    dispatch(setActiveSection(section)); // Dispatch the action directly
  };

  // Get today's day name
  const getTodayDayName = () => {
    const days = [
      { name: 'Sunday', color: 'indigo' },
      { name: 'Monday', color: 'blue' },
      { name: 'Tuesday', color: 'cyan' },
      { name: 'Wednesday', color: 'teal' },
      { name: 'Thursday', color: 'green' },
      { name: 'Friday', color: 'orange' },
      { name: 'Saturday', color: 'grape' }
    ];
    const today = new Date().getDay();
    return days[today];
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return timeString;
    }
  };

  // Safe array checks
  const safeTodaySchedules = Array.isArray(todaySchedules) ? todaySchedules : [];
  const safeAnnouncements = Array.isArray(announcements)
    ? [...announcements].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];
  const todayInfo = getTodayDayName();
  const upcomingClasses = safeTodaySchedules.filter(s => {
    try {
      return new Date(`1970-01-01T${s.start_time}`) > new Date();
    } catch {
      return false;
    }
  }).length;

  return (
    <Container size="xl" p="md">
      <Stack gap="lg">
        {/* Header */}
        <Paper
          withBorder
          p="xl"
          radius="lg"
          className="bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          <Group justify="space-between" align="center">
            <Stack gap="xs">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="xl" color="white" className="bg-white/20">
                  <IconSparkles size={20} />
                </ThemeIcon>
                <Title order={2} className="text-white">
                  Instructor Dashboard
                </Title>
              </Group>
              <Text className="text-blue-100" component="div">
                Welcome back! Here&apos;s your teaching overview for{" "}
                <Badge color={todayInfo.color} variant="filled" className="ml-2">
                  {todayInfo.name}
                </Badge>
              </Text>
            </Stack>
            <Badge
              size="lg"
              variant="filled"
              color="white"
              className="text-blue-600"
            >
              {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </Badge>
          </Group>
        </Paper>

        {/* Stats Row */}
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Card withBorder radius="md" padding="lg">
            <Group justify="space-between">
              <Stack gap={5}>
                <Text size="sm" color="dimmed">
                  Total Weekly Classes
                </Text>
                <Text size="xl" fw={700}>
                  {instructorStats?.total_classes || 0}
                </Text>
              </Stack>
              <ThemeIcon size="lg" color="blue" variant="light">
                <IconCalendarStats size={20} />
              </ThemeIcon>
            </Group>
          </Card>

          <Card withBorder radius="md" padding="lg">
            <Group justify="space-between">
              <Stack gap={5}>
                <Text size="sm" color="dimmed">
                  Total Courses Assigned
                </Text>
                <Text size="xl" fw={700}>
                  {instructorStats?.unique_courses || 0}
                </Text>
              </Stack>
              <ThemeIcon size="lg" color="teal" variant="light">
                <IconBook2 size={20} />
              </ThemeIcon>
            </Group>
          </Card>
        </SimpleGrid>

        <Grid>
          {/* Today's Schedule */}
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card withBorder radius="md" padding="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <Text fw={600} size="lg">
                    Today&apos;s Schedule
                  </Text>
                  <Badge color={todayInfo.color} variant="light">
                    {todayInfo.name}
                  </Badge>
                </Group>

                <Divider />

                {scheduleLoading ? (
                  <Stack gap="md">
                    {[1, 2, 3].map(i => (
                      <Group key={i}>
                        <Skeleton height={40} circle />
                        <Stack gap="xs" style={{ flex: 1 }}>
                          <Skeleton height={12} width="70%" radius="xl" />
                          <Skeleton height={8} width="40%" radius="xl" />
                        </Stack>
                      </Group>
                    ))}
                  </Stack>
                ) : safeTodaySchedules.length > 0 ? (
                  <Stack gap="xs">
                    {safeTodaySchedules.map((schedule, index) => (
                      <Paper
                        key={index}
                        withBorder
                        p="sm"
                        radius="sm"
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <Group justify="space-between">
                          <Stack gap={2}>
                            <Text fw={500} size="sm">
                              {schedule.course_name}
                            </Text>
                            <Group gap="xs">
                              <IconClock size={12} className="text-gray-400" />
                              <Text size="xs" color="dimmed">
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </Text>
                            </Group>
                          </Stack>
                          <Badge
                            size="sm"
                            variant="light"
                            color={
                              new Date(`1970-01-01T${schedule.start_time}`) > new Date()
                                ? "blue"
                                : "gray"
                            }
                          >
                            {new Date(`1970-01-01T${schedule.start_time}`) > new Date()
                              ? "Upcoming"
                              : "Completed"}
                          </Badge>
                        </Group>
                      </Paper>
                    ))}
                    <Button
                      variant="light"
                      fullWidth
                      onClick={() => handleClick("classSchedule")}
                      rightSection={<IconChevronRight size={14} />}
                    >
                      View Full Schedule
                    </Button>
                  </Stack>
                ) : (
                  <Stack align="center" gap="sm" py="xl">
                    <IconCalendar size={48} className="text-gray-300" />
                    <Text color="dimmed">No classes scheduled</Text>
                    <Text size="sm" color="dimmed">Enjoy your day!</Text>
                  </Stack>
                )}
              </Stack>
            </Card>
          </Grid.Col>

          {/* Announcements */}
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder radius="md" padding="md">
              <Group justify="space-between" mb="md">
                <Text fw={600} size="lg">Recent Announcements</Text>
                <ThemeIcon size="md" color="orange" variant="light">
                  <IconBell size={16} />
                </ThemeIcon>
              </Group>

              <Stack gap="md">
                {safeAnnouncements.length > 0 ? (
                  safeAnnouncements.slice(0, 3).map((announcement: any) => (
                    <Paper key={announcement.id} withBorder p="sm" radius="sm">
                      <Stack gap="xs">
                        <Text fw={500} lineClamp={2}>
                          {announcement.title}
                        </Text>
                        <Text size="sm" color="dimmed" lineClamp={3}>
                          {announcement.message || announcement.content || "No content available"}
                        </Text>
                        <Text size="xs" color="dimmed" mt={4}>
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </Text>
                      </Stack>
                    </Paper>
                  ))
                ) : (
                  <Text size="sm" color="dimmed" ta="center">No announcements</Text>
                )}

                <Button
                  variant="light"
                  color="orange"
                  fullWidth
                  onClick={() => handleClick("notifications")}
                >
                  View All Announcements
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};

export default DashboardSection;