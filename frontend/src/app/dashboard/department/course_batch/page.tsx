/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Button,
  Card,
  Group,
  Table,
  TextInput,
  Modal,
  Loader,
  Title,
  Container,
  ScrollArea,
  Alert,
  Box,
  Stack,
  Badge,
  Text,
  ActionIcon,
  Menu,
  Select,
  Avatar,
  ThemeIcon,
  Paper,
  Grid,
  Center,
  MultiSelect,
  Tabs,
  Tooltip,
  NumberInput,
  Divider,
  Checkbox,
  Flex,
  Collapse,
} from "@mantine/core";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusCircleIcon,
  AcademicCapIcon,
  CalendarIcon,
  BookOpenIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ClockIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  UsersIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { notifications } from "@mantine/notifications";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { Authentication, Found } from "@/app/auth/auth";

// Import slices
import { 
  fetchDepartments, 
  Department,
  fetchCreditHourSettings,
  updateCreditHourSettings as updateCreditHourSettingsThunk,
  fetchCreditHourUsage,
  type CreditHourSettings,
  type CreditHourUsage,
} from "@/store/slices/departmentsSlice";
import { fetchSemesters, Semester } from "@/store/slices/semesterSlice";
import { fetchBatches, Batch } from "@/store/slices/batchSlice";
import { 
  fetchCourses, 
  Course,
  fetchAllAssignments,
  clearAssignmentError,
  clearAssignmentSuccessMessage,
  CourseAssignment,
  Instructor,
} from "@/store/slices/coursesSlice";
import { 
  fetchCourseBatches, 
  createCourseBatch, 
  updateCourseBatch, 
  deleteCourseBatch,
  assignInstructorToCourseBatch,
  clearError,
  clearSuccessMessage,
  CourseBatch,
  CourseBatchFormData
} from "@/store/slices/courseBatchSlice";

// Import section slice
import {
  fetchSectionAssignments, 
  fetchSectionAssignmentsByCourseBatch,
  createSectionAssignment,
  updateSectionAssignment,
  deleteSectionAssignment,
  SectionInstructor,
  SectionInstructorFormData,
  clearError as clearSectionError,
  clearSuccessMessage as clearSectionSuccessMessage,
  createMultipleSectionAssignments,
  updateSectionAssignmentsForCourseBatch,
} from "@/store/slices/courseSectionSlice";

// Styled components
const StatCard = ({ icon: Icon, title, value, color, description }: any) => (
  <Card 
    withBorder 
    radius="lg" 
    className={`bg-gradient-to-br from-white to-${color}-50 border-${color}-100`}
    padding="lg"
  >
    <Group gap="md" align="flex-start">
      <ThemeIcon size="lg" radius="md" color={color} variant="light">
        <Icon className="h-5 w-5" />
      </ThemeIcon>
      <div style={{ flex: 1 }}>
        <Text size="sm" c="dimmed" fw={500}>{title}</Text>
        <Title order={3} className={`text-${color}-700`}>{value}</Title>
        {description && (
          <Text size="xs" c="dimmed" mt={4}>{description}</Text>
        )}
      </div>
    </Group>
  </Card>
);

// Helper function to extract instructor data
const extractInstructorData = (assignment: CourseAssignment) => {
  // Handle both nested instructor object and direct properties
  return {
    id: assignment.instructor_id,
    full_name: assignment.instructor?.full_name || assignment.instructor_name || "Unknown Instructor",
    email: assignment.instructor?.email || assignment.email || "",
    department: assignment.instructor?.department || assignment.department_name || "",
    course_status: assignment.course_status || 'active',
    department_name: assignment.department_name || "",
  };
};

// Instructor Status Badge Component
const InstructorStatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    if (!status) return 'gray';
    switch (status.toLowerCase()) {
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'pending': return 'orange';
      case 'completed': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Badge 
      color={getStatusColor(status)} 
      variant="light" 
      size="xs"
    >
      {getStatusText(status)}
    </Badge>
  );
};

