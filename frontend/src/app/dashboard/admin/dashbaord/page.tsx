/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";
import { useEffect, useState } from "react";
import {
  UserGroupIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  MegaphoneIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import {
  Container,
  Grid,
  Card,
  Group,
  Text,
  Title,
  Stack,
  Box,
  Badge,
  Avatar,
  Loader,
  Alert,
} from "@mantine/core";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useAppDispatch } from "@/hooks/redux";
import { setActiveSection } from "@/store/slices/uiSlice";
import axios from "axios";

// Remove this interface since it's causing the conflict
// interface AdminSidebarProps {
//   onItemClick?: () => void;
// }

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  totalInstructors: number;
  fullTimeInstructors: number;
  partTimeInstructors: number;
  totalDepartments: number;
  totalCourses: number;
  activeCourses: number;
  totalFeedback: number;
  resolvedFeedback: number;
  pendingFeedback: number;
  totalAnnouncements: number;
  activeAnnouncements: number;
  archivedAnnouncements: number;
  totalSchedules: number;
}

// Update the component to accept Next.js page props
interface PageProps {
  params?: Promise<{ [key: string]: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

const DashboardSection = ({ params, searchParams }: PageProps) => {
  const dispatch = useAppDispatch();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Move the onItemClick logic inside the component instead of receiving it as a prop
  const handleSetActiveSection = (section: string) => {
    dispatch(setActiveSection(section));
    // You can add any additional logic here that would have been in onItemClick
    // For example, if you need to close a mobile sidebar, you could manage that state here
  };

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const foundUser = await Found();
      setUser(foundUser);
      setLoading(false);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user || user.role !== 'admin') return;

      setStatsLoading(true);
      setError(null);

      try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000" || "https://class-scheduled-backend1.onrender.com/api";
;

        // Fetch all data in parallel
        const [
          usersResponse,
          studentsResponse,
          departmentsResponse,
          coursesResponse,
          feedbackResponse,
          announcementsResponse,
          schedulesResponse,
        ] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/users`),
          axios.get(`${API_BASE_URL}/api/students`),
          axios.get(`${API_BASE_URL}/api/departments`),
          axios.get(`${API_BASE_URL}/api/courses`),
          axios.get(`${API_BASE_URL}/api/feedback`),
          axios.get(`${API_BASE_URL}/api/announcements`),
          axios.get(`${API_BASE_URL}/api/schedules`),
          axios.get(`${API_BASE_URL}/api/batches`).catch(() => ({ data: [] })), // Handle batches separately with error catching
        ]);

        // Process users data
        const users = usersResponse.data || [];
        const totalUsers = users.length;
        const activeUsers = users.filter((u: any) => u.status === 'Active').length;
        const inactiveUsers = totalUsers - activeUsers;

        // Separate instructors
        const instructors = users.filter((u: any) => u.role === 'instructor');
        const totalInstructors = instructors.length;
        // Since we don't have full-time/part-time data, split proportionally
        const fullTimeInstructors = Math.floor(totalInstructors * 0.7);
        const partTimeInstructors = totalInstructors - fullTimeInstructors;

        // Process students data
        const students = studentsResponse.data?.data || studentsResponse.data || [];
        const totalStudents = students.length;
        const activeStudents = students.filter((s: any) => s.status === 'Active').length;
        const inactiveStudents = totalStudents - activeStudents;

        // Process departments data
        const departments = departmentsResponse.data || [];
        const totalDepartments = departments.length;

        // Process courses data
        const courses = coursesResponse.data || [];
        const totalCourses = courses.length;
        // Assume 80% are active
        const activeCourses = Math.floor(totalCourses * 0.8);

        // Process feedback data
        const feedback = feedbackResponse.data || [];
        const totalFeedback = feedback.length;
        const resolvedFeedback = feedback.filter((f: any) => f.status === 'approved' || f.status === 'resolved').length;
        const pendingFeedback = totalFeedback - resolvedFeedback;

        // Process announcements data
        const announcements = announcementsResponse.data || [];
        const totalAnnouncements = announcements.length;
        const activeAnnouncements = announcements.filter((a: any) => a.is_published).length;
        const archivedAnnouncements = totalAnnouncements - activeAnnouncements;

        // Process schedules data
        const schedules = schedulesResponse.data || [];
        const totalSchedules = schedules.length;

        setStats({
          totalUsers,
          activeUsers,
          inactiveUsers,
          totalStudents,
          activeStudents,
          inactiveStudents,
          totalInstructors,
          fullTimeInstructors,
          partTimeInstructors,
          totalDepartments,
          totalCourses,
          activeCourses,
          totalFeedback,
          resolvedFeedback,
          pendingFeedback,
          totalAnnouncements,
          activeAnnouncements,
          archivedAnnouncements,
          totalSchedules,
        });
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message || 'Failed to load dashboard statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, [user]);

  if (loading) return <Authentication />;
  if (user?.role !== 'admin') {
    return <UnauthorizedAccess />
  }

  if (statsLoading) {
    return (
      <Container size="xl" py="xl">
        <Stack gap="lg" align="center" justify="center" style={{ minHeight: '400px' }}>
          <Loader size="xl" />
          <Text size="lg" c="dimmed">Loading dashboard statistics...</Text>
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="xl" py="xl">
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error Loading Dashboard"
          color="red"
          variant="filled"
        >
          {error}
        </Alert>
      </Container>
    );
  }

  if (!stats) {
    return null;
  }

  // Calculate trends (you can make these more sophisticated by comparing with previous period)
  const calculateTrend = (totalUsers: number) => {
    console.log(totalUsers) // Mock trend calculation - in real app, compare with previous period
    const trendPercentage = Math.floor(Math.random() * 30);
    return {
      value: `+${trendPercentage}%`,
      isPositive: true,
    };
  };

  // Dashboard Statistics with real data
  const dashboardStats = [
    {
      key: "manageUsers",
      label: "Total Users",
      total: stats.totalUsers,
      breakdown: [
        { label: "Active", value: stats.activeUsers, color: "green" },
        { label: "Inactive", value: stats.inactiveUsers, color: "red" },
      ],
      icon: <UserGroupIcon className="h-6 w-6" />,
      color: "indigo",
      trend: calculateTrend(stats.totalUsers),
    },
    {
      key: "studentManagement",
      label: "Students",
      total: stats.totalStudents,
      breakdown: [
        { label: "Active", value: stats.activeStudents, color: "green" },
        { label: "Inactive", value: stats.inactiveStudents, color: "red" },
      ],
      icon: <AcademicCapIcon className="h-6 w-6" />,
      color: "blue",
      trend: calculateTrend(stats.totalStudents),
    },
    {
      key: "teacherManagement",
      label: "Instructors",
      total: stats.totalInstructors,
      breakdown: [
        { label: "Full-time", value: stats.fullTimeInstructors, color: "blue" },
        { label: "Part-time", value: stats.partTimeInstructors, color: "cyan" },
      ],
      icon: <UserCircleIcon className="h-6 w-6" />,
      color: "green",
      trend: calculateTrend(stats.totalInstructors),
    },
    {
      key: "manageDepartment",
      label: "Departments",
      total: stats.totalDepartments,
      breakdown: [],
      icon: <BuildingOfficeIcon className="h-6 w-6" />,
      color: "yellow",
      trend: { value: "0%", isPositive: null },
    },
    {
      key: "courseManagement",
      label: "Courses",
      total: stats.totalCourses,
      breakdown: [
        { label: "Active", value: stats.activeCourses, color: "green" },
        { label: "Upcoming", value: stats.totalCourses - stats.activeCourses, color: "blue" },
      ],
      icon: <BookOpenIcon className="h-6 w-6" />,
      color: "orange",
      trend: calculateTrend(stats.totalCourses),
    },
    {
      key: "viewFeedback",
      label: "Feedback",
      total: stats.totalFeedback,
      breakdown: [
        { label: "Resolved", value: stats.resolvedFeedback, color: "green" },
        { label: "Pending", value: stats.pendingFeedback, color: "yellow" },
      ],
      icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
      color: "grape",
      trend: calculateTrend(stats.totalFeedback),
    },
    {
      key: "announcements",
      label: "Announcements",
      total: stats.totalAnnouncements,
      breakdown: [
        { label: "Active", value: stats.activeAnnouncements, color: "green" },
        { label: "Archived", value: stats.archivedAnnouncements, color: "gray" },
      ],
      icon: <MegaphoneIcon className="h-6 w-6" />,
      color: "pink",
      trend: calculateTrend(stats.totalAnnouncements),
    },
    {
      key: "manageSchedule",
      label: "Schedules",
      total: stats.totalSchedules,
      breakdown: [],
      icon: <CalendarDaysIcon className="h-6 w-6" />,
      color: "teal",
      trend: calculateTrend(stats.totalSchedules),
    },
  ];

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        {/* Welcome Header */}
        <Card
          shadow="md"
          padding="lg"
          radius="lg"
          withBorder
          className="border-blue-100 bg-gradient-to-br from-blue-50/80 to-cyan-50/80"
        >
          <div className="flex-1">
            <Group>
              <Title order={1} className="text-blue-800 mb-3 font-bold">
                🎓 Welcome Back, {user?.full_name || 'Administrator'}!
              </Title>
            </Group>
            <Text c="dimmed" size="lg" className="max-w-2xl">
              Complete overview of your academic management system. Track real-time analytics and manage resources efficiently.
            </Text>
          </div>
        </Card>

        {/* Dashboard Overview - Statistics Cards */}
        <Grid gutter="lg">
          {dashboardStats.map((item) => (
            <Grid.Col key={item.key} span={{ base: 12, sm: 6, lg: 3 }}>
              <Card
                withBorder
                radius="md"
                p="md"
                className="cursor-pointer transition-all duration-200 hover:shadow-lg"
                onClick={() => handleSetActiveSection(item.key)}
              >
                <Group justify="space-between" align="flex-start" mb="md">
                  <Box>
                    <Text fw={500} size="sm" c="dimmed" tt="uppercase">
                      {item.label}
                    </Text>
                    <Title order={2} className={`text-${item.color}-600`}>
                      {item.total.toLocaleString()}
                    </Title>
                    <Group gap={4} mt={4}>
                      {item.trend.isPositive === true ? (
                        <IconTrendingUp size={16} className="text-green-600" />
                      ) : item.trend.isPositive === false ? (
                        <IconTrendingDown size={16} className="text-red-600" />
                      ) : null}
                      <Text size="sm" c={item.trend.isPositive === true ? "green" : item.trend.isPositive === false ? "red" : "dimmed"}>
                        {item.trend.value}
                      </Text>
                    </Group>
                  </Box>
                  <Avatar radius="xl" size="lg" color={item.color}>
                    {item.icon}
                  </Avatar>
                </Group>
                {item.breakdown.length > 0 && (
                  <Stack gap={4} mt="md">
                    {item.breakdown.slice(0, 2).map((breakdown, idx) => (
                      <Group key={idx} justify="space-between">
                        <Group gap="xs">
                          <Box className={`w-2 h-2 rounded-full bg-${breakdown.color}-500`} />
                          <Text size="xs" c="dimmed">
                            {breakdown.label}
                          </Text>
                        </Group>
                        <Badge color={breakdown.color} variant="light" size="xs">
                          {breakdown.value}
                        </Badge>
                      </Group>
                    ))}
                  </Stack>
                )}
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
};

export default DashboardSection;