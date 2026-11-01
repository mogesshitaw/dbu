/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState , useEffect} from "react";
import {
  Card,
  Title,
  Text,
  Group,
  Button,
  Stack,
  Container,
  Paper,
  Grid,
  Box,
  ThemeIcon,
  Badge,
  SimpleGrid,
} from "@mantine/core";
import {
  IconCalendarPlus,
  IconCalendarTime,
  IconBooks,
  IconClock,
  IconList,
  IconPlus,
} from "@tabler/icons-react";
import ShowCourse from "./ShowCourse";
import Addschedule from "./addschedule";
import BatchSemesterSelector from "./BatchSemesterSelector";
import { Authentication,Found } from "@/app/auth/auth";


const ManageSchedule: React.FC = () => {
  const [activeSection, setActiveSection] = useState("viewschedule");

 
 const [user, setUser] = useState<any>(null);
   useEffect(() => {
     const checkAuth = async () => {
       const foundUser = await Found();
       setUser(foundUser);
     };
     checkAuth();
   }, []);
 
   if (user === null) {
     // Not logged in → show authentication page
     return <Authentication />;
   }
  const sections = [
    {
      key: "addschedule",
      label: "Add Schedule",
      description: "Create new class schedules",
      icon: IconCalendarPlus,
      color: "blue",
      badge: "New",
    },
    {
      key: "viewschedule",
      label: "View Schedule",
      description: "Browse by batch & semester",
      icon: IconCalendarTime,
      color: "green",
      badge: "Popular",
    },
    {
      key: "showCourses",
      label: "All Courses",
      description: "Manage course catalog",
      icon: IconBooks,
      color: "violet",
      badge: "Catalog",
    },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "addschedule":
        return <Addschedule />;
      case "viewschedule":
        return <BatchSemesterSelector />;
      case "showCourses":
        return <ShowCourse />;
      default:
        return (
          <Card className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <ThemeIcon size={64} color="gray" variant="light" className="mb-4">
                <IconClock size={32} />
              </ThemeIcon>
              <Title order={3} c="dimmed" mb="xs">
                Schedule Management
              </Title>
              <Text c="dimmed">
                Select an option above to manage your schedules
              </Text>
            </div>
          </Card>
        );
    }
  };

  const activeSectionData = sections.find(section => section.key === activeSection);

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        {/* Header Section */}
        <Box className="text-center">
          <Title order={1} className="text-blue-800 mb-3 font-bold">
            📅 Schedule Management
          </Title>
          <Text c="dimmed" size="lg" className="max-w-2xl mx-auto">
            Efficiently manage class schedules, course timetables, and academic planning
          </Text>
        </Box>



        <Grid gutter="xl">
          {/* Sidebar Navigation - Desktop */}
          <Grid.Col span={{ base: 12, md: 3 }}>
            <div className="border-blue-100 hidden lg md:block sticky top-4 bg-gradient-to-br from-blue-50/50 to-white">
            <Card 
              shadow="sm" 
              padding="lg" 
              radius="lg" 
              withBorder
            >
              <Card.Section withBorder inheritPadding py="md" className="bg-gradient-to-r from-blue-500 to-blue-600">
                <Group>
                  <ThemeIcon size={32} color="white" variant="transparent">
                    <IconList size={20} />
                  </ThemeIcon>
                  <Text fw={700} size="lg" className="text-white">
                    Schedule Tools
                  </Text>
                </Group>
              </Card.Section>

              <Stack gap="xs" mt="md">
                {sections.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <Button
                      key={section.key}
                      variant={activeSection === section.key ? "filled" : "light"}
                      color={section.color as any}
                      justify="start"
                      fullWidth
                      size="lg"
                      leftSection={<IconComponent size={20} />}
                      rightSection={
                        <Badge 
                          color={section.color} 
                          variant={activeSection === section.key ? "white" : "light"}
                          size="xs"
                        >
                          {section.badge}
                        </Badge>
                      }
                      onClick={() => setActiveSection(section.key)}
                      className={`
                        transition-all duration-300 rounded-xl h-16
                        ${activeSection === section.key 
                          ? 'shadow-lg transform scale-[1.02]' 
                          : 'border-2 border-transparent hover:border-blue-200 hover:shadow-md'
                        }
                      `}
                    >
                      <div className="text-left flex-1">
                        <Text fw={600} size="sm">
                          {section.label}
                        </Text>
                        <Text size="xs" c="dimmed" className="mt-1" lineClamp={1}>
                          {section.description}
                        </Text>
                      </div>
                    </Button>
                  );
                })}
              </Stack>

              {/* Quick Stats */}
              <Card.Section withBorder inheritPadding py="md" mt="md" className="bg-gray-50/50 rounded-lg">
                <SimpleGrid cols={2} spacing="xs">
                  <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                    <Text fw={700} size="sm" className="text-blue-600">
                      {sections.length}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Tools
                    </Text>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg shadow-sm">
                    <Text fw={700} size="sm" className="text-green-600">
                      Active
                    </Text>
                    <Text size="xs" c="dimmed">
                      {activeSectionData?.label}
                    </Text>
                  </div>
                </SimpleGrid>
              </Card.Section>
            </Card>
            </div>

            {/* Mobile Stats */}
            <Paper 
              p="md" 
              radius="lg" 
              withBorder 
              className="md:hidden mt-4 bg-gradient-to-r from-blue-50 to-indigo-50"
            >
              <SimpleGrid cols={2} spacing="md">
                <div className="md:hidden text-center p-3 bg-white rounded-lg shadow-sm border border-blue-100">
                  <Text fw={700} size="lg" className="text-blue-600">
                    {sections.length}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Tools
                  </Text>
                </div>
                <div className=" md:hidden text-center p-3 bg-white rounded-lg shadow-sm border border-green-100">
                  <Text fw={700} size="lg" className="text-green-600 capitalize">
                    {activeSection}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Active
                  </Text>
                </div>
              </SimpleGrid>
            </Paper>
          </Grid.Col>

          {/* Main Content Area */}
          <Grid.Col span={{ base: 12, md: 9 }}>
            <Paper 
              shadow="md" 
              radius="lg" 
              withBorder 
              className="border-blue-100 min-h-[600px] overflow-hidden bg-gradient-to-br from-white to-blue-50/30"
            >
              {/* Active Section Header */}
              <Paper 
                p="md" 
                radius="lg" 
                withBorder 
                className="border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50"
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group>
                    <ThemeIcon 
                      size={40} 
                      color={activeSectionData?.color || "blue"} 
                      variant="light"
                    >
                      <IconPlus size={20} />
                    </ThemeIcon>
                    <div>
                      <Title order={3} className="text-gray-800">
                        {activeSectionData?.label || "Schedule Management"}
                      </Title>
                      <Text c="dimmed" size="sm">
                        {activeSectionData?.description || "Manage your academic schedules"}
                      </Text>
                    </div>
                  </Group>
                  <Badge 
                    color={activeSectionData?.color || "blue"} 
                    variant="filled" 
                    size="lg"
                  >
                    {activeSectionData?.badge || "Active"}
                  </Badge>
                </Group>
              </Paper>

              {/* Section Content */}
              <div className="p-6">
                {renderSection()}
              </div>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Bottom Navigation for Mobile */}
        <div  className="md:hidden  lg fixed bottom-4 py-5 left-4 right-4 bg-white/95 backdrop-blur-sm border-blue-200 shadow-lg z-50">
          <SimpleGrid cols={3} spacing="xs">
            {sections.map((section) => {
              const IconComponent = section.icon;
              const isActive = activeSection === section.key;
              return (
                <Button
                  key={section.key}
                  variant={isActive ? "filled" : "light"}
                  color={section.color as any}
                  size="compact-lg"
                  onClick={() => setActiveSection(section.key)}
                  className={`
                    transition-all duration-200 py-4 rounded-lg
                    ${isActive ? 'shadow-md' : ''}
                  `}
                >
                  <div className="flex flex-col py-5 items-center gap-1">
                    <IconComponent size={0} />
                    <Text size="xs" fw={500}>
                      {section.label.split(' ')[0]}
                    </Text>
                  </div>
                </Button>
              );
            })}
          </SimpleGrid>
        </div>
      </Stack>
    </Container>
  );
};

export default ManageSchedule;