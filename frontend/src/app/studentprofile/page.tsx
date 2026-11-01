/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Container,
  Card,
  Title,
  Text,
  Stack,
  Button,
  Select,
  PasswordInput,
  Divider,
  Alert,
  ThemeIcon,
  Loader,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconUser,
  IconCheck,
  IconAlertCircle,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { selectUser, setUser } from "@/store/slices/authSlice";

// Import from studentSlice instead of scheduleSlice
import {
  fetchBatches,
  fetchSemesters,
  fetchDepartments,
  updateStudentFirstLogin,
} from "@/store/slices/studentSlice";

import {
  selectDepartments,
  selectBatches,
  selectSemesters,
} from "@/store/selectors/studentSelector";
import { Found } from "@/app/auth/auth";

const UpdateStudentFirstLoginProfilePage = () => {
  
  const router = useRouter();
  const dispatch = useAppDispatch();

  const user = useAppSelector(selectUser);
  const departments = useAppSelector(selectDepartments);
  const batches = useAppSelector(selectBatches);
  const semesters = useAppSelector(selectSemesters);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [passwordPolicy, setPasswordPolicy] = useState("Standard");
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  /* ----------------------------------
     Check session & redirect suspended students
  ---------------------------------- */
  useEffect(() => {
    const checkSession = async () => {
      const activeUser = user || (await Found());
      if (!activeUser) {
        router.push("/login");
        return;
      }
      if (!user && activeUser) {
        dispatch(setUser(activeUser));
      }
      if (activeUser.status === "Suspended") {
        router.push("/dashboard/student/dashboard");
      }
    };
    checkSession();
  }, []);

  /* ----------------------------------
     Form initialization
  ---------------------------------- */
  const form = useForm({
    initialValues: {
      batch_id: user?.batch_id?.toString() || user?.batch?.toString() || "",
      semester_id: user?.semester_id?.toString() || user?.current_semester?.toString() || "",
      department_id: user?.department_id?.toString() || "",
      section: user?.section || "",
      password: "",
      confirmPassword: "",
    },

    validate: {
      batch_id: (v) => (!v ? "Batch is required" : null),
      semester_id: (v) => (!v ? "Semester is required" : null),
      department_id: (v) => (!v ? "Department is required" : null),
      section: (v) => (!v ? "Section is required" : null),

      password: (value) => {
        if (!value) return null; // Password is optional
        if (passwordPolicy === 'Standard') {
          if (value.length < 6) return "Password must be at least 6 characters long";
          return null;
        }
        if (passwordPolicy === 'Strong') {
          if (value.length < 8) return "Password must be at least 8 characters long";
          if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
            return 'Password must contain uppercase, lowercase, and numbers';
          }
          return null;
        }
        return null;
      },

      confirmPassword: (value, values) => {
        if (!values.password) return null; // Skip if no password
        return value !== values.password ? "Passwords do not match" : null;
      },
    }
  });

  /* ----------------------------------
     Fetch required dropdown data
  ---------------------------------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(fetchDepartments()),
          dispatch(fetchBatches()),
          dispatch(fetchSemesters()),
        ]);
        setDataLoaded(true);
      } catch (error) {
        console.error("Failed to load dropdown data:", error);
        notifications.show({
          title: "Error",
          message: "Failed to load dropdown data",
          color: "red",
        });
      }
    };
    
    loadData();
  }, [dispatch]);

  /* ----------------------------------
     Fetch password policy
  ---------------------------------- */
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

  /* ----------------------------------
     Update form when user data loads (only once)
  ---------------------------------- */
  useEffect(() => {
    if (user && dataLoaded) {
      const currentBatch = user?.batch_id?.toString() || user?.batch?.toString() || "";
      const currentSem = user?.semester_id?.toString() || user?.current_semester?.toString() || "";
      const needsUpdate = 
        form.values.batch_id !== currentBatch ||
        form.values.semester_id !== currentSem ||
        form.values.department_id !== (user?.department_id?.toString() || "") ||
        form.values.section !== (user?.section || "");
      
      if (needsUpdate) {
        form.setValues({
          batch_id: currentBatch,
          semester_id: currentSem,
          department_id: user?.department_id?.toString() || "",
          section: user?.section || "",
          password: "",
          confirmPassword: "",
        });
      }
    }
  }, [user, dataLoaded]); // 'form' is stable, no need to include

  /* ----------------------------------
     Memoized dropdown options
  ---------------------------------- */
  const departmentOptions = useMemo(() => 
    departments
      .filter(dept => dept && dept.department_id && dept.department_name)
      .map(dept => ({
        value: dept.department_id.toString(),
        label: dept.department_name,
      })),
    [departments]
  );

  const batchOptions = useMemo(() => 
    batches
      .filter(batch => batch && batch.batch_id && batch.batch_year)
      .map(batch => ({
        value: batch.batch_id.toString(),
        label: batch.batch_year.toString(),
      })),
    [batches]
  );

  const semesterOptions = useMemo(() => 
    semesters
      .filter(sem => sem && sem.id && sem.semester)
      .map(sem => ({
        value: sem.id.toString(),
        label: sem.semester.toString(),
      })),
    [semesters]
  );

  const sectionOptions = useMemo(() => [
    { value: "", label: "Select Section" },
    ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
      .map(letter => ({
        value: letter,
        label: `Section ${letter}`,
      }))
  ], []);

  /* ----------------------------------
     Submit handler - Using Redux thunk
  ---------------------------------- */
  const handleSubmit = async (values: typeof form.values) => {
    if (!user) {
      router.push("/login");
      return;
    }

    // Validate passwords match if password is provided
    if (values.password && values.password !== values.confirmPassword) {
      form.setFieldError('confirmPassword', 'Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare the student data for Redux thunk
      const studentData = {
        newPassword: values.password || undefined, // Only send if provided
        department_id: Number(values.department_id),
        batch_id: Number(values.batch_id),
        semester_id: Number(values.semester_id),
        section: values.section,
      };

      // Dispatch the Redux thunk action
      const result = await dispatch(updateStudentFirstLogin({
        studentId: user.id,
        studentData
      }));

      if (updateStudentFirstLogin.fulfilled.match(result)) {
        // Update was successful
        notifications.show({
          title: "Profile Updated",
          message: "Student profile updated successfully",
          color: "green",
          icon: <IconCheck size={18} />,
        });

        if (user.status === 'Suspended') {
          router.push('/dashboard/student/dashboard');
          return;
        }

        // Get updated department name
        const department = departments.find(d => 
          d.department_id === Number(values.department_id)
        );
        
        // Get updated batch year
        const batch = batches.find(b => 
          b.batch_id === Number(values.batch_id)
        );
        
        // Get updated semester name
        const semester = semesters.find(s => 
          s.id === Number(values.semester_id)
        );

        // Update user in auth slice
        dispatch(
          setUser({
            ...user,
            batch: batch?.batch_year?.toString() || values.batch_id,
            current_semester: semester?.semester?.toString() || values.semester_id,
            department_id: values.department_id,
            department_name: department?.department_name || user.department_name,
            section: values.section,
          })
        );

        // Redirect after successful update
        setTimeout(() => {
          router.push("/dashboard/student/dashboard");
        }, 1500);
      } else if (updateStudentFirstLogin.rejected.match(result)) {
        // Update failed
        throw new Error(result.payload as string || "Update failed");
      }
    } catch (err: any) {
      console.error("Update error:", err);
      const errorMessage = err.message || err.response?.data?.message || "Update failed. Please try again.";
      setError(errorMessage);
      notifications.show({
        title: "Error",
        message: errorMessage,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading if user not loaded or data not ready
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="xl" />
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader size="xl" />
        <Text mt="md">Loading dropdown data...</Text>
      </div>
    );
  }

  /* ----------------------------------
     Render
  ---------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <Container size="sm">
        <Card shadow="xl" radius="xl" p="xl" withBorder>
          <Stack align="center" mb="md">
            <ThemeIcon size={56} radius="xl" color="blue">
              <IconUser size={28} />
            </ThemeIcon>
            <Title order={2}>Update Student Profile</Title>
            <Text size="sm" c="dimmed">
              Update your academic details and password
            </Text>
          </Stack>

          {error && (
            <Alert
              color="red"
              icon={<IconAlertCircle />}
              withCloseButton
              onClose={() => setError(null)}
              mb="md"
            >
              {error}
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack>
              {/* Department */}
              <Select
                label="Department"
                placeholder="Select department"
                data={departmentOptions}
                required
                {...form.getInputProps('department_id')}
                radius="md"
                size="md"
                searchable
                nothingFoundMessage="No departments found"
              />

              {/* Batch */}
              <Select
                label="Batch"
                placeholder="Select batch"
                data={batchOptions}
                required
                {...form.getInputProps('batch_id')}
                radius="md"
                size="md"
                searchable
                nothingFoundMessage="No batches found"
              />
              
              {/* Semester */}
              <Select
                label="Semester"
                placeholder="Select semester"
                data={semesterOptions}
                required
                {...form.getInputProps('semester_id')}
                radius="md"
                size="md"
                searchable
                nothingFoundMessage="No semesters found"
              />

              {/* Section */}
              <Select
                label="Section"
                placeholder="Select section"
                data={sectionOptions}
                required
                {...form.getInputProps('section')}
                radius="md"
                size="md"
                searchable
                nothingFoundMessage="No sections found"
              />

              <Divider label="Change Password (Optional)" my="sm" />

              <PasswordInput
                label="New Password"
                placeholder="Enter new password"
                visibilityToggleIcon={({ reveal }) =>
                  reveal ? <IconEyeOff size={16} /> : <IconEye size={16} />
                }
                {...form.getInputProps("password")}
                description={passwordPolicy === 'Strong' ? 
                  "Password must contain uppercase, lowercase, and numbers" : 
                  "Password must be at least 6 characters long"}
              />

              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm new password"
                visibilityToggleIcon={({ reveal }) =>
                  reveal ? <IconEyeOff size={16} /> : <IconEye size={16} />
                }
                {...form.getInputProps("confirmPassword")}
                disabled={!form.values.password}
              />

              <Button 
                type="submit" 
                size="lg" 
                loading={loading}
                fullWidth
                mt="md"
                color="blue"
              >
                {loading ? "Updating..." : "Update Profile"}
              </Button>
              
              <Button 
                variant="light"
                onClick={() => router.push("/dashboard/student/dashboard")}
                fullWidth
                color="gray"
              >
                Cancel
              </Button>
            </Stack>
          </form>
        </Card>
      </Container>
    </div>
  );
};

export default UpdateStudentFirstLoginProfilePage;