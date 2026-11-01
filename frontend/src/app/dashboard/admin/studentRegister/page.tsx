/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Container,
  Card,
  Title,
  Text,
  TextInput,
  Select,
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
  Image,
  FileInput,
  Textarea,
  Divider,
  Tabs,
  SimpleGrid,
  Avatar,
  ActionIcon,
  Modal,
  ScrollArea,
  RingProgress,
  Pagination,
  Collapse,
  Table} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconCalendar,
  IconMapPin,
  IconBuilding,
  IconUsers,
  IconBook,
  IconSchool,
  IconUpload,
  IconCheck,
  IconX,
  IconEye,
  IconEdit,
  IconTrash,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconGenderMale,
  IconGenderFemale,
  IconGenderAgender,
  IconList,
  IconLayoutGrid,
  IconCalendarTime,
  IconUserPlus,
  IconStatusChange} from "@tabler/icons-react";

// Redux Imports
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  createStudent,
  updateStudent,
  fetchStudents,
  deleteStudent,
  fetchDepartments,
  fetchBatches,
  fetchSemesters,
  setCurrentStudent,
  setSearchQuery,
  setFilters,
  setPage,
  clearMessages,
  Student} from "@/store/slices/studentSlice";
import { fetchAdmissionYears } from "@/store/slices/batchSlice";
import {
  selectStudents,
  selectCurrentStudent,
  selectLoading,
  selectSubmitting,
  selectError,
  selectSuccessMessage,
  selectTotalCount,
  selectPage,
  selectLimit,
  selectSearchQuery,
  selectFilters,
  selectDepartmentOptions,
  selectBatchOptions,
  selectSemesterOptions,
  selectAdmissionYearOptions,
  selectFilteredStudents
} from "@/store/selectors/studentSelector";
import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";
import { useRouter } from "next/navigation";

