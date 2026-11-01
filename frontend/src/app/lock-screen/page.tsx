/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Title,
  Text,
  PasswordInput,
  Button,
  Stack,
  Center,
  Box,
  ThemeIcon
} from "@mantine/core";
import { IconShieldLock, IconHome } from "@tabler/icons-react";
import { Authentication, Found } from "../auth/auth";

export default function LockScreen() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);

    if (user === null ) { 
          return <Authentication />;
      }
        
  const handleUnlock = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/unlock`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        setError("Incorrect password. Try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      
        if (data.success) {
           // 7️⃣ Normal role-based redirect
          const redirectMap: Record<string, string> = {
            admin: "/dashboard/admin/dashbaord",
            department_head: "/dashboard/department/dashboard",
            instructor: "/dashboard/instructor/dashboard",
            Student: "/dashboard/student/dashboard",
          };

          router.push(redirectMap[user.role] || "/dashboard"); // redirect to dashboard
      } else {
        setError("Incorrect password. Try again.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20 p-4">
      <Card shadow="xl" radius="lg" p="xl" className="text-center max-w-md w-full" withBorder>
        <Box mb="md">
          <ThemeIcon size={100} color="red" variant="light" radius="xl">
            <IconShieldLock size={50} />
          </ThemeIcon>
        </Box>

        <Stack gap="md">
          <Title order={1}>Session Locked</Title>
          <Text c="dimmed" size="lg">
            Enter your password to unlock the session
          </Text>

          <PasswordInput
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            size="md"
            required
          />

          {error && <Text size="sm" c="red">{error}</Text>}

          <Button
            onClick={handleUnlock}
            loading={loading}
            size="md"
            fullWidth
          >
            Unlock
          </Button>

          <Button
            variant="light"
            color="gray"
            component="a"
            href="/"
            fullWidth
            leftSection={<IconHome size={18} />}
          >
            Back to Home
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}
