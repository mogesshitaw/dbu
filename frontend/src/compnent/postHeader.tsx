/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline";
import {
  Menu,
  Avatar,
  UnstyledButton,
  Group,
  Text,
  Skeleton,
  Modal,
  TextInput,
  Button,
  Stack,
  PasswordInput,
  Notification,
  FileInput,
  Divider,
  LoadingOverlay,
  Badge,
  Paper,
  Select,
  Table,
  Card,
} from "@mantine/core";
import {
  IconUser,
  IconSettings,
  IconLock,
  IconLogout,
  IconUserCircle,
  IconMail,
  IconCheck,
  IconX,
  IconCamera,
  IconDeviceFloppy,
  IconId,
  IconSchool,
  IconCalendar,
  IconCalendarEvent,
  IconCalendarTime,
  IconBuilding,
  IconCalendarStats,
  IconList,
  IconBook,
} from "@tabler/icons-react";

import img from "../../public/images/dbu.jpg";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setSidebarOpened } from "@/store/slices/uiSlice";
import { Found } from "@/app/auth/auth";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/store/slices/checkSession";

// CORRECTED IMPORTS: Use academicYearSlice for academic years with statuses
import { fetchAcademicYears, selectActiveAcademicYears } from "@/store/slices/academicYearSlice";
import { fetchBatches, selectBatches } from "@/store/slices/batchSlice";

interface UserProfile {
  id: number;
  id_number: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  department_id: number;
  department_name: string;
  phone?: string;
  address?: string;
  profile_picture?: string;
}

// Update Academic Year interface to match your data structure
interface AcademicYear {
  id: number;
  semester_id: number;
  batch_id: number;
  academic_year: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'completed' | 'upcoming';
  semester: string;
  batch_year: string;
}

// Get appropriate badge color based on role
const getRoleColor = (role: string) => {
  switch (role) {
    case "student":
      return "green";
    case "instructor":
      return "blue";
    case "department_head":
      return "orange";
    case "admin":
      return "red";
    default:
      return "gray";
  }
};

