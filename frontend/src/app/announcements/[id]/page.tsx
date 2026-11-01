/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { use } from "react";
import { useEffect, useState } from "react";
import {
  Container,
  Card,
  Title,
  Text,
  Badge,
  Group,
  Loader,
  Alert,
  Divider,
} from "@mantine/core";
import { IconAlertCircle, IconCalendar } from "@tabler/icons-react";

interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: string;
  publish_at: string;
  expires_at: string;
  author_name: string;
  department_name: string;
}

export default function AnnouncementDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ unwrap params Promise
  const { id } = use(params);

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnnouncement();
  }, []);

    const fetchAnnouncement = async () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    try {
      const res = await fetch(
        `${API_URL}/api/announcements/${id}`,
        { credentials: "include" }
      );

      if (!res.ok) throw new Error("Announcement not found");

      const data = await res.json();
      setAnnouncement(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <Container py="xl" style={{ textAlign: "center" }}>
        <Loader />
      </Container>
    );

  if (error)
    return (
      <Container py="xl">
        <Alert icon={<IconAlertCircle />} color="red">
          {error}
        </Alert>
      </Container>
    );

  if (!announcement) return null;

  return (
    <Container size="md" py="xl">
      <Card shadow="md" radius="lg" p="xl">
        <Group justify="space-between" mb="sm">
          <Badge>{announcement.department_name}</Badge>
          <Badge color="red">{announcement.priority}</Badge>
        </Group>

        <Title order={2}>{announcement.title}</Title>
        <Text size="sm" c="dimmed" mb="md">
          By {announcement.author_name}
        </Text>

        <Divider my="md" />

        <Text style={{ whiteSpace: "pre-line" }}>
          {announcement.content}
        </Text>

        <Divider my="md" />

        <Group gap="xs">
          <IconCalendar size={16} />
          <Text size="sm">
            {new Date(announcement.publish_at).toLocaleDateString()}
          </Text>
        </Group>
      </Card>
    </Container>
  );
}
