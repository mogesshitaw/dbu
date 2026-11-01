/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  Title,
  Text,
  Button,
  ThemeIcon,
  Center,
  Stack,
  Box
} from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { IconShieldLock, IconLogin, IconHome } from '@tabler/icons-react';

  const API_URL = process.env.NEXT_PUBLIC_API_URL  || "http://localhost:5000";

export const UnauthorizedAccess = () => {
  return (
    <Center className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20 p-4">
      <Card 
        shadow="xl" 
        radius="lg" 
        p="xl" 
        className="text-center max-w-md w-full"
        withBorder
      >
        <Box mb="md">
          <ThemeIcon 
            size={100} 
            color="red" 
            variant="light" 
            radius="xl"
            className="mx-auto"
          >
            <IconShieldLock size={50} />
          </ThemeIcon>
        </Box>
        
        <Stack gap="md">
          <Title order={1} className="text-gray-900">
            Access Restricted
          </Title>
          
          <Text c="dimmed" size="lg">
            This page requires special permissions. Please authenticate to proceed.
          </Text>
          
          <Box className="bg-blue-50 p-4 rounded-lg mt-4">
            <Text size="sm" c="blue" component="div">
              <span className="font-medium">You may need to:</span>
              <ul className="text-left mt-2 space-y-1 pl-5 list-disc">
                <li>Log in with your account</li>
                <li>Request access from an administrator</li>
                <li>Use a different account with permissions</li>
              </ul>
            </Text>
          </Box>
          
          <Stack gap="sm" mt="xl">
            <Button 
              leftSection={<IconLogin size={20} />}
              component="a" 
              href="/login"
              size="lg"
              fullWidth
              color="blue"
            >
              Sign In
            </Button>
            
            <Button 
              leftSection={<IconHome size={20} />}
              component="a" 
              href="/"
              variant="light"
              size="md"
              fullWidth
            >
              Back to Home
            </Button>
            
            <Button 
              variant="subtle" 
              size="sm"
              component="a"
              href="/contact-support"
            >
              Need Help? Contact Support
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Center>
  );
};

export const Authentication = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserSession = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.loggedIn) {
          setCurrentUser(data.user);
        }
      }
    } catch (error) {
      console.error("Failed to fetch user session:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserSession();
  }, [fetchUserSession]);

  if (loading) {
    return (
      <Center className="min-h-screen">
        <Text>Loading authentication...</Text>
      </Center>
    );
  }

  if (!currentUser) {
    return (
      <Center className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
        <Card shadow="lg" radius="lg" p="xl" className="text-center">
          <ThemeIcon size={80} color="blue" variant="light" radius="xl" mb="md">
            <IconUser size={40} />
          </ThemeIcon>
          <Title order={2} mb="sm">Authentication Required</Title>
          <Text c="dimmed" mb="lg">Please log in to continue</Text>
          <Button component="a" href="/login" size="lg">
            Go to Login
          </Button>
        </Card>
      </Center>
    );
  }

  return null; // nothing is shown when logged in
};

// ✅ Exported helper function to check authentication (for other files)
export async function Found() {
  const res = await fetch(`${API_URL}/api/auth/profile`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
 console.log('data', data)
  if (!data.loggedIn) return null;
  if (data.locked) return {
    locked: true,
    role: data.user.role,
    sessionTime: data.user.sessionTime,
    enable_session_timeout: data.user.enable_session_timeout,
  };
  
  return data.user;
}