export default function PostHeader() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [profileModalOpened, setProfileModalOpened] = useState(false);
  const [passwordModalOpened, setPasswordModalOpened] = useState(false);
  const [semesterModalOpened, setSemesterModalOpened] = useState(false);

  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Academic Year states
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(null);
  const [academicYearsLoading, setAcademicYearsLoading] = useState(false);

  // Redux selectors for academic years and batches
  const upcomingAcademicYears: AcademicYear[] = useAppSelector(selectActiveAcademicYears);
  const batches = useAppSelector(selectBatches);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const foundUser = await Found();
        setUser(foundUser);
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Load academic years and batches when component mounts
  useEffect(() => {
    const loadData = async () => {
      setAcademicYearsLoading(true);
      try {
        await Promise.all([
          dispatch(fetchAcademicYears() as any),
          dispatch(fetchBatches() as any)
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setAcademicYearsLoading(false);
      }
    };
    loadData();
  }, [dispatch]);

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleLogout = async () => {
    const result = await dispatch(logoutUser());
    if (logoutUser.fulfilled.match(result)) {
      router.push("/login");
    }
  };

  // Profile Modal Handlers
  const openProfileModal = () => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || "",
        email: user.email || "",
      });
      setImagePreview(user.profile_picture || "");
      setProfileImage(null);
    }
    setProfileModalOpened(true);
  };

  const closeProfileModal = () => {
    setProfileModalOpened(false);
    setProfileImage(null);
  };

  // Password Modal Handlers
  const openPasswordModal = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordModalOpened(true);
  };

  const closePasswordModal = () => {
    setPasswordModalOpened(false);
  };

  // Academic Year Modal Handlers
  const openSemesterModal = () => {
    setSemesterModalOpened(true);
  };

  const closeSemesterModal = () => {
    setSemesterModalOpened(false);
    setSelectedAcademicYear(null);
  };

  // Form Handlers
  const handleProfileInputChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (file: File | null) => {
    setProfileImage(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Save Profile
  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          full_name: profileForm.full_name,
          email: profileForm.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        closeProfileModal();
        setNotification({ type: 'success', message: "Profile updated successfully!" });

        // Refresh user data
        const foundUser = await Found();
        setUser(foundUser);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };
const API_URL =process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const [passwordPolicy, setPasswordPolicy] = useState();
  
 useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/security-settings`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const data = await res.json();
        setPasswordPolicy(data.password_policy ?? "Standard");
       
      } catch (err) {
        console.error("Failed to load security settings", err);
      }
    };

    loadSettings();
  }, [API_URL]);
  // Change Password
   const handleChangePassword = async () => {
    console.log("passwordPolicy", passwordPolicy);
             if (passwordPolicy == 'Standard') {
               if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    setNotification({ type: 'error', message: "New passwords do not match" });
                    return;
                  }
                  if (passwordForm.newPassword.length < 6) {
                  setNotification({ type: 'error', message: "Password must be at least 6 characters long" });
                  return;
                }
                }
                if (passwordPolicy == 'Strong') { 
                     if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                      setNotification({ type: 'error', message: "New passwords do not match" });
                      return;
                    }

                    if (passwordForm.newPassword.length < 8) {
                      setNotification({ type: 'error', message: "Password must be at least 8 characters long" });
                      return;
                    }
                    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.newPassword)) {
                      setNotification({ type: 'error', message: 'Password must contain uppercase, lowercase, and numbers' });
                      return;
                    }
                }
    try {
      setSaving(true);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: "Password changed successfully!" });
        closePasswordModal();
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password");
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get batch year for an academic year
  const getBatchYear = (batchId: number) => {
    const batch = batches.find(b => b.batch_id === batchId);
    return batch ? `Batch ${batch.batch_year}` : 'Unknown Batch';
  };

  // Prepare academic year options for dropdown - show all upcoming academic years
  const academicYearOptions = upcomingAcademicYears.map(ay => ({
    value: ay.id.toString(),
    label: `${ay.semester} - ${ay.academic_year} (${getBatchYear(ay.batch_id)})`,
    academicYear: ay
  }));

  // Get selected academic year details
  const selectedAcademicYearDetails = selectedAcademicYear 
    ? upcomingAcademicYears.find(ay => ay.id.toString() === selectedAcademicYear)
    : null;

  // Show loading state or fallback while user data is loading
  if (loading) {
    return (
      <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center justify-between h-20 px-6">
          {/* Loading state for logo */}
          <div className="hidden md:flex items-center space-x-4">
            <Image src={img} alt="DBU Logo" width={60} height={60} className="rounded-lg" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">DEBRE BERHAN UNIVERSITY</h1>
              <p className="text-sm font-semibold text-blue-700">Class Schedule Management System</p>
            </div>
          </div>

          {/* Loading state for user menu */}
          <div className="flex items-center space-x-3">
            <Skeleton height={20} width={100} />
            <Skeleton circle height={45} width={45} />
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-60 max-w-sm w-full">
          <Notification
            color={notification.type === 'success' ? 'teal' : 'red'}
            title={notification.type === 'success' ? 'Success' : 'Error'}
            onClose={() => setNotification(null)}
            icon={notification.type === 'success' ? <IconCheck size={18} /> : <IconX size={18} />}
          >
            {notification.message}
          </Notification>
        </div>
      )}

      <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-md border-b border-gray-200">
        <div className="flex items-center justify-between h-20 px-6">
          {/* Mobile Header with Burger Menu */}
          <div className="md:hidden flex items-center justify-between p-4">
            <button
              onClick={() => dispatch(setSidebarOpened(true))}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6 text-gray-700" />
            </button>
          </div>

          {/* LEFT: Logo */}
          <div className="hidden md:flex items-center space-x-4">
            <Image
              src={img}
              alt="DBU Logo"
              width={60}
              height={60}
              className="rounded-lg cursor-pointer"
              onClick={() => router.push("/dashboard")}
            />
            <div>
              <h1 className="text-xl font-bold text-gray-800">DEBRE BERHAN UNIVERSITY</h1>
              <p className="text-sm font-semibold text-blue-700">Class Schedule Management System</p>
            </div>
          </div>
          {/* RIGHT: User menu */}
          <Menu
            width={260}
            position="bottom-end"
            withinPortal
          >
            <Menu.Target>
              <UnstyledButton className="hover:bg-gray-100 rounded-xl px-3 py-2 transition-colors duration-200">
                <Group>
                  <div className="text-right hidden sm:block">
                    <Text size="sm" fw={600} className="text-gray-800">
                      {user?.full_name || "User"}
                    </Text>
                    <Text size="xs" c="dimmed" className="capitalize">
                      {user?.role || "User"}
                    </Text>
                  </div>
                  <Avatar
                    radius="xl"
                    size={45}
                    src={user?.profile_picture}
                    className="border-2 border-blue-200"
                  >
                    <IconUser size={20} className="text-blue-600" />
                  </Avatar>
                </Group>
              </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown className="rounded-xl shadow-lg border-0">
              {/* User Info Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-100">
                <Group>
                  <Avatar
                    size={50}
                    radius="xl"
                    src={user?.profile_picture}
                    className="border-2 border-white shadow-sm"
                  >
                    <IconUser size={24} className="text-blue-600" />
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Text fw={700} size="md" className="text-gray-900 truncate">
                      {user?.full_name || "User"}
                    </Text>
                    <Text size="sm" c="dimmed" className="truncate">
                      {user?.email || "No email"}
                    </Text>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge color={getRoleColor(user?.role || '')} size="xs">
                        {user?.role}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${user?.status === 'active' ? 'bg-green-500' :
                        user?.status === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                    </div>
                  </div>
                </Group>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                {/* Current Academic Year Info (for ALL users) */}
                {user && (
                  <>
                    <Menu.Item
                      leftSection={<IconCalendarStats size={18} className="text-indigo-600" />}
                      onClick={openSemesterModal}
                      className="rounded-lg mb-1 hover:bg-indigo-50 transition-colors"
                    >
                      View Current Academic Years
                    </Menu.Item>
                    <div className="mx-2 my-1">
                      <Divider />
                    </div>
                  </>
                )}

                <Menu.Item
                  leftSection={<IconUserCircle size={18} className="text-blue-600" />}
                  onClick={openProfileModal}
                  className="rounded-lg mb-1 hover:bg-blue-50 transition-colors"
                >
                  Update Profile
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconLock size={18} className="text-green-600" />}
                  onClick={openPasswordModal}
                  className="rounded-lg mb-1 hover:bg-green-50 transition-colors"
                >
                  Change Password
                </Menu.Item>

                <Menu.Item
                  leftSection={<IconSettings size={18} className="text-orange-600" />}
                  onClick={() => router.push("/dashboard/setting")}
                  className="rounded-lg mb-1 hover:bg-orange-50 transition-colors"
                >
                  Settings
                </Menu.Item>

                <div className="mx-2 my-1">
                  <Divider />
                </div>

                <Menu.Item
                  leftSection={<IconLogout size={18} className="text-red-600" />}
                  onClick={handleLogout}
                  className="rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logout
                </Menu.Item>
              </div>
            </Menu.Dropdown>
          </Menu>
        </div>
      </header>

      {/* Upcoming Academic Years Info Modal */}
      <Modal
        opened={semesterModalOpened}
        onClose={closeSemesterModal}
        title="Current Academic Years Information"
        size="lg"
        radius="lg"
        overlayProps={{ blur: 3 }}
      >
        <LoadingOverlay visible={academicYearsLoading} overlayProps={{ blur: 2 }} />

        <Stack gap="lg">
          {/* Welcome message based on role */}
          {user && (
            <Card withBorder className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <Group>
                <Avatar size="md" radius="xl" color={getRoleColor(user.role)}>
                  {user.role === 'student' ? 'S' : 
                   user.role === 'instructor' ? 'I' : 
                   user.role === 'department_head' ? 'D' : 'A'}
                </Avatar>
                <div>
                  <Text fw={600} size="md">
                    {user.full_name}
                  </Text>
                  <Text size="sm" c="dimmed">
                    Viewing Current academic years as {user.role}
                  </Text>
                </div>
              </Group>
            </Card>
          )}

          {/* Academic Year Selection Dropdown */}
          <Select
            label="Select Current Academic Year"
            placeholder="Choose an academic year to view details..."
            data={academicYearOptions}
            value={selectedAcademicYear}
            onChange={setSelectedAcademicYear}
            leftSection={<IconCalendarEvent size={18} />}
            searchable
            nothingFoundMessage="No Current academic years found"
            clearable
            disabled={upcomingAcademicYears.length === 0}
            description={upcomingAcademicYears.length === 0 
              ? "No Current academic years available" 
              : "Select an academic year to view detailed information"}
          />

          {/* Selected Academic Year Details */}
          {selectedAcademicYearDetails && (
            <Card withBorder shadow="sm" radius="md" className="mt-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <Group justify="space-between" mb="md">
                  <Text fw={700} size="lg" className="text-gray-800">
                    {selectedAcademicYearDetails.semester} - {selectedAcademicYearDetails.academic_year}
                  </Text>
                  <Badge color="yellow" variant="light" leftSection={<IconCalendarTime size={14} />}>
                    Current/Active
                  </Badge>
                </Group>

                <Table verticalSpacing="sm" className="mt-4">
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td className="font-semibold text-gray-600">
                        <Group gap="xs">
                          <IconBuilding size={16} />
                          Semester
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="blue" variant="light">
                          {selectedAcademicYearDetails.semester}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>

                    <Table.Tr>
                      <Table.Td className="font-semibold text-gray-600">
                        <Group gap="xs">
                          <IconSchool size={16} />
                          Academic Year
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="indigo" variant="light">
                          {selectedAcademicYearDetails.academic_year}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>

                    <Table.Tr>
                      <Table.Td className="font-semibold text-gray-600">
                        <Group gap="xs">
                          <IconSchool size={16} />
                          Batch
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color="teal" variant="light">
                          {getBatchYear(selectedAcademicYearDetails.batch_id)}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>

                    <Table.Tr>
                      <Table.Td className="font-semibold text-gray-600">
                        <Group gap="xs">
                          <IconCalendar size={16} />
                          Start Date
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={500}>
                          {formatDate(selectedAcademicYearDetails.start_date)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>

                    <Table.Tr>
                      <Table.Td className="font-semibold text-gray-600">
                        <Group gap="xs">
                          <IconCalendar size={16} />
                          End Date
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={500}>
                          {formatDate(selectedAcademicYearDetails.end_date)}
                        </Text>
                      </Table.Td>
                    </Table.Tr>

                    <Table.Tr>
                      <Table.Td className="font-semibold text-gray-600">
                        <Group gap="xs">
                          <IconList size={16} />
                          Status
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          color={
                            selectedAcademicYearDetails.status === 'active' ? 'green' :
                            selectedAcademicYearDetails.status === 'completed' ? 'blue' :
                            selectedAcademicYearDetails.status === 'upcoming' ? 'yellow' : 'gray'
                          } 
                          variant="light"
                        >
                          {selectedAcademicYearDetails.status.charAt(0).toUpperCase() + selectedAcademicYearDetails.status.slice(1)}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>

                <Divider my="md" />

                <Text size="sm" c="dimmed" className="mt-2">
                  <IconCalendarTime size={14} className="inline mr-1" />
                  This academic year is scheduled to start on {formatDate(selectedAcademicYearDetails.start_date)} and end on {formatDate(selectedAcademicYearDetails.end_date)}
                </Text>
              </div>
            </Card>
          )}

          {/* List of all upcoming academic years */}
          {!selectedAcademicYear && upcomingAcademicYears.length > 0 && (
            <Card withBorder shadow="sm" radius="md" className="mt-4">
              <Text fw={600} size="md" mb="sm">
                <IconList size={18} className="inline mr-2" />
                All Current Academic Years ({upcomingAcademicYears.length})
              </Text>
              
              <Table verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Semester</Table.Th>
                    <Table.Th>Academic Year</Table.Th>
                    <Table.Th>Batch</Table.Th>
                    <Table.Th>Start Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {upcomingAcademicYears.map(ay => (
                    <Table.Tr 
                      key={ay.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedAcademicYear(ay.id.toString())}
                    >
                      <Table.Td>
                        <Badge color="blue" variant="light">
                          {ay.semester}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{ay.academic_year}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{getBatchYear(ay.batch_id)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{formatDate(ay.start_date)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge 
                          size="sm"
                          color={
                            ay.status === 'active' ? 'green' :
                            ay.status === 'completed' ? 'blue' :
                            ay.status === 'upcoming' ? 'yellow' : 'gray'
                          }
                        >
                          {ay.status}
                        </Badge>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Card>
          )}

          {/* No upcoming academic years message */}
          {upcomingAcademicYears.length === 0 && (
            <Paper p="xl" className="text-center border-dashed border-2 border-gray-300">
              <IconCalendarEvent size={48} className="mx-auto text-gray-400 mb-4" />
              <Text fw={500} size="lg" c="dimmed" mb="xs">
                No Current Academic Years
              </Text>
              <Text size="sm" c="dimmed">
                There are no Current academic years scheduled at the moment.
              </Text>
              {user?.role === 'admin' && (
                <Button 
                  variant="subtle" 
                  className="mt-4"
                  onClick={() => {
                    router.push('/dashboard/admin/semester');
                    closeSemesterModal();
                  }}
                >
                  Go to Academic Year Management
                </Button>
              )}
            </Paper>
          )}

          {/* Action Buttons */}
          <Group justify="right" className="mt-6">
            <Button
              variant="outline"
              onClick={closeSemesterModal}
              leftSection={<IconX size={18} />}
            >
              Close
            </Button>
            {selectedAcademicYearDetails && user?.role === 'admin' && (
              <Button
                leftSection={<IconCalendar size={18} />}
                onClick={() => {
                  router.push('/dashboard/admin/semester');
                  closeSemesterModal();
                }}
              >
                Manage Academic Years
              </Button>
            )}
            {selectedAcademicYearDetails && user?.role === 'student' && (
              <Button
                leftSection={<IconBook size={18} />}
                onClick={() => {
                  router.push('/dashboard/student/courses');
                  closeSemesterModal();
                }}
              >
                View Courses
              </Button>
            )}
          </Group>
        </Stack>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        opened={profileModalOpened}
        onClose={closeProfileModal}
        title="Update Profile"
        size="lg"
        radius="lg"
        overlayProps={{ blur: 3 }}
      >
        <LoadingOverlay visible={saving} overlayProps={{ blur: 2 }} />

        <Stack gap="lg">
          {/* Profile Picture Section */}
          <Group justify="center">
            <div className="relative">
              <Avatar
                src={imagePreview}
                size={120}
                radius="xl"
                className="border-4 border-blue-100 shadow-lg"
              >
                <IconUser size={48} className="text-blue-400" />
              </Avatar>
              <FileInput
                accept="image/*"
                onChange={handleImageChange}
                className="absolute bottom-0 right-0"
                size="xs"
              >
                <Button
                  variant="filled"
                  color="blue"
                  size="sm"
                  radius="xl"
                  leftSection={<IconCamera size={16} />}
                >
                  Change
                </Button>
              </FileInput>
            </div>
          </Group>

          {/* Read-only Information */}
          <Paper p="md" className="bg-gray-50 border">
            <Group grow>
              <TextInput
                label="ID Number"
                value={user?.id_number || ""}
                leftSection={<IconId size={18} />}
                disabled
              />
              <TextInput
                label="Role"
                value={user?.role || ""}
                leftSection={<IconUser size={18} />}
                disabled
              />
            </Group>
            {user?.department_name && (
              <TextInput
                label="Department"
                value={user.department_name}
                leftSection={<IconSchool size={18} />}
                disabled
                className="mt-3"
              />
            )}
          </Paper>

          {/* Editable Information */}
          <TextInput
            label="Full Name"
            value={profileForm.full_name}
            onChange={(e) => handleProfileInputChange('full_name', e.target.value)}
            leftSection={<IconUser size={18} />}
            required
            placeholder="Enter your full name"
          />

          <TextInput
            label="Email Address"
            value={profileForm.email}
            onChange={(e) => handleProfileInputChange('email', e.target.value)}
            leftSection={<IconMail size={18} />}
            required
            type="email"
            placeholder="Enter your email address"
          />

          {/* Action Buttons */}
          <Group justify="right" className="mt-6">
            <Button
              variant="outline"
              onClick={closeProfileModal}
              leftSection={<IconX size={18} />}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              loading={saving}
              leftSection={<IconDeviceFloppy size={18} />}
              disabled={!profileForm.full_name || !profileForm.email}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        opened={passwordModalOpened}
        onClose={closePasswordModal}
        title="Change Password"
        size="md"
        radius="lg"
        overlayProps={{ blur: 3 }}
      >
        <LoadingOverlay visible={saving} overlayProps={{ blur: 2 }} />

        <Stack gap="md">
          <PasswordInput
            label="Current Password"
            value={passwordForm.currentPassword}
            onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
            leftSection={<IconLock size={18} />}
            required
            placeholder="Enter your current password"
          />

          <PasswordInput
            label="New Password"
            value={passwordForm.newPassword}
            onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
            leftSection={<IconLock size={18} />}
            required
            placeholder="Enter your new password"
            description="Password must be at least 6 characters long"
          />

          <PasswordInput
            label="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
            leftSection={<IconLock size={18} />}
            required
            placeholder="Confirm your new password"
          />

          <Group justify="right" className="mt-6">
            <Button variant="outline" onClick={closePasswordModal}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              loading={saving}
              disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            >
              Change Password
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}