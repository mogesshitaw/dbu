/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  Badge,
  Group,
  Text,
  ThemeIcon,
  Button,
  ActionIcon,
  Title,
  Avatar,
  Tooltip,
  Box,
  Stack,
  Card,
  Center,
  ScrollArea,
  SimpleGrid,
  Pagination,
} from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconSchool,
  IconCertificate,
  IconPlus,
  IconClock,
  IconBook,
  IconCategory,
  IconChevronRight,
  IconFilter,
  IconSearch,
  IconStar,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Found, Authentication, UnauthorizedAccess } from "@/app/auth/auth";

interface ViewCoursesProps {
  courses: any[];
  totalCourses: number;
  onEditClick: (course: any) => void;
  onDeleteClick: (courseId: number) => void;
  searchTerm: string;
  categoryFilter: string | null;
}

const ViewCourses: React.FC<ViewCoursesProps> = ({
  courses,
  onEditClick,
  onDeleteClick,
  searchTerm,
  categoryFilter,
}) => {
  const router = useRouter();
  const hasActiveFilters = searchTerm || categoryFilter;
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  //Paginated data
  const paginatedCourse = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return courses.slice(startIndex, startIndex + itemsPerPage);
  }, [courses, currentPage]);
  const totalPages = Math.ceil(courses.length / itemsPerPage);

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Major Course': return { badge: 'blue', bg: '#3b82f6', light: '#dbeafe' };
      case 'Support Course': return { badge: 'green', bg: '#10b981', light: '#d1fae5' };
      case 'Common Course': return { badge: 'purple', bg: '#8b5cf6', light: '#ede9fe' };
      case 'Elective Course': return { badge: 'orange', bg: '#f59e0b', light: '#fef3c7' };
      case 'Core Course': return { badge: 'red', bg: '#ef4444', light: '#fee2e2' };
      default: return { badge: 'gray', bg: '#6b7280', light: '#f3f4f6' };
    }
  };
   const [user, setUser] = useState<any>(null);
     useEffect(() => {
       const checkAuth = async () => {
         const foundUser = await Found();
         setUser(foundUser);
       };
       checkAuth();
     }, []);

    if (user === null ) { 
      return <Authentication />;
  }
    if (user?.role !== 'admin') {
      return <UnauthorizedAccess />
    }
  // Get credit hour badge variant
  const getCreditVariant = (credits: number) => {
    if (credits >= 4) return { color: 'blue', label: 'Heavy' };
    if (credits >= 3) return { color: 'green', label: 'Medium' };
    return { color: 'yellow', label: 'Light' };
  };

  // Empty state component
  if (courses.length === 0) {
    return (
      <Card
        withBorder
        radius="xl"
        className="border-blue-200 overflow-hidden bg-gradient-to-br from-white to-blue-50 min-h-[500px]"
      >
        <Center className="h-full">
          <Stack align="center" gap="xl">
            <Box className="relative">
              <ThemeIcon
                size={120}
                color="blue"
                variant="light"
                radius="xl"
                className="border-8 border-blue-100"
              >
                <IconSchool size={60} stroke={1.5} />
              </ThemeIcon>
              <div className="absolute -top-2 -right-2">
                <ThemeIcon size={40} color="blue" radius="xl">
                  <IconSearch size={20} />
                </ThemeIcon>
              </div>
            </Box>

            <div className="text-center max-w-md">
              <Title order={2} c="blue" mb="xs">
                {hasActiveFilters ? "No Results Found" : "Course Catalog Empty"}
              </Title>
              <Text c="dimmed" size="lg" mb="lg">
                {hasActiveFilters
                  ? "No courses match your current search or filter criteria. Try different keywords or clear filters."
                  : "Your course catalog is currently empty. Start building your academic curriculum by adding courses."}
              </Text>
            </div>

            <Group>
              {hasActiveFilters ? (
                <Button
                  variant="light"
                  color="blue"
                  size="lg"
                  radius="xl"
                  leftSection={<IconFilter size={20} />}
                  onClick={() => {
                    // Clear filters logic would go here
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button
                  leftSection={<IconPlus size={20} />}
                  onClick={() => router.push("/dashboard/admin/manageCourse/add")}
                  size="lg"
                  radius="xl"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  rightSection={<IconChevronRight size={20} />}
                >
                  Create First Course
                </Button>
              )}
            </Group>
          </Stack>
        </Center>
      </Card>
    );
  }

  return (
    <Card
      withBorder
      radius="xl"
      className="border-blue-100 overflow-hidden bg-white shadow-xl"
      p={0}
    >

      {/* Stats Bar */}
      <div className="px-8 py-4 bg-blue-50 border-b border-blue-100">
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          <Group gap="xs">
            <ThemeIcon size="sm" color="blue" variant="light" radius="md">
              <IconBook size={14} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">Total Credits</Text>
              <Text fw={600} size="sm">
                {courses.reduce((sum, course) => sum + (course.credit_hour || 0), 0)} credits
              </Text>
            </div>
          </Group>

          <Group gap="xs">
            <ThemeIcon size="sm" color="green" variant="light" radius="md">
              <IconCategory size={14} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">Categories</Text>
              <Text fw={600} size="sm">
                {Array.from(new Set(courses.map(c => c.category))).length}
              </Text>
            </div>
          </Group>

          <Group gap="xs">
            <ThemeIcon size="sm" color="purple" variant="light" radius="md">
              <IconClock size={14} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed">Avg. Credits</Text>
              <Text fw={600} size="sm">
                {(courses.reduce((sum, course) => sum + (course.credit_hour || 0), 0) / courses.length).toFixed(1)}
              </Text>
            </div>
          </Group>
        </SimpleGrid>
      </div>

      {/* Courses Table */}
      <ScrollArea>
        <Table.ScrollContainer minWidth={800}>
          <Table verticalSpacing="sm" striped
            highlightOnHover
            className="min-w-full"
            classNames={{
              table: "rounded-lg",
              thead: "bg-gradient-to-r from-blue-50 to-indigo-50 sticky top-0 z-10",
              th: "text-blue-700 font-bold py-5 px-6 border-b-2 border-blue-200 text-sm uppercase tracking-wide",
              td: "py-5 px-6 border-b border-blue-50 transition-all duration-300 group-hover:bg-blue-50/70",
              tr: "group hover:bg-blue-50/30 transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500",
            }}
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="pl-8">#</Table.Th>
                <Table.Th className="pl-8">COURSE DETAILS</Table.Th>
                <Table.Th className="text-center">CREDITS</Table.Th>
                <Table.Th className="text-center">LEC.HR</Table.Th>
                <Table.Th className="text-center">LAB.HR</Table.Th>
                <Table.Th className="text-center">TUT.HR</Table.Th>
                <Table.Th>CATEGORY</Table.Th>
                <Table.Th className="pr-8 text-center">ACTIONS</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedCourse.map((course, index) => {
                const categoryColor = getCategoryColor(course.category);
                const creditVariant = getCreditVariant(course.credit_hour);

                return (
                  <Table.Tr
                    key={course.course_id}
                    className="group"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(course);
                    }}
                  >
                    <Table.Td>{(currentPage - 1) * itemsPerPage + index + 1}</Table.Td>
                    <Table.Td className="pl-8">
                      <Group gap="md">
                        <Avatar
                          size="lg"
                          radius="lg"
                          color="blue"
                          variant="light"
                          className="border-2 border-blue-200"
                        >
                          <IconCertificate size={20} />
                        </Avatar>
                        <div>
                          <Group gap="xs" mb={4}>
                            <Text fw={700} className="text-blue-700 font-mono text-base tracking-wide">
                              {course.course_code}
                            </Text>
                            {index < 3 && (
                              <Badge
                                size="xs"
                                color="yellow"
                                variant="light"
                                leftSection={<IconStar size={10} />}
                              >
                                Featured
                              </Badge>
                            )}
                          </Group>
                          <Text
                            className="text-gray-800 font-medium group-hover:text-blue-900 transition-colors max-w-md"
                            lineClamp={1}
                          >
                            {course.course_name}
                          </Text>
                          {course.description && (
                            <Text
                              size="sm"
                              c="dimmed"
                              lineClamp={1}
                              className="mt-1"
                            >
                              {course.description}
                            </Text>
                          )}
                        </div>
                      </Group>
                    </Table.Td>

                    <Table.Td className="text-center">
                      <Stack align="center" gap={2}>
                        <Badge
                          color={creditVariant.color}
                          variant="light"
                          size="xl"
                          className="font-bold text-lg px-3"
                          radius="md"
                        >
                          {course.credit_hour}
                        </Badge>
                        <Text size="xs" c="dimmed" fw={50}>
                          {creditVariant.label} • {course.credit_hour} credit{course.credit_hour !== 1 ? 's' : ''}
                        </Text>
                      </Stack>
                    </Table.Td>

                    <Table.Td className="text-center">
                      <Badge
                        color="green"
                        variant="light"
                        size="lg"
                        className="font-semibold px-3"
                        radius="md"
                      >
                        {course.lec_hr || 0}
                      </Badge>
                    </Table.Td>

                    <Table.Td className="text-center">
                      <Badge
                        color="purple"
                        variant="light"
                        size="lg"
                        className="font-semibold px-3"
                        radius="md"
                      >
                        {course.lab_hr || 0}
                      </Badge>
                    </Table.Td>

                    <Table.Td className="text-center">
                      <Badge
                        color="orange"
                        variant="light"
                        size="lg"
                        className="font-semibold px-3"
                        radius="md"
                      >
                        {course.tut_hr || 0}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <Badge
                        color={categoryColor.badge}
                        variant="light"
                        size="lg"
                        className="font-semibold px-3"
                        radius="md"
                        leftSection={
                          <div
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: categoryColor.bg }}
                          />
                        }
                      >
                        {course.category}
                      </Badge>
                    </Table.Td>



                    <Table.Td className="pr-8">
                      <Group gap="xs" justify="center">
                        <Tooltip label="Edit course" position="top" withArrow>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            size="lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditClick(course);
                            }}
                            className="action-btn hover:scale-110 transition-all duration-200 hover:bg-blue-100 border border-blue-200"
                            radius="md"
                          >
                            <IconEdit size={18} stroke={1.5} />
                          </ActionIcon>
                        </Tooltip>

                        <Tooltip label="Delete course" position="top" withArrow>
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteClick(course.course_id);
                            }}
                            className="action-btn hover:scale-110 transition-all duration-200 hover:bg-red-100 border border-red-200"
                            radius="md"
                          >
                            <IconTrash size={18} stroke={1.5} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box p="md" className="bg-gray-50 border-t">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, courses.length)} of{' '}
              {courses.length} departments
            </Text>
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
              radius="md"
              size="sm"
              withEdges
            />
          </Group>
        </Box>
      )}



    </Card>
  );
};

export default ViewCourses;