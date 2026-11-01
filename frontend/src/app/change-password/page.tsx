/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Container,
    Card,
    Title,
    Text,
    PasswordInput,
    Button,
    Stack,
    ThemeIcon,
    Alert,
    Divider,
    Group,
    
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
    IconLock,
    IconCheck,
    IconAlertCircle,
    IconShield,
    IconEye,
    IconEyeOff,
} from "@tabler/icons-react";
import axios from "axios";
import { useAppSelector, useAppDispatch } from "@/hooks/redux"; // Adjust path if needed
import { selectUser, setUser } from "@/store/slices/authSlice"; // Adjust path if needed
const API_URL =process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ChangePasswordPage = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const user = useAppSelector(selectUser);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
      const [passwordPolicy, setPasswordPolicy] = useState("Standard");
    
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
  }, []);

    const form = useForm({
        initialValues: {
            password: "",
            confirmPassword: "",
        },
        validate: {
            password: (value) => {
                if (passwordPolicy == 'Standard') {
                if (!value) return "Password is required";
                if (value.length < 6) return "Password must be at least 6 characters long";
                      return null;
                }
                if (passwordPolicy == 'Strong') { 
                     if (!value) return "Password is required";
                if (value.length < 8) return "Password must be at least 8 characters long";
                 if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                        return 'Password must contain uppercase, lowercase, and numbers';
                    }
                      return null;
                }
               
              
            },
            confirmPassword: (value, values) => {
                if (value !== values.password) return "Passwords do not match";
                return null;
            },
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        if (!user) {
            notifications.show({
                title: "Error",
                message: "User not found. Please log in again.",
                color: "red",
            });
            router.push("/login");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const response = await axios.post(
                `${API_URL}/api/auth/change-password`,
                {
                    userId: user.id,
                    newPassword: values.password,
                },
                { withCredentials: true }
            );

            if (response.data.success) {
                notifications.show({
                    title: "Success!",
                    message: "Password changed successfully. Redirecting...",
                    color: "green",
                    icon: <IconCheck size={20} />,
                });

                // Update user state to reflect is_first_login = false
                dispatch(setUser({ ...user, is_first_login: false }));

                setTimeout(() => {
                    let redirectPath = "/dashboard";
                    console.log("Debug: User object:", user);
                    if (user) {
                        console.log("Debug: User role:", user.role);
                        switch (user.role) {
                            case "admin":
                                redirectPath = "/dashboard/admin/dashbaord"; // Note: typo in folder name
                                break;
                            case "department_head":
                                redirectPath = "/dashboard/department/dashboard";
                                break;
                            case "instructor":
                                redirectPath = "/dashboard/instructor/dashboard";
                                break;
                            case "student":
                                redirectPath = "/dashboard/student/dashboard";
                                break;
                            default:
                                redirectPath = "/dashboard";
                        }
                    } else {
                        console.log("Debug: User object is null or undefined");
                    }
                    console.log("Debug: Redirecting to:", redirectPath);
                    router.push(redirectPath);
                }, 1500);
            }
        } catch (err: any) {
            console.error("Change password error:", err);
            setError(err.response?.data?.message || "Failed to change password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden flex items-center justify-center">
            {/* Background Blobs */}
            <div className="absolute top-10 left-10 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>

            <Container size="xs" className="relative z-10 w-full">
                <Card
                    shadow="xl"
                    radius="xl"
                    padding="xl"
                    className="bg-white/90 backdrop-blur-lg border border-white/20"
                >
                    <Stack align="center" gap="md" mb="xl">
                        <ThemeIcon
                            size={60}
                            radius="xl"
                            variant="gradient"
                            gradient={{ from: "blue", to: "cyan" }}
                        >
                            <IconLock size={30} />
                        </ThemeIcon>
                        <Title order={2} ta="center">
                            Change Password
                        </Title>
                        <Text c="dimmed" ta="center" size="sm">
                            For your security, please update your password before continuing.
                        </Text>
                    </Stack>

                    {error && (
                        <Alert
                            color="red"
                            title="Error"
                            icon={<IconAlertCircle size={20} />}
                            mb="md"
                            radius="md"
                            withCloseButton
                            onClose={() => setError(null)}
                        >
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="md">
                            <PasswordInput
                                label="New Password"
                                placeholder="Enter new password"
                                leftSection={<IconLock size={18} className="text-gray-500" />}
                                radius="md"
                                size="md"
                                visibilityToggleIcon={({ reveal }) =>
                                    reveal ? <IconEyeOff size={18} /> : <IconEye size={18} />
                                }
                                {...form.getInputProps("password")}
                            />

                            <PasswordInput
                                label="Confirm Password"
                                placeholder="Confirm new password"
                                leftSection={<IconCheck size={18} className="text-gray-500" />}
                                radius="md"
                                size="md"
                                visibilityToggleIcon={({ reveal }) =>
                                    reveal ? <IconEyeOff size={18} /> : <IconEye size={18} />
                                }
                                {...form.getInputProps("confirmPassword")}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                radius="md"
                                loading={loading}
                                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 mt-4"
                            >
                                Update Password
                            </Button>
                        </Stack>
                    </form>

                    <Divider my="xl" label="Secure Action" labelPosition="center" />

                    <Group justify="center" gap="xs">
                        <IconShield size={16} className="text-green-600" />
                        <Text size="xs" c="dimmed">
                            Your password is encrypted and secure.
                        </Text>
                    </Group>
                </Card>
            </Container>
        </div>
    );
};

export default ChangePasswordPage;