const StudentRegistrationPage: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const students = useAppSelector(selectStudents);
  const currentStudent = useAppSelector(selectCurrentStudent);
  const loading = useAppSelector(selectLoading);
  const submitting = useAppSelector(selectSubmitting);
  const error = useAppSelector(selectError);
  const successMessage = useAppSelector(selectSuccessMessage);
  const totalCount = useAppSelector(selectTotalCount);
  const page = useAppSelector(selectPage);
  const limit = useAppSelector(selectLimit);
  const searchQuery = useAppSelector(selectSearchQuery);
  const filters = useAppSelector(selectFilters);
  const departmentOptions = useAppSelector(selectDepartmentOptions);
  const batchOptions = useAppSelector(selectBatchOptions);
  const admissionYearOptions = useAppSelector(selectAdmissionYearOptions);
  const semesterOptions = useAppSelector(selectSemesterOptions);
  const filteredStudents = useAppSelector(selectFilteredStudents);
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [registrationModalOpened, { open: openRegistrationModal, close: closeRegistrationModal }] = useDisclosure(false);
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'registration' | 'students'>('students');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [register_edit, setregister_edit] = useState("Student Registration");

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
    { value: 'Graduated', label: 'Graduated' },
    { value: 'Suspended', label: 'Suspended' },
  ];

  const letters = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const sectionOptions = [
    { value: "", label: "Select Section" },
    { value: "1", label: "Single Class" },
    ...letters.map((letter) => ({
      value: letter,
      label: `Section ${letter}`,
    })),
  ];
  const form = useForm({
    initialValues: {
      full_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: '' as 'Male' | 'Female' | 'Other',
      address: '',
      department_id: '',
      batch_id: '',
      admission_year: '2014',
      semester_id: '',
      section: '',
    },
    validate: {
      full_name: (value) => value.trim().length < 2 ? 'Full name must be at least 2 characters' : null,
      email: (value) => /^\S+@\S+$/.test(value) ? null : 'Invalid email',
      phone: (value) => value && !/^[\d\s\-\+\(\)]{10,15}$/.test(value) ? 'Invalid phone number' : null,
      department_id: (value) => !value ? 'Department is required' : null,
      batch_id: (value) => !value ? 'Batch is required' : null,
      semester_id: (value) => !value ? 'Semester is required' : null,
    },
  });

  useEffect(() => {
    dispatch(fetchDepartments());
    dispatch(fetchBatches());
    dispatch(fetchAdmissionYears());
    dispatch(fetchSemesters());
    dispatch(fetchStudents({ page, limit, search: searchQuery, filters }));
  }, [dispatch, page, limit, searchQuery, filters]);

  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (successMessage) {
      notifications.show({
        title: "Success",
        message: successMessage,
        color: "green",
        icon: <IconCheck size={20} />,
      });
      dispatch(clearMessages());
      closeRegistrationModal();
      form.reset();
      setProfileImage(null);
      setProfileImagePreview(null);
    }

    if (error) {
      notifications.show({
        title: "Error",
        message: error,
        color: "red",
        icon: <IconX size={20} />,
      });
      dispatch(clearMessages());
    }
  }, [successMessage, error]);
 
  useEffect(() => {
    if (currentStudent) {
      form.setValues({
        full_name: currentStudent.full_name,
        email: currentStudent.email,
        phone: currentStudent.phone || '',
        date_of_birth: currentStudent.date_of_birth || '',
        gender: currentStudent.gender,
        address: currentStudent.address || '',
        department_id: currentStudent.department_id.toString() || "",
        batch_id: currentStudent.batch_id.toString() || "",
        admission_year: currentStudent.admission_year || '2014',
        semester_id: currentStudent.semester_id.toString() || "",
        section: currentStudent.section || '',
      });
      if (currentStudent.profile_image_url) {
        setProfileImagePreview(currentStudent.profile_image_url);
      }
    }
  }, [currentStudent]);

 const handleSubmit = async (values: any) => {
  // Create a proper student object
  const studentData = {
    full_name: values.full_name,
    email: values.email,
    phone: values.phone,
    date_of_birth: values.date_of_birth,
    gender: values.gender,
    address: values.address,
    department_id: parseInt(values.department_id),
    batch_id: parseInt(values.batch_id),
    admission_year: values.admission_year || '2014',
    semester_id: parseInt(values.semester_id),
    section: values.section,
    status: values.status || 'Active'
  };

  if (currentStudent) {
    // Update existing student
    await dispatch(updateStudent({
      studentId: currentStudent.student_id,
      studentData: studentData  // Send as JSON object
    }));
  } else {
    // Create new student - send as JSON
    await dispatch(createStudent(studentData));
  }

  // Refresh student list
  dispatch(fetchStudents({ page, limit, search: searchQuery, filters }));
};

  const handleEditStudent = (student: Student) => {
    dispatch(setCurrentStudent(student));
    openRegistrationModal();
    setregister_edit("Edit Personal info");
    setActiveTab("registration");
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    openDetailModal();
  };

  const handleDeleteStudent = async () => {
    if (selectedStudent) {
      await dispatch(deleteStudent(selectedStudent.student_id));
      dispatch(fetchStudents({ page, limit, search: searchQuery, filters }));
      closeDeleteModal();
    }
  };

  const handleProfileImageChange = (file: File | null) => {
    setProfileImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setProfileImagePreview(null);
    }
  };

  const handleSearch = (value: string) => {
    dispatch(setSearchQuery(value));
    dispatch(setPage(1));
  };

  const handleFilterChange = (key: string, value: string) => {
    dispatch(setFilters({ [key]: value }));
    dispatch(setPage(1));
  };

  const handlePageChange = (newPage: number) => {
    dispatch(setPage(newPage));
  };

  const handleResetForm = () => {
    form.reset();
    setProfileImage(null);
    setProfileImagePreview(null);
    dispatch(setCurrentStudent(null));
    setregister_edit("Student Registration");
  };

  const calculateStatistics = () => {
    const activeCount = students.filter(s => s.status === 'Active').length;
    const maleCount = students.filter(s => s.gender === 'Male').length;
    const femaleCount = students.filter(s => s.gender === 'Female').length;
    const otherCount = students.filter(s => s.gender === 'Other').length;
    
    return {
      total: students.length,
      activeCount,
      maleCount,
      femaleCount,
      otherCount,
      activePercentage: students.length > 0 ? (activeCount / students.length * 100).toFixed(1) : '0.0',
    };
  };

  const stats = calculateStatistics();

  if (user === null) {
    return <Authentication />;
  }
  if (user.role !== 'admin') {
    return <UnauthorizedAccess />
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
      <Container size="xl" className="py-8">
        {/* Header */}
        <Stack gap="lg" mb="xl">
          <Group justify="space-between">
            <Stack gap="xs">
              <Title order={1} className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {register_edit}
              </Title>
              <Text c="dimmed" size="lg">
                Manage student enrollment and academic information
              </Text>
            </Stack>
            <Group>
              <Button
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
                leftSection={<IconUserPlus size={20} />}
                size="lg"
                radius="lg"
                onClick={() => {
                 router.push('/dashboard/admin/import-students')
                }}
              >
                Register New Student from excel
              </Button>
            </Group>
          </Group>

          {/* Statistics Cards */}
          <SimpleGrid cols={{ base: 2, md: 3, lg: 5 }} spacing="lg">
            <Card radius="lg" className="bg-gradient-to-br from-blue-50 to-blue-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-blue-600">
                  {stats.total}
                </Text>
                <Text size="sm" c="dimmed">Total Students</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-green-50 to-green-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-green-600">
                  {stats.activeCount}
                </Text>
                <Text size="sm" c="dimmed">Active Students</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-pink-50 to-pink-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-pink-600">
                  {stats.maleCount}
                </Text>
                <Text size="sm" c="dimmed">Male Students</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-purple-50 to-purple-100/50">
              <Stack align="center" gap="xs">
                <Text fw={700} size="xl" className="text-purple-600">
                  {stats.femaleCount}
                </Text>
                <Text size="sm" c="dimmed">Female Students</Text>
              </Stack>
            </Card>
            
            <Card radius="lg" className="bg-gradient-to-br from-teal-50 to-teal-100/50">
              <Stack align="center" gap="xs">
                <RingProgress
                  size={60}
                  thickness={6}
                  roundCaps
                  sections={[{ value: parseFloat(stats.activePercentage), color: 'teal' }]}
                  label={
                    <Text ta="center" fw={700} size="xs">
                      {stats.activePercentage}%
                    </Text>
                  }
                />
                <Text size="sm" c="dimmed">Active Rate</Text>
              </Stack>
            </Card>
          </SimpleGrid>
        </Stack>

        {/* Main Content */}
        <Card
          shadow="xl"
          radius="xl"
          padding="xl"
          className="bg-white/90 backdrop-blur-lg border border-white/20 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent pointer-events-none"></div>

          <Tabs value={activeTab} onChange={(value)=> setActiveTab(value as "registration" | "students" )}>
            <Tabs.List grow>
              <Tabs.Tab 
                value="registration" 
                leftSection={<IconUserPlus size={16} />}
              >
               {register_edit}
              </Tabs.Tab>
              <Tabs.Tab 
                value="students" 
                leftSection={<IconUsers size={16} />}
              >
                Students List ({totalCount})
              </Tabs.Tab>
            </Tabs.List>
            {/* Registration Form Tab */}
            <Tabs.Panel value="registration" pt="xl">
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="xl">
                  {/* Personal Information */}
                  <Paper p="lg" radius="lg" className="bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
                    <Group mb="md">
                      <ThemeIcon size="lg" color="blue" variant="light" radius="xl">
                        <IconUser size={20} />
                      </ThemeIcon>
                      <Text fw={700} size="xl" className="text-blue-800">
                        Personal Information
                      </Text>
                    </Group>

                    <Grid gutter="lg">
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                          label="Full Name"
                          placeholder="Enter student's full name"
                          required
                          leftSection={<IconUser size={16} />}
                          {...form.getInputProps('full_name')}
                          radius="md"
                          size="md"
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                          label="Email Address"
                          placeholder="student@example.com"
                          required
                          leftSection={<IconMail size={16} />}
                          {...form.getInputProps('email')}
                          radius="md"
                          size="md"
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                          label="Phone Number"
                          placeholder="+1234567890"
                          leftSection={<IconPhone size={16} />}
                          {...form.getInputProps('phone')}
                          radius="md"
                          size="md"
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <TextInput
                         type="date"
                          label="Date of Birth"
                          placeholder="Select date"
                          leftSection={<IconCalendar size={16} />}
                          {...form.getInputProps('date_of_birth')}
                          radius="md"
                          size="md"
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Select
                          label="Gender"
                          placeholder="Select gender"
                          data={genderOptions}
                          leftSection={
                            <ThemeIcon size="sm" variant="transparent">
                              {form.values.gender === 'Male' ? <IconGenderMale size={16} /> :
                               form.values.gender === 'Female' ? <IconGenderFemale size={16} /> :
                               <IconGenderAgender size={16} />}
                            </ThemeIcon>
                          }
                          {...form.getInputProps('gender')}
                          radius="md"
                          size="md"
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Select
                          label="Section"
                          placeholder="Select section"
                          data={sectionOptions}
                          leftSection={<IconSchool size={16} />}
                          {...form.getInputProps('section')}
                          radius="md"
                          size="md"
                        />
                      </Grid.Col>

                      <Grid.Col span={12}>
                        <Textarea
                          label="Address"
                          placeholder="Enter complete address"
                          autosize
                          minRows={2}
                          leftSection={<IconMapPin size={16} />}
                          {...form.getInputProps('address')}
                          radius="md"
                          size="md"
                        />
                      </Grid.Col>

                      <Grid.Col span={12}>
                        <FileInput
                          label="Profile Picture"
                          placeholder="Upload profile image"
                          accept="image/png,image/jpeg,image/gif"
                          leftSection={<IconUpload size={16} />}
                          onChange={handleProfileImageChange}
                          radius="md"
                          size="md"
                        />
                        {profileImagePreview && (
                          <Box mt="sm">
                            <Image
                              src={profileImagePreview}
                              alt="Profile preview"
                              width={100}
                              height={100}
                              radius="md"
                              className="border-2 border-gray-200"
                            />
                          </Box>
                        )}
                      </Grid.Col>
                    </Grid>
                  </Paper>

                  {/* Academic Information */}
                  <Paper p="lg" radius="lg" className="bg-gradient-to-r from-purple-50/50 to-pink-50/50">
                    <Group mb="md">
                      <ThemeIcon size="lg" color="purple" variant="light" radius="xl">
                        <IconBook size={20} />
                      </ThemeIcon>
                      <Text fw={700} size="xl" className="text-purple-800">
                        Academic Information
                      </Text>
                    </Group>

                    <Grid gutter="lg">
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Select
                          label="Department"
                          placeholder="Select department"
                          data={departmentOptions}
                          required
                          leftSection={<IconBuilding size={16} />}
                          {...form.getInputProps('department_id')}
                          radius="md"
                          size="md"
                          searchable
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Select
                          label="Batch Level"
                          placeholder="Select batch level (e.g. First year)"
                          data={batchOptions}
                          required
                          leftSection={<IconUsers size={16} />}
                          {...form.getInputProps('batch_id')}
                          radius="md"
                          size="md"
                          searchable
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Select
                          label="Entrance / Admission Year"
                          placeholder="Select entrance year (e.g. 2014)"
                          data={admissionYearOptions}
                          required
                          leftSection={<IconCalendar size={16} />}
                          {...form.getInputProps('admission_year')}
                          radius="md"
                          size="md"
                          searchable
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Select
                          label="Semester"
                          placeholder="Select semester"
                          data={semesterOptions}
                          required
                          leftSection={<IconCalendarTime size={16} />}
                          {...form.getInputProps('semester_id')}
                          radius="md"
                          size="md"
                          searchable
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <Select
                          label="Status"
                          placeholder="Select status"
                          data={statusOptions}
                          defaultValue="Active"
                          leftSection={<IconStatusChange size={16} />}
                          radius="md"
                          size="md"
                        />
                      </Grid.Col>
                    </Grid>
                  </Paper>

                  {/* Submit Button */}
                  <Group justify="center">
                    <Button
                      type="submit"
                      size="lg"
                      radius="lg"
                      loading={submitting}
                      leftSection={currentStudent ? <IconEdit size={20} /> : <IconUserPlus size={20} />}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                    >
                      {currentStudent ? 'Update Student' : 'Register Student'}
                    </Button>
                    <Button
                      type="button"
                      variant="light"
                      size="lg"
                      radius="lg"
                      onClick={handleResetForm}
                      leftSection={<IconRefresh size={20} />}
                    >
                      Reset Form
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Tabs.Panel>

            {/* Students List Tab */}
            <Tabs.Panel value="students" pt="xl">
              <Stack gap="lg">
                {/* Search and Filter Bar */}
                <Paper p="lg" radius="lg" className="bg-gradient-to-r from-gray-50 to-blue-50/30">
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, md: 4 }}>
                      <TextInput
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        leftSection={<IconSearch size={18} />}
                        radius="lg"
                        size="md"
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, md: 2 }}>
                      <Button
                        variant={showAdvancedFilters ? "filled" : "light"}
                        color="blue"
                        leftSection={<IconFilter size={18} />}
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        fullWidth
                        radius="lg"
                        size="md"
                      >
                        Filters
                      </Button>
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <Select
                        placeholder="View Mode"
                        data={[
                          { value: 'list', label: 'List View' },
                          { value: 'grid', label: 'Grid View' },
                        ]}
                        value={viewMode}
                        onChange={(value) => setViewMode(value as 'list' | 'grid')}
                        leftSection={viewMode === 'list' ? <IconList size={16} /> : <IconLayoutGrid size={16} />}
                        radius="lg"
                        size="md"
                      />
                    </Grid.Col>
                    
                    <Grid.Col span={{ base: 12, md: 3 }}>
                      <Button
                        variant="light"
                        color="blue"
                        leftSection={<IconRefresh size={18} />}
                        onClick={() => dispatch(fetchStudents({ page, limit, search: searchQuery, filters }))}
                        loading={loading}
                        fullWidth
                        radius="lg"
                        size="md"
                      >
                        Refresh
                      </Button>
                    </Grid.Col>
                  </Grid>

                  {/* Advanced Filters */}
                  <Collapse in={showAdvancedFilters}>
                    <Grid gutter="md" mt="md">
                      <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                        <Select
                          placeholder="Department"
                          data={[{ value: '', label: 'All Departments' }, ...departmentOptions]}
                          value={filters.department}
                          onChange={(value) => handleFilterChange('department', value || '')}
                          radius="lg"
                          size="sm"
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                        <Select
                          placeholder="Batch Level"
                          data={[{ value: '', label: 'All Batches' }, ...batchOptions]}
                          value={filters.batch}
                          onChange={(value) => handleFilterChange('batch', value || '')}
                          radius="lg"
                          size="sm"
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                        <Select
                          placeholder="Entrance Year"
                          data={[{ value: '', label: 'All Entrance Years' }, ...admissionYearOptions]}
                          value={filters.admission_year || ''}
                          onChange={(value) => handleFilterChange('admission_year', value || '')}
                          radius="lg"
                          size="sm"
                          clearable
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                        <Select
                          placeholder="Semester"
                          data={[{ value: '', label: 'All Semesters' }, ...semesterOptions]}
                          value={filters.semester}
                          onChange={(value) => handleFilterChange('semester', value || '')}
                          radius="lg"
                          size="sm"
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                        <Select
                          placeholder="Status"
                          data={[{ value: '', label: 'All Status' }, ...statusOptions]}
                          value={filters.status}
                          onChange={(value) => handleFilterChange('status', value || '')}
                          radius="lg"
                          size="sm"
                        />
                      </Grid.Col>
                    </Grid>
                  </Collapse>
                </Paper>

                {/* Students List/Grid */}
                {loading ? (
                  <Center py={80}>
                    <Stack align="center" gap="lg">
                      <Loader size="xl" color="blue" />
                      <Stack gap="xs" align="center">
                        <Text fw={600} size="lg">Loading students...</Text>
                        <Text c="dimmed">Fetching student records</Text>
                      </Stack>
                    </Stack>
                  </Center>
                ) : filteredStudents.length === 0 ? (
                  <Center py={80}>
                    <Stack align="center" gap="lg">
                      <ThemeIcon size={120} color="gray" variant="light" radius="xl">
                        <IconUsers size={48} />
                      </ThemeIcon>
                      <Stack gap="xs" align="center">
                        <Title order={3} c="gray.7">No Students Found</Title>
                        <Text c="dimmed" ta="center" size="lg">
                          {searchQuery || Object.values(filters).some(f => f) 
                            ? "Try adjusting your search terms or filters"
                            : "No students registered yet. Register your first student!"}
                        </Text>
                      </Stack>
                    </Stack>
                  </Center>
                ) : viewMode === 'list' ? (
                      <ScrollArea>
                        <Table.ScrollContainer minWidth={1300}>
                    <Table className="w-full border-collapse">
                        <Table.Thead>
                            <Table.Tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                                
                            <Table.Th className="border border-gray-200 px-6 py-4 text-left font-bold text-gray-700">Student</Table.Th>
                            <Table.Th className="border border-gray-200 px-4 py-4 text-left font-bold text-gray-700">Contact</Table.Th>
                            <Table.Th className="border border-gray-200 px-4 py-4 text-left font-bold text-gray-700">Academic</Table.Th>
                            <Table.Th className="border border-gray-200 px-4 py-4 text-left font-bold text-gray-700">Status</Table.Th>
                            <Table.Th className="border border-gray-200 px-4 py-4 text-left font-bold text-gray-700">Actions</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {filteredStudents.map((student) => (
                          <Table.Tr key={student.student_id} className="border-b border-gray-200 hover:bg-blue-50/30">
                            
                            <Table.Td className="border border-gray-200 px-6 py-4">
                              <Group gap="md">
                                <Avatar
                                  size="lg"
                                  radius="xl"
                                  src={student.profile_image_url}
                                  alt={student.full_name}
                                >
                                  {student.full_name.charAt(0)}
                                </Avatar>
                                <Stack gap={2}>
                                  <Text fw={600}>{student.full_name}</Text>
                                  <Text size="sm" c="dimmed">{student.student_number}</Text>
                                </Stack>
                              </Group>
                            </Table.Td>
                            <Table.Td className="border border-gray-200 px-4 py-4">
                              <Stack gap={2}>
                                <Group gap="xs">
                                  <IconMail size={14} className="text-gray-500" />
                                  <Text size="sm">{student.email}</Text>
                                </Group>
                                {student.phone && (
                                  <Group gap="xs">
                                    <IconPhone size={14} className="text-gray-500" />
                                    <Text size="sm">{student.phone}</Text>
                                  </Group>
                                )}
                              </Stack>
                            </Table.Td>
                            <Table.Td className="border border-gray-200 px-4 py-4">
                              <Stack gap={2}>
                                <Badge color="blue" variant="light" size="sm">
                                  {student.department_name}
                                </Badge>
                                <Group gap="xs">
                                  <Text size="sm">
                                    Batch: {student.batch_full_label || (student.admission_year ? `${student.batch_year} / ${student.admission_year}` : student.batch_year)}
                                  </Text>
                                  <Text size="sm" c="dimmed">• {student.semester_name}</Text>
                                </Group>
                                {student.section && (
                                  <Badge color="orange" variant="light" size="xs">
                                    Sec {student.section}
                                  </Badge>
                                )}
                              </Stack>
                            </Table.Td>
                            <Table.Td className="border border-gray-200 px-4 py-4">
                              <Badge
                                color={
                                  student.status === 'Active' ? 'green' :
                                  student.status === 'Inactive' ? 'gray' :
                                  student.status === 'Graduated' ? 'blue' : 'red'
                                }
                                variant="light"
                                size="md"
                              >
                                {student.status}
                              </Badge>
                            </Table.Td>
                            <Table.Td className="border border-gray-200 px-4 py-4">
                              <Group gap="xs">
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  size="lg"
                                  onClick={() => handleViewStudent(student)}
                                >
                                  <IconEye size={18} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="light"
                                  color="yellow"
                                  size="lg"
                                  onClick={() => handleEditStudent(student)}
                                >
                                  <IconEdit size={18} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="light"
                                  color="red"
                                  size="lg"
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    openDeleteModal();
                                  }}
                                >
                                  <IconTrash size={18} />
                                </ActionIcon>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                    </Table.ScrollContainer>
                  </ScrollArea>
                ) : (
                  <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                    {filteredStudents.map((student) => (
                      <Card
                        key={student.student_id}
                        shadow="md"
                        padding="lg"
                        radius="lg"
                        className="border-2 border-gray-200/50 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
                      >
                        <Stack gap="md">
                          {/* Header */}
                          <Group justify="space-between">
                            <Avatar
                              size="lg"
                              radius="xl"
                              src={student.profile_image_url}
                              alt={student.full_name}
                            >
                              {student.full_name.charAt(0)}
                            </Avatar>
                            <Badge
                              color={
                                student.status === 'Active' ? 'green' :
                                student.status === 'Inactive' ? 'gray' :
                                student.status === 'Graduated' ? 'blue' : 'red'
                              }
                              variant="light"
                            >
                              {student.status}
                            </Badge>
                          </Group>

                          {/* Student Info */}
                          <Stack gap="xs">
                            <Text fw={600} size="lg">{student.full_name}</Text>
                            <Text size="sm" c="dimmed">{student.student_number}</Text>
                            <Text size="sm">{student.email}</Text>
                            {student.phone && (
                              <Text size="sm">{student.phone}</Text>
                            )}
                          </Stack>

                          {/* Academic Info */}
                          <Stack gap="xs">
                            <Badge color="blue" variant="light">
                              {student.department_name}
                            </Badge>
                            <Group>
                              <Badge color="teal" variant="light" size="sm">
                                {student.batch_full_label || `Batch ${student.batch_year}`}
                              </Badge>
                              <Badge color="violet" variant="light" size="sm">
                                {student.semester_name}
                              </Badge>
                              {student.section && (
                                <Badge color="orange" variant="light" size="sm">
                                  Sec {student.section}
                                </Badge>
                              )}
                            </Group>
                          </Stack>

                          {/* Actions */}
                          <Group justify="space-between" mt="md">
                            <Text size="xs" c="dimmed">
                              Joined: {new Date(student.created_at).toLocaleDateString()}
                            </Text>
                            <Group gap="xs">
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="sm"
                                onClick={() => handleViewStudent(student)}
                              >
                                <IconEye size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="yellow"
                                size="sm"
                                onClick={() => handleEditStudent(student)}
                              >
                                <IconEdit size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="red"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  openDeleteModal();
                                }}
                              >
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Group>
                          </Group>
                        </Stack>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}

                {/* Pagination */}
                {totalCount > limit && (
                  <Center mt="xl">
                    <Pagination
                      value={page}
                      onChange={handlePageChange}
                      total={Math.ceil(totalCount / limit)}
                      radius="lg"
                      withEdges
                      size="md"
                    />
                  </Center>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Card>
      </Container>

      {/* Student Detail Modal */}
      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title={
          <Group gap="xs">
            <IconUser size={20} />
            <Text fw={600}>Student Details</Text>
          </Group>
        }
        size="lg"
        radius="lg"
        scrollAreaComponent={ScrollArea.Autosize}
      >
        {selectedStudent && (
          <Stack gap="lg">
            {/* Header */}
            <Group gap="lg">
              <Avatar
                size="xl"
                radius="xl"
                src={selectedStudent.profile_image_url}
                alt={selectedStudent.full_name}
              >
                {selectedStudent.full_name.charAt(0)}
              </Avatar>
              <Stack gap={2}>
                <Title order={3}>{selectedStudent.full_name}</Title>
                <Group>
                  <Badge color="blue" variant="light">{selectedStudent.student_number}</Badge>
                  <Badge
                    color={
                      selectedStudent.status === 'Active' ? 'green' :
                      selectedStudent.status === 'Inactive' ? 'gray' :
                      selectedStudent.status === 'Graduated' ? 'blue' : 'red'
                    }
                    variant="light"
                  >
                    {selectedStudent.status}
                  </Badge>
                </Group>
              </Stack>
            </Group>

            <Divider />

            {/* Personal Info */}
            <Stack gap="md">
              <Title order={4}>Personal Informationg
              </Title>
              <SimpleGrid cols={2} spacing="md">
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Email</Text>
                  <Text>{selectedStudent.email}</Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Phone</Text>
                  <Text>{selectedStudent.phone || 'N/A'}</Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Gender</Text>
                  <Text>{selectedStudent.gender}</Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Date of Birth</Text>
                  <Text>{selectedStudent.date_of_birth || 'N/A'}</Text>
                </Stack>
                {selectedStudent.address && (
                  <Stack gap={2} justify-content='center'>
                    <Text fw={500} size="sm" c="dimmed">Address</Text>
                    <Text>{selectedStudent.address}</Text>
                  </Stack>
                )}
              </SimpleGrid>
            </Stack>

            <Divider />

            {/* Academic Info */}
            <Stack gap="md">
              <Title order={4}>Academic Information</Title>
              <SimpleGrid cols={2} spacing="md">
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Department</Text>
                  <Badge color="blue" variant="light">
                    {selectedStudent.department_name}
                  </Badge>
                </Stack>
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Batch / Entrance Year</Text>
                  <Text>{selectedStudent.batch_full_label || (selectedStudent.admission_year ? `${selectedStudent.batch_year} / ${selectedStudent.admission_year}` : selectedStudent.batch_year)}</Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Semester</Text>
                  <Text>{selectedStudent.semester_name}</Text>
                </Stack>
                <Stack gap={2}>
                  <Text fw={500} size="sm" c="dimmed">Section</Text>
                  <Text>{selectedStudent.section || 'N/A'}</Text>
                </Stack>
              </SimpleGrid>
            </Stack>

            <Divider />

            {/* Dates */}
            <SimpleGrid cols={2} spacing="md">
              <Stack gap={2}>
                <Text fw={500} size="sm" c="dimmed">Enrollment Date</Text>
                <Text>{new Date(selectedStudent.enrollment_date).toLocaleDateString()}</Text>
              </Stack>
              <Stack gap={2}>
                <Text fw={500} size="sm" c="dimmed">Created At</Text>
                <Text>{new Date(selectedStudent.created_at).toLocaleDateString()}</Text>
              </Stack>
            </SimpleGrid>

            <Group justify="flex-end" mt="md">
              <Button
                variant="light"
                color="blue"
                leftSection={<IconEdit size={16} />}
                onClick={() => {
                  closeDetailModal();
                  handleEditStudent(selectedStudent);
                }}
              >
                Edit Student
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Student"
        centered
        radius="lg"
      >
        <Stack>
          <Alert color="red" variant="light" title="Warning">
            Are you sure you want to delete {selectedStudent?.full_name}? This action cannot be undone.
          </Alert>
          
          {selectedStudent && (
            <Paper p="md" radius="md" className="bg-red-50">
              <Stack gap="xs">
                <Text fw={500}>Student Details:</Text>
                <Group justify="space-between">
                  <Text size="sm">Name:</Text>
                  <Text size="sm" fw={500}>{selectedStudent.full_name}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Student Number:</Text>
                  <Text size="sm" fw={500}>{selectedStudent.student_number}</Text>
                </Group>
                <Group justify="space-between">
                  <Text size="sm">Department:</Text>
                  <Text size="sm" fw={500}>{selectedStudent.department_name}</Text>
                </Group>
              </Stack>
            </Paper>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button
              color="red"
              onClick={handleDeleteStudent}
              loading={submitting}
              leftSection={<IconTrash size={16} />}
            >
              Delete Student
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default StudentRegistrationPage;