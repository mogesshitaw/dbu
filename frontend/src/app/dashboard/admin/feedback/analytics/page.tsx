/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  Text,
  Group,
  Grid,
  Paper,
  Stack,
  LoadingOverlay,
  Select,
  Button,
  Badge,
  Divider,
  Progress,
  RingProgress,
  Center,
} from "@mantine/core";
import {
  IconChartBar,
  IconTrendingUp,
  IconUsers,
  IconMessage,
  IconRefresh,
  IconThumbUp,
  IconThumbDown,
  IconClock,
} from "@tabler/icons-react";
import { useAppDispatch } from "@/hooks/redux";
import { useFeedback } from "@/hooks/redux";
import { fetchFeedbacks } from "@/store/slices/feedbackSlice";
import { Authentication, Found } from "@/app/auth/auth";

// Mock analytics data generator (replace with actual API calls)
const generateAnalyticsData = (feedbacks: any[]) => {
  const total = feedbacks.length;
  const pending = feedbacks.filter(f => f.status === 'pending').length;
  const approved = feedbacks.filter(f => f.status === 'approved').length;
  const rejected = feedbacks.filter(f => f.status === 'rejected').length;
  
  // Role distribution
  const students = feedbacks.filter(f => f.role_type === 'student').length;
  const instructors = feedbacks.filter(f => f.role_type === 'instructor').length;
  
  // Monthly trend (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    
    const monthFeedbacks = feedbacks.filter(f => {
      const feedbackDate = new Date(f.created_at);
      return feedbackDate.getMonth() === date.getMonth() && 
             feedbackDate.getFullYear() === date.getFullYear();
    });
    
    return {
      month: `${month} ${year}`,
      total: monthFeedbacks.length,
      approved: monthFeedbacks.filter(f => f.status === 'approved').length,
      pending: monthFeedbacks.filter(f => f.status === 'pending').length,
      rejected: monthFeedbacks.filter(f => f.status === 'rejected').length,
    };
  }).reverse();

  // Sentiment analysis (mock - replace with actual sentiment analysis)
  const positive = Math.floor(approved * 0.8 + pending * 0.3);
  const negative = Math.floor(rejected * 0.9 + pending * 0.2);
  const neutral = total - positive - negative;

  return {
    overview: {
      total,
      pending,
      approved,
      rejected,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      responseRate: total > 0 ? Math.round(((approved + rejected) / total) * 100) : 0,
    },
    distribution: {
      byRole: {
        students,
        instructors,
        studentPercentage: total > 0 ? Math.round((students / total) * 100) : 0,
        instructorPercentage: total > 0 ? Math.round((instructors / total) * 100) : 0,
      },
      byStatus: {
        approved,
        pending,
        rejected,
      },
    },
    trends: {
      monthly: monthlyData,
      sentiment: {
        positive,
        negative,
        neutral,
        positivePercentage: total > 0 ? Math.round((positive / total) * 100) : 0,
        negativePercentage: total > 0 ? Math.round((negative / total) * 100) : 0,
        neutralPercentage: total > 0 ? Math.round((neutral / total) * 100) : 0,
      },
    },
  };
};