// Section Assignment Modal Component with View, Edit, Delete
interface SectionAssignmentModalProps {
  opened: boolean;
  onClose: () => void;
  courseBatch: CourseBatch | null;
  availableInstructors: CourseAssignment[];
  existingAssignments: SectionInstructor[];
  onSave: (formData: SectionInstructorFormData[]) => Promise<void>;
  onUpdate: (id: number, formData: Partial<SectionInstructorFormData>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const SectionAssignmentModal: React.FC<SectionAssignmentModalProps> = ({
  opened,
  onClose,
  courseBatch,
  availableInstructors,
  existingAssignments,
  onSave,
  onUpdate,
  onDelete,
}) => {
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [sections] = useState<string[]>(["A", "B", "C", "D", "E", "F", "G", "H"]);
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'bulk'>('bulk');
  const [viewMode, setViewMode] = useState<'assign' | 'manage'>('assign');
  const [selectedAssignment, setSelectedAssignment] = useState<SectionInstructor | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [instructorLoad, setInstructorLoad] = useState<{
    current_sections: number;
    max_sections: number;
    remaining_sections: number;
    current_contact_hours: number;
    max_weekly_hours: number;
    remaining_hours: number;
    current_weekly_sessions: number;
    incoming_course?: {
      contact_hours_per_section: number;
      sessions_per_section: number;
    };
    is_overloaded: boolean;
  } | null>(null);

  // Fetch selected instructor's current section load
  useEffect(() => {
    if (selectedInstructorId && courseBatch?.id) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/course-sections/instructor-load/${selectedInstructorId}?course_batch_id=${courseBatch.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setInstructorLoad(data);
          } else {
            setInstructorLoad(null);
          }
        })
        .catch(() => setInstructorLoad(null));
    } else {
      setInstructorLoad(null);
    }
  }, [selectedInstructorId, courseBatch?.id]);
 
  // Process available instructors and remove duplicates
  const processedInstructors = useMemo(() => {
    const uniqueInstructors = new Map<number, any>();
    
    availableInstructors.forEach(instructor => {
      const processed = {
        ...extractInstructorData(instructor),
        instructor_id: instructor.instructor_id,
        course_id: instructor.course_id,
      };
      
      if (!uniqueInstructors.has(processed.id)) {
        uniqueInstructors.set(processed.id, processed);
      }
    });
    
    return Array.from(uniqueInstructors.values());
  }, [availableInstructors]);

  // Available sections for assignment
  const availableSections = useMemo(() => {
    // Filter out already assigned sections
    const assignedSections = existingAssignments.map(a => a.section);
    return sections.filter(section => !assignedSections.includes(section));
  }, [existingAssignments, sections]);

  // Filter instructors for display (active only)
  const filteredInstructorsForSelect = useMemo(() => {
    const uniqueOptions = new Map<string, any>();
    
    processedInstructors.forEach(instructor => {
      // Only show active instructors
      if (instructor.course_status !== 'active') return;
      
      const key = `${instructor.id}`;
      
      if (!uniqueOptions.has(key)) {
        uniqueOptions.set(key, {
          value: instructor.id.toString(),
          label: instructor.full_name,
          description: instructor.email || '',
          instructor: instructor
        });
      }
    });
    
    return Array.from(uniqueOptions.values());
  }, [processedInstructors]);

  // Handle section selection change
  const handleSectionsChange = (newSections: string[]) => {
    if (assignmentMode === 'single') {
      // Single mode: only allow one section
      setSelectedSections(newSections.slice(0, 1));
    } else {
      // Bulk mode: allow multiple
      setSelectedSections(newSections);
    }
  };

  const handleSubmit = async () => {
    if (!courseBatch || !selectedInstructorId) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "Please select an instructor",
      });
      return;
    }

    if (selectedSections.length === 0) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "Please select at least one section",
      });
      return;
    }

    // Check for duplicate sections (sections already assigned to other instructors)
    const duplicateSections = selectedSections.filter(section =>
      existingAssignments.some(a => a.section === section && a.instructor_id.toString() !== selectedInstructorId)
    );

    if (duplicateSections.length > 0) {
      notifications.show({
        color: "red",
        title: "Error",
        message: `Sections ${duplicateSections.join(', ')} are already assigned to other instructors`,
      });
      return;
    }

    // Check for instructor workload overload (Option B: Weekly Contact Hours & Sections)
    if (instructorLoad) {
      const incomingHours = (instructorLoad.incoming_course?.contact_hours_per_section || 0) * selectedSections.length;
      const projectedHours = instructorLoad.current_contact_hours + incomingHours;
      const projectedSections = instructorLoad.current_sections + selectedSections.length;

      if (incomingHours > 0 && projectedHours > instructorLoad.max_weekly_hours) {
        notifications.show({
          color: "red",
          title: "Weekly Contact Hours Overload Alert",
          message: `Cannot assign: this instructor would reach ${projectedHours} contact hrs/week (current: ${instructorLoad.current_contact_hours} hrs, adding: ${incomingHours} hrs). Department limit is ${instructorLoad.max_weekly_hours} hrs/week.`,
        });
        return;
      }

      if (projectedSections > instructorLoad.max_sections) {
        notifications.show({
          color: "red",
          title: "Instructor Overload Alert",
          message: `Cannot assign: this instructor already has ${instructorLoad.current_sections} section(s). Adding ${selectedSections.length} section(s) would exceed the department limit of ${instructorLoad.max_sections} sections per semester.`,
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Create assignments
      const assignments: SectionInstructorFormData[] = selectedSections.map(section => ({
        course_batch_id: courseBatch.id,
        instructor_id: parseInt(selectedInstructorId),
        section: section,
      }));
      
      console.log('Submitting assignments:', assignments);
      
      await onSave(assignments);
      
      // Reset form
      setSelectedSections([]);
      setSelectedInstructorId("");
      
    } catch (error: any) {
      console.error('Submission failed:', error);
      
      // Show detailed error
      let errorMessage = error.message || "Failed to save section assignment";
      
      // Extract server error message if available
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }
      
      notifications.show({
        color: "red",
        title: "Error",
        message: errorMessage,
      });
      
      // Don't close modal on error
      return;
    } finally {
      setLoading(false);
    }
    
    // Only close if successful
    onClose();
  };

  const handleEditAssignment = (assignment: SectionInstructor) => {
    setSelectedAssignment(assignment);
    setEditModalOpen(true);
  };

  const handleViewAssignment = (assignment: SectionInstructor) => {
    setSelectedAssignment(assignment);
    setViewModalOpen(true);
  };

  const handleDeleteAssignment = (assignment: SectionInstructor) => {
    setSelectedAssignment(assignment);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAssignment) return;
    
    try {
      await onDelete(selectedAssignment.id);
      setDeleteModalOpen(false);
      setSelectedAssignment(null);
      notifications.show({
        color: "green",
        title: "Success",
        message: "Section assignment deleted successfully",
      });
    } catch (error: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: error.message || "Failed to delete section assignment",
      });
    }
  };

  const handleEditSave = async () => {
    if (!selectedAssignment || !courseBatch) return;
    
    setLoading(true);
    try {
      const formData: Partial<SectionInstructorFormData> = {
        course_batch_id: courseBatch.id,
        instructor_id: selectedAssignment.instructor_id,
        section: selectedAssignment.section,
      };
      
      await onUpdate(selectedAssignment.id, formData);
      setEditModalOpen(false);
      setSelectedAssignment(null);
      notifications.show({
        color: "green",
        title: "Success",
        message: "Section assignment updated successfully",
      });
    } catch (error: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: error.message || "Failed to update section assignment",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedInstructor = processedInstructors.find(
    instructor => instructor.id.toString() === selectedInstructorId
  );

  // Get sections already assigned (to show which are unavailable)
  const assignedSections = useMemo(() => {
    return existingAssignments.map(a => a.section);
  }, [existingAssignments]);

  // Get instructor for a specific assignment
  const getInstructorForAssignment = (assignment: SectionInstructor) => {
    return processedInstructors.find(inst => inst.id === assignment.instructor_id);
  };

  // Test API connection function
  const testApiConnection = async () => {
    setTestMode(true);
    try {
      const testData = {
        course_batch_id: courseBatch?.id || 1,
        instructor_id: parseInt(selectedInstructorId) || 1,
        section: 'A',
      };
      
      console.log('Testing API with:', testData);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/course-sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });
      
      const data = await response.json();
      console.log('Test response:', { status: response.status, data });
      
      if (!response.ok) {
        throw new Error(`Test failed: ${response.status} - ${JSON.stringify(data)}`);
      }
      
      notifications.show({
        color: "green",
        title: "API Test Successful",
        message: "API connection is working correctly",
      });
    } catch (error: any) {
      console.error('API test failed:', error);
      notifications.show({
        color: "red",
        title: "API Test Failed",
        message: error.message || "Could not connect to server",
      });
    } finally {
      setTestMode(false);
    }
  };

  return (
    <>
      <Modal 
        opened={opened} 
        onClose={() => {
          setSelectedSections([]);
          setSelectedInstructorId("");
          onClose();
        }}
        title={
          <Group gap="sm">
            <ThemeIcon size="md" radius="lg" color="indigo" variant="light">
              <UserGroupIcon className="h-5 w-5" />
            </ThemeIcon>
            <div>
              <Text fw={600} component="div">Manage Section Instructors</Text>
              <Text size="sm" c="dimmed" component="div">
                Assign instructors to multiple sections (One instructor can handle multiple sections)
              </Text>
            </div>
          </Group>
        }
        centered
        size="lg"
        radius="lg"
      >
        <Stack gap="lg">
          {/* Course Batch Info */}
          {courseBatch && (
            <Paper withBorder p="md" radius="md" className="bg-indigo-50 border-indigo-100">
              <Group justify="space-between" wrap="nowrap">
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Text size="sm" fw={500} component="div">
                    {courseBatch.course_code} - {courseBatch.course_name}
                  </Text>
                  <Group gap="md" wrap="wrap">
                    <Badge color="orange" variant="light" size="sm">
                      Batch {courseBatch.batch}
                    </Badge>
                    <Badge color="green" variant="light" size="sm">
                      {courseBatch.semester}
                    </Badge>
                    <Badge color="purple" variant="light" size="sm">
                      {courseBatch.department_name}
                    </Badge>
                  </Group>
                </Stack>
                <Badge color="indigo" variant="light" size="lg">
                  {existingAssignments.length} section(s) assigned
                </Badge>
              </Group>
            </Paper>
          )}
          

          {/* Tabs for Assign vs Manage */}
          <Paper withBorder p="md" radius="md">
            <Tabs value={viewMode} onChange={(value) => setViewMode(value as any)}>
              <Tabs.List grow>
                <Tabs.Tab value="assign" leftSection={<UserPlusIcon className="h-4 w-4" />}>
                  Assign Sections
                </Tabs.Tab>
                <Tabs.Tab value="manage" leftSection={<UsersIcon className="h-4 w-4" />}>
                  Manage Assignments ({existingAssignments.length})
                </Tabs.Tab>
              </Tabs.List>

              {/* Assign Tab Content */}
              <Tabs.Panel value="assign" pt="md">
                <Stack gap="md">
                  {/* Mode Selection */}
                  <Group justify="space-between">
                    <Text fw={600} component="div">Assignment Mode</Text>
                    <Group gap="xs">
                      <Button
                        variant={assignmentMode === 'single' ? 'filled' : 'light'}
                        color="blue"
                        size="sm"
                        onClick={() => {
                          setAssignmentMode('single');
                          setSelectedSections(selectedSections.slice(0, 1));
                        }}
                      >
                        Single Section
                      </Button>
                      <Button
                        variant={assignmentMode === 'bulk' ? 'filled' : 'light'}
                        color="green"
                        size="sm"
                        onClick={() => setAssignmentMode('bulk')}
                      >
                        Multiple Sections
                      </Button>
                      <Tooltip label="Test API connection">
                        <Button
                          variant="light"
                          color="orange"
                          size="sm"
                          onClick={testApiConnection}
                          loading={testMode}
                          leftSection={<InformationCircleIcon className="h-4 w-4" />}
                        >
                          Test API
                        </Button>
                      </Tooltip>
                    </Group>
                  </Group>

                  {/* Instructor Selection */}
                  <Select
                    label={
                      <Group gap="xs">
                        <UserIcon className="h-4 w-4" />
                        <Text component="span">Select Instructor</Text>
                        <Badge color="green" variant="light" size="xs">
                          Active only
                        </Badge>
                      </Group>
                    }
                    data={filteredInstructorsForSelect}
                    value={selectedInstructorId}
                    onChange={(value) => {
                      setSelectedInstructorId(value || "");
                    }}
                    required
                    withAsterisk
                    searchable
                    clearable
                    nothingFoundMessage="No active instructors available"
                    size="md"
                    placeholder="Choose an instructor"
                    disabled={filteredInstructorsForSelect.length === 0}
                  />

                  {/* Instructor Workload Card (Option B: Weekly Contact Hours & Sessions) */}
                  {instructorLoad && (() => {
                    const incomingHrsPerSec = instructorLoad.incoming_course?.contact_hours_per_section || 0;
                    const incomingSesPerSec = instructorLoad.incoming_course?.sessions_per_section || 0;
                    const addedHours = incomingHrsPerSec * selectedSections.length;
                    const addedSessions = incomingSesPerSec * selectedSections.length;
                    const projectedHours = instructorLoad.current_contact_hours + addedHours;
                    const projectedSections = instructorLoad.current_sections + selectedSections.length;
                    const willExceedHours = addedHours > 0 && projectedHours > instructorLoad.max_weekly_hours;
                    const willExceedSections = projectedSections > instructorLoad.max_sections;
                    const hasProjectedOverload = willExceedHours || willExceedSections;

                    return (
                      <Paper
                        withBorder
                        p="xs"
                        radius="md"
                        style={{
                          background: (instructorLoad.is_overloaded || hasProjectedOverload) ? '#fef2f2' : (instructorLoad.remaining_hours <= 3 ? '#fffbeb' : '#f0fdf4'),
                          borderColor: (instructorLoad.is_overloaded || hasProjectedOverload) ? '#fca5a5' : (instructorLoad.remaining_hours <= 3 ? '#fde68a' : '#bbf7d0')
                        }}
                      >
                        <Group justify="space-between" mb={4}>
                          <Group gap="xs">
                            <Text size="xs" fw={700} c={(instructorLoad.is_overloaded || hasProjectedOverload) ? 'red' : (instructorLoad.remaining_hours <= 3 ? 'orange' : 'teal')} component="span">
                              {(instructorLoad.is_overloaded || hasProjectedOverload) ? '⚠️ OVERLOAD' : '👨‍🏫 Instructor Workload (Option B)'}
                            </Text>
                            <Badge size="xs" color={(instructorLoad.is_overloaded || hasProjectedOverload) ? 'red' : 'indigo'} variant="light">
                              {instructorLoad.current_contact_hours} / {instructorLoad.max_weekly_hours} contact hrs/week
                            </Badge>
                            <Badge size="xs" color="gray" variant="outline">
                              {instructorLoad.current_weekly_sessions} sessions/week
                            </Badge>
                          </Group>
                          <Text size="xs" c="dimmed" component="span">
                            {instructorLoad.current_sections} / {instructorLoad.max_sections} sections
                          </Text>
                        </Group>
                        
                        {/* Weekly Contact Hours Progress Bar */}
                        <div style={{ position: 'relative', height: 7, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(100, (instructorLoad.current_contact_hours / instructorLoad.max_weekly_hours) * 100)}%`,
                            background: instructorLoad.is_overloaded ? '#ef4444' : (instructorLoad.remaining_hours <= 3 ? '#f59e0b' : '#10b981'),
                            transition: 'width 0.3s ease'
                          }} />
                        </div>

                        {/* Incoming section calculation preview */}
                        {selectedSections.length > 0 && incomingHrsPerSec > 0 && (
                          <Group justify="space-between" mt={6}>
                            <Text size="xs" c="dimmed" component="span">
                              Selected: {selectedSections.length} section(s) = +{addedHours} contact hrs (+{addedSessions} sessions)
                            </Text>
                            <Text size="xs" fw={600} c={hasProjectedOverload ? 'red' : 'teal'} component="span">
                              Total: {projectedHours} / {instructorLoad.max_weekly_hours} hrs/week
                            </Text>
                          </Group>
                        )}

                        {/* Overload alert message */}
                        {hasProjectedOverload && (
                          <Text size="xs" c="red" fw={600} mt={4} component="div">
                            ⚠️ Overload warning: Adding {selectedSections.length} section(s) will exceed {willExceedHours ? `max contact hours (${projectedHours} > ${instructorLoad.max_weekly_hours} hrs/week)` : `max sections (${projectedSections} > ${instructorLoad.max_sections})`}!
                          </Text>
                        )}
                      </Paper>
                    );
                  })()}

                  {/* Section Selection */}
                  <div>
                    <Group justify="space-between" mb="xs">
                      <Group gap="xs">
                        <UserGroupIcon className="h-4 w-4" />
                        <Text fw={500} size="sm" component="span">
                          {assignmentMode === 'single' ? 'Select Section' : 'Select Multiple Sections'}
                        </Text>
                        {assignmentMode === 'bulk' && (
                          <Badge color="green" variant="light" size="xs">
                            {selectedSections.length} selected
                          </Badge>
                        )}
                      </Group>
                      <Text size="sm" c="dimmed">
                        {availableSections.length} available
                      </Text>
                    </Group>
                    
                    {availableSections.length === 0 ? (
                      <Alert color="blue" title="All Sections Assigned" radius="md">
                        <Text size="sm" component="div">
                          All sections have been assigned to instructors.
                        </Text>
                      </Alert>
                    ) : assignmentMode === 'single' ? (
                      <Select
                        data={availableSections.map(section => ({
                          value: section,
                          label: `Section ${section}`,
                        }))}
                        value={selectedSections[0] || ""}
                        onChange={(value) => setSelectedSections(value ? [value] : [])}
                        required
                        withAsterisk
                        size="md"
                        placeholder="Choose a section"
                      />
                    ) : (
                      <MultiSelect
                        data={sections.map(section => ({
                          value: section,
                          label: `Section ${section}`,
                          disabled: assignedSections.includes(section),
                        }))}
                        value={selectedSections}
                        onChange={handleSectionsChange}
                        searchable
                        clearable
                        placeholder="Choose sections"
                        size="md"
                        maxDropdownHeight={200}
                      />
                    )}
                    
                    {assignedSections.length > 0 && (
                      <Text size="xs" c="dimmed" mt="xs">
                        Note: Sections {assignedSections.sort().join(', ')} are already assigned
                      </Text>
                    )}
                  </div>

                  {/* Selected Instructor Info */}
                  {selectedInstructor && (
                    <Paper withBorder p="md" radius="md" className="bg-teal-50 border-teal-100">
                      <Stack gap="sm">
                        <Group gap="md">
                          <Avatar size="md" radius="md" color="teal">
                            {selectedInstructor.full_name.charAt(0)}
                          </Avatar>
                          <div>
                            <Text fw={600} component="div">
                              {selectedInstructor.full_name}
                            </Text>
                            <Text size="sm" c="dimmed" component="div">
                              {selectedInstructor.email}
                            </Text>
                            <Group gap="xs" mt={4}>
                              <InstructorStatusBadge status={selectedInstructor.course_status} />
                              {selectedInstructor.department && (
                                <Badge color="blue" variant="light" size="xs">
                                  {selectedInstructor.department}
                                </Badge>
                              )}
                            </Group>
                          </div>
                        </Group>
                      </Stack>
                    </Paper>
                  )}

                  {/* Submit Button */}
                  <Group justify="flex-end">
                    <Button
                      onClick={handleSubmit}
                      loading={loading}
                      disabled={!selectedInstructorId || selectedSections.length === 0 || availableSections.length === 0}
                      size="md"
                      color="indigo"
                      leftSection={
                        assignmentMode === 'bulk' ? (
                          <DocumentDuplicateIcon className="h-5 w-5" />
                        ) : (
                          <UserPlusIcon className="h-5 w-5" />
                        )
                      }
                    >
                      {loading
                        ? "Saving..."
                        : assignmentMode === 'bulk'
                        ? `Assign to ${selectedSections.length} Section(s)`
                        : "Assign to Section"}
                    </Button>
                  </Group>
                </Stack>
              </Tabs.Panel>

              {/* Manage Tab Content */}
              <Tabs.Panel value="manage" pt="md">
                {existingAssignments.length === 0 ? (
                  <Center py="lg">
                    <Stack align="center" gap="md">
                      <ThemeIcon size="xl" radius="lg" color="gray" variant="light">
                        <UserGroupIcon className="h-8 w-8" />
                      </ThemeIcon>
                      <Text size="lg" fw={500} c="dimmed" component="div">
                        No section assignments yet
                      </Text>
                      <Text c="dimmed" ta="center" component="div">
                        Start by assigning instructors to sections in the &quot;Assign Sections&quot; tab
                      </Text>
                    </Stack>
                  </Center>
                ) : (
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text fw={600} size="sm" component="div">
                        All Section Assignments
                      </Text>
                      <Badge color="indigo" variant="light" size="sm">
                        {existingAssignments.length} total
                      </Badge>
                    </Group>
                    
                    <ScrollArea h={400}>
                      <Stack gap="sm">
                        {existingAssignments.map((assignment, index) => {
                          const instructor = getInstructorForAssignment(assignment);
                          
                          // Create unique key
                          const uniqueKey = `section-assignment-${assignment.id}-${index}`;
                          
                          return (
                            <Paper
                              key={uniqueKey}
                              withBorder
                              p="md"
                              radius="md"
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <Group justify="space-between">
                                <Group gap="md">
                                  <Badge color="indigo" variant="light" size="lg">
                                    Section {assignment.section}
                                  </Badge>
                                  <Divider orientation="vertical" />
                                  <Group gap="sm">
                                    <Avatar size="sm" radius="md" color="teal" variant="light">
                                      {instructor?.full_name.charAt(0) || "I"}
                                    </Avatar>
                                    <div>
                                      <Text fw={500} size="sm" component="div">
                                        {instructor?.full_name || "Unknown Instructor"}
                                      </Text>
                                      <Text size="xs" c="dimmed" component="div">
                                        {instructor?.email || ""}
                                      </Text>
                                      {instructor && (
                                        <Group gap="xs" mt={4}>
                                          <InstructorStatusBadge status={instructor.course_status} />
                                          {instructor.department && (
                                            <Badge color="blue" variant="light" size="xs">
                                              {instructor.department}
                                            </Badge>
                                          )}
                                        </Group>
                                      )}
                                    </div>
                                  </Group>
                                </Group>
                                
                                <Group gap="xs">
                                  <Tooltip label="View details">
                                    <ActionIcon
                                      variant="light"
                                      color="blue"
                                      onClick={() => handleViewAssignment(assignment)}
                                    >
                                      <EyeIcon className="h-4 w-4" />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Edit assignment">
                                    <ActionIcon
                                      variant="light"
                                      color="orange"
                                      onClick={() => handleEditAssignment(assignment)}
                                    >
                                      <PencilSquareIcon className="h-4 w-4" />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Delete assignment">
                                    <ActionIcon
                                      variant="light"
                                      color="red"
                                      onClick={() => handleDeleteAssignment(assignment)}
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </Group>
                            </Paper>
                          );
                        })}
                      </Stack>
                    </ScrollArea>
                  </Stack>
                )}
              </Tabs.Panel>
            </Tabs>
          </Paper>

          {processedInstructors.filter(i => i.course_status === 'active').length === 0 && (
            <Alert
              color="orange"
              title="No Active Instructors Available"
              icon={<ExclamationTriangleIcon className="h-5 w-5" />}
              radius="md"
            >
              <Text size="sm" component="div">
                No active instructors have been assigned to this course by admin yet.
              </Text>
              <Text size="sm" component="div" mt="xs">
                Please contact admin to assign active instructors to this course first.
              </Text>
            </Alert>
          )}
        </Stack>
      </Modal>

      {/* View Assignment Modal */}
      <Modal
        opened={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedAssignment(null);
        }}
        title="View Section Assignment"
        centered
        size="md"
        radius="lg"
      >
        {selectedAssignment && courseBatch && (
          <Stack gap="lg">
            <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
              <Stack gap="xs">
                <Group justify="center">
                  <Badge color="indigo" variant="light" size="xl">
                    Section {selectedAssignment.section}
                  </Badge>
                </Group>
                
                <Divider />
                
                <Text size="sm" fw={600} component="div">Course Details</Text>
                <Group justify="space-between">
                  <Text size="sm" component="div">
                    <strong>Course:</strong> {courseBatch.course_code} - {courseBatch.course_name}
                  </Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm" component="div">
                    <strong>Batch:</strong> {courseBatch.batch}
                  </Text>
                  <Text size="sm" component="div">
                    <strong>Semester:</strong> {courseBatch.semester}
                  </Text>
                </Group>
                <Text size="sm" component="div">
                  <strong>Department:</strong> {courseBatch.department_name}
                </Text>
              </Stack>
            </Paper>

            <Paper withBorder p="md" radius="md" className="bg-teal-50 border-teal-100">
              <Text size="sm" fw={600} component="div" mb="xs">Instructor Details</Text>
              {(() => {
                const instructor = getInstructorForAssignment(selectedAssignment);
                return (
                  <Group gap="md">
                    <Avatar size="lg" radius="md" color="teal">
                      {instructor?.full_name.charAt(0) || "I"}
                    </Avatar>
                    <div>
                      <Text fw={600} component="div">
                        {instructor?.full_name || "Unknown Instructor"}
                      </Text>
                      <Text size="sm" c="dimmed" component="div">
                        {instructor?.email || ""}
                      </Text>
                      <Group gap="xs" mt={4}>
                        <InstructorStatusBadge status={instructor?.course_status || 'active'} />
                        {instructor?.department && (
                          <Badge color="blue" variant="light" size="xs">
                            {instructor.department}
                          </Badge>
                        )}
                      </Group>
                    </div>
                  </Group>
                );
              })()}
            </Paper>

            <Paper withBorder p="md" radius="md">
              <Text size="sm" fw={600} component="div" mb="xs">Assignment Details</Text>
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" component="div">
                    <strong>Assignment ID:</strong> {selectedAssignment.id}
                  </Text>
                  <Badge color="gray" variant="light">
                    ID: {selectedAssignment.id}
                  </Badge>
                </Group>
                <Text size="sm" component="div">
                  <strong>Created:</strong> {new Date(selectedAssignment.created_at).toLocaleDateString()}
                </Text>
                <Text size="sm" component="div">
                  <strong>Last Updated:</strong> {new Date(selectedAssignment.updated_at).toLocaleDateString()}
                </Text>
              </Stack>
            </Paper>

            <Group justify="flex-end">
              <Button
                variant="light"
                color="blue"
                onClick={() => {
                  setViewModalOpen(false);
                  handleEditAssignment(selectedAssignment);
                }}
                leftSection={<PencilSquareIcon className="h-4 w-4" />}
              >
                Edit Assignment
              </Button>
              <Button
                variant="light"
                color="gray"
                onClick={() => setViewModalOpen(false)}
              >
                Close
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Edit Assignment Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedAssignment(null);
        }}
        title="Edit Section Assignment"
        centered
        size="md"
        radius="lg"
      >
        {selectedAssignment && courseBatch && (
          <Stack gap="lg">
            <Alert color="blue" title="Edit Mode" radius="md">
              <Text size="sm" component="div">
                You are editing Section {selectedAssignment.section} assignment.
              </Text>
              <Text size="sm" component="div" mt="xs">
                Note: Changing instructor will reassign this section to a different instructor.
              </Text>
            </Alert>

            <Select
              label="Instructor"
              data={filteredInstructorsForSelect}
              value={selectedAssignment.instructor_id.toString()}
              onChange={(value) => {
                if (value) {
                  setSelectedAssignment({
                    ...selectedAssignment,
                    instructor_id: parseInt(value)
                  });
                }
              }}
              required
              withAsterisk
              searchable
              nothingFoundMessage="No active instructors available"
              size="md"
              placeholder="Select instructor"
            />

            <Select
              label="Section"
              data={sections.map(section => ({
                value: section,
                label: `Section ${section}`,
                disabled: existingAssignments.some(a => 
                  a.section === section && a.id !== selectedAssignment.id
                ),
              }))}
              value={selectedAssignment.section}
              onChange={(value) => {
                if (value) {
                  setSelectedAssignment({
                    ...selectedAssignment,
                    section: value
                  });
                }
              }}
              required
              withAsterisk
              size="md"
              placeholder="Select section"
            />

            {(() => {
              const instructor = getInstructorForAssignment(selectedAssignment);
              return instructor ? (
                <Paper withBorder p="md" radius="md" className="bg-teal-50 border-teal-100">
                  <Group gap="md">
                    <Avatar size="md" radius="md" color="teal">
                      {instructor.full_name.charAt(0)}
                    </Avatar>
                    <div>
                      <Text fw={600} component="div">
                        {instructor.full_name}
                      </Text>
                      <Text size="sm" c="dimmed" component="div">
                        {instructor.email}
                      </Text>
                      <Group gap="xs" mt={4}>
                        <InstructorStatusBadge status={instructor.course_status} />
                        {instructor.department && (
                          <Badge color="blue" variant="light" size="xs">
                            {instructor.department}
                          </Badge>
                        )}
                      </Group>
                    </div>
                  </Group>
                </Paper>
              ) : null;
            })()}

            <Group justify="flex-end" gap="sm">
              <Button
                variant="light"
                color="gray"
                onClick={() => {
                  setEditModalOpen(false);
                  setSelectedAssignment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditSave}
                loading={loading}
                color="orange"
                leftSection={<PencilSquareIcon className="h-4 w-4" />}
              >
                Update Assignment
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedAssignment(null);
        }}
        title="Delete Section Assignment"
        centered
        size="md"
        radius="lg"
      >
        {selectedAssignment && (
          <Stack gap="lg">
            <Alert color="red" title="Warning" icon={<ExclamationTriangleIcon className="h-5 w-5" />} radius="md">
              <Text size="sm" component="div">
                Are you sure you want to delete this section assignment?
              </Text>
              <Text size="sm" component="div" mt="xs">
                This action cannot be undone.
              </Text>
            </Alert>

            <Paper withBorder p="md" radius="md">
              <Stack gap="xs">
                <Text size="sm" fw={600} component="div">Assignment Details</Text>
                <Text size="sm" component="div">
                  <strong>Section:</strong> {selectedAssignment.section}
                </Text>
                <Text size="sm" component="div">
                  <strong>Instructor ID:</strong> {selectedAssignment.instructor_id}
                </Text>
                {(() => {
                  const instructor = getInstructorForAssignment(selectedAssignment);
                  return (
                    <Text size="sm" component="div">
                      <strong>Instructor:</strong> {instructor?.full_name || "Unknown"}
                    </Text>
                  );
                })()}
                <Text size="sm" component="div">
                  <strong>Created:</strong> {new Date(selectedAssignment.created_at).toLocaleDateString()}
                </Text>
              </Stack>
            </Paper>

            <Group justify="flex-end" gap="sm">
              <Button
                variant="light"
                color="gray"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedAssignment(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                loading={loading}
                color="red"
                leftSection={<TrashIcon className="h-4 w-4" />}
              >
                Delete Assignment
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
};

// Course Batch Modal Component (keep this as is from your original code)
interface CourseBatchModalProps {
  opened: boolean;
  onClose: () => void;
  courseBatch: CourseBatch | null;
  onSave: (id: number | null, data: CourseBatchFormData) => Promise<void>;
  onSaveMultiple: (assignments: CourseBatchFormData[]) => Promise<void>;
  courses: Course[];
  departments: Department[];
  batches: Batch[];
  semesters: Semester[];
  adminAssignedInstructors: CourseAssignment[];
}

const CourseBatchModal: React.FC<CourseBatchModalProps> = ({
  opened,
  onClose,
  courseBatch,
  onSave,
  onSaveMultiple,
  courses,
  departments,
  batches,
  semesters,
  adminAssignedInstructors,
}) => {
  const [formData, setFormData] = useState<CourseBatchFormData>({
    course_id: 0,
    batch: 0,
    semester_id: '',
    department_id: 0,
    instructor_id: 0,
  });
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<'single' | 'multiple'>('multiple');
  const [user, setUser] = useState<any>(null);
  const department_id = user?.department_id.toString();

  // Credit hour usage state
  const [creditUsage, setCreditUsage] = useState<CreditHourUsage | null>(null);
  const [creditSettings, setCreditSettings] = useState<CreditHourSettings | null>(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  // Fetch credit hour settings on mount when we know the department
  useEffect(() => {
    if (user?.department_id) {
      fetch(`${API_BASE}/api/departments/${user.department_id}/credit-hour-settings`)
        .then(r => r.json())
        .then(data => setCreditSettings(data))
        .catch(() => {});
    }
  }, [user?.department_id, API_BASE]);

  // Fetch credit hour usage when batch + semester changes
  useEffect(() => {
    if (user?.department_id && formData.batch && formData.semester_id) {
      setCreditLoading(true);
      fetch(
        `${API_BASE}/api/departments/${user.department_id}/credit-hour-usage?batch_id=${formData.batch}&semester_id=${formData.semester_id}`
      )
        .then(r => r.json())
        .then(data => { setCreditUsage(data); setCreditLoading(false); })
        .catch(() => setCreditLoading(false));
    } else {
      setCreditUsage(null);
    }
  }, [user?.department_id, formData.batch, formData.semester_id, API_BASE]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const foundUser = await Found();
        setUser(foundUser);
      } catch (error) {
        console.error("Auth error:", error);
        setUser(null);
      } 
    };
    checkAuth();
  }, []);
  
  // Initialize form when modal opens or courseBatch changes
  useEffect(() => {
    if (courseBatch) {
      setFormData({
        course_id: courseBatch.course_id,
        batch: courseBatch.batch,
        semester_id: courseBatch.semester_id,
        department_id: department_id,
        instructor_id: courseBatch.instructor_id || 0,
      });
      setSelectedCourseIds([courseBatch.course_id.toString()]);
      setAssignmentMode('single');
    } else {
      setFormData({
        course_id: 0,
        batch: 0,
        semester_id: '',
        department_id: 0,
        instructor_id: 0,
      });
      setSelectedCourseIds([]);
      setAssignmentMode('multiple');
    }
  }, [courseBatch, opened, department_id]);

  // Filter courses by selected department
  const departmentCourses = useMemo(() => {
    if (!department_id) return courses;
    return courses;
  }, [courses, department_id]);

  // Filter batches by selected department
  const departmentBatches = useMemo(() => {
    if (!formData.department_id) return batches;
    return batches.filter(batch => true);
  }, [batches, formData.department_id]);

  // Filter semesters by selected department
  const departmentSemesters = useMemo(() => {
    if (!formData.department_id) return semesters;
      return semesters;
  }, [semesters, formData.department_id]);

  const handleSubmit = async () => {
    if (assignmentMode === 'single') {
      if (!formData.course_id || !formData.batch || !formData.semester_id || !department_id) {
        notifications.show({
          color: "red",
          title: "Error",
          message: "All fields are required",
        });
        return;
      }
    } else {
      if (selectedCourseIds.length === 0 || !formData.batch || !formData.semester_id || !department_id) {
        notifications.show({
          color: "red",
          title: "Error",
          message: "Please select at least one course and fill all required fields",
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Credit hour limit enforcement
      if (creditUsage && creditSettings) {
        const newCreditHours = assignmentMode === 'multiple'
          ? selectedCoursesData.reduce((sum, c) => sum + (c?.credit_hour || 0), 0)
          : (courses.find(c => c.course_id === formData.course_id)?.credit_hour || 0);
        const projected = creditUsage.total_credit_hours + newCreditHours;
        if (projected > creditSettings.max_credit_hours) {
          notifications.show({
            color: 'red',
            title: '❌ Credit Hour Limit Exceeded',
            message: `Adding these courses would reach ${projected} credit hours, exceeding the max of ${creditSettings.max_credit_hours}. Remove some courses or increase the limit in Settings.`,
            autoClose: 8000,
          });
          setLoading(false);
          return;
        }
        if (projected >= creditSettings.warning_credit_hours && newCreditHours > 0) {
          notifications.show({
            color: 'yellow',
            title: '⚠️ High Credit Hour Load',
            message: `After adding, total will be ${projected}/${creditSettings.max_credit_hours} credit hours. Proceeding...`,
            autoClose: 5000,
          });
        }
      }

      if (assignmentMode === 'single' && courseBatch) {
        await onSave(courseBatch.id, formData);
      } else if (assignmentMode === 'multiple') {
        const assignments = selectedCourseIds.map(courseId => ({
          course_id: parseInt(courseId),
          batch: formData.batch,
          semester_id: formData.semester_id,
          department_id: department_id,
          instructor_id: formData.instructor_id || 0,
        }));
        await onSaveMultiple(assignments);
      }
      onClose();
    } catch (error: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: error.message || "Failed to save course batch",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get selected courses data
  const selectedCoursesData = useMemo(() => {
    return selectedCourseIds.map(id => 
      departmentCourses.find(course => course.course_id.toString() === id)
    ).filter(Boolean) as Course[];
  }, [selectedCourseIds, departmentCourses]);

  return (
    <Modal 
      opened={opened} 
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" radius="lg" color="blue" variant="light">
            {assignmentMode === 'multiple' ? 
              <DocumentDuplicateIcon className="h-5 w-5" /> : 
              <BookOpenIcon className="h-5 w-5" />
            }
          </ThemeIcon>
          <div>
            <Text fw={600} component="div">{courseBatch ? "Edit Course Assignment" : "Assign Courses to Batch"}</Text>
            <Text size="sm" c="dimmed" component="div">
              {courseBatch ? "Update course details" : "Link multiple courses with batch and semester"}
            </Text>
          </div>
        </Group>
      }
      centered
      size="lg"
      radius="lg"
    >
      <Stack gap="lg">
        <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
          <Text size="sm" c="blue" fw={500} component="div">
            {courseBatch 
              ? "Update course assignment to batch and semester"
              : "Select multiple courses to assign to a specific batch and semester"}
          </Text>
        </Paper>

        {/* Assignment Mode Toggle (only for new assignments) */}
        {!courseBatch && (
          <Paper withBorder p="md" radius="md">
            <Group justify="space-between">
              <Text fw={600} component="div">Assignment Mode</Text>
              <Group gap="xs">
                <Button
                  variant={assignmentMode === 'single' ? 'filled' : 'light'}
                  color="blue"
                  size="sm"
                  onClick={() => setAssignmentMode('single')}
                >
                  Single Course
                </Button>
                <Button
                  variant={assignmentMode === 'multiple' ? 'filled' : 'light'}
                  color="green"
                  size="sm"
                  onClick={() => setAssignmentMode('multiple')}
                >
                  Multiple Courses
                </Button>
              </Group>
            </Group>
          </Paper>
        )}

        {/* Course Selection */}
        {assignmentMode === 'multiple' ? (
          <div>
            <Group justify="space-between" mb="xs">
              <Group gap="xs">
                <BookOpenIcon className="h-4 w-4" />
                <Text fw={500} size="sm" component="span">
                  Select Courses
                </Text>
              </Group>
              <Badge color="blue" variant="light">
                {selectedCourseIds.length} selected
              </Badge>
            </Group>
            
            {!department_id ? (
              <Alert color="yellow" title="Select Department First">
                Please select a department to view available courses.
              </Alert>
            ) : departmentCourses.length === 0 ? (
              <Alert color="orange" title="No Courses Available">
                No courses found for this department.
              </Alert>
            ) : (
              <MultiSelect
                data={departmentCourses.map(course => ({
                  value: course.course_id.toString(),
                  label: `${course.course_code} - ${course.course_name}`,
                  description: `${course.credit_hour} credits • ${course.category}`
                }))}
                value={selectedCourseIds}
                onChange={setSelectedCourseIds}
                placeholder="Search and select multiple courses..."
                searchable
                clearable
                hidePickedOptions
                maxDropdownHeight={200}
                size="md"
                radius="md"
                nothingFoundMessage="No courses found"
                disabled={!department_id}
              />
            )}
          </div>
        ) : (
          <Select
            label={
              <Group gap="xs">
                <BookOpenIcon className="h-4 w-4" />
                <Text component="span">Course</Text>
              </Group>
            }
            placeholder="Select course"
            data={departmentCourses.map(course => ({
              value: course.course_id.toString(),
              label: `${course.course_code} - ${course.course_name}`,
              description: `${course.credit_hour} credits • ${course.category}`
            }))}
            value={formData.course_id.toString()}
            onChange={(value) => setFormData({...formData, course_id: parseInt(value || '0')})}
            required
            withAsterisk
            searchable
            clearable
            disabled={!department_id || courseBatch !== null}
            size="md"
          />
        )}

        {/* Batch Selection */}
        <Select
          label={
            <Group gap="xs">
              <UserGroupIcon className="h-4 w-4" />
              <Text component="span">Batch</Text>
            </Group>
          }
          placeholder="Select batch"
          data={departmentBatches.map(batch => ({
            value: batch.batch_id.toString(),
            label: `Batch ${batch.batch_year}`,
            description: `ID: ${batch.batch_id}`
          }))}
          value={formData.batch.toString()}
          onChange={(value) => setFormData({...formData, batch: parseInt(value || '0')})}
          required
          withAsterisk
          searchable
          clearable
          disabled={!department_id}
          size="md"
        />

        {/* Semester Selection */}
        <Select
          label={
            <Group gap="xs">
              <CalendarDaysIcon className="h-4 w-4" />
              <Text component="span">Semester</Text>
            </Group>
          }
          placeholder="Select semester"
          data={departmentSemesters.map(semester => ({
            value: semester.id.toString(),
            label: `${semester.semester}`,
            // description: `${semester.start_date} to ${semester.end_date}`
          }))}
          value={formData.semester_id}
          onChange={(value) => setFormData({...formData, semester_id: value || ''})}
          required
          withAsterisk
          searchable
          clearable
          disabled={!department_id}
          size="md"
        />

        {/* Credit Hour Usage Bar */}
        {formData.batch > 0 && formData.semester_id && (
          <Paper withBorder p="md" radius="md" 
            style={{ 
              background: creditUsage?.status === 'exceeded' ? '#fef2f2' : 
                          creditUsage?.status === 'warning' ? '#fffbeb' : '#f0fdf4',
              borderColor: creditUsage?.status === 'exceeded' ? '#fca5a5' : 
                           creditUsage?.status === 'warning' ? '#fcd34d' : '#86efac',
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={600} component="div">
                📊 Credit Hour Usage
              </Text>
              {creditLoading ? (
                <Loader size="xs" />
              ) : creditUsage ? (
                <Badge 
                  color={creditUsage.status === 'exceeded' ? 'red' : creditUsage.status === 'warning' ? 'yellow' : 'green'}
                  variant="filled"
                  size="sm"
                >
                  {creditUsage.status === 'exceeded' ? '🚫 Exceeded' : creditUsage.status === 'warning' ? '⚠️ Warning' : '✅ Normal'}
                </Badge>
              ) : null}
            </Group>
            {creditUsage && (
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" component="div">Current total</Text>
                  <Text size="xs" fw={500} component="div">{creditUsage.total_credit_hours} / {creditUsage.max_credit_hours} credit hrs</Text>
                </Group>
                {/* Progress bar */}
                <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, (creditUsage.total_credit_hours / creditUsage.max_credit_hours) * 100)}%`,
                    background: creditUsage.status === 'exceeded' ? '#ef4444' : creditUsage.status === 'warning' ? '#f59e0b' : '#22c55e',
                    borderRadius: 4,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
                <Group justify="space-between">
                  <Text size="xs" c="dimmed" component="div">Warning at {creditUsage.warning_credit_hours} hrs</Text>
                  <Text size="xs" c="dimmed" component="div">
                    {creditUsage.remaining > 0 ? `${creditUsage.remaining} hrs remaining` : 'Limit reached'}
                  </Text>
                </Group>
                {/* Projected total for new selection */}
                {selectedCoursesData.length > 0 && (
                  (() => {
                    const addingHrs = selectedCoursesData.reduce((s, c) => s + (c?.credit_hour || 0), 0);
                    const projected = creditUsage.total_credit_hours + addingHrs;
                    return (
                      <Text size="xs" component="div" 
                        c={projected > creditUsage.max_credit_hours ? 'red' : projected >= creditUsage.warning_credit_hours ? 'orange' : 'teal'}
                        fw={500}
                      >
                        {addingHrs > 0 ? `After adding: ${projected} credit hrs (+${addingHrs})` : ''}
                      </Text>
                    );
                  })()
                )}
              </Stack>
            )}
          </Paper>
        )}

        {/* Summary */}
        {(department_id && (formData.batch || formData.semester_id || (assignmentMode === 'multiple' ? selectedCourseIds.length > 0 : formData.course_id))) && (
          <Paper withBorder p="md" radius="md" className="bg-blue-50 border-blue-100">
            <Text size="sm" fw={500} c="blue" mb="xs" component="div">Assignment Summary</Text>
            <Stack gap="xs">
              <Text size="sm" component="div">
                <strong>Department:</strong> {user?.department_name}
              </Text>
              <Text size="sm" component="div">
                <strong>Batch:</strong> {departmentBatches.find(b => b.batch_id === formData.batch)?.batch_year || 'Not selected'}
              </Text>
              <Text size="sm" component="div">
                <strong>Semester:</strong> {departmentSemesters.find(s => s.id.toString() === formData.semester_id)?.semester || 'Not selected'}
              </Text>
              {assignmentMode === 'multiple' ? (
                <>
                  <Text size="sm" component="div">
                    <strong>Courses:</strong> {selectedCourseIds.length} course(s) selected
                  </Text>
                </>
              ) : (
                <>
                  <Text size="sm" component="div">
                    <strong>Course:</strong> {departmentCourses.find(c => c.course_id === formData.course_id)?.course_name || 'Not selected'}
                  </Text>
                </>
              )}
            </Stack>
          </Paper>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="light" color="gray" onClick={onClose} size="md">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            loading={loading}
            disabled={
              assignmentMode === 'single' 
                ? !formData.course_id || !formData.batch || !formData.semester_id || !department_id
                : selectedCourseIds.length === 0 || !formData.batch || !formData.semester_id || !department_id
            }
            size="md"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            leftSection={assignmentMode === 'multiple' ? 
              <DocumentDuplicateIcon className="h-5 w-5" /> : 
              <BookOpenIcon className="h-5 w-5" />
            }
          >
            {loading ? "Saving..." : courseBatch ? "Update Assignment" : `Assign ${assignmentMode === 'multiple' ? selectedCourseIds.length : ''} Course(s)`}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

const CourseBatchManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const { courseBatches, loading, error, successMessage } = useAppSelector((state) => state.courseBatches || {
    courseBatches: [],
    loading: false,
    error: null,
    successMessage: null,
  });
  
  const { departments } = useAppSelector((state) => state.departments);
  const { semesters } = useAppSelector((state) => state.semesters);
  const { batches } = useAppSelector((state) => state.batches);
  const { courses } = useAppSelector((state) => state.courses);
  
  // Get admin assigned instructors from courses slice
  const { assignments: adminAssignments } = useAppSelector((state) => state.courses);
  
  // Get section assignments
  const { sectionAssignments, loading: sectionsLoading } = useAppSelector(
    (state) => state.courseSections || {
      sectionAssignments: [],
      loading: false,
      error: null,
      successMessage: null,
    }
  );
  
  // Local state
  const [modalState, setModalState] = useState<{
    opened: boolean;
    courseBatch: CourseBatch | null; 
  }>({
    opened: false,
    courseBatch: null
  });
  
  const [sectionModalState, setSectionModalState] = useState<{
    opened: boolean;
    courseBatch: CourseBatch | null;
  }>({
    opened: false,
    courseBatch: null,
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  // Credit hour & overload settings state
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [creditSettings, setCreditSettings] = useState<CreditHourSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState({ 
    max_credit_hours: 40, 
    warning_credit_hours: 37,
    max_sections_per_instructor: 4,
    max_weekly_hours_per_instructor: 16
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const foundUser = await Found();
        setUser(foundUser);
      } catch (error) {
        console.error("Auth error:", error);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    if (!authLoading && user) {
      dispatch(fetchCourseBatches());
      dispatch(fetchDepartments());
      dispatch(fetchSemesters());
      dispatch(fetchBatches());
      dispatch(fetchCourses());
      // Fetch admin assigned instructors
      dispatch(fetchAllAssignments());
      // Fetch credit hour & overload settings
      if (user.department_id) {
        fetch(`${API_BASE}/api/departments/${user.department_id}/credit-hour-settings`)
          .then(r => r.json())
          .then(data => {
            setCreditSettings(data);
            setSettingsForm({ 
              max_credit_hours: data.max_credit_hours ?? 40, 
              warning_credit_hours: data.warning_credit_hours ?? 37,
              max_sections_per_instructor: data.max_sections_per_instructor ?? 4,
              max_weekly_hours_per_instructor: data.max_weekly_hours_per_instructor ?? 16
            });
          })
          .catch(() => {});
      }
    }
  }, [dispatch, authLoading, user, API_BASE]);


  // Clear messages
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);
  useEffect(()=>{})
  // Process admin assignments
  const processedAdminAssignments = useMemo(() => {
    return adminAssignments.map(assignment => extractInstructorData(assignment));
  }, [adminAssignments]);

  // Filter course batches
// In filteredCourseBatches:
const filteredCourseBatche= useMemo(() => {
  const filtered = courseBatches.filter(cb => {
    const matchesSearch = searchTerm ? 
      cb.course_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cb.course_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cb.department_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cb.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    const matchesDepartment = selectedDepartment ? 
      cb.department_id.toString() === selectedDepartment 
      : true;
    
    // FIX: Get batch_year from batches array
    const selectedBatchObj = batches.find(b => b.batch_id.toString() === selectedBatch);
    const selectedBatchYear = selectedBatchObj?.batch_year;
    
   const matchesBatch = selectedBatch ? 
  cb.batch.toString() === selectedBatch  // cb.batch is now batch_id
  : true;
    let matchesSemester = true;
    if (selectedSemester) {
      // Make sure both are strings for comparison
      matchesSemester = cb.semester_id.toString() === selectedSemester.toString();
    }
    
    return matchesSearch && matchesDepartment && matchesBatch && matchesSemester;
  });
  
  // Sort: user's department first
  if (user?.department_id) {
    filtered.sort((a, b) => {
      const aIsUserDept = a.department_id === user.department_id;
      const bIsUserDept = b.department_id === user.department_id;
      return (bIsUserDept ? 1 : 0) - (aIsUserDept ? 1 : 0);
    });
  }
  
  return filtered;
}, [courseBatches, searchTerm, selectedDepartment, selectedBatch, selectedSemester, user?.department_id, batches]); // Calculate statistics
   
  const filteredCourseBatches = filteredCourseBatche.filter(cb => cb.department_id === user?.department_id);
  const totalAssignments = courseBatches.length;
  const uniqueCourses = [...new Set(courseBatches.map(cb => cb.course_id))].length;
  const uniqueBatches = [...new Set(courseBatches.map(cb => cb.batch))].length;
  const assignedInstructors = [...new Set(courseBatches.map(cb => cb.instructor_id).filter(id => id))].length;
  const totalSectionAssignments = sectionAssignments.length;
  
  // Count active admin instructors
  const activeAdminInstructors = useMemo(() => {
    return processedAdminAssignments.filter(a => a.course_status === 'active').length;
  }, [processedAdminAssignments]);

  // Get unique admin-assigned instructors for each course
  const getAvailableInstructorsForBatch = useCallback((courseBatch: CourseBatch) => {
    // Get admin assigned instructors for this course
    const courseAdminAssignments = adminAssignments.filter(assignment => 
      assignment.course_id === courseBatch.course_id
    );
    
    return courseAdminAssignments;
  }, [adminAssignments]);

  // Get processed instructors for a course batch
  const getProcessedInstructorsForBatch = useCallback((courseBatch: CourseBatch) => {
    const instructors = getAvailableInstructorsForBatch(courseBatch);
    return instructors.map(instructor => extractInstructorData(instructor));
  }, [getAvailableInstructorsForBatch]);

  // Get existing section assignments for a course batch
  const getExistingSectionAssignments = useCallback(
    (courseBatchId: number) => {
      return sectionAssignments.filter(
        (assignment: { course_batch_id: number; }) => assignment.course_batch_id === courseBatchId
      );
    },
    [sectionAssignments]
  );

  // Handle save single
  const handleSave = useCallback(async (id: number | null, data: CourseBatchFormData) => {
    try {
      if (id === null) {
        await dispatch(createCourseBatch(data)).unwrap();
      } else {
        await dispatch(updateCourseBatch({ id, data })).unwrap();
      }
      dispatch(fetchCourseBatches());
    } catch (err: any) {
      throw err;
    }
  }, [dispatch]);

  // Handle save multiple
  const handleSaveMultiple = useCallback(async (assignments: CourseBatchFormData[]) => {
    try {
      const promises = assignments.map(assignment => 
        dispatch(createCourseBatch(assignment)).unwrap()
      );
      
      await Promise.all(promises);
      dispatch(fetchCourseBatches());
      
      notifications.show({
        color: "green",
        title: "Success",
        message: `Successfully assigned ${assignments.length} course(s) to batch`,
      });
    } catch (err: any) {
      throw err;
    }
  }, [dispatch]);

  // Handle section assignment - UPDATED with better error handling
const handleSaveSection = useCallback(
  async (assignments: SectionInstructorFormData[]): Promise<void> => {
    console.log('handleSaveSection called with:', assignments);

    if (!assignments || assignments.length === 0) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "No assignments provided",
      });
      return;
    }

    const courseBatchId = assignments[0].course_batch_id;
    if (!courseBatchId || courseBatchId <= 0) {
      notifications.show({
        color: "red",
        title: "Error",
        message: "Invalid course batch ID",
      });
      return;
    }

    const results: any[] = [];

    for (const assignment of assignments) {
      if (!assignment.instructor_id || assignment.instructor_id <= 0) {
        notifications.show({
          color: "red",
          title: "Error",
          message: `Assignment ${assignment.section}: Invalid instructor ID`,
        });
        continue;
      }

      if (!assignment.section || assignment.section.trim() === '') {
        notifications.show({
          color: "red",
          title: "Error",
          message: `Assignment ${assignment.section}: Section is required`,
        });
        continue;
      }

      try {
        const actionResult = await dispatch(createSectionAssignment(assignment));

        if (createSectionAssignment.rejected.match(actionResult)) {
          // Extract error info from payload
          const errorPayload = actionResult.payload as any;
          const errorMessage = errorPayload?.message;

          notifications.show({
            color: "red",
            title: "Assignment Error",
            message: `Failed to assign section ${assignment.section}: ${errorMessage}`,
            autoClose: 10000,
          });
          continue;
        }

        // Success
        results.push(actionResult.payload);
      } catch (err: any) {
        console.error(`Failed to assign section ${assignment.section}:`, err);

        const errorMessage = err?.message;

        notifications.show({
          color: "red",
          title: "Assignment Error",
          message: `Failed to assign section ${assignment.section}: ${errorMessage}`,
          autoClose: 10000,
        });
      }

      // Small delay to avoid server overload
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (results.length > 0) {
      notifications.show({
        color: "green",
        title: "Success",
        message: `Successfully assigned ${results.length} section(s)`,
        autoClose: 5000,
      });

      // Refresh section assignments
      try {
        await dispatch(fetchSectionAssignmentsByCourseBatch(courseBatchId));
      } catch (refreshError) {
        console.error('Failed to refresh section assignments:', refreshError);
      }
    }
  },
  [dispatch]
);

  const handleUpdateSection = useCallback(
    async (id: number, formData: Partial<SectionInstructorFormData>) => {
      try {
        const result = await dispatch(updateSectionAssignment({ id, formData })).unwrap();
        
        // Manually update the state for immediate feedback
        if (formData.course_batch_id) {
          // Get current assignments for this course batch
          const currentAssignments = getExistingSectionAssignments(formData.course_batch_id);
          
          // Update the specific assignment
          const updatedAssignments = currentAssignments.map(assignment => 
            assignment.id === id ? { ...assignment, ...formData, ...result } : assignment
          );
          
          // Update the state
          dispatch(updateSectionAssignmentsForCourseBatch({
            courseBatchId: formData.course_batch_id,
            assignments: updatedAssignments as SectionInstructor[]
          }));
        }
        
        notifications.show({
          color: "green",
          title: "Success",
          message: "Section assignment updated successfully",
        });
        
        return result;
      } catch (err: any) {
        console.error('Update section assignment failed:', err);
        
        let errorMessage = err.message || "Failed to update section assignment";
        if (err?.payload) {
          errorMessage = err.payload;
        }
        
        notifications.show({
          color: "red",
          title: "Error",
          message: errorMessage,
        });
        
        throw err;
      }
    },
    [dispatch, getExistingSectionAssignments]
  );

  const handleDeleteSection = useCallback(
    async (id: number) => {
      try {
        // Get the assignment before deletion to know which course batch it belongs to
        const assignmentToDelete = sectionAssignments.find(a => a.id === id);
        
        if (!assignmentToDelete) {
          throw new Error('Assignment not found');
        }
        
        const result = await dispatch(deleteSectionAssignment(id)).unwrap();
        
        // Manually update the state for immediate feedback
        const updatedAssignments = sectionAssignments.filter(a => a.id !== id);
        dispatch(updateSectionAssignmentsForCourseBatch({
          courseBatchId: assignmentToDelete.course_batch_id,
          assignments: updatedAssignments.filter(a => a.course_batch_id === assignmentToDelete.course_batch_id)
        }));
        
        notifications.show({
          color: "green",
          title: "Success",
          message: "Section assignment deleted successfully",
        });
        
        return result;
      } catch (err: any) {
        console.error('Delete section assignment failed:', err);
        
        let errorMessage = err.message || "Failed to delete section assignment";
        if (err?.payload) {
          errorMessage = err.payload;
        }
        
        notifications.show({
          color: "red",
          title: "Error",
          message: errorMessage,
        });
        
        throw err;
      }
    },
    [dispatch, sectionAssignments]
  );

  // Handle delete
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm("Are you sure you want to delete this course batch assignment?")) {
      return;
    }
    
    try {
      await dispatch(deleteCourseBatch(id)).unwrap();
      dispatch(fetchCourseBatches());
      notifications.show({
        color: "green",
        title: "Success",
        message: "Course batch assignment deleted successfully",
      });
    } catch (err: any) {
      notifications.show({
        color: "red",
        title: "Error",
        message: err.message || "Failed to delete assignment",
      });
    }
  }, [dispatch]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedDepartment(null);
    setSelectedBatch(null);
    setSelectedSemester(null);
  }, []);

  const hasFilters = useMemo(() => {
    return !!(searchTerm || selectedDepartment || selectedBatch || selectedSemester);
  }, [searchTerm, selectedDepartment, selectedBatch, selectedSemester]);

  // Toggle row expansion
  const toggleRowExpansion =  useCallback(async (id: number) => {
   await dispatch(
            fetchSectionAssignmentsByCourseBatch(id)
    ).unwrap();
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  }, [dispatch]);

  // Grid view component with FIXED duplicate keys
  const GridView = () => {
    // Remove duplicates first
    const uniqueBatches = useMemo(() => {
      const seen = new Set();
      return filteredCourseBatches.filter(cb => {
        const key = `${cb.id}-${cb.course_id}-${cb.batch}-${cb.semester_id}`;
        if (seen.has(key)) {
          console.warn('Removing duplicate:', cb);
          return false;
        }
        seen.add(key);
        return true;
      });
    }, []);

    return (
      <Grid gutter="lg">
        {uniqueBatches.map((cb, index) => {
          const processedInstructors = getProcessedInstructorsForBatch(cb);
          const hasAdminAssignedInstructors = processedInstructors.length > 0;
          const existingSectionAssignments = getExistingSectionAssignments(cb.id);
          const activeInstructors = processedInstructors.filter(i => i.course_status === 'active');
          
          // Create a truly unique key
          const uniqueKey = `cb-grid-${cb.id}-${index}`;
          
          return (
            <Grid.Col key={uniqueKey} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <Card withBorder radius="lg" shadow="sm" className="h-full hover:shadow-md transition-shadow">
                <Card.Section withBorder inheritPadding py="md">
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Avatar size="lg" radius="md" color={cb.instructor_id ? "teal" : "blue"} variant="light">
                        {cb.course_code?.charAt(0) || 'C'}
                      </Avatar>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <EllipsisVerticalIcon className="h-5 w-5" />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Label>Actions</Menu.Label>
                          <Menu.Item
                            leftSection={<PencilSquareIcon className="h-4 w-4" />}
                            onClick={() => setModalState({ opened: true, courseBatch: cb })}
                          >
                            Edit Assignment
                          </Menu.Item>
                          {hasAdminAssignedInstructors && (
                            <Menu.Item
                              leftSection={<UserGroupIcon className="h-4 w-4" />}
                              onClick={() => setSectionModalState({ opened: true, courseBatch: cb })}
                              disabled={activeInstructors.length === 0}
                            >
                              Manage Section Instructors
                              {existingSectionAssignments.length > 0 && (
                                <Badge ml="sm" size="xs" color="indigo">
                                  {existingSectionAssignments.length}
                                </Badge>
                              )}
                              {activeInstructors.length === 0 && (
                                <Badge ml="sm" size="xs" color="red">
                                  No active
                                </Badge>
                              )}
                            </Menu.Item>
                          )}
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<TrashIcon className="h-4 w-4" />}
                            color="red"
                            onClick={() => handleDelete(cb.id)}
                          >
                            Delete Assignment
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                    
                    <div>
                      <Text fw={600} size="lg" component="div">
                        {cb.course_code}
                      </Text>
                      <Text size="sm" c="dimmed" lineClamp={2} component="div">
                        {cb.course_name}
                      </Text>
                    </div>
                  </Stack>
                </Card.Section>
                
                <Card.Section inheritPadding py="md">
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Badge color="orange" variant="light">
                        Batch {cb.batch !== null ? cb.batch_year: cb.batch}
                      </Badge>
                      <Badge color="green" variant="light">
                        {cb.semester}
                      </Badge>
                    </Group>
                    
                    <Text size="sm" c="dimmed" component="div">
                      {cb.department_name}
                    </Text>
                    
                    {/* Admin Assigned Instructors Info */}
                    {processedInstructors.length > 0 && (
                      <Paper withBorder p="xs" radius="md" className="bg-blue-50">
                        <Group gap="xs">
                          <Text size="xs" fw={500} c="blue" component="span">
                            Available Instructors:
                          </Text>
                          <Group gap={4}>
                            <Badge color="blue" variant="light" size="xs">
                              {activeInstructors.length} active
                            </Badge>
                            <Badge color="gray" variant="light" size="xs">
                              {processedInstructors.length - activeInstructors.length} inactive
                            </Badge>
                          </Group>
                        </Group>
                      </Paper>
                    )}
                    
                    {existingSectionAssignments.length > 0 && (
                      <Paper withBorder p="xs" radius="md" className="bg-indigo-50">
                        <Group gap="xs">
                          <Text size="xs" fw={500} c="indigo" component="span">
                            Assigned Sections:
                          </Text>
                          <Group gap={4}>
                            {/* Show unique instructors count */}
                            <Badge color="indigo" variant="light" size="xs">
                              {[...new Set(existingSectionAssignments.map((a: { instructor_id: any; }) => a.instructor_id))].length} instructors
                            </Badge>
                            <Badge color="indigo" variant="light" size="xs">
                              {existingSectionAssignments.length} sections
                            </Badge>
                          </Group>
                        </Group>
                      </Paper>
                    )}
                  </Stack>
                </Card.Section>
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>
    );
  };

  if (authLoading) {
    return (
      <Container size="xl" py="xl" className="min-h-screen">
        <Center h="100vh">
          <Loader size="xl" color="blue" />
        </Center>
      </Container>
    );
  }

  if (user === null) { 
    return <Authentication />;
  }

  return (
    <Container size="xl" py="xl" className="min-h-screen">
      <Stack gap="lg">
        {/* Header */}
        <Box className="relative overflow-hidden rounded-2xl to-indigo-600 p-8">
          <Stack gap="xs">
            <Group align="center" gap="sm">
              <ThemeIcon size="xl" radius="lg" color="blue" variant="blue">
                <BookOpenIcon className="h-6 w-6 text-white-600" />
              </ThemeIcon>
              <Title order={1} c="blue">Course Batch Management</Title>
            </Group>
            <Text className="text-blue-100 max-w-2xl" c="blue" component="div">
              Assign multiple courses to specific batches and semesters across departments. 
              Manage section instructors and organize curriculum planning.
            </Text>
          </Stack>
        </Box>

        {/* Stats Dashboard */}
        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard 
              icon={BookOpenIcon}
              title="Total Assignments"
              value={totalAssignments}
              color="blue"
              description="Course-Batch links"
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard 
              icon={UsersIcon}
              title="Courses"
              value={uniqueCourses}
              color="orange"
              description="Unique courses"
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard 
              icon={UserGroupIcon}
              title="Section Assignments"
              value={totalSectionAssignments}
              color="indigo"
              description="Section-instructor links"
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <StatCard 
              icon={UserGroupIcon}
              title="Active Admin Instructors"
              value={activeAdminInstructors}
              color="green"
              description="Available for assignment"
            />
          </Grid.Col>
        </Grid>

        {/* Search and Filters */}
        <Card withBorder radius="lg" shadow="sm">
          <Card.Section withBorder inheritPadding py="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size="sm" radius="lg" color="blue" variant="light">
                    <AcademicCapIcon className="h-4 w-4" />
                  </ThemeIcon>
                  <Text fw={600} component="div">Course Batch Assignments</Text>
                  <Badge variant="light" color="blue">
                    {filteredCourseBatches.length} found
                  </Badge>
                  {totalSectionAssignments > 0 && (
                    <Badge variant="light" color="indigo">
                      {totalSectionAssignments} section assignments
                    </Badge>
                  )}
                </Group>
                
                <Group gap="xs">
                  <Button 
                    variant={viewMode === 'table' ? 'filled' : 'light'}
                    color="blue"
                    onClick={() => setViewMode('table')}
                    leftSection={<ListBulletIcon className="h-4 w-4" />}
                    size="md"
                  >
                    Table
                  </Button>
                  <Button 
                    variant={viewMode === 'grid' ? 'filled' : 'light'}
                    color="green"
                    onClick={() => setViewMode('grid')}
                    leftSection={<Squares2X2Icon className="h-4 w-4" />}
                    size="md"
                  >
                    Grid
                  </Button>
                  <Button 
                    onClick={() => setModalState({ opened: true, courseBatch: null })}
                    leftSection={<DocumentDuplicateIcon className="h-5 w-5" />}
                    loading={loading}
                    size="md"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Assign Multiple Courses
                  </Button>
                  <Tooltip label={`Credit Hour Limits: Warning ${creditSettings?.warning_credit_hours ?? 37}hr | Max ${creditSettings?.max_credit_hours ?? 40}hr`}>
                    <Button
                      variant="light"
                      color="violet"
                      size="md"
                      onClick={() => setSettingsOpened(true)}
                      leftSection={<ChartBarIcon className="h-4 w-4" />}
                    >
                      ⚙️ Credit Hr Settings
                    </Button>
                  </Tooltip>
                </Group>
              </Group>

              <Group gap="md" align="flex-end">
                <TextInput
                  placeholder="Search courses, departments, instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftSection={<MagnifyingGlassIcon className="h-4 w-4" />}
                  size="md"
                  radius="md"
                  style={{ flex: 1 }}
                />
                
                
                <Select
                  placeholder="Batch"
                  data={batches.map(b => ({
                    value: b.batch_id.toString(),
                    label: `Batch ${b.batch_year}`
                  }))}
                  value={selectedBatch}
                  onChange={setSelectedBatch}
                  clearable
                  size="md"
                  style={{ width: 150 }}
                />
                
                <Select
                  placeholder="Semester"
                  data={semesters.map(s => ({
                    value: s.id.toString(),
                    label: `${s.semester}`
                  }))}
                  value={selectedSemester}
                  onChange={setSelectedSemester}
                  clearable
                  size="md"
                  style={{ width: 200 }}
                />
                
                {hasFilters && (
                  <Button
                    variant="subtle"
                    color="red"
                    leftSection={<XCircleIcon className="h-4 w-4" />}
                    onClick={clearFilters}
                    size="md"
                  >
                    Clear Filters
                  </Button>
                )}
              </Group>
            </Stack>
          </Card.Section>

          {/* Error and Success Messages */}
          {(error || successMessage) && (
            <Card.Section inheritPadding py="md">
              <Stack gap="sm">
                {error && (
                  <Alert 
                    color="red" 
                    title="Error" 
                    withCloseButton 
                    onClose={() => dispatch(clearError())}
                    radius="md"
                    icon={<XCircleIcon className="h-5 w-5" />}
                  >
                    {error}
                  </Alert>
                )}
                
                {successMessage && (
                  <Alert 
                    color="green" 
                    title="Success" 
                    withCloseButton 
                    onClose={() => dispatch(clearSuccessMessage())}
                    radius="md"
                    icon={<CheckCircleIcon className="h-5 w-5" />}
                  >
                    {successMessage}
                  </Alert>
                )}
              </Stack>
            </Card.Section>
          )}

          {/* Course Batches Content */}
          <Card.Section inheritPadding py="md">
            {loading && courseBatches.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <Loader size="lg" color="blue" />
                  <Text c="dimmed" component="div">Loading course batches...</Text>
                </Stack>
              </Center>
            ) : filteredCourseBatches.length === 0 ? (
              <Center py="xl">
                <Stack align="center" gap="md">
                  <ThemeIcon size="xl" radius="lg" color="gray" variant="light">
                    <BookOpenIcon className="h-8 w-8" />
                  </ThemeIcon>
                  <Text size="lg" fw={500} c="dimmed" component="div">
                    {hasFilters ? "No assignments match your filters" : "No course batch assignments found"}
                  </Text>
                  <Text c="dimmed" ta="center" maw={500} component="div">
                    {hasFilters 
                      ? "Try adjusting your search or filters"
                      : "Get started by creating your first course batch assignment"
                    }
                  </Text>
                  <Button 
                    onClick={() => setModalState({ opened: true, courseBatch: null })}
                    leftSection={<PlusCircleIcon className="h-4 w-4" />}
                    size="md"
                    className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    Create First Assignment
                  </Button>
                </Stack>
              </Center>
            ) : viewMode === 'table' ? (
              <ScrollArea>
                <Table.ScrollContainer minWidth={1400}>
                  <Table verticalSpacing="md" highlightOnHover>
                    <Table.Thead className="bg-gray-50">
                      <Table.Tr>
                        <Table.Th style={{ width: 50 }}>
                          <Text fw={600} component="div">#</Text>
                        </Table.Th>
                        <Table.Th style={{ width: 60 }}>
                          <Text fw={600} component="div"></Text>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <BookOpenIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Course</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <UserGroupIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Batch</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <CalendarDaysIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Semester</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <BuildingOfficeIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Department</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th>
                          <Group gap="xs">
                            <UserGroupIcon className="h-4 w-4" />
                            <Text fw={600} component="span">Section Instructors</Text>
                          </Group>
                        </Table.Th>
                        <Table.Th style={{ width: 150 }}>
                          <Text fw={600} component="div">Actions</Text>
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {filteredCourseBatches.map((cb, index) => {
                        const isExpanded = expandedRows.includes(cb.id);
                        // Get available instructors for this course batch
                        const processedInstructors = getProcessedInstructorsForBatch(cb);
                        const hasAdminAssignedInstructors = processedInstructors.length > 0;
                        const existingSectionAssignments = getExistingSectionAssignments(cb.id);
                        const activeInstructors = processedInstructors.filter(i => i.course_status === 'active');
                        const uniqueInstructors = [...new Set(existingSectionAssignments.map((a: { instructor_id: any; }) => a.instructor_id))];
                        
                        return (
                          <React.Fragment key={`course-batch-${cb.id}-${index}`}>
                            <Table.Tr className="hover:bg-blue-50/50 transition-colors">
                              <Table.Td>
                                <Text fw={500} className="text-gray-700" component="div">{index + 1}</Text>
                              </Table.Td>
                              
                              <Table.Td>
                                <ActionIcon
                                  variant="subtle"
                                  onClick={() => toggleRowExpansion(cb.id)}
                                  color="blue"
                                >
                                  {isExpanded ? (
                                    <ChevronDownIcon className="h-4 w-4" />
                                  ) : (
                                    <ChevronRightIcon className="h-4 w-4" />
                                  )}
                                </ActionIcon>
                              </Table.Td>
                              
                              <Table.Td>
                                <Group gap="sm">
                                  <Avatar 
                                    size="md" 
                                    radius="md" 
                                    color={existingSectionAssignments.length > 0 ? "indigo" : "blue"} 
                                    variant="light"
                                  >
                                    {cb.course_code?.charAt(0) || 'C'}
                                  </Avatar>
                                  <div>
                                    <Text fw={600} component="div">{cb.course_code}</Text>
                                    <Text size="sm" c="dimmed" lineClamp={1} component="div">
                                      {cb.course_name}
                                    </Text>
                                    <Group gap="xs" mt={4}>
                                      <Text size="xs" c="dimmed" component="span">
                                        Available Instructors:
                                      </Text>
                                      <Badge color="blue" variant="light" size="xs">
                                        {activeInstructors.length} active
                                      </Badge>
                                      {processedInstructors.length - activeInstructors.length > 0 && (
                                        <Badge color="gray" variant="light" size="xs">
                                          {processedInstructors.length - activeInstructors.length} inactive
                                        </Badge>
                                      )}
                                    </Group>
                                  </div>
                                </Group>
                              </Table.Td>
                              
                              <Table.Td>
                                <Badge 
                                  color="orange"
                                  variant="light" 
                                  size="lg"
                                  leftSection={<UserGroupIcon className="h-3 w-3 mr-1" />}
                                >
                                   {cb.batch ? cb.batch_year:"Batch " + cb.batch}
                                </Badge>
                              </Table.Td>
                              
                              <Table.Td>
                                <Badge 
                                  color="green"
                                  variant="light" 
                                  size="lg"
                                  leftSection={<CalendarDaysIcon className="h-3 w-3 mr-1" />}
                                >
                                  {cb.semester || `Semester ${cb.semester_id}`}
                                </Badge>
                              </Table.Td>
                              
                              <Table.Td>
                                <Badge 
                                  color="purple"
                                  variant="light" 
                                  size="lg"
                                  leftSection={<BuildingOfficeIcon className="h-3 w-3 mr-1" />}
                                >
                                  {cb.department_name}
                                </Badge>
                              </Table.Td>
                              
                              <Table.Td>
                                {existingSectionAssignments.length > 0 ? (
                                  <Stack gap="xs">
                                    <Group gap="xs" wrap="nowrap">
                                      <Badge color="indigo" variant="light" size="sm">
                                        {uniqueInstructors.length} instructors
                                      </Badge>
                                      <Badge color="indigo" variant="light" size="sm">
                                        {existingSectionAssignments.length} sections
                                      </Badge>
                                    </Group>
                                    <Group gap={4} wrap="wrap">
                                      {existingSectionAssignments.map((assignment: SectionInstructor, badgeIndex: number) => {
                                        const instructor = processedInstructors.find(
                                          inst => inst.id === assignment.instructor_id
                                        );
                                        
                                        // Create unique key for each badge
                                        const badgeKey = `section-badge-${assignment.id}-${assignment.course_batch_id}-${assignment.section}-${badgeIndex}`;
                                        
                                        return (
                                          <Badge 
                                            key={badgeKey}
                                            color="indigo" 
                                            variant="light" 
                                            size="xs"
                                          >
                                            {assignment.section}: {instructor?.full_name?.split(' ')[0] || 'Inst'}
                                          </Badge>
                                        );
                                      })}
                                    </Group>
                                  </Stack>
                                ) : hasAdminAssignedInstructors ? (
                                  <Stack gap="xs">
                                    <Badge color="orange" variant="light" size="lg">
                                      No Section Assignments
                                    </Badge>
                                    <Text size="xs" c="dimmed" component="div">
                                      {activeInstructors.length} active instructors available
                                    </Text>
                                  </Stack>
                                ) : (
                                  <Group gap="xs">
                                    <Badge color="red" variant="light" size="lg">
                                      No Admin Instructors
                                    </Badge>
                                    <Tooltip label="No instructors assigned by admin for this course">
                                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                    </Tooltip>
                                  </Group>
                                )}
                              </Table.Td>
                              
                              <Table.Td>
                                <Group gap="xs">
                                  <Tooltip label="Edit assignment">
                                    <ActionIcon
                                      variant="light"
                                      color="blue"
                                      onClick={() => setModalState({ opened: true, courseBatch: cb })}
                                    >
                                      <PencilSquareIcon className="h-4 w-4" />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Delete assignment">
                                    <ActionIcon
                                      variant="light"
                                      color="red"
                                      onClick={() => handleDelete(cb.id)}
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </Table.Td>
                            </Table.Tr>
                            
                            {/* Expanded Row for Details */}
                            {isExpanded && (
                              <Table.Tr className="bg-blue-50/30">
                                <Table.Td colSpan={8}>
                                  <Box p="md">
                                    <Stack gap="md">
                                      {/* Admin Assigned Instructors */}
                                      <Paper withBorder p="md" radius="md">
                                        <Group justify="space-between" mb="md">
                                          <Group gap="xs">
                                            <ThemeIcon size="sm" radius="lg" color="blue" variant="light">
                                              <UsersIcon className="h-4 w-4" />
                                            </ThemeIcon>
                                            <Text fw={600} component="div">Admin Assigned Instructors</Text>
                                            <Group gap="xs">
                                              <Badge color="blue" variant="light">
                                                {activeInstructors.length} active
                                              </Badge>
                                              <Badge color="gray" variant="light">
                                                {processedInstructors.length - activeInstructors.length} inactive
                                              </Badge>
                                            </Group>
                                          </Group>
                                          <Button
                                            variant="light"
                                            color="indigo"
                                            size="xs"
                                            onClick={() => setSectionModalState({ opened: true, courseBatch: cb })}
                                            disabled={activeInstructors.length === 0}
                                          >
                                            Assign Sections
                                          </Button>
                                        </Group>
                                        
                                        {processedInstructors.length > 0 ? (
                                          <Grid gutter="md">
                                            {processedInstructors.map((instructor, instIndex) => (
                                              <Grid.Col key={`instructor-${instructor.id}-${instIndex}`} span={{ base: 12, sm: 6, md: 4 }}>
                                                <Paper 
                                                  withBorder 
                                                  p="sm" 
                                                  radius="md"
                                                  className={instructor.course_status === 'active' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}
                                                >
                                                  <Group gap="sm">
                                                    <Avatar 
                                                      size="sm" 
                                                      radius="md" 
                                                      color={instructor.course_status === 'active' ? "green" : "gray"} 
                                                      variant="light"
                                                    >
                                                      {instructor.full_name.charAt(0)}
                                                    </Avatar>
                                                    <div style={{ flex: 1 }}>
                                                      <Text fw={500} size="sm" component="div">
                                                        {instructor.full_name}
                                                      </Text>
                                                      <Text size="xs" c="dimmed" component="div">
                                                        {instructor.email}
                                                      </Text>
                                                      <Group gap="xs" mt={4}>
                                                        <InstructorStatusBadge status={instructor.course_status} />
                                                        {instructor.department && (
                                                          <Badge color="blue" variant="light" size="xs">
                                                            {instructor.department}
                                                          </Badge>
                                                        )}
                                                      </Group>
                                                    </div>
                                                  </Group>
                                                </Paper>
                                              </Grid.Col>
                                            ))}
                                          </Grid>
                                        ) : (
                                          <Alert color="orange" title="No Admin Instructors" radius="md">
                                            <Text size="sm" component="div">
                                              No instructors have been assigned to this course by admin yet.
                                            </Text>
                                          </Alert>
                                        )}
                                      </Paper>
                                      
                                      {/* Section Assignments */}
                                      <Paper withBorder p="md" radius="md">
                                        <Group justify="space-between" mb="md">
                                          <Group gap="xs">
                                            <ThemeIcon size="sm" radius="lg" color="indigo" variant="light">
                                              <UserGroupIcon className="h-4 w-4" />
                                            </ThemeIcon>
                                            <Text fw={600} component="div">Section Assignments</Text>
                                            <Badge color="indigo" variant="light">
                                              {existingSectionAssignments.length} sections
                                            </Badge>
                                          </Group>
                                          <Button
                                            variant="light"
                                            color="indigo"
                                            size="xs"
                                            onClick={() => setSectionModalState({ opened: true, courseBatch: cb })}
                                            disabled={activeInstructors.length === 0}
                                          >
                                            Manage Sections
                                          </Button>
                                        </Group>
                                        
                                        {existingSectionAssignments.length > 0 ? (
                                          <Grid gutter="md">
                                            {existingSectionAssignments.map((assignment: SectionInstructor, assignIndex: number) => {
                                              const instructor = processedInstructors.find(
                                                inst => inst.id === assignment.instructor_id
                                              );
                                              
                                              // Create unique key for each assignment
                                              const assignmentKey = `section-assignment-${assignment.id}-${assignment.course_batch_id}-${assignment.section}-${assignIndex}`;
                                              
                                              return (
                                                <Grid.Col key={assignmentKey} span={{ base: 12, sm: 6, md: 4 }}>
                                                  <Paper 
                                                    withBorder 
                                                    p="sm" 
                                                    radius="md" 
                                                    className="bg-indigo-50 border-indigo-200"
                                                  >
                                                    <Stack gap="xs">
                                                      <Group justify="space-between">
                                                        <Badge color="indigo" variant="light">
                                                          Section {assignment.section}
                                                        </Badge>
                                                        <Group gap={4}>
                                                          <Tooltip label="Edit">
                                                            <ActionIcon
                                                              variant="subtle"
                                                              color="blue"
                                                              size="xs"
                                                              onClick={() => {
                                                                setSectionModalState({ opened: true, courseBatch: cb });
                                                                // Note: You would need to handle the edit state here
                                                              }}
                                                            >
                                                              <PencilSquareIcon className="h-3 w-3" />
                                                            </ActionIcon>
                                                          </Tooltip>
                                                          <Tooltip label="Delete">
                                                            <ActionIcon
                                                              variant="subtle"
                                                              color="red"
                                                              size="xs"
                                                              onClick={() => handleDeleteSection(assignment.id)}
                                                            >
                                                              <TrashIcon className="h-3 w-3" />
                                                            </ActionIcon>
                                                          </Tooltip>
                                                        </Group>
                                                      </Group>
                                                      <Group gap="xs">
                                                        <Avatar 
                                                          size="sm" 
                                                          radius="md" 
                                                          color={instructor?.course_status === 'active' ? "teal" : "gray"} 
                                                          variant="light"
                                                        >
                                                          {instructor?.full_name.charAt(0) || "I"}
                                                        </Avatar>
                                                        <div>
                                                          <Text fw={500} size="sm" component="div">
                                                            {instructor?.full_name || "Unknown"}
                                                          </Text>
                                                          <Text size="xs" c="dimmed" component="div">
                                                            {instructor?.email || ""}
                                                          </Text>
                                                          {instructor && (
                                                            <InstructorStatusBadge status={instructor.course_status} />
                                                          )}
                                                        </div>
                                                      </Group>
                                                    </Stack>
                                                  </Paper>
                                                </Grid.Col>
                                              );
                                            })}
                                          </Grid>
                                        ) : (
                                          <Alert color="blue" title="No Section Assignments"  radius="md">
                                            <Text size="sm" component="div">
                                              No section instructors have been assigned yet.
                                            </Text>
                                          </Alert>
                                        )}
                                      </Paper>
                                    </Stack>
                                  </Box>
                                </Table.Td>
                              </Table.Tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </ScrollArea>
            ) : (
              <GridView />
            )}
          </Card.Section>
        </Card>
      </Stack>

      {/* Course Batch Modal */}
      <CourseBatchModal
        opened={modalState.opened}
        onClose={() => setModalState({ opened: false, courseBatch: null })}
        courseBatch={modalState.courseBatch}
        onSave={handleSave}
        onSaveMultiple={handleSaveMultiple}
        courses={courses}
        departments={departments}
        batches={batches}
        semesters={semesters}
        adminAssignedInstructors={adminAssignments}
      />

      {/* Section Assignment Modal */}
      {sectionModalState.courseBatch && (
        <SectionAssignmentModal
          opened={sectionModalState.opened}
          onClose={() => {
            setSectionModalState({ opened: false, courseBatch: null });
          }}
          courseBatch={sectionModalState.courseBatch}
          availableInstructors={getAvailableInstructorsForBatch(sectionModalState.courseBatch)}
          existingAssignments={getExistingSectionAssignments(sectionModalState.courseBatch.id)}
          onSave={handleSaveSection}
          onUpdate={handleUpdateSection}
          onDelete={handleDeleteSection}
        />
      )}

      {/* ========= Credit Hour Settings Modal ========= */}
      <Modal
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
        title={
          <Group gap="sm">
            <ThemeIcon size="md" radius="lg" color="violet" variant="light">
              <ChartBarIcon className="h-5 w-5" />
            </ThemeIcon>
            <div>
              <Text fw={600} component="div">Credit Hour Settings</Text>
              <Text size="xs" c="dimmed" component="div">
                Configure semester credit hour limits for your department
              </Text>
            </div>
          </Group>
        }
        centered
        size="md"
        radius="lg"
      >
        <Stack gap="lg">
          {/* Current status */}
          {creditSettings && (
            <Paper withBorder p="md" radius="md" style={{ background: '#f5f3ff', borderColor: '#ddd6fe' }}>
              <Text size="sm" fw={600} c="violet" mb="xs" component="div">📊 Current Configuration</Text>
              <Group gap="xl">
                <div>
                  <Text size="xs" c="dimmed" component="div">Warning threshold</Text>
                  <Text fw={700} size="lg" c="orange" component="div">{creditSettings.warning_credit_hours} hrs</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed" component="div">Maximum limit</Text>
                  <Text fw={700} size="lg" c="red" component="div">{creditSettings.max_credit_hours} hrs</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed" component="div">Max sections/inst.</Text>
                  <Text fw={700} size="lg" c="violet" component="div">{creditSettings.max_sections_per_instructor ?? 4} sections</Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed" component="div">Max weekly contact</Text>
                  <Text fw={700} size="lg" c="cyan" component="div">{creditSettings.max_weekly_hours_per_instructor ?? 16} hrs/wk</Text>
                </div>
              </Group>
            </Paper>
          )}

          <Alert color="blue" radius="md">
            <Text size="sm" component="div">
              <strong>Warning threshold:</strong> Shows a ⚠️ warning when total credit hours assigned to a batch/semester reaches this number — but still allows adding more courses.
            </Text>
            <Text size="sm" component="div" mt="xs">
              <strong>Maximum limit:</strong> Blocks adding new courses when this limit would be exceeded.
            </Text>
            <Text size="sm" component="div" mt="xs">
              <strong>Max weekly contact hours (Option B):</strong> Blocks overload when an instructor's total weekly contact hours (lecture + lab) across all courses exceed this limit.
            </Text>
          </Alert>

          <NumberInput
            label="⚠️ Warning Credit Hours"
            description="Show warning when total reaches this value"
            value={settingsForm.warning_credit_hours}
            onChange={(val) => setSettingsForm(prev => ({ ...prev, warning_credit_hours: typeof val === 'number' ? val : parseInt(String(val)) || 37 }))}
            min={1}
            max={settingsForm.max_credit_hours - 1}
            step={1}
            size="md"
            radius="md"
            styles={{ input: { borderColor: '#f59e0b', background: '#fffbeb' } }}
          />

          <NumberInput
            label="🚫 Maximum Credit Hours"
            description="Block adding courses when this limit would be exceeded"
            value={settingsForm.max_credit_hours}
            onChange={(val) => setSettingsForm(prev => ({ ...prev, max_credit_hours: typeof val === 'number' ? val : parseInt(String(val)) || 40 }))}
            min={settingsForm.warning_credit_hours + 1}
            max={100}
            step={1}
            size="md"
            radius="md"
            styles={{ input: { borderColor: '#ef4444', background: '#fef2f2' } }}
          />

          <NumberInput
            label="⏱️ Max Weekly Contact Hours Per Instructor (Option B Workload Limit)"
            description="Maximum weekly contact hours (lecture + tutorial + lab) an instructor can teach across all sections"
            value={settingsForm.max_weekly_hours_per_instructor ?? 16}
            onChange={(val) => setSettingsForm(prev => ({ ...prev, max_weekly_hours_per_instructor: typeof val === 'number' ? val : parseInt(String(val)) || 16 }))}
            min={4}
            max={40}
            step={1}
            size="md"
            radius="md"
            styles={{ input: { borderColor: '#06b6d4', background: '#ecfeff' } }}
          />

          <NumberInput
            label="👨‍🏫 Max Sections Per Instructor"
            description="Block assigning an instructor to more than this number of sections per semester"
            value={settingsForm.max_sections_per_instructor ?? 4}
            onChange={(val) => setSettingsForm(prev => ({ ...prev, max_sections_per_instructor: typeof val === 'number' ? val : parseInt(String(val)) || 4 }))}
            min={1}
            max={20}
            step={1}
            size="md"
            radius="md"
            styles={{ input: { borderColor: '#8b5cf6', background: '#faf5ff' } }}
          />

          {/* Preview bar */}
          <Paper withBorder p="md" radius="md">
            <Text size="xs" fw={600} c="dimmed" mb="xs" component="div">PREVIEW — How limits will appear on credit hour bar</Text>
            <div style={{ position: 'relative', height: 12, background: '#e5e7eb', borderRadius: 6, overflow: 'visible' }}>
              {/* Warning marker */}
              <div style={{
                position: 'absolute',
                left: `${Math.min(100, (settingsForm.warning_credit_hours / settingsForm.max_credit_hours) * 100)}%`,
                top: -4, bottom: -4, width: 2, background: '#f59e0b',
              }} />
              {/* Max marker */}
              <div style={{
                position: 'absolute',
                right: 0, top: -4, bottom: -4, width: 2, background: '#ef4444',
              }} />
            </div>
            <Group justify="space-between" mt="xs">
              <Text size="xs" c="orange" component="div">⚠️ {settingsForm.warning_credit_hours} hrs</Text>
              <Text size="xs" c="red" component="div">🚫 {settingsForm.max_credit_hours} hrs</Text>
            </Group>
          </Paper>

          <Group justify="flex-end" gap="sm">
            <Button variant="light" color="gray" onClick={() => setSettingsOpened(false)}>
              Cancel
            </Button>
            <Button
              color="violet"
              loading={settingsSaving}
              onClick={async () => {
                if (settingsForm.warning_credit_hours >= settingsForm.max_credit_hours) {
                  notifications.show({ color: 'red', title: 'Invalid', message: 'Warning hours must be less than max hours' });
                  return;
                }
                setSettingsSaving(true);
                try {
                  const res = await fetch(`${API_BASE}/api/departments/${user?.department_id}/credit-hour-settings`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settingsForm),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || 'Failed to save');
                  setCreditSettings(data.data);
                  notifications.show({ color: 'green', title: '✅ Saved', message: 'Credit hour settings updated successfully' });
                  setSettingsOpened(false);
                } catch (err: any) {
                  notifications.show({ color: 'red', title: 'Error', message: err.message });
                } finally {
                  setSettingsSaving(false);
                }
              }}
              leftSection={<CheckCircleIcon className="h-4 w-4" />}
            >
              Save Settings
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
};

export default CourseBatchManagement;