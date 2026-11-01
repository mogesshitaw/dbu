/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Grid,
  Group,
  Text,
  Progress,
  RingProgress,
  Stack,
  Badge,
  ThemeIcon,
  Paper,
  Title,
  Button,
} from "@mantine/core";
import {
  IconUsers,
  IconBook,
  IconCalendar,
  IconMessage,
  IconTrendingUp,
  IconAlertCircle,
  IconSchool,
} from "@tabler/icons-react";
import { Authentication, Found } from "@/app/auth/auth";

const DashboardSection: React.FC<{ setActiveSection: (section: string) => void }> = ({ setActiveSection }) => {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalInstructors: 0,
    totalStudents: 0,
    activeCourses: 0,
    pendingFeedback: 0,
    scheduleConflicts: 0,
    upcomingDeadlines: 0,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
      // Mock stats data - replace with actual API calls
      setStats({
        totalInstructors: 18,
        totalStudents: 245,
        activeCourses: 32,
        pendingFeedback: 15,
        scheduleConflicts: 2,
        upcomingDeadlines: 5,
      });
    };
    checkAuth();
  }, []);

  if (user === null) {
    return <Authentication />;
  }

  const quickActions = [
    {
      title: "Manage Instructors",
      description: "Add or manage faculty members",
      icon: IconUsers,
      color: "blue",
      action: () => setActiveSection("manageinst"),
    },
    {
      title: "View Schedule",
      description: "Check current semester schedule",
      icon: IconCalendar,
      color: "green",
      action: () => setActiveSection("viewSchedule"),
    },
    {
      title: "Course Overview",
      description: "Browse all department courses",
      icon: IconBook,
      color: "violet",
      action: () => setActiveSection("viewcourse"),
    },
    {
      title: "Feedback Review",
      description: "View pending feedback submissions",
      icon: IconMessage,
      color: "orange",
      action: () => setActiveSection("viewFeedback"),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Title order={1} className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </Title>
        <Text c="dimmed" className="text-lg">
          Department of {user?.department_name} - Overview Dashboard
        </Text>
      </div>

      {/* Stats Grid */}
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="lg" className="bg-gradient-to-br from-blue-50 to-blue-100 border-0">
            <Group justify="space-between">
              <div>
                <Text c="blue" fw={600} size="sm">Total Instructors</Text>
                <Text fw={700} size="xl" className="text-blue-700">{stats.totalInstructors}</Text>
                <Text c="blue" size="xs">Active faculty members</Text>
              </div>
              <ThemeIcon size={60} radius="lg" color="blue" variant="light">
                <IconUsers size={30} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="lg" className="bg-gradient-to-br from-green-50 to-green-100 border-0">
            <Group justify="space-between">
              <div>
                <Text c="green" fw={600} size="sm">Total Students</Text>
                <Text fw={700} size="xl" className="text-green-700">{stats.totalStudents}</Text>
                <Text c="green" size="xs">Enrolled students</Text>
              </div>
              <ThemeIcon size={60} radius="lg" color="green" variant="light">
                <IconSchool size={30} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="lg" className="bg-gradient-to-br from-violet-50 to-violet-100 border-0">
            <Group justify="space-between">
              <div>
                <Text c="violet" fw={600} size="sm">Active Courses</Text>
                <Text fw={700} size="xl" className="text-violet-700">{stats.activeCourses}</Text>
                <Text c="violet" size="xs">This semester</Text>
              </div>
              <ThemeIcon size={60} radius="lg" color="violet" variant="light">
                <IconBook size={30} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" padding="lg" radius="lg" className="bg-gradient-to-br from-orange-50 to-orange-100 border-0">
            <Group justify="space-between">
              <div>
                <Text c="orange" fw={600} size="sm">Pending Feedback</Text>
                <Text fw={700} size="xl" className="text-orange-700">{stats.pendingFeedback}</Text>
                <Text c="orange" size="xs">Needs review</Text>
              </div>
              <ThemeIcon size={60} radius="lg" color="orange" variant="light">
                <IconMessage size={30} />
              </ThemeIcon>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Main Content Grid */}
      <Grid gutter="lg">
        {/* Quick Actions */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Card shadow="sm" padding="lg" radius="lg" className="border-0 bg-white">
            <Text fw={600} size="lg" mb="md">Quick Actions</Text>
            <Grid gutter="md">
              {quickActions.map((action, index) => (
                <Grid.Col key={index} span={{ base: 12, sm: 6 }}>
                  <Paper 
                    p="md" 
                    className="border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={action.action}
                  >
                    <Group>
                      <ThemeIcon size={40} color={action.color} variant="light">
                        <action.icon size={20} />
                      </ThemeIcon>
                      <div>
                        <Text fw={600} size="sm">{action.title}</Text>
                        <Text c="dimmed" size="xs">{action.description}</Text>
                      </div>
                    </Group>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          </Card>
        </Grid.Col>

        {/* System Status */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card shadow="sm" padding="lg" radius="lg" className="border-0 bg-white">
            <Text fw={600} size="lg" mb="md">System Status</Text>
            <Stack gap="md">
              <div>
                <Group justify="apart" mb="xs">
                  <Text size="sm">Schedule Health</Text>
                  <Badge color={stats.scheduleConflicts === 0 ? "green" : "red"} variant="light">
                    {stats.scheduleConflicts === 0 ? "Healthy" : "Issues"}
                  </Badge>
                </Group>
                <Progress 
                  value={stats.scheduleConflicts === 0 ? 100 : 60} 
                  color={stats.scheduleConflicts === 0 ? "green" : "red"}
                  size="sm"
                />
              </div>

              <div>
                <Group justify="apart" mb="xs">
                  <Text size="sm">Feedback Response</Text>
                  <Badge color="blue" variant="light">
                    {Math.round((stats.pendingFeedback / (stats.pendingFeedback + 50)) * 100)}%
                  </Badge>
                </Group>
                <Progress value={75} color="blue" size="sm" />
              </div>

              <div className="text-center">
                <RingProgress
                  size={80}
                  thickness={8}
                  roundCaps
                  label={
                    <Text fw={700} size="xs" ta="center">
                      {stats.upcomingDeadlines}
                    </Text>
                  }
                  sections={[
                    { value: (stats.upcomingDeadlines / 10) * 100, color: 'orange' },
                  ]}
                />
                <Text size="sm" fw={500} mt="xs">Upcoming Deadlines</Text>
              </div>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Recent Activity & Alerts */}
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Card shadow="sm" padding="lg" radius="lg" className="border-0 bg-white">
            <Group justify="space-between" mb="md">
              <Text fw={600} size="lg">Recent Activity</Text>
              <Button variant="light" size="xs">View All</Button>
            </Group>
            <Stack gap="sm">
              {[
                "New course schedule published",
                "Faculty meeting scheduled for Friday",
                "Student feedback received for CS101",
                "Semester registration opened",
              ].map((activity, index) => (
                <Group key={index} className="p-2 hover:bg-gray-50 rounded">
                  <ThemeIcon size={30} color="blue" variant="light">
                    <IconTrendingUp size={16} />
                  </ThemeIcon>
                  <Text size="sm">{activity}</Text>
                </Group>
              ))}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 6 }}>
          <Card shadow="sm" padding="lg" radius="lg" className="border-0 bg-white">
            <Group justify="space-between" mb="md">
              <Text fw={600} size="lg">Important Alerts</Text>
              <Badge color="red" variant="light">2 New</Badge>
            </Group>
            <Stack gap="sm">
              <Paper p="md" className="bg-red-50 border border-red-200">
                <Group>
                  <IconAlertCircle className="text-red-600" size={20} />
                  <div>
                    <Text fw={600} size="sm" c="red">Schedule Conflict</Text>
                    <Text size="xs" c="red">Room 101 double booked on Monday</Text>
                  </div>
                </Group>
              </Paper>
              <Paper p="md" className="bg-orange-50 border border-orange-200">
                <Group>
                  <IconAlertCircle className="text-orange-600" size={20} />
                  <div>
                    <Text fw={600} size="sm" c="orange">Pending Approvals</Text>
                    <Text size="xs" c="orange">5 instructor requests awaiting review</Text>
                  </div>
                </Group>
              </Paper>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>
    </div>
  );
};

export default DashboardSection;