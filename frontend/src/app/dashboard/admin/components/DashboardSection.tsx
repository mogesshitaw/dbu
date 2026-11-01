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
  Button,
  Progress,
  RingProgress,
  Center,
  SimpleGrid,
  Paper,
  Avatar,
  Timeline,
  Tabs,
  Table,
  Select,
  SegmentedControl,
} from "@mantine/core";
import {
  IconUsers,
  IconSchool,
  IconChartBar,
  IconMessage,
  IconBellRinging,
  IconTrendingUp,
  IconTrendingDown,
  IconRefresh,
  IconEye,
  IconDownload,
} from "@tabler/icons-react";

interface Props {
  setActiveSection: (section: string) => void;
}

const DashboardSection: React.FC<Props> = ({ setActiveSection }) => {
  const [user, setUser] = useState<any>(null);
  const [timeRange, setTimeRange] = useState("week");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);

  if (user === null) {
    return <Authentication />;
  }
  if (user.role !== 'admin') {
    return <UnauthorizedAccess />
  }
  // Mock Data - Replace with real API calls
  const stats = [
    {
      key: "manageUsers",
      label: "Total Users",
      total: 1242,
      breakdown: [
        { label: "Students", value: 980, color: "blue" },
        { label: "Teachers", value: 142, color: "green" },
        { label: "Admins", value: 120, color: "violet" },
      ],
      icon: <UserGroupIcon className="h-6 w-6" />,
      color: "indigo",
      trend: "+12%",
      trendUp: true,
    },
    {
      key: "studentManagement",
      label: "Students",
      total: 980,
      breakdown: [
        { label: "Active", value: 920, color: "green" },
        { label: "Inactive", value: 60, color: "red" },
      ],
      icon: <AcademicCapIcon className="h-6 w-6" />,
      color: "blue",
      progress: 94,
      trend: "+8%",
      trendUp: true,
    },
    {
      key: "teacherManagement",
      label: "Teachers",
      total: 142,
      breakdown: [
        { label: "Full-time", value: 100, color: "blue" },
        { label: "Part-time", value: 42, color: "cyan" },
      ],
      icon: <UserCircleIcon className="h-6 w-6" />,
      color: "green",
      progress: 70,
      trend: "+5%",
      trendUp: true,
    },
    {
      key: "manageDepartment",
      label: "Departments",
      total: 8,
      breakdown: [
        { label: "Engineering", value: 3, color: "blue" },
        { label: "Science", value: 2, color: "green" },
        { label: "Arts", value: 3, color: "orange" },
      ],
      icon: <BuildingOfficeIcon className="h-6 w-6" />,
      color: "yellow",
      trend: "0%",
      trendUp: null,
    },
    {
      key: "courseManagement",
      label: "Courses",
      total: 156,
      breakdown: [
        { label: "Active", value: 120, color: "green" },
        { label: "Upcoming", value: 36, color: "blue" },
      ],
      icon: <BookOpenIcon className="h-6 w-6" />,
      color: "orange",
      progress: 77,
      trend: "+15%",
      trendUp: true,
    },
    {
      key: "viewFeedback",
      label: "Feedback",
      total: 845,
      breakdown: [
        { label: "Resolved", value: 720, color: "green" },
        { label: "Pending", value: 125, color: "yellow" },
      ],
      icon: <ChatBubbleLeftRightIcon className="h-6 w-6" />,
      color: "grape",
      progress: 85,
      trend: "+23%",
      trendUp: true,
    },
    {
      key: "announcements",
      label: "Announcements",
      total: 45,
      breakdown: [
        { label: "Active", value: 32, color: "green" },
        { label: "Archived", value: 13, color: "gray" },
      ],
      icon: <MegaphoneIcon className="h-6 w-6" />,
      color: "pink",
      progress: 71,
      trend: "+18%",
      trendUp: true,
    },
    {
      key: "manageSchedule",
      label: "Schedules",
      total: 320,
      breakdown: [
        { label: "Today", value: 28, color: "red" },
        { label: "This Week", value: 56, color: "orange" },
        { label: "Upcoming", value: 236, color: "blue" },
      ],
      icon: <CalendarDaysIcon className="h-6 w-6" />,
      color: "teal",
      trend: "+7%",
      trendUp: true,
    },
  ];

  // Student Analytics Data
  const studentAnalytics = {
    enrollmentTrend: [
      { month: 'Jan', count: 120 },
      { month: 'Feb', count: 145 },
      { month: 'Mar', count: 180 },
      { month: 'Apr', count: 210 },
      { month: 'May', count: 250 },
      { month: 'Jun', count: 300 },
    ],
    byDepartment: [
      { name: 'Computer Science', value: 320, color: 'blue' },
      { name: 'Electrical', value: 280, color: 'green' },
      { name: 'Mechanical', value: 240, color: 'orange' },
      { name: 'Civil', value: 140, color: 'red' },
    ],
    performance: {
      averageGrade: 3.6,
      passRate: 92,
      dropoutRate: 3.2,
    },
    genderDistribution: {
      male: 65,
      female: 35,
    }
  };

  // Teacher Analytics Data
  const teacherAnalytics = {
    workload: [
      { teacher: 'Dr. Smith', courses: 4, students: 120 },
      { teacher: 'Prof. Johnson', courses: 3, students: 95 },
      { teacher: 'Dr. Williams', courses: 5, students: 150 },
      { teacher: 'Prof. Brown', courses: 2, students: 60 },
    ],
    ratings: [
      { teacher: 'Dr. Smith', rating: 4.8 },
      { teacher: 'Prof. Johnson', rating: 4.6 },
      { teacher: 'Dr. Williams', rating: 4.9 },
      { teacher: 'Prof. Brown', rating: 4.3 },
    ],
    attendance: {
      average: 95,
      best: 98,
      lowest: 85,
    }
  };

  // Feedback Analytics Data
  const feedbackAnalytics = {
    byCategory: [
      { category: 'Teaching', count: 320, color: 'blue' },
      { category: 'Facilities', count: 180, color: 'green' },
      { category: 'Administration', count: 150, color: 'orange' },
      { category: 'Resources', count: 120, color: 'red' },
      { category: 'Other', count: 75, color: 'gray' },
    ],
    sentiment: {
      positive: 65,
      neutral: 25,
      negative: 10,
    },
    responseTime: {
      average: '2.4 days',
      fastest: '1 hour',
      slowest: '7 days',
    },
    recentFeedback: [
      { id: 1, user: 'Student 101', category: 'Teaching', status: 'Resolved', date: '2 hours ago' },
      { id: 2, user: 'Teacher 045', category: 'Resources', status: 'Pending', date: '1 day ago' },
      { id: 3, user: 'Student 223', category: 'Facilities', status: 'Resolved', date: '2 days ago' },
    ]
  };

  // Announcement Analytics
  const announcementAnalytics = {
    byType: [
      { type: 'Academic', count: 20 },
      { type: 'Event', count: 12 },
      { type: 'Emergency', count: 3 },
      { type: 'General', count: 10 },
    ],
    engagement: {
      views: 2450,
      clicks: 890,
      shares: 120,
    },
    recentAnnouncements: [
      { title: 'Midterm Schedule', type: 'Academic', views: 450, date: 'Today' },
      { title: 'Sports Day', type: 'Event', views: 320, date: 'Yesterday' },
      { title: 'Library Maintenance', type: 'General', views: 280, date: '2 days ago' },
    ]
  };

  // Recent Activities Timeline
  const recentActivities = [
    { time: '2 hours ago', action: 'New student registered', user: 'John Doe' },
    { time: '4 hours ago', action: 'Course schedule updated', user: 'Admin' },
    { time: '1 day ago', action: 'Feedback submitted', user: 'Student 101' },
    { time: '2 days ago', action: 'Announcement published', user: 'Department Head' },
    { time: '3 days ago', action: 'Teacher assignment updated', user: 'System' },
  ];

  // const getRingProgressValue = (item: typeof stats[0]) => {
  //   if (item.breakdown.length === 0) return 100;
  //   const mainValue = item.breakdown[0]?.value || 0;
  //   return (mainValue / item.total) * 100;
  // };

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
          <Group justify="space-between" wrap="nowrap">
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
            <Group>
              <SegmentedControl
                value={timeRange}
                onChange={setTimeRange}
                data={[
                  { label: 'Today', value: 'today' },
                  { label: 'Week', value: 'week' },
                  { label: 'Month', value: 'month' },
                  { label: 'Year', value: 'year' },
                ]}
              />
              <Button
                variant="light"
                color="blue"
                size="sm"
                leftSection={<IconRefresh size={16} />}
              >
                Refresh
              </Button>
            </Group>
          </Group>
        </Card>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onChange={()=>setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="students" leftSection={<IconUsers size={16} />}>
              Student Analytics
            </Tabs.Tab>
            <Tabs.Tab value="teachers" leftSection={<IconSchool size={16} />}>
              Teacher Analytics
            </Tabs.Tab>
            <Tabs.Tab value="feedback" leftSection={<IconMessage size={16} />}>
              Feedback Analytics
            </Tabs.Tab>
            <Tabs.Tab value="announcements" leftSection={<IconBellRinging size={16} />}>
              Announcements
            </Tabs.Tab>
          </Tabs.List>

          {/* Overview Tab */}
          <Tabs.Panel value="overview" pt="md">
            <Grid gutter="lg">
              {/* Key Metrics */}
              {stats.map((item) => (
                <Grid.Col key={item.key} span={{ base: 12, sm: 6, lg: 3 }}>
                  <Card
                    withBorder
                    radius="md"
                    p="md"
                    className="cursor-pointer transition-all duration-200 hover:shadow-lg"
                    onClick={() => setActiveSection(item.key)}
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
                          {item.trendUp === true ? (
                            <IconTrendingUp size={16} className="text-green-600" />
                          ) : item.trendUp === false ? (
                            <IconTrendingDown size={16} className="text-red-600" />
                          ) : null}
                          <Text size="sm" c={item.trendUp === true ? "green" : item.trendUp === false ? "red" : "dimmed"}>
                            {item.trend}
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

            {/* Charts Row */}
            <Grid gutter="lg" mt="md">
              <Grid.Col span={{ base: 12, lg: 8 }}>
                <Card withBorder radius="md" p="md">
                  <Group justify="space-between" mb="md">
                    <Title order={4}>Student Enrollment Trend</Title>
                    <Select
                      placeholder="Filter"
                      data={['This Year', 'Last Year', 'All Time']}
                      defaultValue="This Year"
                    />
                  </Group>
                  <Box h={300}>
                    {/* Replace with actual chart */}
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                      <Text c="dimmed">Line Chart: Enrollment Over Time</Text>
                    </div>
                  </Box>
                </Card>
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <Card withBorder radius="md" p="md">
                  <Title order={4} mb="md">Department Distribution</Title>
                  <Box h={300}>
                    {/* Replace with actual chart */}
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
                      <Text c="dimmed">Pie Chart: Student Distribution</Text>
                    </div>
                  </Box>
                </Card>
              </Grid.Col>
            </Grid>

            {/* Recent Activities */}
            <Card withBorder radius="md" p="md" mt="lg">
              <Group justify="space-between" mb="md">
                <Title order={4}>Recent Activities</Title>
                <Button variant="subtle" size="sm" leftSection={<IconEye size={16} />}>
                  View All
                </Button>
              </Group>
              <Timeline active={1} bulletSize={24} lineWidth={2}>
                {recentActivities.map((activity, index) => (
                  <Timeline.Item key={index} bullet={<Avatar size={22} radius="xl" />}>
                    <Group justify="space-between">
                      <div>
                        <Text fw={500}>{activity.action}</Text>
                        <Text size="sm" c="dimmed">{activity.user}</Text>
                      </div>
                      <Badge variant="light" color="gray">
                        {activity.time}
                      </Badge>
                    </Group>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </Tabs.Panel>

          {/* Student Analytics Tab */}
          <Tabs.Panel value="students" pt="md">
            <Grid gutter="lg">
              <Grid.Col span={12}>
                <Card withBorder radius="md" p="md">
                  <Title order={3} mb="md">📊 Student Analytics Dashboard</Title>
                  <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md" mb="lg">
                    <Paper withBorder p="md" radius="md">
                      <Text fw={500} size="sm" c="dimmed">Total Students</Text>
                      <Title order={2}>{studentAnalytics.enrollmentTrend[5].count.toLocaleString()}</Title>
                      <Group gap={4} mt={4}>
                        <IconTrendingUp size={16} className="text-green-600" />
                        <Text size="sm" c="green">+15% this year</Text>
                      </Group>
                    </Paper>
                    <Paper withBorder p="md" radius="md">
                      <Text fw={500} size="sm" c="dimmed">Average Grade</Text>
                      <Title order={2}>{studentAnalytics.performance.averageGrade.toFixed(1)}</Title>
                      <Progress value={studentAnalytics.performance.averageGrade * 20} color="blue" mt="md" />
                    </Paper>
                    <Paper withBorder p="md" radius="md">
                      <Text fw={500} size="sm" c="dimmed">Pass Rate</Text>
                      <Title order={2}>{studentAnalytics.performance.passRate}%</Title>
                      <Progress value={studentAnalytics.performance.passRate} color="green" mt="md" />
                    </Paper>
                    <Paper withBorder p="md" radius="md">
                      <Text fw={500} size="sm" c="dimmed">Dropout Rate</Text>
                      <Title order={2}>{studentAnalytics.performance.dropoutRate}%</Title>
                      <Progress value={studentAnalytics.performance.dropoutRate} color="red" mt="md" />
                    </Paper>
                  </SimpleGrid>

                  <Grid gutter="lg">
                    <Grid.Col span={{ base: 12, lg: 8 }}>
                      <Paper withBorder p="md" radius="md">
                        <Title order={4} mb="md">Enrollment Growth</Title>
                        <Box h={250}>
                          {/* Chart placeholder */}
                          <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded">
                            <Text c="dimmed">Line Chart: Monthly Enrollment</Text>
                          </div>
                        </Box>
                      </Paper>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, lg: 4 }}>
                      <Paper withBorder p="md" radius="md">
                        <Title order={4} mb="md">Gender Distribution</Title>
                        <RingProgress
                          size={200}
                          thickness={16}
                          roundCaps
                          sections={[
                            { value: studentAnalytics.genderDistribution.male, color: 'blue' },
                            { value: studentAnalytics.genderDistribution.female, color: 'pink' },
                          ]}
                          label={
                            <Center>
                              <Stack gap={0} align="center">
                                <Text fw={700} size="xl">
                                  Total
                                </Text>
                                <Text size="sm" c="dimmed">
                                  Students
                                </Text>
                              </Stack>
                            </Center>
                          }
                        />
                        <SimpleGrid cols={2} mt="md">
                          <Box>
                            <Group gap="xs">
                              <Box className="w-3 h-3 rounded-full bg-blue-500" />
                              <Text size="sm">Male</Text>
                            </Group>
                            <Text fw={700} size="lg">{studentAnalytics.genderDistribution.male}%</Text>
                          </Box>
                          <Box>
                            <Group gap="xs">
                              <Box className="w-3 h-3 rounded-full bg-pink-500" />
                              <Text size="sm">Female</Text>
                            </Group>
                            <Text fw={700} size="lg">{studentAnalytics.genderDistribution.female}%</Text>
                          </Box>
                        </SimpleGrid>
                      </Paper>
                    </Grid.Col>
                  </Grid>
                </Card>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* Teacher Analytics Tab */}
          <Tabs.Panel value="teachers" pt="md">
            <Card withBorder radius="md" p="md">
              <Title order={3} mb="md">👨‍🏫 Teacher Analytics</Title>
              
              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="lg">
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} size="sm" c="dimmed">Average Rating</Text>
                  <Title order={2}>4.7/5.0</Title>
                  <Group gap={4} mt={4}>
                    <IconTrendingUp size={16} className="text-green-600" />
                    <Text size="sm" c="green">Improved 0.2</Text>
                  </Group>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} size="sm" c="dimmed">Attendance Rate</Text>
                  <Title order={2}>{teacherAnalytics.attendance.average}%</Title>
                  <Progress value={teacherAnalytics.attendance.average} color="green" mt="md" />
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} size="sm" c="dimmed">Avg Courses/Teacher</Text>
                  <Title order={2}>3.5</Title>
                  <Text size="sm" c="dimmed">Total 142 teachers</Text>
                </Paper>
              </SimpleGrid>

              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, lg: 6 }}>
                  <Paper withBorder p="md" radius="md">
                    <Title order={4} mb="md">Teacher Workload</Title>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Teacher</Table.Th>
                          <Table.Th>Courses</Table.Th>
                          <Table.Th>Students</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {teacherAnalytics.workload.map((teacher, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>{teacher.teacher}</Table.Td>
                            <Table.Td>
                              <Badge color="blue" variant="light">{teacher.courses}</Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge color="green" variant="light">{teacher.students}</Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, lg: 6 }}>
                  <Paper withBorder p="md" radius="md">
                    <Title order={4} mb="md">Teacher Ratings</Title>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Teacher</Table.Th>
                          <Table.Th>Rating</Table.Th>
                          <Table.Th>Status</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {teacherAnalytics.ratings.map((teacher, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>{teacher.teacher}</Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Text fw={500}>{teacher.rating.toFixed(1)}</Text>
                                <Text size="sm" c="dimmed">/5.0</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>
                              <Badge 
                                color={teacher.rating >= 4.5 ? "green" : teacher.rating >= 4.0 ? "yellow" : "orange"}
                                variant="light"
                              >
                                {teacher.rating >= 4.5 ? "Excellent" : teacher.rating >= 4.0 ? "Good" : "Average"}
                              </Badge>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Card>
          </Tabs.Panel>

          {/* Feedback Analytics Tab */}
          <Tabs.Panel value="feedback" pt="md">
            <Card withBorder radius="md" p="md">
              <Group justify="space-between" mb="md">
                <Title order={3}>💬 Feedback Analytics</Title>
                <Button leftSection={<IconDownload size={16} />} variant="light">
                  Export Report
                </Button>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="lg">
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} size="sm" c="dimmed">Total Feedback</Text>
                  <Title order={2}>{feedbackAnalytics.byCategory.reduce((sum, cat) => sum + cat.count, 0)}</Title>
                  <Text size="sm" c="green">85% Resolved</Text>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} size="sm" c="dimmed">Avg Response Time</Text>
                  <Title order={2}>{feedbackAnalytics.responseTime.average}</Title>
                  <Text size="sm" c="dimmed">From submission to resolution</Text>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} size="sm" c="dimmed">Positive Sentiment</Text>
                  <Title order={2}>{feedbackAnalytics.sentiment.positive}%</Title>
                  <Progress value={feedbackAnalytics.sentiment.positive} color="green" mt="md" />
                </Paper>
              </SimpleGrid>

              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, lg: 7 }}>
                  <Paper withBorder p="md" radius="md">
                    <Title order={4} mb="md">Feedback by Category</Title>
                    <Box h={300}>
                      {/* Bar chart placeholder */}
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded">
                        <Text c="dimmed">Bar Chart: Feedback Categories</Text>
                      </div>
                    </Box>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, lg: 5 }}>
                  <Paper withBorder p="md" radius="md">
                    <Title order={4} mb="md">Sentiment Analysis</Title>
                    <RingProgress
                      size={200}
                      thickness={16}
                      roundCaps
                      sections={[
                        { value: feedbackAnalytics.sentiment.positive, color: 'green' },
                        { value: feedbackAnalytics.sentiment.neutral, color: 'yellow' },
                        { value: feedbackAnalytics.sentiment.negative, color: 'red' },
                      ]}
                      label={
                        <Center>
                          <Stack gap={0} align="center">
                            <Text fw={700} size="xl">
                              Sentiment
                            </Text>
                          </Stack>
                        </Center>
                      }
                    />
                    <Stack gap="xs" mt="md">
                      {[
                        { label: 'Positive', value: feedbackAnalytics.sentiment.positive, color: 'green' },
                        { label: 'Neutral', value: feedbackAnalytics.sentiment.neutral, color: 'yellow' },
                        { label: 'Negative', value: feedbackAnalytics.sentiment.negative, color: 'red' },
                      ].map((item, index) => (
                        <Group key={index} justify="space-between">
                          <Group gap="xs">
                            <Box className={`w-3 h-3 rounded-full bg-${item.color}-500`} />
                            <Text size="sm">{item.label}</Text>
                          </Group>
                          <Text fw={500}>{item.value}%</Text>
                        </Group>
                      ))}
                    </Stack>
                  </Paper>
                </Grid.Col>
              </Grid>

              <Paper withBorder p="md" radius="md" mt="lg">
                <Title order={4} mb="md">Recent Feedback</Title>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>User</Table.Th>
                      <Table.Th>Category</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Date</Table.Th>
                      <Table.Th>Action</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {feedbackAnalytics.recentFeedback.map((feedback) => (
                      <Table.Tr key={feedback.id}>
                        <Table.Td>{feedback.user}</Table.Td>
                        <Table.Td>
                          <Badge color="blue" variant="light">{feedback.category}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge 
                            color={feedback.status === 'Resolved' ? 'green' : 'yellow'}
                            variant="light"
                          >
                            {feedback.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>{feedback.date}</Table.Td>
                        <Table.Td>
                          <Button variant="subtle" size="xs">View</Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Card>
          </Tabs.Panel>

          {/* Announcements Tab */}
          <Tabs.Panel value="announcements" pt="md">
            <Card withBorder radius="md" p="md">
              <Group justify="space-between" mb="md">
                <Title order={3}>📢 Announcement Analytics</Title>
                <Button leftSection={<MegaphoneIcon className="h-4 w-4" />}>
                  New Announcement
                </Button>
              </Group>

              <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md" mb="lg">
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} size="sm" c="dimmed">Total Views</Text>
                  <Title order={2}>{announcementAnalytics.engagement.views.toLocaleString()}</Title>
                  <Text size="sm" c="green">+320 today</Text>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} size="sm" c="dimmed">Engagement Rate</Text>
                  <Title order={2}>
                    {((announcementAnalytics.engagement.clicks / announcementAnalytics.engagement.views) * 100).toFixed(1)}%
                  </Title>
                  <Text size="sm" c="dimmed">Clicks per view</Text>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} size="sm" c="dimmed">Active Announcements</Text>
                  <Title order={2}>
                    {announcementAnalytics.byType.find(t => t.type === 'Academic')?.count || 0}
                  </Title>
                  <Text size="sm" c="dimmed">Academic type</Text>
                </Paper>
                <Paper withBorder p="md" radius="md">
                  <Text fw={500} size="sm" c="dimmed">Shares</Text>
                  <Title order={2}>{announcementAnalytics.engagement.shares}</Title>
                  <Text size="sm" c="green">Viral content</Text>
                </Paper>
              </SimpleGrid>

              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, lg: 6 }}>
                  <Paper withBorder p="md" radius="md">
                    <Title order={4} mb="md">Announcements by Type</Title>
                    <Box h={300}>
                      {/* Chart placeholder */}
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded">
                        <Text c="dimmed">Donut Chart: Announcement Types</Text>
                      </div>
                    </Box>
                  </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, lg: 6 }}>
                  <Paper withBorder p="md" radius="md">
                    <Title order={4} mb="md">Top Announcements</Title>
                    <Table>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Title</Table.Th>
                          <Table.Th>Type</Table.Th>
                          <Table.Th>Views</Table.Th>
                          <Table.Th>Date</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {announcementAnalytics.recentAnnouncements.map((announcement, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>
                              <Text fw={500} truncate>{announcement.title}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge 
                                color={
                                  announcement.type === 'Academic' ? 'blue' :
                                  announcement.type === 'Event' ? 'green' :
                                  announcement.type === 'Emergency' ? 'red' : 'gray'
                                }
                                variant="light"
                              >
                                {announcement.type}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <IconEye size={14} className="text-gray-500" />
                                <Text>{announcement.views.toLocaleString()}</Text>
                              </Group>
                            </Table.Td>
                            <Table.Td>{announcement.date}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Card>
          </Tabs.Panel>
        </Tabs>

        {/* System Status & Quick Actions */}
        <Card withBorder radius="md" p="md">
          <Group justify="space-between" mb="md">
            <Title order={4}>⚡ Quick Actions</Title>
            <Text size="sm" c="dimmed">Last updated: Just now</Text>
          </Group>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
            <Button 
              variant="light" 
              color="blue" 
              onClick={() => setActiveSection('manageUsers')}
              leftSection={<UserGroupIcon className="h-4 w-4" />}
            >
              Manage Users
            </Button>
            <Button 
              variant="light" 
              color="green"
              onClick={() => setActiveSection('courseManagement')}
              leftSection={<BookOpenIcon className="h-4 w-4" />}
            >
              Add Course
            </Button>
            <Button 
              variant="light" 
              color="orange"
              onClick={() => setActiveSection('viewFeedback')}
              leftSection={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
            >
              View Feedback
            </Button>
            <Button 
              variant="light" 
              color="violet"
              onClick={() => setActiveSection('announcements')}
              leftSection={<MegaphoneIcon className="h-4 w-4" />}
            >
              Post Announcement
            </Button>
          </SimpleGrid>
        </Card>
      </Stack>
    </Container>
  );
};

export default DashboardSection;