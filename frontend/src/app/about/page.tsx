"use client";

import React from "react";
import Link from "next/link";
import Header from "@/compnent/header";
import {
  Container,
  Card,
  Text,
  Title,
  Group,
  Stack,
  List,
  ThemeIcon,
  Avatar,
  Grid,
  Button,
  Badge,
  Paper,
} from "@mantine/core";
import {
  AcademicCapIcon,
  LightBulbIcon,
  UsersIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {
  AcademicCapIcon as AcademicCapSolid,
  CheckCircleIcon as CheckCircleSolid,
  StarIcon,
} from "@heroicons/react/24/solid";
import Footer from "@/compnent/footer";

const AboutPage = () => {
  const features = [
    {
      icon: ClockIcon,
      title: "Real-time Updates",
      description: "Access up-to-date schedule information instantly"
    },
    {
      icon: ChartBarIcon,
      title: "Conflict Resolution",
      description: "Automatically detect and prevent scheduling conflicts"
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure & Reliable",
      description: "Enterprise-grade security for your academic data"
    },
    {
      icon: UserGroupIcon,
      title: "Multi-user Access",
      description: "Collaborative scheduling for teams and departments"
    }
  ];

  const stakeholders = [
    {
      role: "Students",
      description: "Easily find classes, locations, and times",
      color: "blue",
      count: "5000+"
    },
    {
      role: "Instructors",
      description: "Manage teaching schedules and optimize delivery",
      color: "green",
      count: "300+"
    },
    {
      role: "Department Heads",
      description: "Oversee academic planning and resource allocation",
      color: "violet",
      count: "25+"
    },
    {
      role: "Administration",
      description: "Streamline institutional scheduling processes",
      color: "orange",
      count: "50+"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-10 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-10 left-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <Header isActive="/about"/>

      <Container size="lg" className="relative z-10 py-8">
        {/* Hero Section */}
        <Card 
          shadow="xl" 
          radius="xl" 
          padding="xl" 
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white mb-12 transform transition-all duration-500 hover:shadow-2xl"
        >
          <Stack align="center" gap="md" className="text-center">
            <Group>
              <ThemeIcon size={60} radius="xl" variant="filled" color="white" className="text-blue-600">
                <AcademicCapSolid className="w-8 h-8" />
              </ThemeIcon>
            </Group>
            <Title order={1} className="text-3xl md:text-5xl font-black">
              About Our Class Schedule System
            </Title>
            <Text size="xl" className="text-blue-100 max-w-2xl">
              Revolutionizing academic scheduling at Debre Berhan University with cutting-edge technology
            </Text>
            <Badge size="lg" color="yellow" variant="filled" className="mt-4">
              🚀 Powered by Innovation
            </Badge>
          </Stack>
        </Card>

        <Grid gutter="xl">
          {/* Mission & Vision */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card 
              shadow="md" 
              radius="lg" 
              padding="xl" 
              className="h-full bg-white/80 backdrop-blur-sm border-0 transform transition-all duration-300 hover:scale-105 hover:shadow-xl group"
            >
              <Stack align="center" gap="md">
                <ThemeIcon size={80} radius="xl" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                  <AcademicCapIcon className="w-10 h-10" />
                </ThemeIcon>
                <Title order={2} className="text-2xl font-bold text-blue-800 text-center">
                  Our Mission
                </Title>
                <Text size="lg" className="text-gray-700 text-center leading-relaxed">
                  To empower Debre Berhan University with an intuitive and efficient system that 
                  simplifies class scheduling, optimizes resource allocation, and enhances 
                  the academic experience for every member of the university community.
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card 
              shadow="md" 
              radius="lg" 
              padding="xl" 
              className="h-full bg-white/80 backdrop-blur-sm border-0 transform transition-all duration-300 hover:scale-105 hover:shadow-xl group"
            >
              <Stack align="center" gap="md">
                <ThemeIcon size={80} radius="xl" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>
                  <LightBulbIcon className="w-10 h-10" />
                </ThemeIcon>
                <Title order={2} className="text-2xl font-bold text-blue-800 text-center">
                  Our Vision
                </Title>
                <Text size="lg" className="text-gray-700 text-center leading-relaxed">
                  To be the leading digital solution for academic scheduling, fostering a 
                  seamless and organized educational environment that supports Debre Berhan 
                  University&apos;s commitment to academic excellence and innovation.
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          {/* Key Features */}
          <Grid.Col span={12}>
            <Card shadow="md" radius="lg" padding="xl" className="bg-white/80 backdrop-blur-sm border-0">
              <Stack gap="xl">
                <Group justify="center">
                  <ThemeIcon size={60} radius="xl" variant="light" color="green">
                    <CheckCircleSolid className="w-8 h-8" />
                  </ThemeIcon>
                  <Title order={2} className="text-3xl font-bold text-blue-800">
                    Key Features & Benefits
                  </Title>
                </Group>
                
                <Grid gutter="md">
                  {features.map((feature, index) => (
                    <Grid.Col key={index} span={{ base: 12, sm: 6 }}>
                      <Paper 
                        p="md" 
                        withBorder 
                        className="bg-white/50 backdrop-blur-sm border-blue-100 transform transition-all duration-300 hover:scale-105 hover:shadow-md group"
                      >
                        <Group>
                          <ThemeIcon size={50} radius="lg" variant="light" color="blue">
                            <feature.icon className="w-6 h-6" />
                          </ThemeIcon>
                          <Stack gap="xs">
                            <Text fw={600} className="text-blue-800">
                              {feature.title}
                            </Text>
                            <Text size="sm" className="text-gray-600">
                              {feature.description}
                            </Text>
                          </Stack>
                        </Group>
                      </Paper>
                    </Grid.Col>
                  ))}
                </Grid>

                <List
                  size="lg"
                  center
                  icon={
                    <ThemeIcon color="blue" size={24} radius="xl">
                      <StarIcon className="w-4 h-4" />
                    </ThemeIcon>
                  }
                >
                  <List.Item>
                    <Text className="text-gray-700">
                      Our platform enables faculty, department heads, and students to access 
                      up-to-date schedule information in real-time
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text className="text-gray-700">
                      It eliminates scheduling conflicts, reduces paperwork, and ensures 
                      transparency across departments
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text className="text-gray-700">
                      With a focus on ease of use, automation, and reliability, this system 
                      is a step forward in digital transformation
                    </Text>
                  </List.Item>
                  <List.Item>
                    <Text className="text-gray-700">
                      We are committed to improving administrative efficiency and supporting 
                      quality education through smart technology solutions
                    </Text>
                  </List.Item>
                </List>
              </Stack>
            </Card>
          </Grid.Col>

          {/* Stakeholders */}
          <Grid.Col span={12}>
            <Card shadow="md" radius="lg" padding="xl" className="bg-white/80 backdrop-blur-sm border-0">
              <Stack gap="xl">
                <Group justify="center">
                  <ThemeIcon size={60} radius="xl" variant="light" color="indigo">
                    <UsersIcon className="w-8 h-8" />
                  </ThemeIcon>
                  <Title order={2} className="text-3xl font-bold text-blue-800">
                    Who Benefits From Our System?
                  </Title>
                </Group>

                <Grid gutter="lg">
                  {stakeholders.map((stakeholder, index) => (
                    <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 3 }}>
                      <Card 
                        shadow="sm" 
                        radius="lg" 
                        padding="lg" 
                        className="text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg border-0 bg-gradient-to-br from-white to-gray-50"
                      >
                        <Stack align="center" gap="sm">
                          <Avatar 
                            size={80} 
                            radius="xl" 
                            color={stakeholder.color} 
                            variant="light"
                            className="border-4 border-white shadow-lg"
                          >
                            <Text fw={700} size="xl" className="text-gray-700">
                              {stakeholder.count}
                            </Text>
                          </Avatar>
                          <Badge color={stakeholder.color} variant="light" size="lg">
                            {stakeholder.role}
                          </Badge>
                          <Text size="sm" className="text-gray-600">
                            {stakeholder.description}
                          </Text>
                        </Stack>
                      </Card>
                    </Grid.Col>
                  ))}
                </Grid>
              </Stack>
            </Card>
          </Grid.Col>

          {/* Contact Section */}
          <Grid.Col span={12}>
            <Card 
              shadow="md" 
              radius="lg" 
              padding="xl" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            >
              <Stack gap="xl" align="center">
                <Group>
                  <ThemeIcon size={60} radius="xl" variant="white" color="blue">
                    <EnvelopeIcon className="w-8 h-8" />
                  </ThemeIcon>
                  <Title order={2} className="text-3xl font-bold text-white">
                    Get In Touch
                  </Title>
                </Group>
                
                <Text size="xl" className="text-blue-100 text-center max-w-2xl">
                  Have questions or need further information? We are here to help!
                </Text> 

                <Grid gutter="xl" className="w-full">
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Group justify="center">
                      <MapPinIcon className="w-8 h-8 text-blue-200" />
                      <Stack gap={0} align="center">
                        <Text fw={600}>Address</Text>
                        <Text size="sm" className="text-blue-100">
                          Debre Berhan University, Debre Berhan, Ethiopia
                        </Text>
                      </Stack>
                    </Group>
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Group justify="center">
                      <EnvelopeIcon className="w-8 h-8 text-blue-200" />
                      <Stack gap={0} align="center">
                        <Text fw={600}>Email</Text>
                        <Link 
                          href="mailto:madonnaeph21@gmail.com"
                          className="text-blue-100 hover:text-white transition-colors"
                        >
                          info@dbu.edu.et
                        </Link>
                      </Stack>
                    </Group>
                  </Grid.Col>
                  
                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Group justify="center">
                      <PhoneIcon className="w-8 h-8 text-blue-200" />
                      <Stack gap={0} align="center">
                        <Text fw={600}>Phone</Text>
                        <Link 
                          href="tel:+251945663473"
                          className="text-blue-100 hover:text-white transition-colors"
                        >
                          +251 945 663 473
                        </Link>
                      </Stack>
                    </Group>
                  </Grid.Col>
                </Grid>

                <Button 
                  size="lg" 
                  variant="white" 
                  color="blue" 
                  radius="xl"
                  className="mt-4 transform transition-all duration-300 hover:scale-105"
                  component={Link}
                  href="/contact"
                >
                  Contact Us Now
                </Button>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Container>
       <Footer />
      {/* Animations */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

    </div>
  );
};

export default AboutPage;