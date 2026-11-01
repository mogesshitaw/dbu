/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import { Paper, Group, Text, Badge, Grid } from "@mantine/core";
import { 
  IconBooks, 
  IconCertificate, 
  IconCategory, 
  IconSchool 
} from "@tabler/icons-react";

interface CourseStatsProps {
  courses: any[];
}

const CourseStats: React.FC<CourseStatsProps> = ({ courses }) => {
  // Calculate statistics
  const totalCourses = courses.length;
  const majorCourses = courses.filter(course => course.category === 'Major Course').length;
  const supportCourses = courses.filter(course => course.category === 'Support Course').length;
//   const commonCourses = courses.filter(course => course.category === 'Common Course').length;
  const totalCredits = courses.reduce((sum, course) => sum + (course.credit_hour || 0), 0);

  const stats = [
    {
      label: "Total Courses",
      value: totalCourses,
      icon: IconBooks,
      color: "blue",
      description: "All courses in catalog"
    },
    {
      label: "Major Courses",
      value: majorCourses,
      icon: IconCertificate,
      color: "green",
      description: "Core program courses"
    },
    {
      label: "Support Courses",
      value: supportCourses,
      icon: IconCategory,
      color: "orange",
      description: "Foundation courses"
    },
    {
      label: "Total Credits",
      value: totalCredits,
      icon: IconSchool,
      color: "violet",
      description: "Sum of all credit hours"
    }
  ];

  return (
    <Grid gutter="md">
      {stats.map((stat, index) => (
        <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 3 }}>
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
              <div>
                <Text c="dimmed" size="sm" tt="uppercase" fw={700}>
                  {stat.label}
                </Text>
                <Text fw={700} size="xl" mt="xs">
                  {stat.value}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  {stat.description}
                </Text>
              </div>
              <Badge 
                color={stat.color} 
                variant="light" 
                size="lg"
                p="md"
              >
                <stat.icon size={20} />
              </Badge>
            </Group>
          </Paper>
        </Grid.Col>
      ))}
    </Grid>
  );
};

export default CourseStats;