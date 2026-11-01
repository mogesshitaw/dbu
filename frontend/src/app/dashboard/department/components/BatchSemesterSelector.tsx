/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Card,
  Title,
  Text,
  Select,
  Button,
  Group,
  Stack,
  Grid,
  Loader,
  Badge,
  Paper,
  ThemeIcon,
  Center,
  TextInput,
  ActionIcon,
  MultiSelect,
  Modal,
  ScrollArea,
  RingProgress,
  SimpleGrid,
  Pagination,
  Collapse,
  SegmentedControl,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconCalendar,
  IconSchool,
  IconUsers,
  IconClock,
  IconBuilding,
  IconSearch,
  IconBook,
  IconUser,
  IconFilter,
  IconRefresh,
  IconCalendarStats,
  IconCalendarTime,
  IconLayoutGrid,
  IconLayoutList,
  IconDownload,
  IconEye,
  IconX,
  IconChevronRight,
  IconCalendarPlus,
  IconSparkles,
  IconRobot,
  IconAlertTriangle,
  IconAlertCircle,
} from "@tabler/icons-react";
import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Redux Imports
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  setBatchFilters,
  fetchDepartments,
  fetchBatches,
  fetchSemesters,
  fetchSchedules,
  fetchAiScheduleSuggestion,
} from "@/store/slices/scheduleSlice";
import {
  selectBatchFilters,
  selectBatchLoading,
  selectBatches,
  selectSemesters,
  selectSchedules as selectAllSchedules,
  selectAiSuggestions,
  selectAiLoading,
  selectAiError,
} from "@/store/selectors/scheduleSelectors";
import { Authentication, Found } from "@/app/auth/auth";
import AiScheduleModal from "./AiScheduleModal";

const DepartmentScheduleView: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const allSchedules = useAppSelector(selectAllSchedules);
  const filters = useAppSelector(selectBatchFilters);
  const loading = useAppSelector(selectBatchLoading);
  const batches = useAppSelector(selectBatches);
  const semesters = useAppSelector(selectSemesters);

  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [detailedViewModal, setDetailedViewModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // 🤖 AI State & Handlers
  const aiSuggestions = useAppSelector(selectAiSuggestions);
  const aiLoading = useAppSelector(selectAiLoading);
  const aiError = useAppSelector(selectAiError);
  const [aiModalOpened, setAiModalOpened] = useState(false);
  const [aiActiveSchedule, setAiActiveSchedule] = useState<any>(null);

  const handleOpenAiInsights = (schedule: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAiActiveSchedule(schedule);
    setAiModalOpened(true);
    dispatch(fetchAiScheduleSuggestion(schedule.id));
  };

  const form = useForm({
    initialValues: {
      department: filters.department,
      batch: filters.batch,
      semester: filters.semester,
      section: filters.section,
    },
  });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const timeRanges = [
    { value: "all", label: "All Day" },
    { value: "morning", label: "Morning (2AM-6AM)" },
    { value: "afternoon", label: "Afternoon (7:30PM-11:30PM)" },
    { value: "evening", label: "Evening (5PM-8PM)" }
  ];

  const dayOptions = days.map(day => ({ value: day, label: day }));

  // Get user's department schedules
  const departmentSchedules = useMemo(() => {
    if (!user?.department_id) return allSchedules;
    return allSchedules.filter(schedule => 
      schedule.department_id === user.department_id
    );
  }, [allSchedules, user]);

  // Filtered schedules based on search and filters
  const filteredSchedules = useMemo(() => {
    return departmentSchedules.filter(schedule => {
      // Search filter
      const matchesSearch = searchQuery === "" || 
        schedule.batch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.semester?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.section?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.instructor_name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Day filter
      const matchesDay = selectedDays.length === 0 || 
        schedule.days?.some((day: any) => selectedDays.includes(day.day_of_week));

      // Batch filter
      const matchesBatch = !form.values.batch || schedule.batch === form.values.batch;

      // Semester filter
      const matchesSemester = !form.values.semester || schedule.semester === form.values.semester;

      // Section filter
      const matchesSection = !form.values.section || schedule.section === form.values.section;

      return matchesSearch && matchesDay && matchesBatch && matchesSemester && matchesSection;
    });
  }, [departmentSchedules, searchQuery, selectedDays, form.values]);

  // Paginated schedules for grid and list views
  const paginatedSchedules = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSchedules, currentPage]);

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

  // Calculate statistics
  const departmentStats = useMemo(() => {
    const totalSchedules = departmentSchedules.length;
    const publishedSchedules = departmentSchedules.filter(s => s.status === "published").length;
    const draftSchedules = departmentSchedules.filter(s => s.status === "draft").length;
    
    const uniqueBatches = [...new Set(departmentSchedules.map(s => s.batch))].length;
    const uniqueSemesters = [...new Set(departmentSchedules.map(s => s.semester))].length;
    const uniqueSections = [...new Set(departmentSchedules.map(s => s.section))].length;
    
    const today = new Date();

    const todaySchedules = departmentSchedules.filter(s => 
      s.days?.some((day: any) => {
        const todayDayName = days[today.getDay() - 1] || days[0];
        return day.day_of_week === todayDayName;
      })
    ).length;

    return {
      totalSchedules,
      publishedSchedules,
      draftSchedules,
      uniqueBatches,
      uniqueSemesters,
      uniqueSections,
      todaySchedules,
      completionRate: totalSchedules > 0 ? ((publishedSchedules / totalSchedules) * 100).toFixed(1) : "0.0"
    };
  }, [days, departmentSchedules]);

// Add this ref at the top of your component
const scheduleRef = useRef<HTMLDivElement>(null);