const FeedbackAnalytics: React.FC = () => {
  const dispatch = useAppDispatch();
  const { feedbacks, loading, error } = useFeedback();
  const [timeRange, setTimeRange] = useState<string>('all');
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchFeedbacks());
  }, [dispatch]);

  useEffect(() => {
    if (feedbacks.length > 0) {
      setAnalyticsData(generateAnalyticsData(feedbacks));
    }
  }, [feedbacks]);

  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setCurrentUser(foundUser);
    };
    checkAuth();
  }, []);

  if (currentUser === null) {
    return <Authentication />;
  }

  if (loading || !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-6">
        <LoadingOverlay visible={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <Card 
          shadow="sm" 
          padding="lg" 
          radius="lg"
          className="bg-white/80 backdrop-blur-sm border border-white/20"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <Text className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Feedback Analytics
              </Text>
              <Text c="dimmed" className="text-lg">
                Comprehensive insights and trends from user feedback
              </Text>
            </div>
            <Group>
              <Select
                value={timeRange}
                onChange={(value) => setTimeRange(value || 'all')}
                data={[
                  { value: '7days', label: 'Last 7 Days' },
                  { value: '30days', label: 'Last 30 Days' },
                  { value: '90days', label: 'Last 90 Days' },
                  { value: 'all', label: 'All Time' },
                ]}
                className="w-40"
              />
              <Button
                leftSection={<IconRefresh size={20} />}
                onClick={() => dispatch(fetchFeedbacks())}
                variant="light"
                color="blue"
                loading={loading}
              >
                Refresh
              </Button>
            </Group>
          </div>
        </Card>

        {error && (
          <Paper p="md" className="bg-red-50 border border-red-200">
            <Text c="red">Error loading analytics: {error}</Text>
          </Paper>
        )}

        {/* Overview Stats */}
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="lg" radius="lg" className="bg-blue-50/50 border border-blue-200 hover:shadow-md transition-all">
              <Group justify="space-between">
                <div>
                  <Text fw={700} size="xl" className="text-blue-700">
                    {analyticsData.overview.total}
                  </Text>
                  <Text size="sm" c="blue" fw={500}>Total Feedback</Text>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <IconMessage size={24} className="text-blue-600" />
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="lg" radius="lg" className="bg-green-50/50 border border-green-200 hover:shadow-md transition-all">
              <Group justify="space-between">
                <div>
                  <Text fw={700} size="xl" className="text-green-700">
                    {analyticsData.overview.approved}
                  </Text>
                  <Text size="sm" c="green" fw={500}>Approved</Text>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <IconThumbUp size={24} className="text-green-600" />
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="lg" radius="lg" className="bg-yellow-50/50 border border-yellow-200 hover:shadow-md transition-all">
              <Group justify="space-between">
                <div>
                  <Text fw={700} size="xl" className="text-yellow-700">
                    {analyticsData.overview.pending}
                  </Text>
                  <Text size="sm" c="yellow" fw={500}>Pending</Text>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <IconClock size={24} className="text-yellow-600" />
                </div>
              </Group>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card padding="lg" radius="lg" className="bg-red-50/50 border border-red-200 hover:shadow-md transition-all">
              <Group justify="space-between">
                <div>
                  <Text fw={700} size="xl" className="text-red-700">
                    {analyticsData.overview.rejected}
                  </Text>
                  <Text size="sm" c="red" fw={500}>Rejected</Text>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <IconThumbDown size={24} className="text-red-600" />
                </div>
              </Group>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Main Analytics Grid */}
        <Grid gutter="lg">
          {/* Status Distribution */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="lg" className="bg-white/80 backdrop-blur-sm h-full">
              <Text fw={600} size="lg" mb="md" className="flex items-center gap-2">
                <IconChartBar size={20} className="text-blue-600" />
                Status Distribution
              </Text>
              <Stack gap="md">
                <div>
                  <Group justify="apart" mb="xs">
                    <Text size="sm">Approved</Text>
                    <Text fw={600} size="sm" c="green">
                      {analyticsData.distribution.byStatus.approved} ({analyticsData.overview.total > 0 ? Math.round((analyticsData.distribution.byStatus.approved / analyticsData.overview.total) * 100) : 0}%)
                    </Text>
                  </Group>
                  <Progress value={analyticsData.overview.total > 0 ? (analyticsData.distribution.byStatus.approved / analyticsData.overview.total) * 100 : 0} color="green" size="lg" radius="xl" />
                </div>
                
                <div>
                  <Group justify="apart" mb="xs">
                    <Text size="sm">Pending</Text>
                    <Text fw={600} size="sm" c="yellow">
                      {analyticsData.distribution.byStatus.pending} ({analyticsData.overview.total > 0 ? Math.round((analyticsData.distribution.byStatus.pending / analyticsData.overview.total) * 100) : 0}%)
                    </Text>
                  </Group>
                  <Progress value={analyticsData.overview.total > 0 ? (analyticsData.distribution.byStatus.pending / analyticsData.overview.total) * 100 : 0} color="yellow" size="lg" radius="xl" />
                </div>
                
                <div>
                  <Group justify="apart" mb="xs">
                    <Text size="sm">Rejected</Text>
                    <Text fw={600} size="sm" c="red">
                      {analyticsData.distribution.byStatus.rejected} ({analyticsData.overview.total > 0 ? Math.round((analyticsData.distribution.byStatus.rejected / analyticsData.overview.total) * 100) : 0}%)
                    </Text>
                  </Group>
                  <Progress value={analyticsData.overview.total > 0 ? (analyticsData.distribution.byStatus.rejected / analyticsData.overview.total) * 100 : 0} color="red" size="lg" radius="xl" />
                </div>
              </Stack>
            </Card>
          </Grid.Col>

          {/* Role Distribution */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="lg" className="bg-white/80 backdrop-blur-sm h-full">
              <Text fw={600} size="lg" mb="md" className="flex items-center gap-2">
                <IconUsers size={20} className="text-violet-600" />
                Role Distribution
              </Text>
              <div className="flex flex-col items-center justify-center h-48">
                <RingProgress
                  size={140}
                  thickness={12}
                  roundCaps
                  label={
                    <Center>
                      <Text fw={700} size="xl">
                        {analyticsData.overview.total}
                      </Text>
                    </Center>
                  }
                  sections={[
                    {
                      value: analyticsData.distribution.byRole.studentPercentage,
                      color: 'blue',
                      tooltip: `Students: ${analyticsData.distribution.byRole.students} (${analyticsData.distribution.byRole.studentPercentage}%)`,
                    },
                    {
                      value: analyticsData.distribution.byRole.instructorPercentage,
                      color: 'violet',
                      tooltip: `Instructors: ${analyticsData.distribution.byRole.instructors} (${analyticsData.distribution.byRole.instructorPercentage}%)`,
                    },
                  ]}
                />
                <Group justify="center" mt="md" gap="xl">
                  <Group gap="xs">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <Text size="sm">Students</Text>
                  </Group>
                  <Group gap="xs">
                    <div className="w-3 h-3 bg-violet-600 rounded-full"></div>
                    <Text size="sm">Instructors</Text>
                  </Group>
                </Group>
              </div>
            </Card>
          </Grid.Col>

          {/* Monthly Trends */}
          <Grid.Col span={{ base: 12, lg: 8 }}>
            <Card shadow="sm" padding="lg" radius="lg" className="bg-white/80 backdrop-blur-sm">
              <Text fw={600} size="lg" mb="md" className="flex items-center gap-2">
                <IconTrendingUp size={20} className="text-green-600" />
                Monthly Feedback Trends
              </Text>
              <Stack gap="md">
                {analyticsData.trends.monthly.map((month: any, index: number) => (
                  <div key={index}>
                    <Group justify="apart" mb="xs">
                      <Text size="sm" fw={500}>{month.month}</Text>
                      <Badge variant="light" color="blue">
                        Total: {month.total}
                      </Badge>
                    </Group>
                    <Progress.Root size="xl" radius="xl">
                      <Progress.Section value={month.total > 0 ? (month.approved / month.total) * 100 : 0} color="green">
                        <Progress.Label>Approved: {month.approved}</Progress.Label>
                      </Progress.Section>
                      <Progress.Section value={month.total > 0 ? (month.pending / month.total) * 100 : 0} color="yellow">
                        <Progress.Label>Pending: {month.pending}</Progress.Label>
                      </Progress.Section>
                      <Progress.Section value={month.total > 0 ? (month.rejected / month.total) * 100 : 0} color="red">
                        <Progress.Label>Rejected: {month.rejected}</Progress.Label>
                      </Progress.Section>
                    </Progress.Root>
                  </div>
                ))}
              </Stack>
            </Card>
          </Grid.Col>

          {/* Sentiment Analysis */}
          <Grid.Col span={{ base: 12, lg: 4 }}>
            <Card shadow="sm" padding="lg" radius="lg" className="bg-white/80 backdrop-blur-sm">
              <Text fw={600} size="lg" mb="md" className="flex items-center gap-2">
                <IconThumbUp size={20} className="text-orange-600" />
                Sentiment Analysis
              </Text>
              <Stack gap="lg">
                <div className="text-center">
                  <RingProgress
                    size={120}
                    thickness={10}
                    roundCaps
                    label={
                      <Text fw={700} size="sm" c="green">
                        {analyticsData.trends.sentiment.positivePercentage}%
                      </Text>
                    }
                    sections={[
                      { value: analyticsData.trends.sentiment.positivePercentage, color: 'green' },
                    ]}
                  />
                  <Text fw={600} mt="sm">Positive</Text>
                  <Text size="sm" c="dimmed">{analyticsData.trends.sentiment.positive} feedbacks</Text>
                </div>
                
                <Divider />
                
                <Group justify="apart">
                  <div className="text-center">
                    <Text fw={600} size="sm" c="red">{analyticsData.trends.sentiment.negativePercentage}%</Text>
                    <Text size="xs" c="dimmed">Negative</Text>
                  </div>
                  <div className="text-center">
                    <Text fw={600} size="sm" c="gray">{analyticsData.trends.sentiment.neutralPercentage}%</Text>
                    <Text size="xs" c="dimmed">Neutral</Text>
                  </div>
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Performance Metrics */}
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="lg" className="bg-white/80 backdrop-blur-sm">
              <Text fw={600} size="lg" mb="md">Approval Rate</Text>
              <div className="text-center">
                <Text className="text-4xl font-bold text-green-600">
                  {analyticsData.overview.approvalRate}%
                </Text>
                <Text c="dimmed" size="sm">
                  {analyticsData.overview.approved} out of {analyticsData.overview.total} feedbacks approved
                </Text>
              </div>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card shadow="sm" padding="lg" radius="lg" className="bg-white/80 backdrop-blur-sm">
              <Text fw={600} size="lg" mb="md">Response Rate</Text>
              <div className="text-center">
                <Text className="text-4xl font-bold text-blue-600">
                  {analyticsData.overview.responseRate}%
                </Text>
                <Text c="dimmed" size="sm">
                  {analyticsData.overview.approved + analyticsData.overview.rejected} out of {analyticsData.overview.total} feedbacks responded
                </Text>
              </div>
            </Card>
          </Grid.Col>
        </Grid>
      </div>
    </div>
  );
};

export default FeedbackAnalytics;