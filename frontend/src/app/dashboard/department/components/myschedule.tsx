/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Card,
  Title,
  Text,
  Button,
  Group,
  Alert,
  Stack,
  Grid,
  Loader,
  Badge,
  Paper,
  ThemeIcon,
  Center,
  Box,
  Avatar,
  Divider,
  ScrollArea,
  Tooltip,
  Modal,
  ActionIcon,
  Tabs,
  SimpleGrid,
  Table,
} from "@mantine/core";
import {
  IconCalendar,
  IconUser,
  IconClock,
  IconMapPin,
  IconSchool,
  IconUsers,
  IconBuilding,
  IconAlertCircle,
  IconCoffee,
  IconChartBar,
  IconRefresh,
  IconLayoutGrid,
  IconLayoutList,
  IconCalendarTime,
  IconDownload,
} from "@tabler/icons-react";
import { useAppDispatch, useInstructor } from "@/hooks/redux";
import {
  fetchInstructorSchedule,
  fetchInstructorInfo,
  clearScheduleError,
} from "@/store/slices/instructorsSlice";
import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


const MySchedule: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);
  const dispatch = useAppDispatch();
  const {
    schedules,
    scheduleLoading,
    scheduleError,
  } = useInstructor();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [statsModalOpened, setStatsModalOpened] = useState(false);
  const [hasFetchedSchedule, setHasFetchedSchedule] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('calendar');

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  // Fetch current user session and automatically load schedule
  useEffect(() => {
    fetchUserSession();
  }, []);

  const fetchUserSession = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.loggedIn) {
          setCurrentUser(data.user);

          // Auto-fetch schedule if user is an instructor
          if (data.user.role === 'department_head' && data.user.id) {
            await handleAutoFetchSchedule(data.user.id, data.user);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch user session:', error);
    }
  };

  const handleAutoFetchSchedule = async (instructorId: string, userData: any) => {
    dispatch(clearScheduleError());

    try {
      await Promise.all([
        dispatch(fetchInstructorSchedule(instructorId)),
        dispatch(fetchInstructorInfo(instructorId)),
      ]);
      setHasFetchedSchedule(true);
    } catch (error) {
      console.error('Failed to fetch instructor data:', error);
      setHasFetchedSchedule(true);
    }
  };

  const handleRefreshSchedule = async () => {
    if (currentUser?.id) {
      await handleAutoFetchSchedule(currentUser.id, currentUser);
    }
  };

  const getDayColor = (day: string) => {
    const colors: { [key: string]: string } = {
      Monday: "blue",
      Tuesday: "teal",
      Wednesday: "violet",
      Thursday: "orange",
      Friday: "red",
      Saturday: "indigo",
    };
    return colors[day] || "gray";
  };

  const getTimeSlots = () => {
    const uniqueSlots = [...new Set(schedules.map(s => s.time_slot))].sort();
    return uniqueSlots.map(slot => {
      const firstSchedule = schedules.find(s => s.time_slot === slot);
      return {
        slot,
        start_time: firstSchedule?.start_time || '',
        end_time: firstSchedule?.end_time || '',
        isMorning: firstSchedule?.start_time ? parseInt(firstSchedule.start_time.split(':')[0]) < 12 : true
      };
    });
  };

  const getScheduleForTimeSlot = (day: string, timeSlot: string) => {
    return schedules.find(schedule =>
      schedule.day === day && schedule.time_slot === timeSlot
    );
  };

  // Group schedules by day for grid and list views
  const schedulesByDay = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    days.forEach(day => {
      grouped[day] = schedules.filter(s => s.day === day);
    });
    return grouped;
  }, [schedules]);

  const calculateStats = () => {
    const totalClasses = schedules.length;
    const classesPerDay = days.reduce((acc, day) => {
      acc[day] = schedules.filter(s => s.day === day).length;
      return acc;
    }, {} as any);

    const uniqueCourses = [...new Set(schedules.map(s => s.course_name))].length;
    const uniqueBatches = [...new Set(schedules.map(s => s.batch))].length;
    const uniqueSections = [...new Set(schedules.map(s => s.section))].length;

    const busiestDay = Object.keys(classesPerDay).reduce((a, b) =>
      classesPerDay[a] > classesPerDay[b] ? a : b, "Monday"
    );

    return {
      totalClasses,
      classesPerDay,
      uniqueCourses,
      uniqueBatches,
      uniqueSections,
      busiestDay,
    };
  };

  const stats = calculateStats();