const handleDownloadPDF = async () => {
  if (!selectedSchedule) return;
  
  try {
    // Show loading indicator
    const loadingToast = window.alert ? window.alert('Generating PDF... Please wait.') : null;

    // Define color mappings based on your getDayColor function
    const dayColorMap: { [key: string]: { 
      primary: string, 
      light: string, 
      text: string 
    } } = {
      'Monday': { 
        primary: '#3b82f6',    // blue
        light: '#EBF5FF',      // blue-50
        text: '#1E40AF'        // blue-800
      },
      'Tuesday': { 
        primary: '#14b8a6',    // teal
        light: '#E6FFFA',      // teal-50
        text: '#0F766E'        // teal-800
      },
      'Wednesday': { 
        primary: '#8b5cf6',    // violet
        light: '#F3E8FF',      // violet-50
        text: '#7E22CE'        // violet-800
      },
      'Thursday': { 
        primary: '#f97316',    // orange
        light: '#FFF7ED',      // orange-50
        text: '#C2410C'        // orange-800
      },
      'Friday': { 
        primary: '#ef4444',    // red
        light: '#FEE2E2',      // red-50
        text: '#B91C1C'        // red-800
      }
    };

    // Get all time slots from the selected schedule
    const getTimeSlots = () => {
      const allTimeSlots = new Set<string>();
      
      // Collect all unique time slots from all days and courses
      selectedSchedule.days?.forEach((day: any) => {
        day.courses?.forEach((course: any) => {
          if (course.startTime && course.endTime) {
            const timeSlot = `${course.startTime}-${course.endTime}`;
            allTimeSlots.add(timeSlot);
          }
        });
      });
      
      // Convert to array and sort by start time
      return Array.from(allTimeSlots)
        .sort((a, b) => {
          const aStart = a.split('-')[0];
          const bStart = b.split('-')[0];
          return aStart.localeCompare(bStart);
        })
        .map(timeSlotStr => {
          const [startTime, endTime] = timeSlotStr.split('-');
          const startHour = startTime ? parseInt(startTime.split(':')[0]) : 0;
          return {
            slot: timeSlotStr,
            startTime,
            endTime,
            isMorning: startHour < 12
          };
        });
    };

    const timeSlots = getTimeSlots();

    // Create a temporary div for the table
    const tempDiv = document.createElement('div');
    tempDiv.style.width = '1200px';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '30px';
    tempDiv.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    
    // Build HTML content as a table
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
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          padding: 25px;
          border-radius: 15px;
          color: white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        ">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold; margin-bottom: 10px;">
            📅 Department Schedule - ${selectedSchedule.batch}
          </h1>
          <div style="font-size: 16px; opacity: 0.9; margin-bottom: 15px;">
             ${selectedSchedule.semester} • Section ${selectedSchedule.section}
          </div>
          <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
            <span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-size: 13px;">
              🏛️ ${user?.department_name || 'Department'}
            </span>
            <span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-size: 13px;">
              📊 Status: ${selectedSchedule.status}
            </span>
            <span style="background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; font-size: 13px;">
              📅 Created: ${new Date(selectedSchedule.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <!-- Schedule Table -->
        <div style="overflow-x: auto;">
          <table style="
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-radius: 10px;
            overflow: hidden;
          ">
            <thead>
              <tr style="background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);">
                <th style="
                  border: 2px solid #e5e7eb;
                  padding: 18px;
                  text-align: center;
                  color: white;
                  font-weight: 700;
                  font-size: 16px;
                  text-transform: uppercase;
                  min-width: 150px;
                ">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <span>⏰</span>
                    <span>Time</span>
                  </div>
                </th>
                ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                  const dayColor = dayColorMap[day] || { primary: '#3b82f6' };
                  return `
                    <th style="
                      border: 2px solid #e5e7eb;
                      padding: 18px;
                      text-align: center;
                      color: white;
                      font-weight: 700;
                      font-size: 16px;
                      text-transform: uppercase;
                      background: ${dayColor.primary};
                    ">
                      ${day}
                    </th>
                  `;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${timeSlots.length > 0 ? timeSlots.map((timeSlot, index) => {
                const getCourseForDay = (day: string) => {
                  const daySchedule = selectedSchedule.days?.find((d: any) => d.day_of_week === day);
                  if (!daySchedule) return null;
                  
                  return daySchedule.courses?.find((course: any) => 
                    course.startTime === timeSlot.startTime && 
                    course.endTime === timeSlot.endTime
                  );
                };
                
                return `
                  <tr style="${index % 2 === 0 ? 'background: #f9fafb;' : 'background: white;'}">
                    <td style="
                      border: 2px solid #e5e7eb;
                      padding: 15px;
                      text-align: center;
                      background: #f3f4f6;
                      font-weight: 700;
                      color: #374151;
                      min-width: 150px;
                    ">
                      <div style="font-size: 15px; margin-bottom: 4px;">${timeSlot.startTime}</div>
                      <div style="font-size: 12px; color: #6b7280; margin: 4px 0;">to</div>
                      <div style="font-size: 15px; margin-top: 4px;">${timeSlot.endTime}</div>
                      <div style="
                        margin-top: 8px;
                        background: ${timeSlot.isMorning ? '#DBEAFE' : '#FEF3C7'};
                        color: ${timeSlot.isMorning ? '#1E40AF' : '#92400E'};
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 11px;
                        font-weight: 600;
                        display: inline-block;
                      ">
                        ${timeSlot.isMorning ? 'Morning' : 'Afternoon'}
                      </div>
                    </td>
                    ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                      const course = getCourseForDay(day);
                      const dayColor = dayColorMap[day] || { 
                        primary: '#e5e7eb', 
                        light: '#f9fafb', 
                        text: '#374151' 
                      };
                      
                      if (course) {
                        return `
                          <td style="
                            border: 2px solid #e5e7eb;
                            padding: 12px;
                            background: ${dayColor.light};
                            border-left: 6px solid ${dayColor.primary};
                            vertical-align: top;
                          ">
                            <div style="padding: 10px;">
                              <div style="font-weight: 700; color: ${dayColor.text}; margin-bottom: 6px; font-size: 14px; line-height: 1.3;">
                                ${course.course_name || 'Course'}
                              </div>
                              <div style="color: #6b7280; font-size: 12px; margin-bottom: 8px;">
                                ${course.course_code || ''}
                              </div>
                              <div style="margin-bottom: 6px; font-size: 12px;">
                                <div style="color: #374151; margin-bottom: 4px;">
                                  <strong>👨‍🏫:</strong> ${course.instructor_name || 'Instructor'}
                                </div>
                                <div style="color: #374151;">
                                  <strong>🏢:</strong> ${course.block_code || ''}${course.block_code && course.room_number ? '-' : ''}${course.room_number || 'Room'} 
                                  ${course.room_type === 'lab' ? '(Lab)' : course.room_type === 'lecture' ? '(Lecture)' : ''}
                                </div>
                              </div>
                              <div style="
                                background: rgba(59, 130, 246, 0.1);
                                color: #3b82f6;
                                padding: 4px 8px;
                                border-radius: 4px;
                                font-size: 11px;
                                font-weight: 600;
                                display: inline-block;
                                margin-top: 6px;
                              ">
                                ${selectedSchedule.batch} | Sec ${selectedSchedule.section}
                              </div>
                            </div>
                          </td>
                        `;
                      } else {
                        return `
                          <td style="
                            border: 2px solid #e5e7eb;
                            padding: 15px;
                            color: #9ca3af;
                            font-style: italic;
                            text-align: center;
                            background: #f9fafb;
                          ">
                            <div style="height: 100px; display: flex; align-items: center; justify-content: center;">
                              No Class
                            </div>
                          </td>
                        `;
                      }
                    }).join('')}
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="6" style="padding: 40px; text-align: center; color: #6b7280; font-style: italic;">
                    No schedule data available for this selection.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
        
        <!-- Summary Section -->
        <div style="
          margin-top: 30px;
          padding: 25px;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border-radius: 10px;
        ">
          <h3 style="margin: 0 0 20px 0; font-size: 20px; color: #374151; font-weight: 700;">
            📊 Schedule Summary
          </h3>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">
                ${selectedSchedule.days?.length || 0}
              </div>
              <div style="font-size: 13px; color: #6b7280; margin-top: 5px;">Days/Week</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <div style="font-size: 24px; font-weight: bold; color: #10b981;">
                ${selectedSchedule.days?.reduce((total: number, day: any) => total + (day.courses?.length || 0), 0) || 0}
              </div>
              <div style="font-size: 13px; color: #6b7280; margin-top: 5px;">Total Classes</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <div style="font-size: 24px; font-weight: bold; color: #f97316;">
                ${new Set(selectedSchedule.days?.flatMap((day: any) => 
                  day.courses?.map((course: any) => course.course_name)
                )).size || 0}
              </div>
              <div style="font-size: 13px; color: #6b7280; margin-top: 5px;">Unique Courses</div>
            </div>
            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
              <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">
                ${selectedSchedule.semester}
              </div>
              <div style="font-size: 13px; color: #6b7280; margin-top: 5px;">Semester</div>
            </div>
          </div>
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
    
    // Create PDF in landscape for better table view
    const pdf = new jsPDF('l', 'mm', 'a4');
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
      canvas.toDataURL('image/png'),
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
      `${selectedSchedule.batch} Schedule - Semester ${selectedSchedule.semester}`,
      pdfWidth / 2,
      8,
      { align: 'center' }
    );
    
    // Add page numbers
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
      pdf.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        pdfWidth / 2,
        pdfHeight - 5,
        { align: 'center' }
      );
    }
    
    // Save PDF
    const fileName = `Schedule_${selectedSchedule.batch}_Sem${selectedSchedule.semester}_Sec${selectedSchedule.section}.pdf`;
    pdf.save(fileName);
    
    // Clean up
    document.body.removeChild(tempDiv);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};
  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchBatches());
    dispatch(fetchSemesters());
    dispatch(fetchSchedules());
  }, [dispatch]);

  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
      // Set department filter to user's department
      if (foundUser?.department_id) {
        dispatch(setBatchFilters({ department: foundUser.department_id.toString() }));
        form.setFieldValue('department', foundUser.department_id.toString());
      }
    };
    checkAuth();
  }, []);

  // Update form when Redux filters change
  useEffect(() => {
    form.setValues({
      department: filters.department,
      batch: filters.batch,
      semester: filters.semester,
      section: filters.section,
    });
  }, [filters]);

const semesterOptions = Array.isArray(semesters)
  ? semesters
      .map((semester: any) => ({
        value: semester.semester?.toString() || "",
        label: semester.semester?.toString() || "",
      }))
      .filter(option => option.value)
      .filter(
        (option, index, self) =>
          index === self.findIndex(o => o.value === option.value)
      )
  : [];

  if (user === null) {
    return <Authentication />;
  }

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


  const handleViewScheduleDetails = (schedule: any) => {
    setSelectedSchedule(schedule);
    setDetailedViewModal(true);
  };

  const batchOptions = Array.isArray(batches) 
    ? batches
        .map((batch: any) => ({
          value: batch.batch_year?.toString() || "",
          label: batch.batch_year?.toString() || "",
        }))
        .filter(option => option.value) 
    : [];

  const handleExportSchedule = () => {
    // Export logic here
    console.log("Exporting schedule...");
  };

  const handleRefresh = () => {
    dispatch(fetchSchedules());
  };

  const GridView = () => (
    <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
      {paginatedSchedules.map((schedule, index) => (
        <Card
          key={index}
          shadow="md"
          padding="lg"
          radius="lg"
          className={`border-2 ${
            schedule.status === "published" 
              ? "border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50" 
              : "border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-amber-50/50"
          } hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
          onClick={() => handleViewScheduleDetails(schedule)}
        >
          <Stack gap="md">
            {/* Header */}
            <Group justify="space-between">
              <Badge
                size="lg"
                color={schedule.status === "published" ? "green" : "yellow"}
                variant="light"
                leftSection={
                  schedule.status === "published" ? 
                    <IconCalendar size={14} /> : 
                    <IconCalendarPlus size={14} />
                }
              >
                {schedule.status}
              </Badge>
              <Badge color="blue" variant="light" size="sm">
                {schedule.days?.length || 0} days
              </Badge>
            </Group>

            {/* Schedule Info */}
            <Stack gap="xs">
              <Group>
                <ThemeIcon size="sm" color="blue" variant="light">
                  <IconUsers size={14} />
                </ThemeIcon>
                <Text fw={600} size="lg" className="text-blue-800">
                  {schedule.batch}
                </Text>
              </Group>
              
              <Group>
                <ThemeIcon size="sm" color="violet" variant="light">
                  <IconBook size={14} />
                </ThemeIcon>
                <Text size="sm">{schedule.semester} </Text>
              </Group>
              
              <Group>
                <ThemeIcon size="sm" color="orange" variant="light">
                  <IconSchool size={14} />
                </ThemeIcon>
                <Text size="sm">Section {schedule.section}</Text>
              </Group>
            </Stack>

            {/* Days Preview */}
            <Stack gap="sm">
              <Text size="sm" fw={500} c="dimmed">Classes:</Text>
              {schedule.days?.slice(0, 3).map((day: any, idx: number) => (
                <Group key={idx} justify="space-between">
                  <Badge color={getDayColor(day.day_of_week)} variant="light" size="sm">
                    {day.day_of_week}
                  </Badge>
                  <Badge color="gray" variant="light" size="xs">
                    {day.courses.length} courses
                  </Badge>
                </Group>
              ))}
              {schedule.days?.length > 3 && (
                <Text size="xs" c="dimmed" className="text-center">
                  +{schedule.days.length - 3} more days
                </Text>
              )}
            </Stack>

            {/* Footer */}
            <Group justify="space-between" mt="md">
              <Text size="xs" c="dimmed">
                {new Date(schedule.created_at).toLocaleDateString()}
              </Text>
              <Group gap="xs">
                <Tooltip label="AI Schedule Insights">
                  <ActionIcon
                    variant="light"
                    color="indigo"
                    size="sm"
                    onClick={(e) => handleOpenAiInsights(schedule, e)}
                  >
                    <IconSparkles size={16} />
                  </ActionIcon>
                </Tooltip>
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewScheduleDetails(schedule);
                  }}
                >
                  <IconEye size={16} />
                </ActionIcon>
              </Group>
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );

  const ListView = () => (
    <Stack gap="md">
      {paginatedSchedules.map((schedule, index) => (
        <Paper
          key={index}
          p="lg"
          radius="lg"
          withBorder
          className="hover:shadow-md transition-all cursor-pointer"
          onClick={() => handleViewScheduleDetails(schedule)}
        >
          <Grid gutter="md" align="center">
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Badge
                color={schedule.status === "published" ? "green" : "yellow"}
                variant="light"
                size="lg"
                fullWidth
              >
                {schedule.status}
              </Badge>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Stack gap={4}>
                <Text fw={600} size="lg">{schedule.batch}</Text>
                <Group gap="xs">
                  <Badge color="blue" variant="light" size="xs">
                    {schedule.semester}
                  </Badge>
                  <Badge color="orange" variant="light" size="xs">
                    Sec {schedule.section}
                  </Badge>
                </Group>
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Stack gap={4}>
                <Text size="sm" fw={500}>Class Schedule</Text>
                <Group gap="xs">
                  {schedule.days?.slice(0, 3).map((day: any, idx: number) => (
                    <Badge key={idx} color={getDayColor(day.day_of_week)} variant="light" size="xs">
                      {day.day_of_week.substring(0, 3)}
                    </Badge>
                  ))}
                  {schedule.days?.length > 3 && (
                    <Badge color="gray" variant="light" size="xs">
                      +{schedule.days.length - 3} more
                    </Badge>
                  )}
                </Group>
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Group justify="center">
                <Badge color="blue" variant="filled" size="md">
                  {schedule.days?.length || 0} days
                </Badge>
              </Group>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 1 }}>
              <Group gap="xs" wrap="nowrap" justify="flex-end">
                <Tooltip label="AI Schedule Insights">
                  <ActionIcon
                    variant="light"
                    color="indigo"
                    size="md"
                    onClick={(e) => handleOpenAiInsights(schedule, e)}
                  >
                    <IconSparkles size={16} />
                  </ActionIcon>
                </Tooltip>
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewScheduleDetails(schedule);
                  }}
                >
                  <IconChevronRight size={18} />
                </ActionIcon>
              </Group>
            </Grid.Col>
          </Grid>
        </Paper>
      ))}
    </Stack>
  );

