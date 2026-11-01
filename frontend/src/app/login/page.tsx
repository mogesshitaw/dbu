 "use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Card,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Alert,
  Stack,
  ThemeIcon,
  Progress,
  Modal,
  Anchor,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconLogin,
  IconCheck,
  IconAlertCircle,
  IconEye,
  IconEyeOff,
  IconLock,
  IconUser,
  IconClock,
  IconMail,
  IconKey,
  IconArrowRight,
  IconX,
} from "@tabler/icons-react";

// Redux Imports
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  loginUser,
  clearError,
  clearLoading,
  selectAuthLoading,
  selectAuthError,
  selectIsRateLimited,
  selectLoginAttempts,
  resetLoginAttempts,
} from "@/store/slices/authSlice";

// Component Imports
import Header from "@/compnent/header";

// --- Form Validation Schema ---
const validateLoginForm = {
  email: (value: string) => {
    if (!value) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(value)) return "Email address is invalid.";
    return null;
  },
  password: (value: string) => {
    if (!value) return "Password is required.";
    if (value.length < 5) return "Password must be at least 5 characters long.";
    return null;
  },
};
// API Configuration
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000" || "https://class-scheduled-backend1.onrender.com";

// --- Forgot Password Modal Component ---
const ForgotPasswordModal = ({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) => {
  const [loading, setLoading] = React.useState(false);

  const form = useForm({
    initialValues: { email: "" },
    validate: {
      email: (value) => {
        if (!value) return "Email is required.";
        if (!/^\S+@\S+$/.test(value)) return "Invalid email format.";
        if (!value.endsWith("@gmail.com") ) { // 
          return "Please use your university email address (@dbu.edu.et).";
        }
        return null;
      },
    },
  });

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const data = await res.json();

      if (res.ok) {
        notifications.show({
          title: "Success!",
          message: "Password reset link has been sent to your email",
          color: "green",
          icon: <IconCheck size={20} />,
        });
        onClose();
        form.reset();
      } else {
        notifications.show({
          title: "Error",
          message: data.error || "Failed to send reset link. Please try again.",
          color: "red",
          icon: <IconX size={20} />,
        });
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      notifications.show({
        title: "Connection Error",
        message: "Unable to connect to server. Please check your internet.",
        color: "red",
        icon: <IconX size={20} />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon color="blue" variant="light" radius="xl">
            <IconKey size={18} />
          </ThemeIcon>
          <Text fw={700} size="xl">
            Reset Your Password
          </Text>
        </Group>
      }
      centered
      radius="lg"
      size="md"
      closeOnClickOutside={!loading}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          <Text c="dimmed" size="sm">
            Enter your university email address (@dbu.edu.et) and we&apos;ll send
            you a password reset link.
          </Text>

          <TextInput
            label="University Email"
            placeholder="your.email@dbu.edu.et"
            leftSection={<IconMail size={20} className="text-blue-500" />}
            size="md"
            radius="lg"
            disabled={loading}
            {...form.getInputProps("email")}
          />

          <Group justify="space-between" mt="md">
            <Button variant="light" color="gray" onClick={onClose} radius="lg" disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              rightSection={!loading && <IconArrowRight size={18} />}
              radius="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </Group>

          <Alert color="blue" variant="light" radius="md">
            <Text size="xs">
              <strong>Note:</strong> The reset link will expire in 1 hour. Check your
              spam folder if you don&apos;t see the email.
            </Text>
          </Alert>
        </Stack>
      </form>
    </Modal>
  );
};

// --- Login Page Component ---
const LoginPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);
  const isRateLimited = useAppSelector(selectIsRateLimited);
  const loginAttempts = useAppSelector(selectLoginAttempts);

  const [redirectProgress, setRedirectProgress] = React.useState(0);
  const [localLoading, setLocalLoading] = React.useState(false);
  const [forgotPasswordOpened, setForgotPasswordOpened] = React.useState(false);

  const isLoading = localLoading || loading;

  const form = useForm({
    initialValues: { email: "", password: "" },
    validate: validateLoginForm,
  });
  const handleSubmit = async (values: typeof form.values) => {
    // 1️⃣ Check rate limiting
    if (isRateLimited) {
      notifications.show({
        title: "Too Many Attempts",
        message: "Please wait 1 minute before trying again.",
        color: "orange",
        icon: <IconClock size={20} />,
      });
      return;
    }

    setLocalLoading(true);

    try {
      // 2️⃣ Dispatch login action
      const result = await dispatch(loginUser(values));

      if (loginUser.fulfilled.match(result)) {
        const user = result.payload.user;

        // 3️⃣ Check if account is active
        if (user?.status !== "Active") {
          if (user?.status !== "Suspended") {
            notifications.show({
              title: "Account Not Active",
              message: "Your account has been deactivated. Contact administrator.",
              color: "orange",
              icon: <IconAlertCircle size={20} />,
              withBorder: true,
            });
            setLocalLoading(false);
            return;
          }
        }

        // 4️⃣ Show welcome notification
        notifications.show({
          title: "🎉 Welcome Back!",
          message: "Taking you to your dashboard...",
          color: "teal",
          icon: <IconCheck size={20} />,
          withBorder: true,
          radius: "md",
        });

        // 5️⃣ Redirect with progress bar
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          setRedirectProgress(progress);

          if (progress >= 100) {
            clearInterval(interval);
            setLocalLoading(false);

            // 6️⃣ Handle first login
            if (user.is_first_login) {
              const firstLoginPath = user.role === "Student" ? "/studentprofile" : "/change-password";
              router.push(firstLoginPath);
              return;
            }

            // 7️⃣ Normal role-based redirect
            const redirectMap: Record<string, string> = {
              admin: "/dashboard/admin/dashbaord",
              department_head: "/dashboard/department/dashboard",
              instructor: "/dashboard/instructor/dashboard",
              Student: "/dashboard/student/dashboard",
            };

            router.push(redirectMap[user.role] || "/dashboard");
          }
        }, 200);

      } else if (loginUser.rejected.match(result)) {
        // 8️⃣ Handle rejected login (invalid credentials)
        notifications.show({
          title: "Login Failed",
          // message: result.payload?.message || "Invalid email or password",
          message:"Invalid email or password",
          color: "red",
          icon: <IconX size={20} />,
        });
        setLocalLoading(false);
      }

    } catch (err) {
      console.error("Login error:", err);
      notifications.show({
        title: "Login Failed",
        message: "Unable to login. Please try again later.",
        color: "red",
        icon: <IconX size={20} />,
      });
      setLocalLoading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  React.useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        dispatch(clearLoading());
        setLocalLoading(false);
        notifications.show({
          title: "Request Timeout",
          message: "Login request took too long. Please try again.",
          color: "orange",
        });
      }, 30000);

      return () => clearTimeout(timeout);
    }
  }, [loading, dispatch]);

  React.useEffect(() => {
    if (loginAttempts >= 5) {
      const timeout = setTimeout(() => {
        dispatch(resetLoginAttempts());
      }, 60000);

      return () => clearTimeout(timeout);
    }
  }, [loginAttempts, dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-10 right-10 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-10 left-20 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      <div className="absolute bottom-20 right-20 w-60 h-60 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-6000"></div>

      <Header isActive="/login" />

      <Container size="xs" className="py-20 relative z-10">
        <Card shadow="xl" radius="lg" padding="lg" className="bg-white/90 backdrop-blur-lg border border-white/20 relative overflow-hidden">
          <Stack align="center" gap="xs" mb="lg">
            <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: "blue", to: "purple" }}>
              <IconLogin size={30} />
            </ThemeIcon>
            <Title order={2} className="text-2xl font-bold text-gray-800 text-center">
              Debre Berhan University
            </Title>
            <Text c="dimmed" size="sm">
              Login to your portal
            </Text>
          </Stack>

          {isRateLimited && (
            <Alert color="orange" title="Rate Limit" icon={<IconClock size={16} />} mb="sm" radius="md" variant="light">
              <Text size="xs">
                Wait 1 min. ({loginAttempts}/5 attempts)
              </Text>
            </Alert>
          )}

          {redirectProgress > 0 && redirectProgress < 100 && (
            <Progress value={redirectProgress} size="sm" color="teal" animated className="mb-4" radius="xl" />
          )}

          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} mb="sm" withCloseButton onClose={() => dispatch(clearError())} radius="md" variant="light">
              <Text size="xs" fw={500}>{error}</Text>
            </Alert>
          )}

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <TextInput
                label="Email"
                placeholder="your.email@dbu.edu.et"
                leftSection={<IconUser size={18} className="text-blue-500" />}
                size="md"
                radius="md"
                disabled={isLoading || isRateLimited}
                {...form.getInputProps("email")}
              />

              <PasswordInput
                label="Password"
                placeholder="Password"
                leftSection={<IconLock size={18} className="text-blue-500" />}
                size="md"
                radius="md"
                disabled={isLoading || isRateLimited}
                visibilityToggleIcon={({ reveal }) => (reveal ? <IconEyeOff size={16} /> : <IconEye size={16} />)}
                {...form.getInputProps("password")}
              />

              <Box ta="right">
                <Anchor component="button" type="button" c="blue" fw={500} size="xs" onClick={() => setForgotPasswordOpened(true)} disabled={isLoading}>
                  Forgot password?
                </Anchor>
              </Box>

              <Button
                type="submit"
                size="md"
                radius="md"
                fullWidth
                loading={isLoading}
                disabled={isLoading || isRateLimited}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                {isRateLimited ? "Locked" : isLoading ? "Logging in..." : "Login"}
              </Button>
            </Stack>
          </form>
        </Card>
      </Container>

      <ForgotPasswordModal opened={forgotPasswordOpened} onClose={() => setForgotPasswordOpened(false)} />

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px,0px) scale(1); }
          33% { transform: translate(30px,-50px) scale(1.1); }
          66% { transform: translate(-20px,20px) scale(0.9); }
          100% { transform: translate(0px,0px) scale(1); }
        }
        .animate-blob { animation: blob 8s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animation-delay-6000 { animation-delay: 6s; }
      `}</style>
    </div>
  );
};

export default LoginPage;
