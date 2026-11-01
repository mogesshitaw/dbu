/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Container,
  Card,
  Title,
  Text,
  PasswordInput,
  Button,
  Alert,
  Stack,
  ThemeIcon,
  Loader,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import {
  IconCheck,
  IconX,
  IconLock,
  IconShieldCheck,
  IconAlertCircle,
} from '@tabler/icons-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const form = useForm({
    initialValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      newPassword: (value) => {
        if (!value) return 'New password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain uppercase, lowercase, and numbers';
        }
        return null;
      },
      confirmPassword: (value, values) => {
        if (value !== values.newPassword) return 'Passwords do not match';
        return null;
      },
    },
  });

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        // Fixed: Remove duplicate /api in the URL
        const response = await fetch(`${API_URL}/auth/verify-reset-token/${token}`);
        const data = await response.json();
        
        if (data.valid) {
          setValidToken(true);
          setUserEmail(data.email || '');
        } else {
          notifications.show({
            title: 'Invalid Link',
            message: data.error || 'This password reset link is invalid or has expired.',
            color: 'red',
            icon: <IconX size={20} />,
          });
        }
      } catch (error) {
        notifications.show({
          title: 'Connection Error',
          message: 'Unable to verify reset link. Please try again.',
          color: 'red',
          icon: <IconX size={20} />,
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (values: typeof form.values) => {
    if (!token || !validToken) return;

    setLoading(true);

    try {
      // Fixed: Remove duplicate /api in the URL
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        notifications.show({
          title: 'Success!',
          message: data.message || 'Password reset successfully!',
          color: 'green',
          icon: <IconCheck size={20} />,
        });

        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        notifications.show({
          title: 'Error',
          message: data.error || 'Failed to reset password',
          color: 'red',
          icon: <IconX size={20} />,
        });
      }
    } catch (error) {
      notifications.show({
        title: 'Connection Error',
        message: 'Unable to reset password. Please try again.',
        color: 'red',
        icon: <IconX size={20} />,
      });
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Container size="xs">
          <Card shadow="md" radius="lg" className="text-center">
            <Loader size="xl" className="mb-4" />
            <Title order={3} className="mb-2">
              Verifying Reset Link
            </Title>
            <Text c="dimmed">
              Please wait while we verify your password reset link...
            </Text>
          </Card>
        </Container>
      </div>
    );
  }

  if (!token || !validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Container size="sm">
          <Card shadow="md" radius="lg">
            <Alert
              color="red"
              title="Invalid Reset Link"
              icon={<IconAlertCircle size={24} />}
              className="mb-4"
            >
              <Text>
                This password reset link is invalid or has expired. Please request a new reset link from the login page.
              </Text>
            </Alert>
            <Button
              fullWidth
              onClick={() => router.push('/login')}
              size="lg"
            >
              Go to Login Page
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Container size="sm">
        <Card
          shadow="xl"
          radius="xl"
          padding="xl"
          className="bg-white/90 backdrop-blur-lg border border-white/20"
        >
          <Stack align="center" gap="lg" mb="xl">
            <ThemeIcon
              size={80}
              radius="xl"
              variant="gradient"
              gradient={{ from: 'blue', to: 'green' }}
            >
              <IconShieldCheck size={40} />
            </ThemeIcon>
            
            <Stack gap="xs" align="center">
              <Title order={2} className="text-center">
                Set New Password
              </Title>
              <Text c="dimmed" ta="center">
                {userEmail && `Reset password for: ${userEmail}`}
              </Text>
              <Text size="sm" c="blue" ta="center">
                Create a strong password to secure your account
              </Text>
            </Stack>
          </Stack>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <PasswordInput
                label="New Password"
                placeholder="Enter new password"
                leftSection={<IconLock size={20} />}
                size="lg"
                radius="lg"
                disabled={loading}
                description="Minimum 8 characters with uppercase, lowercase, and numbers"
                {...form.getInputProps('newPassword')}
              />

              <PasswordInput
                label="Confirm New Password"
                placeholder="Confirm your new password"
                leftSection={<IconLock size={20} />}
                size="lg"
                radius="lg"
                disabled={loading}
                {...form.getInputProps('confirmPassword')}
              />

              <Group justify="space-between" mt="md">
                <Button
                  variant="light"
                  color="gray"
                  onClick={() => router.push('/login')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  size="lg"
                  radius="lg"
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  Reset Password
                </Button>
              </Group>

              <Alert color="blue" variant="light" mt="md">
                <Text size="sm">
                  <strong>Security Tips:</strong>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Use a unique password not used elsewhere</li>
                    <li>Include uppercase, lowercase, numbers, and symbols</li>
                    <li>Consider using a password manager</li>
                  </ul>
                </Text>
              </Alert>
            </Stack>
          </form>
        </Card>
      </Container>
    </div>
  );
}