const CalendarView = () => {
  // Get time slots from your data structure
  const getTimeSlots = () => {
    const uniqueSlots = [...new Set(
      filteredSchedules.flatMap(schedule => 
        schedule.days?.flatMap((day: any) => 
          day.courses?.map((course: any) => 
            `${course.startTime}-${course.endTime}`
          )
        )
      ).filter(Boolean)
    )].sort();
    
    return uniqueSlots.map(slot => {
      const [startTime, endTime] = slot.split('-');
      return {
        slot,
        startTime,
        endTime,
        isMorning: startTime ? parseInt(startTime.split(':')[0]) < 12 : true
      };
    });
  };

  const timeSlots = getTimeSlots();

  const getScheduleForTimeSlot = (day: string, timeSlotStr: string) => {
    const [startTime, endTime] = timeSlotStr.split('-');
    
    return filteredSchedules.filter(schedule => 
      schedule.days?.some((d: any) => 
        d.day_of_week === day && 
        d.courses?.some((c: any) => 
          c.startTime === startTime && 
          c.endTime === endTime
        )
      )
    );
  };

  return (
    <Paper
      radius="lg"
      p="md"
      className="border border-gray-200/40 shadow-lg"
    >
      <ScrollArea>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-cyan-100/50">
                <th className="border border-gray-200/60 px-6 py-4 text-left font-bold text-gray-700 sticky left-0 bg-cyan-50/80 backdrop-blur-sm">
                  <Group gap="xs">
                    <IconClock size={18} />
                    <Text>Time</Text>
                  </Group>
                </th>
                {days.map(day => (
                  <th
                    key={day}
                    className={`border border-gray-200/60 px-4 py-4 text-center font-bold text-gray-700 bg-${getDayColor(day)}-50/80 backdrop-blur-sm`}
                  >
                    <Stack gap={4} align="center">
                      <Text>{day}</Text>
                      <Badge
                        size="sm"
                        color={getDayColor(day)}
                        variant="light"
                      >
                        {filteredSchedules.filter(s => 
                          s.days?.some((d: any) => d.day_of_week === day)
                        ).length || 0} schedules
                      </Badge>
                    </Stack>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot, index) => (
                <tr
                  key={timeSlot.slot}
                  className={`border-b border-gray-200/50 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  } hover:bg-cyan-50/30 transition-colors duration-200`}
                >
                  <td className="border border-gray-200/60 px-6 py-4 font-semibold bg-cyan-50/50 sticky left-0 backdrop-blur-sm">
                    <Stack gap="xs" align="center">
                      <Text fw={700} size="sm">
                        {timeSlot.startTime}
                      </Text>
                      <Text size="xs" c="dimmed">to</Text>
                      <Text fw={700} size="sm">
                        {timeSlot.endTime}
                      </Text>
                      <Badge
                        size="sm"
                        color={timeSlot.isMorning ? "blue" : "orange"}
                        variant="light"
                      >
                        {timeSlot.isMorning ? "Morning" : "Afternoon"}
                      </Badge>
                    </Stack>
                  </td>
                  {days.map(day => {
                    const schedulesForSlot = getScheduleForTimeSlot(day, timeSlot.slot);
                    
                    return (
                      <td key={day} className="border border-gray-200/60 px-3 py-3">
                        {schedulesForSlot.length > 0 ? (
                          <Stack gap="xs">
                            {schedulesForSlot.slice(0, 2).map((schedule, idx) => {
                              const daySchedule = schedule.days?.find((d: any) => d.day_of_week === day);
                              const course = daySchedule?.courses?.find((c: any) => 
                                c.startTime === timeSlot.startTime && 
                                c.endTime === timeSlot.endTime
                              );
                              
                              return (
                                <Card
                                  key={idx}
                                  padding="md"
                                  radius="md"
                                  className={`border-l-4 ${course?.color === '#ef4444' ? 'border-red-500 bg-red-50/90 ring-1 ring-red-400' : `border-${getDayColor(day)}-500 bg-${getDayColor(day)}-50/30`} hover:shadow-md transition-all duration-300 cursor-pointer`}
                                  onClick={() => handleViewScheduleDetails(schedule)}
                                >
                                  <Stack gap="xs">
                                    <Group justify="space-between" wrap="nowrap">
                                      <Badge
                                        color={course?.color === '#ef4444' ? "red" : getDayColor(day)}
                                        variant={course?.color === '#ef4444' ? "filled" : "light"}
                                        size="xs"
                                      >
                                        {schedule.batch}
                                      </Badge>
                                      {course?.color === '#ef4444' && (
                                        <Badge color="red" variant="filled" size="xs">
                                          ⚠️ Duplicate
                                        </Badge>
                                      )}
                                    </Group>
                                    <Text fw={700} size="sm" lineClamp={2} c={course?.color === '#ef4444' ? "red.8" : undefined}>
                                      {course?.course_name || "Class"}
                                    </Text>
                                    <Group gap="xs">
                                       <Text size="sm" c="dimmed">
                                         {schedule.semester}
                                      </Text>
                                      <Text size="sm" c="dimmed">
                                        Section {schedule.section}
                                      </Text>
                                    </Group>
                                    <Group gap="xs">
                                      <Badge
                                        size="sm"
                                        variant="light"
                                        color="gray"
                                      >
                                        {course?.room_number || "Room"}
                                      </Badge>
                                    </Group>
                                  </Stack>
                                </Card>
                              );
                            })}
                            {schedulesForSlot.length > 2 && (
                              <Center>
                                <Badge color="gray" variant="light" size="xs">
                                  +{schedulesForSlot.length - 2} more
                                </Badge>
                              </Center>
                            )}
                          </Stack>
                        ) : (
                          <Center h={140}>
                            <Text c="dimmed" size="sm" fw={500}>
                              -
                            </Text>
                          </Center>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </Paper>
  );
};
  const viewOptions = [
  { label: 'Grid', value: 'grid' as const, icon: <IconLayoutGrid size={16} /> },
  { label: 'List', value: 'list' as const, icon: <IconLayoutList size={16} /> },
  { label: 'Calendar', value: 'calendar' as const, icon: <IconCalendarTime size={16} /> },
];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
      <Container size="xl" className="py-8">
        {/* Header Section */}
        <Stack gap="lg" mb="xl">
          <Group justify="space-between">
            <Stack gap="xs">
              <Title order={1} className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {user?.department_name || "Department"} Schedule Dashboard
              </Title>
              <Text c="dimmed" size="lg">
                Manage and view all academic schedules for your department
              </Text>
            </Stack>
            <Group>
              <Button
                variant="light"
                color="green"
                leftSection={<IconDownload size={18} />}
                onClick={handleExportSchedule}
              >
                Export
              </Button>
              <Button
                variant="light"
                color="blue"
                leftSection={<IconRefresh size={18} />}
                onClick={handleRefresh}
                loading={loading}
              >
                Refresh
              </Button>
            </Group>
          </Group>

          {/* Stats Cards */}
          <SimpleGrid cols={{ base: 2, md: 3, lg: 6 }} spacing="lg">
            <Card radius="lg" className="bg-gradient-to-br from-blue-50 to-blue-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-blue-600">
                  {departmentStats.totalSchedules}
                </Text>
                <Text size="sm" c="dimmed">Total Schedules</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-green-50 to-green-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-green-600">
                  {departmentStats.publishedSchedules}
                </Text>
                <Text size="sm" c="dimmed">Published</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-yellow-50 to-yellow-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-yellow-600">
                  {departmentStats.draftSchedules}
                </Text>
                <Text size="sm" c="dimmed">Draft</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-purple-50 to-purple-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-purple-600">
                  {departmentStats.uniqueBatches}
                </Text>
                <Text size="sm" c="dimmed">Batches</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-orange-50 to-orange-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-orange-600">
                  {departmentStats.uniqueSemesters}
                </Text>
                <Text size="sm" c="dimmed">Semesters</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-teal-50 to-teal-100/50">
              <Stack align="center" gap="xs">
                <RingProgress
                  size={60}
                  thickness={6}
                  roundCaps
                  sections={[{ value: parseFloat(departmentStats.completionRate), color: 'teal' }]}
                  label={
                    <Text ta="center" fw={700} size="xs">
                      {departmentStats.completionRate}%
                    </Text>
                  }
                />
                <Text size="sm" c="dimmed">Completion</Text>
              </Stack>
            </Card>
          </SimpleGrid>
        </Stack>

        {/* Main Content Card */}
        <Card
          shadow="xl"
          radius="xl"
          padding="xl"
          className="bg-white/90 backdrop-blur-lg border border-white/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none"></div>

          <Stack gap="xl">
            {/* Search and Filter Bar */}
            <Paper p="lg" radius="lg" className="bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    placeholder="Search schedules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    leftSection={<IconSearch size={18} />}
                    rightSection={
                      searchQuery && (
                        <ActionIcon onClick={() => setSearchQuery("")}>
                          <IconX size={16} />
                        </ActionIcon>
                      )
                    }
                    radius="lg"
                    size="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    placeholder="Filter by batch"
                    data={[
                      { value: "", label: "All Batches" },
                      ...batchOptions,
                    ]}
                    value={form.values.batch}
                    onChange={(value) => {
                      form.setFieldValue('batch', value || "");
                      dispatch(setBatchFilters({ batch: value || "" }));
                    }}
                    radius="lg"
                    size="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    placeholder="Filter by semester"
                    data={[
                      { value: "", label: "All Semesters" },
                      ...semesterOptions,
                    ]}
                    value={form.values.semester}
                    onChange={(value) => {
                      form.setFieldValue('semester', value || "");
                      dispatch(setBatchFilters({ semester: value || "" }));
                    }}
                    radius="lg"
                    size="md"
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <Button
                    variant={showFilters ? "filled" : "light"}
                    color="blue"
                    leftSection={<IconFilter size={18} />}
                    onClick={() => setShowFilters(!showFilters)}
                    fullWidth
                    radius="lg"
                    size="md"
                  >
                    Filters
                  </Button>
                </Grid.Col>
              </Grid>

              {/* Advanced Filters */}
              <Collapse in={showFilters}>
                <Grid gutter="md" mt="md">
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <MultiSelect
                      label="Filter by Days"
                      placeholder="Select days"
                      data={dayOptions}
                      value={selectedDays}
                      onChange={setSelectedDays}
                      radius="lg"
                      size="md"
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                      label="Time Range"
                      placeholder="Select time range"
                      data={timeRanges}
                      value={selectedTimeRange}
                      onChange={(value) => setSelectedTimeRange(value ?? "all")}
                      radius="lg"
                      size="md"
                    />
                  </Grid.Col>
                </Grid>
              </Collapse>
            </Paper>

            {/* View Controls */}
            <Group justify="space-between">
              <Group>
                <Badge variant="light" color="blue" size="lg">
                  {filteredSchedules.length} schedules found
                </Badge>
                <Badge variant="light" color="green" size="lg">
                  {departmentStats.todaySchedules} classes today
                </Badge>
              </Group>
              
              <Group>
               <SegmentedControl
                  value={viewMode}
                  onChange={(value) => setViewMode(value as 'grid' | 'list' | 'calendar')}
                  data={viewOptions}
                  radius="lg"
                />
              </Group>
            </Group>

            {/* Schedule Content */}
            {loading ? (
              <Center py={80}>
                <Stack align="center" gap="lg">
                  <Loader size="xl" color="blue" />
                  <Stack gap="xs" align="center">
                    <Text fw={600} size="lg">Loading schedules...</Text>
                    <Text c="dimmed">Fetching department timetable data</Text>
                  </Stack>
                </Stack>
              </Center>
            ) : filteredSchedules.length === 0 ? (
              <Center py={80}>
                <Stack align="center" gap="lg">
                  <ThemeIcon size={120} color="gray" variant="light" radius="xl">
                    <IconCalendar size={48} />
                  </ThemeIcon>
                  <Stack gap="xs" align="center">
                    <Title order={3} c="gray.7">
                      No Schedules Found
                    </Title>
                    <Text c="dimmed" ta="center" size="lg">
                      {searchQuery ? "Try adjusting your search terms" : "No schedules available for your department"}
                    </Text>
                    {searchQuery && (
                      <Button
                        variant="light"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedDays([]);
                          setSelectedTimeRange("all");
                          form.setValues({
                            batch: "",
                            semester: "",
                            section: "",
                          });
                        }}
                      >
                        Clear All Filters
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Center>
            ) : (
              <>
                {viewMode === 'grid' && <GridView />}
                {viewMode === 'list' && <ListView />}
                {viewMode === 'calendar' && <CalendarView />}
                
                {/* Pagination for grid and list views only */}
                {viewMode !== 'calendar' && totalPages > 1 && (
                  <Center mt="xl">
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                      radius="lg"
                      withEdges
                      size="md"
                    />
                  </Center>
                )}
              </>
            )}
          </Stack>
        </Card>
      </Container>

      {/* Schedule Details Modal */}
     {/* Schedule Details Modal */}
<Modal
  opened={detailedViewModal}
  onClose={() => setDetailedViewModal(false)}
  title={
    <Group gap="xs">
      <IconCalendarStats size={20} />
      <Text fw={600}>Schedule Details</Text>
    </Group>
  }
  size="xl"
  radius="lg"
  scrollAreaComponent={ScrollArea.Autosize}
>
  {/* PDF Content (initially hidden) */}
  <div 
    id="pdf-schedule-content"
    ref={scheduleRef}
    style={{ 
      display: 'none',
      backgroundColor: 'white',
      padding: '20px'
    }}
  >
    {selectedSchedule && (
      <div style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: '#e6f7ff', 
          padding: '20px', 
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: '#0066cc',
            marginBottom: '10px'
          }}>
            {selectedSchedule.batch} Schedule
          </h1>
          <div style={{ color: '#666', fontSize: '14px' }}>
            <div><strong>Semester:</strong> {selectedSchedule.semester}</div>
            <div><strong>Section:</strong> {selectedSchedule.section}</div>
            <div><strong>Status:</strong> {selectedSchedule.status}</div>
            <div><strong>Generated:</strong> {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Days Schedule */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold',
            marginBottom: '15px',
            color: '#333'
          }}>
            Weekly Schedule
          </h2>
          
          {selectedSchedule.days?.map((day: any, index: number) => (
            <div 
              key={index} 
              style={{ 
                marginBottom: '20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <div style={{ 
                backgroundColor: getDayColor(day.day_of_week) === 'blue' ? '#0066cc' :
                               getDayColor(day.day_of_week) === 'green' ? '#009933' :
                               getDayColor(day.day_of_week) === 'red' ? '#cc3300' :
                               getDayColor(day.day_of_week) === 'purple' ? '#6600cc' :
                               getDayColor(day.day_of_week) === 'orange' ? '#ff6600' : '#666666',
                color: 'white',
                padding: '12px 15px',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {day.day_of_week}
                <span style={{ 
                  float: 'right',
                  fontSize: '14px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {day.courses.length} courses
                </span>
              </div>
              
              <div style={{ padding: '15px' }}>
                {day.courses.map((course: any, idx: number) => (
                  <div 
                    key={idx} 
                    style={{ 
                      marginBottom: '15px',
                      padding: '15px',
                      borderLeft: '4px solid #0066cc',
                      backgroundColor: idx % 2 === 0 ? '#f9f9f9' : '#ffffff',
                      borderRadius: '4px'
                    }}
                  >
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                      }}>
                        <div>
                          <h3 style={{ 
                            fontSize: '16px', 
                            fontWeight: 'bold',
                            marginBottom: '5px',
                            color: '#0066cc'
                          }}>
                            {course.course_name || "Course"}
                          </h3>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#666',
                            marginBottom: '8px'
                          }}>
                            {course.course_code || ""}
                          </div>
                        </div>
                        <div style={{
                          backgroundColor: '#e6f7ff',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#0066cc'
                        }}>
                          {course.startTime} - {course.endTime}
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'flex', 
                        gap: '20px',
                        marginTop: '10px',
                        fontSize: '14px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ color: '#666' }}>👤</span>
                          <span>{course.instructor_name || "Instructor"}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span style={{ color: '#666' }}>🏢</span>
                          <span>
                            {course.block_code && course.room_number 
                              ? `${course.block_code}-${course.room_number}${course.room_type === 'lab' ? ' (Lab)' : ' (Lec/Tut)'}`
                              : "Room"
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '30px',
          paddingTop: '15px',
          borderTop: '1px solid #ddd',
          textAlign: 'center',
          fontSize: '12px',
          color: '#666'
        }}>
          <div>Generated from Department Schedule System</div>
          <div>{user?.department_name || "Department"} • {new Date().toLocaleDateString()}</div>
        </div>
      </div>
    )}
  </div>

  {/* Modal Content (Visible) */}
  {selectedSchedule && (
    <Stack gap="lg">
      {/* Header */}
      <Paper p="md" className="bg-gradient-to-r from-blue-50 to-purple-50" radius="md">
        <Group justify="space-between">
          <Stack gap={4}>
            <Title order={3}>{selectedSchedule.batch}</Title>
            <Group>
              <Badge color="blue" variant="light">{selectedSchedule.semester} </Badge>
              <Badge color="orange" variant="light">Section {selectedSchedule.section}</Badge>
              <Badge color={selectedSchedule.status === "published" ? "green" : "yellow"} variant="light">
                {selectedSchedule.status}
              </Badge>
            </Group>
          </Stack>
          <Text size="sm" c="dimmed">
            Created: {new Date(selectedSchedule.created_at).toLocaleDateString()}
          </Text>
        </Group>
      </Paper>

      {/* Days Schedule (Visible in Modal) */}
      <Stack gap="md">
        <Text fw={600} size="lg">Weekly Schedule</Text>
        {selectedSchedule.days?.map((day: any, index: number) => (
          <Card key={index} withBorder radius="md">
            <Group justify="space-between" mb="md">
              <Badge size="lg" color={getDayColor(day.day_of_week)} variant="light">
                {day.day_of_week}
              </Badge>
              <Badge color="gray" variant="light">
                {day.courses.length} courses
              </Badge>
            </Group>
            
            <Stack gap="sm">
              {day.courses.map((course: any, idx: number) => {
                const isConflicted = course.color === '#ef4444';
                return (
                  <Paper
                    key={idx}
                    p="md"
                    withBorder
                    className={`border-l-4 ${isConflicted ? "border-red-500 bg-red-50/80 shadow-sm ring-1 ring-red-300" : "border-blue-500"}`}
                  >
                    <Grid gutter="md">
                      <Grid.Col span={4}>
                        <Stack gap={4}>
                          <Group gap="xs">
                            <Text fw={600} size="sm" c={isConflicted ? "red.8" : undefined}>{course.course_name || "Course"}</Text>
                            {isConflicted && (
                              <Badge color="red" variant="filled" size="xs">
                                ⚠️ Duplicate / Conflict
                              </Badge>
                            )}
                          </Group>
                          <Text size="xs" c={isConflicted ? "red.6" : "dimmed"}>{course.course_code || ""}</Text>
                        </Stack>
                      </Grid.Col>
                      <Grid.Col span={3}>
                        <Group gap="xs">
                          <IconUser size={14} className={isConflicted ? "text-red-500" : undefined} />
                          <Text size="sm" fw={isConflicted ? 600 : undefined} c={isConflicted ? "red.8" : undefined}>
                            {course.instructor_name || "Instructor"}
                          </Text>
                        </Group>
                      </Grid.Col>
                      <Grid.Col span={3}>
                        <Group gap="xs">
                          <IconBuilding size={14} className={isConflicted ? "text-red-500" : undefined} />
                          <Text size="sm" fw={isConflicted ? 600 : undefined} c={isConflicted ? "red.8" : undefined}>
                            {course.block_code +"-" +course.room_number+"-"+(course.room_type =='lab'? course.room_type : "Lec/Tut") || "Room"}
                          </Text>
                        </Group>
                      </Grid.Col>
                      <Grid.Col span={2}>
                        <Badge color={isConflicted ? "red" : "blue"} size="sm" variant={isConflicted ? "filled" : "light"}>
                          {course.startTime} - {course.endTime}
                        </Badge>
                      </Grid.Col>
                    </Grid>
                  </Paper>
                );
              })}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Stack>
  )}

  <Group justify="space-between" mt="lg">
    <Button 
      leftSection={<IconSparkles size={16} />} 
      variant="gradient"
      gradient={{ from: "indigo", to: "cyan" }}
      onClick={() => handleOpenAiInsights(selectedSchedule)}
      disabled={!selectedSchedule}
    >
      🤖 AI Optimization & Insights
    </Button>
    <Group>
      <Button variant="light" onClick={() => setDetailedViewModal(false)}>
        Close
      </Button>
      <Button 
        leftSection={<IconDownload size={16} />} 
        color="blue"
        onClick={handleDownloadPDF}
        loading={loading}
      >
        Download as PDF
      </Button>
    </Group>
  </Group>
</Modal>

      {/* 🤖 AI Schedule Insights Modal */}
      <AiScheduleModal
        opened={aiModalOpened}
        onClose={() => setAiModalOpened(false)}
        scheduleId={aiActiveSchedule?.id}
        scheduleInfo={
          aiActiveSchedule
            ? {
                department: user?.department_name || `Dept #${user?.department_id || ""}`,
                batch: aiActiveSchedule.batch,
                semester: aiActiveSchedule.semester,
                section: aiActiveSchedule.section,
                status: aiActiveSchedule.status,
              }
            : undefined
        }
        mode="analysis"
        aiData={aiActiveSchedule ? aiSuggestions[String(aiActiveSchedule.id)] : null}
        loading={aiLoading}
        error={aiError}
        onRefresh={() => {
          if (aiActiveSchedule) {
            dispatch(fetchAiScheduleSuggestion(aiActiveSchedule.id));
          }
        }}
      />
    </div>
  );
};

export default DepartmentScheduleView;