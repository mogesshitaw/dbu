/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Title,
  Text,
  Table,
  Badge,
  Group,
  Stack,
  ThemeIcon,
  TextInput,
  Grid,
  Alert,
  Paper,
  Flex,
} from "@mantine/core";
import {
  IconBooks,
  IconAlertCircle,
  IconSearch,
  IconEye,
  IconCertificate,
  IconClock,
  IconCategory,
  IconFilter,
} from "@tabler/icons-react";

// Redux imports
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchCourses } from "@/store/slices/coursesSlice";
import {
  selectCoursesWithDepartments,
  selectCoursesLoading,
  selectCoursesError,
  selectCoursesCount,
} from "@/store/selectors/coursesSelectors";
import { Authentication, Found } from "@/app/auth/auth";

const ShowCourse: React.FC = () => {
  const dispatch = useAppDispatch();

  // Redux selectors
  const courses = useAppSelector(selectCoursesWithDepartments);
  const loading = useAppSelector(selectCoursesLoading);
  const error = useAppSelector(selectCoursesError);
  const coursesCount = useAppSelector(selectCoursesCount);

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalCredits: 0,
    categories: {} as Record<string, number>,
  });

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchCourses());
  }, [dispatch]);

  // Calculate statistics
  useEffect(() => {
    if (courses.length > 0) {
      const totalCredits = courses.reduce((sum, course) => sum + (course.credit_hour || 0), 0);
      const categories = courses.reduce((acc, course) => {
        const category = course.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      setStats({ totalCredits, categories });
    }
  }, [courses]);

  // Authentication check
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

  // Filter courses based on search term
  const filteredCourses = courses.filter(course =>
    course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Paper className="min-h-[500px] flex items-center justify-center" radius="lg" withBorder>
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            <IconBooks size={24} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-500" />
          </div>
          <Text fw={600} mt="md" className="text-blue-600">Loading Course Catalog</Text>
          <Text c="dimmed" size="sm" mt="xs">Fetching the latest course information...</Text>
        </div>
      </Paper>
    );
  }

  return (
    <Stack gap="xl">
      {/* Header Section with Stats */}
      <Card
        shadow="lg"
        padding={0}
        radius="lg"
        className="overflow-hidden border-0"
      >
        <div className="relative  via-blue-500 to-emerald-600">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
          </div>

          <Card.Section inheritPadding py="3">
            <Group justify="space-between" align="flex-start">
              <Stack gap="xs">
                <Group>
                  <ThemeIcon size={48} color="blue" variant="transparent" className="bg-white/10 backdrop-blur-sm rounded-2xl">
                    <IconBooks size={24} />
                  </ThemeIcon>
                  <div>
                    <Title order={2} c='blue' className="text-blue font-bold">
                      Course Catalog
                    </Title>
                    <Text c="blue" size="lg" opacity={0.9} className="font-medium">
                      Explore our comprehensive course offerings
                    </Text>
                  </div>
                </Group>
              </Stack>
            </Group>
          </Card.Section>
        </div>

        {/* Search Bar */}
        <Card.Section inheritPadding py="lg" className="bg-white/90 backdrop-blur-sm">
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <TextInput
                placeholder="Search courses by code, name, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftSection={<IconSearch size={20} className="text-blue-500" />}
                size="lg"
                radius="lg"
                classNames={{
                  input: "border-2 border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 shadow-sm transition-all duration-300",
                  section: "text-blue-400",
                }}
                rightSection={
                  searchTerm && (
                    <IconFilter size={18} className="text-blue-400" />
                  )
                }
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Group justify="flex-end" h="100%">
                <Group gap="xs">
                  <Badge color="blue" variant="filled" size="lg" radius="lg" className="shadow-sm">
                    Total: {coursesCount}
                  </Badge>
                  <Badge color="teal" variant="filled" size="lg" radius="lg" className="shadow-sm">
                    Showing: {filteredCourses.length}
                  </Badge>
                </Group>
              </Group>
            </Grid.Col>
          </Grid>
        </Card.Section>
      </Card>

      {error && (
        <Alert
          icon={<IconAlertCircle size={24} />}
          title="Error Loading Courses"
          color="red"
          variant="light"
          radius="lg"
          className="border-2 border-red-200 shadow-sm"
        >
          <Text className="text-sm">{error}</Text>
        </Alert>
      )}



      {/* Courses Table */}
      <Card
        shadow="sm"
        padding={0}
        radius="lg"
        withBorder
        className="border-blue-100 overflow-hidden shadow-lg"
      >
        {filteredCourses.length === 0 ? (
          <Card.Section py="xl" className="text-center">
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full"></div>
              <IconBooks size={40} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" />
            </div>
            <Title order={4} c="dimmed" mb="xs" className="font-semibold">
              {searchTerm ? "No matching courses found" : "No courses available"}
            </Title>
            <Text c="dimmed" size="sm">
              {searchTerm ? "Try adjusting your search terms" : "Check back later for course updates"}
            </Text>
          </Card.Section>
        ) : (
          <>
            <Card.Section py="md" className="bg-gradient-to-r from-blue-50/30 to-blue-50/10">
              <div className="overflow-x-auto">
                <Table
                  verticalSpacing="md"
                  horizontalSpacing="lg"
                  className="min-w-full"
                >
                  <Table.Thead>
                    <Table.Tr className="border-b-2 border-blue-100">
                      <Table.Th className="pb-4 pl-8">
                        <Group gap="xs">
                          <IconCertificate size={18} className="text-blue-500" />
                          <Text className="text-blue-600 font-bold">Course Code</Text>
                        </Group>
                      </Table.Th>
                      <Table.Th className="pb-4">
                        <Text className="text-blue-600 font-bold">Course Name</Text>
                      </Table.Th>
                      <Table.Th className="pb-4 text-center">
                        <Group gap="xs" justify="center">
                          <IconClock size={18} className="text-blue-500" />
                          <Text className="text-blue-600 font-bold">Credit Hr</Text>
                        </Group>
                      </Table.Th>
                      <Table.Th className="pb-4 text-center">
                        <Text className="text-blue-600 font-bold">Lec Hr</Text>
                      </Table.Th>
                      <Table.Th className="pb-4 text-center">
                        <Text className="text-blue-600 font-bold">Lab Hr</Text>
                      </Table.Th>
                      <Table.Th className="pb-4 text-center">
                        <Text className="text-blue-600 font-bold">Tut Hr</Text>
                      </Table.Th>
                      <Table.Th className="pb-4">
                        <Text className="text-blue-600 font-bold">Category</Text>
                      </Table.Th>
                      <Table.Th className="pb-4 text-center pr-8">
                        <Text className="text-blue-600 font-bold">Status</Text>
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filteredCourses.map((course, index) => (
                      <Table.Tr
                        key={course.course_id}
                        className={`
                          transition-all duration-300 hover:shadow-md hover:scale-[1.002]
                          ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50/30'}
                          border-b border-blue-50 last:border-0
                        `}
                      >
                        <Table.Td className="pl-8">
                          <Group gap="md">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center shadow-sm">
                                <IconBooks size={16} className="text-white" />
                              </div>
                              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-white"></div>
                            </div>
                            <div>
                              <Text fw={700} className="text-blue-700 font-mono">
                                {course.course_code}
                              </Text>
                              <Text size="xs" c="dimmed" className="font-mono">
                                ID: {course.course_id}
                              </Text>
                            </div>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Stack gap={2}>
                            <Text className="text-gray-800 font-medium">
                              {course.course_name}
                            </Text>
                          </Stack>
                        </Table.Td>
                        <Table.Td className="text-center">
                          <Badge
                            color="blue"
                            variant="gradient"
                            gradient={{ from: 'blue', to: 'cyan' }}
                            size="lg"
                            className="min-w-[70px] shadow-sm font-bold py-2"
                          >
                            {course.credit_hour}
                          </Badge>
                        </Table.Td>
                        <Table.Td className="text-center">
                          <Badge
                            color="blue"
                            variant="light"
                            size="md"
                            className="min-w-[60px] font-semibold"
                          >
                            {course.lec_hr || 0}
                          </Badge>
                        </Table.Td>
                        <Table.Td className="text-center">
                          <Badge
                            color="blue"
                            variant="light"
                            size="md"
                            className="min-w-[60px] font-semibold"
                          >
                            {course.lab_hr || 0}
                          </Badge>
                        </Table.Td>
                        <Table.Td className="text-center">
                          <Badge
                            color="blue"
                            variant="light"
                            size="md"
                            className="min-w-[60px] font-semibold"
                          >
                            {course.tut_hr || 0}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge
                            color={
                              course.category?.includes('Major') ? 'blue' :
                                course.category?.includes('Support') ? 'teal' :
                                  course.category?.includes('Common') ? 'grape' : 'gray'
                            }
                            variant="filled"
                            size="md"
                            className="shadow-sm"
                            leftSection={<IconCategory size={12} />}
                          >
                            {course.category}
                          </Badge>
                        </Table.Td>
                        <Table.Td className="text-center pr-8">
                          <Badge
                            color="green"
                            variant="filled"
                            size="md"
                            className="shadow-sm animate-pulse-slow"
                          >
                            Active
                          </Badge>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </div>
            </Card.Section>

            {/* Footer */}
            <Card.Section
              withBorder
              inheritPadding
              py="md"
              className="bg-gradient-to-r from-blue-50/40 to-blue-50/10 border-t border-blue-100"
            >
              <Flex justify="space-between" align="center">
                <Group gap="xs">
                  <IconEye size={16} className="text-blue-500" />
                  <Text size="sm" c="blue" fw={600}>
                    View Only Mode
                  </Text>
                  <Text size="sm" c="dimmed">
                    • Browse courses without modifications
                  </Text>
                </Group>
                <Group gap="xs">
                  <Text size="sm" c="dimmed">
                    Page 1 of 1
                  </Text>
                  <Badge color="blue" variant="light" size="sm">
                    {filteredCourses.length} items
                  </Badge>
                </Group>
              </Flex>
            </Card.Section>
          </>
        )}
      </Card>

      {/* Stats Summary */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card
            padding="lg"
            radius="lg"
            withBorder
            className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-white text-center"
          >
            <ThemeIcon
              size={56}
              radius="lg"
              className="bg-gradient-to-br from-blue-500 to-blue-400 mx-auto mb-4 shadow-md"
            >
              <IconBooks size={24} />
            </ThemeIcon>
            <Text fw={700} size="xl" className="text-blue-600">{coursesCount}</Text>
            <Text c="dimmed" size="sm">Total Courses</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card
            padding="lg"
            radius="lg"
            withBorder
            className="border-teal-100 bg-gradient-to-br from-teal-50/50 to-white text-center"
          >
            <ThemeIcon
              size={56}
              radius="lg"
              className="bg-gradient-to-br from-teal-500 to-teal-400 mx-auto mb-4 shadow-md"
            >
              <IconClock size={24} />
            </ThemeIcon>
            <Text fw={700} size="xl" className="text-teal-600">{stats.totalCredits}</Text>
            <Text c="dimmed" size="sm">Total Credits</Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card
            padding="lg"
            radius="lg"
            withBorder
            className="border-purple-100 bg-gradient-to-br from-purple-50/50 to-white text-center"
          >
            <ThemeIcon
              size={56}
              radius="lg"
              className="bg-gradient-to-br from-purple-500 to-purple-400 mx-auto mb-4 shadow-md"
            >
              <IconCategory size={24} />
            </ThemeIcon>
            <Text fw={700} size="xl" className="text-purple-600">{Object.keys(stats.categories).length}</Text>
            <Text c="dimmed" size="sm">Categories</Text>
          </Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default ShowCourse;