const handleExportSchedule = async () => {
  if (schedules.length === 0) {
    alert('No schedule data available to export');
    return;
  }

  try {
    // Show loading indicator
    const loadingToast = window.alert ? window.alert('Generating PDF... Please wait.') : null;

    // Create HTML content for the schedule
    const dayColors: { [key: string]: { bg: string; border: string; text: string } } = {
      Monday: { bg: '#EBF5FF', border: '#3B82F6', text: '#1E40AF' },
      Tuesday: { bg: '#E6FFFA', border: '#14B8A6', text: '#0F766E' },
      Wednesday: { bg: '#F3E8FF', border: '#A855F7', text: '#7E22CE' },
      Thursday: { bg: '#FFF7ED', border: '#F97316', text: '#C2410C' },
      Friday: { bg: '#FEE2E2', border: '#EF4444', text: '#B91C1C' },
      Saturday: { bg: '#EEF2FF', border: '#6366F1', text: '#4338CA' },
    };

    const timeSlots = getTimeSlots();
    
    // Create a temporary div to render the schedule
    const tempDiv = document.createElement('div');
    tempDiv.style.width = '1200px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '40px';
    tempDiv.style.boxSizing = 'border-box';
    
    // Build HTML content
    tempDiv.innerHTML = `
      <div style="
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        width: 100%;
        background: white;
      ">
        <!-- Header -->
        <div style="
          text-align: center;
          margin-bottom: 40px;
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          padding: 30px;
          border-radius: 15px;
          color: white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        ">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold; margin-bottom: 10px;">
            👨‍🏫 Teaching Schedule
          </h1>
          <div style="font-size: 18px; opacity: 0.9; margin-bottom: 15px;">
            <strong>${currentUser?.full_name || 'Instructor'}</strong> | ID: ${currentUser?.id_number || 'N/A'}
          </div>
          <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
            <span style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; font-size: 14px;">
              🆔 ${currentUser?.id_number || 'N/A'}
            </span>
            <span style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; font-size: 14px;">
              🏛️ ${currentUser?.department_name || 'Department'}
            </span>
            <span style="background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 8px; font-size: 14px;">
              📚 ${stats.totalClasses} Total Classes
            </span>
          </div>
        </div>
        
        <!-- Schedule Table -->
        <table style="
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          border-radius: 10px;
          overflow: hidden;
        ">
          <thead>
            <tr style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);">
              <th style="
                border: 2px solid #e5e7eb;
                padding: 20px;
                text-align: center;
                color: white;
                font-weight: 700;
                font-size: 16px;
                text-transform: uppercase;
                min-width: 120px;
              ">
                ⏰ Time
              </th>
              ${days.map(day => `
                <th style="
                  border: 2px solid #e5e7eb;
                  padding: 20px;
                  text-align: center;
                  color: white;
                  font-weight: 700;
                  font-size: 16px;
                  text-transform: uppercase;
                ">
                  ${day}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${timeSlots.map(timeSlot => `
              <tr>
                <td style="
                  border: 2px solid #e5e7eb;
                  padding: 15px;
                  text-align: center;
                  background: #f9fafb;
                  font-weight: 700;
                  color: #374151;
                  min-width: 120px;
                ">
                  <div style="font-size: 14px; margin-bottom: 5px;">${timeSlot.start_time}</div>
                  <div style="font-size: 12px; color: #6b7280; margin: 5px 0;">to</div>
                  <div style="font-size: 14px; margin-top: 5px;">${timeSlot.end_time}</div>
                  <div style="
                    margin-top: 8px;
                    background: ${timeSlot.isMorning ? '#DBEAFE' : '#FEF3C7'};
                    color: ${timeSlot.isMorning ? '#1E40AF' : '#92400E'};
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    display: inline-block;
                  ">
                    ${timeSlot.isMorning ? 'Morning' : 'Afternoon'}
                  </div>
                </td>
                ${days.map(day => {
                  const schedule = getScheduleForTimeSlot(day, timeSlot.slot);
                  const colors = dayColors[day] || { bg: '#f9fafb', border: '#e5e7eb', text: '#374151' };
                  
                  if (schedule) {
                    return `
                      <td style="
                        border: 2px solid #e5e7eb;
                        padding: 12px;
                        background: ${colors.bg};
                        border-left: 6px solid ${colors.border};
                      ">
                        <div style="padding: 8px;">
                          <div style="font-weight: 700; color: ${colors.text}; margin-bottom: 6px; font-size: 14px;">
                            ${schedule.course_name}
                          </div>
                          <div style="color: #6b7280; font-size: 12px; margin-bottom: 8px;">
                            ${schedule.course_code}
                          </div>
                          <div style="margin-bottom: 6px; font-size: 12px;">
                            <span style="color: #374151;">📖 Batch: ${schedule.batch}</span>
                            <span style="color: #6b7280; margin-left: 8px;">| Sec: ${schedule.section}</span>
                          </div>
                          <div style="
                            background: #f3f4f6;
                            color: #374151;
                            padding: 4px 10px;
                            border-radius: 6px;
                            font-size: 12px;
                            display: inline-block;
                            margin-top: 8px;
                          ">
                            📍 ${schedule.room}
                          </div>
                        </div>
                      </td>
                    `;
                  } else {
                    return `
                      <td style="
                        border: 2px solid #e5e7eb;
                        padding: 12px;
                        color: #9ca3af;
                        font-style: italic;
                        text-align: center;
                        background: #f9fafb;
                      ">
                        -
                      </td>
                    `;
                  }
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Lunch Break Banner -->
        <div style="
          margin-top: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
          border-radius: 10px;
          text-align: center;
          color: #7c2d12;
          font-weight: 600;
          font-size: 16px;
        ">
          🍽️ Lunch Break: 12:00 PM - 1:00 PM • Time to recharge!
        </div>
        
        <!-- Footer -->
        <div style="
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        ">
          <div>Generated from Department Schedule Management System</div>
          <div style="margin-top: 8px; font-size: 12px;">
            ${user?.department_name || 'Department'} • ${new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    `;
    
    // Add to document body
    document.body.appendChild(tempDiv);
    
    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Convert to canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      width: tempDiv.scrollWidth,
      height: tempDiv.scrollHeight,
      onclone: (clonedDoc, element) => {
        // Ensure all styles are properly applied
        element.style.display = 'block';
        element.style.position = 'absolute';
        element.style.left = '0';
        element.style.top = '0';
      }
    });
    
    // Create PDF
    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF('l', 'mm', 'a4'); // Landscape orientation for better fit
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Calculate ratio to fit the page
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.95;
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 10;
    
    // Add image to PDF
    pdf.addImage(
      imgData,
      'PNG',
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    );
    
    // Add title as text (searchable)
    pdf.setFontSize(20);
    pdf.setTextColor(40, 40, 40);
    pdf.text(
      'Teaching Schedule - ' + (currentUser?.full_name || 'Instructor'),
      pdfWidth / 2,
      8,
      { align: 'center' }
    );
    
    // Add page numbers if multiple pages
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pdfWidth / 2,
        pdfHeight - 10,
        { align: 'center' }
      );
    }
    
    // Save PDF
    const fileName = `Teaching_Schedule_${currentUser?.full_name?.replace(/\s+/g, '_') || 'Instructor'}_${currentUser?.id_number || 'ID'}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);
    
    // Clean up
    document.body.removeChild(tempDiv);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};

  if (user === null) {
    return <Authentication />;
  }
  if (user?.role !== 'department_head') {
    return <UnauthorizedAccess />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Grid View Component
  const GridView = () => (
    <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
      {days.map(day => {
        const daySchedules = schedulesByDay[day];
        if (daySchedules.length === 0) return null;

        return (
          <Card
            key={day}
            shadow="md"
            padding="lg"
            radius="lg"
            className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 hover:shadow-xl transition-all duration-300"
          >
            <Stack gap="md">
              {/* Day Header */}
              <Group justify="space-between">
                <Badge
                  size="lg"
                  color={getDayColor(day)}
                  variant="light"
                  leftSection={<IconCalendar size={14} />}
                >
                  {day}
                </Badge>
                <Badge color="blue" variant="light" size="sm">
                  {daySchedules.length} classes
                </Badge>
              </Group>

              {/* Classes List */}
              <Stack gap="sm">
                {daySchedules.map((schedule, index) => (
                  <Paper
                    key={index}
                    p="md"
                    radius="md"
                    className="border-l-4 border-blue-500 bg-white"
                  >
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text fw={700} size="sm">{schedule.course_name}</Text>
                        <Badge size="xs" color="blue" variant="light">
                          {schedule.start_time} - {schedule.end_time}
                        </Badge>
                      </Group>
                      <Text size="sm" c="dimmed">{schedule.course_code}</Text>
                      <Group gap="xs">
                        <Badge size="xs" color="teal" variant="light">
                          {schedule.batch}
                        </Badge>
                        <Badge size="xs" color="orange" variant="light">
                          Sec {schedule.section}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        <IconMapPin size={12} className="inline mr-1" />
                        {schedule.room}- {schedule.room_type}
                      </Text>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Stack>
          </Card>
        );
      })}
    </SimpleGrid>
  );

  // List View Component
  const ListView = () => (
    <Stack gap="md">
      {schedules.map((schedule, index) => (
        <Paper
          key={index}
          p="lg"
          radius="lg"
          withBorder
          className="hover:shadow-md transition-all"
        >
          <Grid gutter="md" align="center">
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Badge
                color={getDayColor(schedule.day)}
                variant="light"
                size="lg"
                fullWidth
              >
                {schedule.day}
              </Badge>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 3 }}>
              <Stack gap={4}>
                <Text fw={600} size="lg">{schedule.course_name}</Text>
                <Text size="sm" c="dimmed">{schedule.course_code}</Text>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 3 }}>
              <Stack gap={4}>
                <Group gap="xs">
                  <Badge color="teal" variant="light" size="xs">
                    {schedule.batch}
                  </Badge>
                  <Badge color="orange" variant="light" size="xs">
                    Sec {schedule.section}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  <IconMapPin size={14} className="inline mr-1" />
                  {schedule.room}
                </Text>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 2 }}>
              <Group justify="center">
                <Badge color="blue" variant="light" size="md">
                  {schedule.start_time} - {schedule.end_time}
                </Badge>
              </Group>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 2 }}>
              <Group justify="flex-end">
                <Badge color="gray" variant="light" size="sm">
                  {schedule.time_slot}
                </Badge>
              </Group>
            </Grid.Col>
          </Grid>
        </Paper>
      ))}
    </Stack>
  );

  // Calendar View Component (Original view)
  const CalendarView = () => (
    <Paper
      radius="lg"
      p="md"
      className="border border-gray-200/40 shadow-lg"
    >
      <ScrollArea>
        <div className="overflow-x-auto">
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr className="bg-gradient-to-r from-gray-50 to-cyan-100/50">
                <Table.Th>
                  <Group gap="xs">
                    <IconClock size={18} />
                    <Text>Time</Text>
                  </Group>
                </Table.Th>
                {days.map(day => (
                  <Table.Th key={day}>
                    <Stack gap={4} align="center">
                      <Text>{day}</Text>
                      <Badge
                        size="sm"
                        color={getDayColor(day)}
                        variant="light"
                      >
                        {stats.classesPerDay[day] || 0} classes
                      </Badge>
                    </Stack>
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {getTimeSlots().map((timeSlot, index) => (
                <Table.Tr
                  key={timeSlot.slot}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
                >
                  <Table.Td>
                    <Stack gap="xs" align="center">
                      <Text fw={700} size="sm">
                        {timeSlot.start_time}
                      </Text>
                      <Text size="xs" c="dimmed">to</Text>
                      <Text fw={700} size="sm">
                        {timeSlot.end_time}
                      </Text>
                      <Badge
                        size="sm"
                        color={timeSlot.isMorning ? "blue" : "orange"}
                        variant="light"
                      >
                        {timeSlot.isMorning ? "Morning" : "Afternoon"}
                      </Badge>
                    </Stack>
                  </Table.Td>
                  {days.map(day => {
                    const schedule = getScheduleForTimeSlot(day, timeSlot.slot);
                    return (
                      <Table.Td key={day}>
                        {schedule ? (
                          <Card
                            padding="md"
                            radius="md"
                            className={`border-l-4 border-${getDayColor(day)}-500 bg-${getDayColor(day)}-50/30`}
                          >
                            <Stack gap="xs">
                              <Badge
                                color={getDayColor(day)}
                                variant="light"
                                size="xs"
                              >
                                {schedule.course_code}
                              </Badge>
                              <Text fw={700} size="sm" lineClamp={2}>
                                {schedule.course_name}
                              </Text>
                              <Group gap="xs">
                                <IconUsers size={14} />
                                <Text size="sm" c="dimmed">
                                  {schedule.batch}
                                </Text>
                              </Group>
                              <Group gap="xs">
                                <IconMapPin size={14} />
                                <Badge
                                  size="sm"
                                  variant="light"
                                  color="gray"
                                >
                                  {schedule.room}
                                </Badge>
                              </Group>
                              <Text size="xs" c="dimmed">
                                Sec {schedule.section}
                              </Text>
                            </Stack>
                          </Card>
                        ) : (
                          <Center h={140}>
                            <Text c="dimmed" size="sm" fw={500}>
                              No Class
                            </Text>
                          </Center>
                        )}
                      </Table.Td>
                    );
                  })}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </div>
      </ScrollArea>

      {/* Lunch Break Banner */}
      <Paper
        mt="md"
        p="lg"
        className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200"
        radius="lg"
      >
        <Group justify="center" gap="lg">
          <IconCoffee size={24} className="text-orange-500" />
          <Stack gap={0} align="center">
            <Text fw={700} size="lg" c="orange.7">
              Lunch Break
            </Text>
            <Text size="sm" c="orange.6">
              12:00 PM - 1:00 PM • Time to recharge
            </Text>
          </Stack>
          <IconCoffee size={24} className="text-orange-500" />
        </Group>
      </Paper>
    </Paper>
  );

  // Show loading while checking authentication
  if (!currentUser && !hasFetchedSchedule) {
    return (
      <Center className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
        <Stack align="center" gap="lg">
          <Loader size="xl" color="blue" />
          <Text fw={600} size="lg">Loading...</Text>
          <Text c="dimmed">Checking authentication</Text>
        </Stack>
      </Center>
    );
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
      <Container size="xl" className="py-8">
        {/* Header Section */}
        <Stack align="center" gap="md" mb={40}>
          <div className="relative">
            <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
          </div>

          <Stack gap="xs" align="center">
            <Title
              order={1}
              className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent text-center"
            >
              My Teaching Schedule
            </Title>
            <Text c="dimmed" size="xl" ta="center" fw={500}>
              Your personalized class timetable
            </Text>
          </Stack>
        </Stack>

        {/* Main Card */}
        <Card
          shadow="xl"
          radius="xl"
          padding="xl"
          className="bg-white/90 backdrop-blur-lg border border-white/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-transparent pointer-events-none"></div>

          <Stack gap="xl">
            {/* Instructor Profile Header */}
            <Paper
              radius="lg"
              p="lg"
              className="bg-gradient-to-r from-cyan-50/50 to-blue-50/50 border border-cyan-200/50 backdrop-blur-sm"
            >
              <Group justify="flex-end" align="center" className="w-full">
                <Group gap="xs">
                  <Tooltip label="Download Schedule">
                    <Button
                      size="lg"
                      variant="gradient"
                      gradient={{ from: 'cyan', to: 'blue', deg: 90 }}
                      leftSection={<IconDownload size={20} />}
                      onClick={handleExportSchedule}
                      className="shadow-lg hover:shadow-xl transition-all"
                    >
                      Download
                    </Button>
                  </Tooltip>
                  <Tooltip label="View Schedule Statistics">
                    <Button
                      variant="light"
                      color="blue"
                      leftSection={<IconChartBar size={16} />}
                      onClick={() => setStatsModalOpened(true)}
                    >
                      Stats
                    </Button>
                  </Tooltip>
                  <Tooltip label="Refresh Schedule">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      size="lg"
                      onClick={handleRefreshSchedule}
                      loading={scheduleLoading}
                    >
                      <IconRefresh size={20} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Paper>

            {/* Quick Stats */}
            <Grid gutter="md">
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Paper p="md" radius="md" className="bg-blue-50/50 border border-blue-200 text-center hover:shadow-md transition-all">
                  <Text className="text-2xl font-bold text-blue-700">{stats.totalClasses}</Text>
                  <Text size="sm" c="blue" fw={500}>Total Classes</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Paper p="md" radius="md" className="bg-green-50/50 border border-green-200 text-center hover:shadow-md transition-all">
                  <Text className="text-2xl font-bold text-green-700">{stats.uniqueCourses}</Text>
                  <Text size="sm" c="green" fw={500}>Courses</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Paper p="md" radius="md" className="bg-violet-50/50 border border-violet-200 text-center hover:shadow-md transition-all">
                  <Text className="text-2xl font-bold text-violet-700">{stats.uniqueBatches}</Text>
                  <Text size="sm" c="violet" fw={500}>Batches</Text>
                </Paper>
              </Grid.Col>
              <Grid.Col span={{ base: 6, sm: 3 }}>
                <Paper p="md" radius="md" className="bg-orange-50/50 border border-orange-200 text-center hover:shadow-md transition-all">
                  <Text className="text-2xl font-bold text-orange-700">{stats.uniqueSections}</Text>
                  <Text size="sm" c="orange" fw={500}>Sections</Text>
                </Paper>
              </Grid.Col>
            </Grid>

            {/* Error Alert */}
            {scheduleError && (
              <Alert
                color="red"
                title="Error Loading Schedule"
                icon={<IconAlertCircle size={20} />}
                radius="lg"
                variant="light"
                withCloseButton
                onClose={() => dispatch(clearScheduleError())}
              >
                {scheduleError}
              </Alert>
            )}

            {/* View Toggle */}
            <Group justify="space-between">
              <Group>
                <Badge variant="light" color="blue" size="lg">
                  {schedules.length} classes total
                </Badge>
                <Badge variant="light" color="green" size="lg">
                  {stats.classesPerDay[stats.busiestDay] || 0} on {stats.busiestDay}
                </Badge>
              </Group>

              <Tabs
                value={viewMode}
                onChange={(value) => {
                  if (value === 'grid' || value === 'list' || value === 'calendar') {
                    setViewMode(value);
                  }
                }}
                defaultValue="calendar"
              >
                <Tabs.List>
                  <Tabs.Tab
                    value="grid"
                    leftSection={<IconLayoutGrid size={16} />}
                  >
                    Grid
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="list"
                    leftSection={<IconLayoutList size={16} />}
                  >
                    List
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="calendar"
                    leftSection={<IconCalendarTime size={16} />}
                  >
                    Calendar
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs>
            </Group>

            {/* Schedule Content */}
            <Box mt="xl">
              {scheduleLoading ? (
                <Center py={80}>
                  <Stack align="center" gap="lg">
                    <Loader size="xl" color="blue" />
                    <Stack gap="xs" align="center">
                      <Text fw={600} size="lg">Loading your schedule...</Text>
                      <Text c="dimmed">Fetching your teaching timetable</Text>
                    </Stack>
                  </Stack>
                </Center>
              ) : schedules.length === 0 && hasFetchedSchedule ? (
                <Center py={80}>
                  <Stack align="center" gap="lg">
                    <ThemeIcon
                      size={120}
                      color="gray"
                      variant="light"
                      radius="xl"
                    >
                      <IconCalendar size={48} />
                    </ThemeIcon>
                    <Stack gap="xs" align="center">
                      <Title order={3} c="gray.7">
                        No Classes Scheduled
                      </Title>
                      <Text c="dimmed" ta="center" size="lg">
                        You don&apos;t have any classes scheduled for this period.
                      </Text>
                      <Button
                        variant="light"
                        leftSection={<IconRefresh size={16} />}
                        onClick={handleRefreshSchedule}
                      >
                        Refresh
                      </Button>
                    </Stack>
                  </Stack>
                </Center>
              ) : (
                <>
                  {viewMode === 'grid' && <GridView />}
                  {viewMode === 'list' && <ListView />}
                  {viewMode === 'calendar' && <CalendarView />}
                </>
              )}
            </Box>
          </Stack>
        </Card>
      </Container>

      {/* Statistics Modal */}
      <Modal
        opened={statsModalOpened}
        onClose={() => setStatsModalOpened(false)}
        title={
          <Group gap="xs">
            <IconChartBar size={20} />
            <Text fw={600}>Teaching Schedule Statistics</Text>
          </Group>
        }
        size="lg"
        radius="lg"
      >
        <Stack gap="lg">
          <Grid gutter="md">
            <Grid.Col span={6}>
              <Paper p="md" radius="md" className="bg-blue-50 text-center">
                <Text fw={700} size="xl" c="blue">{stats.totalClasses}</Text>
                <Text size="sm" c="blue">Total Classes</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={6}>
              <Paper p="md" radius="md" className="bg-green-50 text-center">
                <Text fw={700} size="xl" c="green">{stats.uniqueCourses}</Text>
                <Text size="sm" c="green">Different Courses</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={6}>
              <Paper p="md" radius="md" className="bg-violet-50 text-center">
                <Text fw={700} size="xl" c="violet">{stats.uniqueBatches}</Text>
                <Text size="sm" c="violet">Batches</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={6}>
              <Paper p="md" radius="md" className="bg-orange-50 text-center">
                <Text fw={700} size="xl" c="orange">{stats.uniqueSections}</Text>
                <Text size="sm" c="orange">Sections</Text>
              </Paper>
            </Grid.Col>
          </Grid>

          <Divider />

          <div>
            <Text fw={600} mb="sm">Classes Distribution</Text>
            <Stack gap="xs">
              {days.map(day => (
                <Group key={day} justify="space-between">
                  <Text>{day}</Text>
                  <Badge color={getDayColor(day)} variant="light">
                    {stats.classesPerDay[day] || 0} classes
                  </Badge>
                </Group>
              ))}
            </Stack>
          </div>

          <Paper p="md" className="bg-cyan-50/50 border border-cyan-200">
            <Text fw={600} size="sm" c="cyan" mb="xs">Busiest Day</Text>
            <Text fw={700} size="lg" c="cyan.7">{stats.busiestDay}</Text>
            <Text size="sm" c="cyan.6">
              with {stats.classesPerDay[stats.busiestDay] || 0} classes
            </Text>
          </Paper>
        </Stack>
      </Modal>

      {/* Custom CSS */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default MySchedule;