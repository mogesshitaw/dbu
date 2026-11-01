/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  Grid,
  Card,
  Text,
  Title,
  Group,
  Stack,
  Badge,
  Button,
  Divider,
  ThemeIcon,
  Paper,
  Box,
  ScrollArea,
  Select,
  Textarea,
  Alert,
  Loader,
  Center,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  CalendarDaysIcon,
  BellAlertIcon,
  AcademicCapIcon,
  UserCircleIcon,
  BookmarkSquareIcon,
  MapPinIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchTodayforStudentSchedule, fetchAnnouncements } from "@/store/slices/dashboardSlice";
import { Found } from "@/app/auth/auth";

// Define props interface
interface DashboardSectionProps {
  setActiveSection: (section: string) => void;
}

interface SemesterRequest {
  id: number;
  status: "pending" | "approved" | "rejected";
  request_type: string;
  reason: string;
  review_remarks: string;
  requested_batch_name: string;
  requested_semester_name: string;
  created_at: string;
}

interface BatchOption { batch_id: number; batch_year: string }
interface SemesterOption { id: number; semester: string }

const rawApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API = rawApi.endsWith("/api") ? rawApi : `${rawApi}/api`;

const DashboardSection: React.FC<DashboardSectionProps> = ({ setActiveSection }) => {
  const dispatch = useAppDispatch();
  const [student, setStudent] = React.useState<any>(null);

  // Semester request state
  const [myRequest, setMyRequest] = React.useState<SemesterRequest | null>(null);
  const [batches, setBatches] = React.useState<BatchOption[]>([]);
  const [semesters, setSemesters] = React.useState<SemesterOption[]>([]);
  const [reqBatchId, setReqBatchId] = React.useState<string | null>(null);
  const [reqSemesterId, setReqSemesterId] = React.useState<string | null>(null);
  const [reqType, setReqType] = React.useState<string>("promotion");
  const [reqReason, setReqReason] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [loadingRequest, setLoadingRequest] = React.useState(false);

  const { todaySchedules, announcements } = useAppSelector(
    (state) => state.dashboard
  );

  const isSuspended = student?.status === "Suspended";

  React.useEffect(() => {
    const loadData = async () => {
      const userData = await Found();
      setStudent(userData);

      if (userData?.status === "Suspended") {
        // Load request info + available batches/semesters
        await fetchMyRequest();
        await fetchBatchesAndSemesters(userData.department_id);
      } else if (userData) {
        dispatch(fetchTodayforStudentSchedule({
          department_id: userData.department_id,
          batch_id: userData.batch_id,
          semester_id: userData.semester_id,
          section: userData.section
        }));
      } else {
        dispatch(fetchTodayforStudentSchedule());
      }
      dispatch(fetchAnnouncements());
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const fetchMyRequest = async () => {
    setLoadingRequest(true);
    try {
      const res = await fetch(`${API}/students/semester-request/mine`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setMyRequest(data.data);
    } catch (e) {
      console.error("fetchMyRequest error", e);
    } finally {
      setLoadingRequest(false);
    }
  };

  const fetchBatchesAndSemesters = async (departmentId: number) => {
    try {
      const [bRes, sRes] = await Promise.all([
        fetch(`${API}/batches?department_id=${departmentId}`, { credentials: "include" }),
        fetch(`${API}/semesters`, { credentials: "include" }),
      ]);
      const bData = await bRes.json();
      const sData = await sRes.json();
      if (bData.success || Array.isArray(bData)) setBatches(bData.data || bData);
      if (sData.success || Array.isArray(sData)) setSemesters(sData.data || sData);
    } catch (e) {
      console.error("fetchBatchesAndSemesters error", e);
    }
  };

  const handleSubmitRequest = async () => {
    if (!reqBatchId || !reqSemesterId) {
      notifications.show({ color: "red", title: "Validation", message: "Please select a requested batch and semester." });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/students/semester-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          requested_batch_id: Number(reqBatchId),
          requested_semester_id: Number(reqSemesterId),
          request_type: reqType,
          reason: reqReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notifications.show({ color: "green", title: "Request Submitted", message: "Your re-registration request has been sent to the department head." });
        await fetchMyRequest();
      } else {
        notifications.show({ color: "red", title: "Error", message: data.message });
      }
    } catch (e) {
      notifications.show({ color: "red", title: "Network Error", message: "Failed to submit request." });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Suspended View ────────────────────────────────────────────────────────
  if (isSuspended) {
    return (
      <Box p="md">
        <Stack gap="xl">
          {/* Warning Banner */}
          <Paper
            p="xl"
            radius="md"
            style={{
              background: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)",
              color: "white",
            }}
          >
            <Group align="center" gap="lg">
              <ThemeIcon color="red" variant="white" size={56} radius="xl">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </ThemeIcon>
              <Stack gap={4}>
                <Title order={2} c="white">Account Suspended — Semester Expired</Title>
                <Text c="red.2" size="md">
                  Your current academic semester has ended. Please submit a re-registration request to your department head to continue.
                </Text>
                {student?.reason && (
                  <Text c="red.1" size="sm" mt={4}>
                    Reason: {student.reason}
                  </Text>
                )}
              </Stack>
            </Group>
          </Paper>

          <Grid gutter="xl">
            {/* Request Form or Status */}
            <Grid.Col span={{ base: 12, md: 7 }}>
              <Card withBorder radius="md" p="xl" shadow="sm">
                <Group mb="lg" gap="sm">
                  <ThemeIcon color="orange" variant="light" size={40} radius="md">
                    <ArrowPathIcon className="h-5 w-5" />
                  </ThemeIcon>
                  <Title order={3} size="h4">Re-registration Request</Title>
                </Group>
                <Divider mb="lg" />

                {loadingRequest ? (
                  <Center py="xl"><Loader /></Center>
                ) : myRequest && myRequest.status === "pending" ? (
                  /* ── Welcome Page: Profile Updated, Awaiting Approval ── */
                  <Paper p="xl" radius="lg" withBorder className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 border-amber-200">
                    <Stack align="center" gap="md" ta="center">
                      <ThemeIcon color="orange" size={64} radius="xl" variant="light">
                        <ClockIcon className="h-10 w-10 text-orange-600" />
                      </ThemeIcon>
                      <Stack gap={4}>
                        <Title order={3} className="text-gray-900">
                          Welcome! Your Profile Has Been Updated 🎉
                        </Title>
                        <Text size="md" c="dimmed" maw={480}>
                          Your re-registration request has been submitted successfully. Please wait for your department head&apos;s approval.
                        </Text>
                      </Stack>

                      <Paper p="md" radius="md" withBorder className="bg-white/80 w-full text-left">
                        <Stack gap="xs">
                          <Group justify="space-between">
                            <Text size="xs" fw={700} c="dimmed">REQUEST STATUS</Text>
                            <Badge color="orange" variant="filled" size="sm">🟡 Pending Approval</Badge>
                          </Group>
                          <Divider />
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">Upcoming Batch:</Text>
                            <Badge color="blue" variant="light">{myRequest.requested_batch_name}</Badge>
                          </Group>
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">Upcoming Semester:</Text>
                            <Badge color="teal" variant="light">{myRequest.requested_semester_name}</Badge>
                          </Group>
                          <Group justify="space-between">
                            <Text size="sm" c="dimmed">Request Type:</Text>
                            <Badge color="grape" variant="dot">{myRequest.request_type}</Badge>
                          </Group>
                          {myRequest.reason && (
                            <Group justify="space-between">
                              <Text size="sm" c="dimmed">Your Note:</Text>
                              <Text size="xs">{myRequest.reason}</Text>
                            </Group>
                          )}
                          <Group justify="space-between">
                            <Text size="xs" c="dimmed">Submitted On:</Text>
                            <Text size="xs" c="dimmed">{new Date(myRequest.created_at).toLocaleDateString()}</Text>
                          </Group>
                        </Stack>
                      </Paper>

                      <Alert color="blue" variant="light" radius="md" className="w-full text-left" icon={<ClockIcon className="h-5 w-5" />}>
                        <Text size="xs">
                          Once the Department Head approves your profile update, your status will immediately change to <b>Active</b> and your courses and schedule for the upcoming semester will automatically be available.
                        </Text>
                      </Alert>

                      <Button
                        variant="light"
                        color="orange"
                        size="sm"
                        radius="md"
                        leftSection={<ArrowPathIcon className="h-4 w-4" />}
                        onClick={fetchMyRequest}
                      >
                        Check Approval Status
                      </Button>
                    </Stack>
                  </Paper>
                ) : myRequest && myRequest.status === "rejected" ? (
                  /* ── Previous request was rejected — allow resubmit ── */
                  <Stack gap="md">
                    <Alert
                      icon={<ExclamationTriangleIcon className="h-5 w-5" />}
                      color="red"
                      title="Previous Request Rejected"
                      radius="md"
                    >
                      <Text size="sm">
                        {myRequest.review_remarks || "Your request was rejected. Please submit a new request."}
                      </Text>
                    </Alert>
                    <ReRequestForm
                      batches={batches}
                      semesters={semesters}
                      reqBatchId={reqBatchId}
                      reqSemesterId={reqSemesterId}
                      reqType={reqType}
                      reqReason={reqReason}
                      submitting={submitting}
                      setReqBatchId={setReqBatchId}
                      setReqSemesterId={setReqSemesterId}
                      setReqType={setReqType}
                      setReqReason={setReqReason}
                      onSubmit={handleSubmitRequest}
                    />
                  </Stack>
                ) : (
                  /* ── No request yet — show form ── */
                  <ReRequestForm
                    batches={batches}
                    semesters={semesters}
                    reqBatchId={reqBatchId}
                    reqSemesterId={reqSemesterId}
                    reqType={reqType}
                    reqReason={reqReason}
                    submitting={submitting}
                    setReqBatchId={setReqBatchId}
                    setReqSemesterId={setReqSemesterId}
                    setReqType={setReqType}
                    setReqReason={setReqReason}
                    onSubmit={handleSubmitRequest}
                  />
                )}

                {myRequest && myRequest.status === "approved" && (
                  <Alert
                    icon={<CheckCircleIcon className="h-5 w-5" />}
                    color="green"
                    title="Request Approved!"
                    radius="md"
                    mt="md"
                  >
                    Your batch and semester have been updated. Please refresh the page or re-login to access your dashboard.
                  </Alert>
                )}
              </Card>
            </Grid.Col>

            {/* Info Card */}
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack gap="xl">
                <Card withBorder radius="md" p="xl" shadow="sm">
                  <Group mb="md" gap="sm">
                    <ThemeIcon color="blue" variant="light" size={40} radius="md">
                      <UserCircleIcon className="h-5 w-5" />
                    </ThemeIcon>
                    <Title order={4}>Your Information</Title>
                  </Group>
                  <Divider mb="md" />
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Name</Text>
                      <Text size="sm" fw={600}>{student?.full_name}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Department</Text>
                      <Text size="sm" fw={600}>{student?.department_name || "N/A"}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Current Batch</Text>
                      <Badge color="gray" variant="light">{student?.batch || "N/A"}</Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Current Semester</Text>
                      <Badge color="gray" variant="light">{student?.semester || "N/A"}</Badge>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Account Status</Text>
                      <Badge color="red" variant="filled">Suspended</Badge>
                    </Group>
                  </Stack>
                </Card>

                <Card withBorder radius="md" p="xl" shadow="sm" bg="orange.0">
                  <Stack gap="sm">
                    <Text fw={700} size="sm" c="orange.8">📋 What happens next?</Text>
                    <Text size="xs" c="dimmed">1. Submit your re-registration request below.</Text>
                    <Text size="xs" c="dimmed">2. The department head will review your request.</Text>
                    <Text size="xs" c="dimmed">3. Once approved, your batch & semester will be updated automatically.</Text>
                    <Text size="xs" c="dimmed">4. Your account will be reactivated and you can log in normally.</Text>
                  </Stack>
                </Card>
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Box>
    );
  }

  // ─── Normal Active Dashboard ────────────────────────────────────────────────
  const stats = [
    {
      label: "My Department",
      value: student?.department_name || "N/A",
      icon: AcademicCapIcon,
      color: "blue"
    },
    {
      label: "Batch & Semester",
      value: student?.is_student ? `${student.batch || ""} - ${student.semester || ""}`.trim() : "N/A",
      icon: BookmarkSquareIcon,
      color: "teal"
    },
    {
      label: "Section",
      value: student?.section || "N/A",
      icon: UserIcon,
      color: "indigo"
    },
  ];

  return (
    <Box p="md">
      <Stack gap="xl">
        {/* Welcome Section */}
        <Paper
          p="xl"
          radius="md"
          style={{
            background: "linear-gradient(135deg, var(--mantine-color-blue-filled) 0%, var(--mantine-color-indigo-filled) 100%)",
            color: "white",
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Stack gap={0}>
              <Title order={1} size="h2" mb={4}>
                Welcome back, {student?.full_name?.split(" ")[0] || "Student"}!
              </Title>
              <Text opacity={0.9} size="lg">
                Stay updated with your schedule, academic results, and announcements.
              </Text>
            </Stack>
            <Group gap="sm">
              <Button
                variant="white"
                color="blue"
                radius="md"
                leftSection={<AcademicCapIcon className="h-5 w-5 text-blue-700" />}
                onClick={() => setActiveSection("myResults")}
                style={{ fontWeight: 600 }}
              >
                View My Results
              </Button>
            </Group>
          </Group>
        </Paper>

        {/* Stats Grid */}
        <Grid>
          {stats.map((stat, index) => (
            <Grid.Col key={index} span={{ base: 12, sm: 4 }}>
              <Card withBorder radius="md" p="md" shadow="sm">
                <Group justify="space-between">
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                      {stat.label}
                    </Text>
                    <Text fw={700} size="lg">
                      {stat.value}
                    </Text>
                  </Stack>
                  <ThemeIcon
                    color={stat.color}
                    variant="light"
                    size={48}
                    radius="md"
                  >
                    <stat.icon className="h-6 w-6" />
                  </ThemeIcon>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        <Grid gutter="xl">
          {/* Today's Schedule */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Card withBorder radius="md" p="xl" shadow="sm" h="100%">
              <Group justify="space-between" mb="lg">
                <Title order={3} size="h4" className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
                  Today&apos;s Schedule
                </Title>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => setActiveSection("mySchedule")}
                >
                  View Full
                </Button>
              </Group>

              <Divider mb="xl" />

              <Stack gap="md">
                {todaySchedules && todaySchedules.length > 0 ? (
                  todaySchedules.map((item: any) => (
                    <Paper key={item.id} withBorder p="md" radius="sm" className="hover:bg-gray-50 transition-colors">
                      <Grid align="center" gutter="sm">
                        <Grid.Col span={4}>
                          <Stack gap={0}>
                            <Text size="sm" fw={700} c="blue">{item.start_time}</Text>
                            <Text size="xs" c="dimmed">{item.end_time}</Text>
                          </Stack>
                        </Grid.Col>
                        <Grid.Col span={8}>
                          <Stack gap={4}>
                            <Text fw={600} size="sm" lineClamp={1}>{item.course_name}</Text>
                            <Group gap="xs">
                              <Badge size="xs" variant="light" leftSection={<MapPinIcon className="h-3 w-3" />}>
                                {item.location}
                              </Badge>
                            </Group>
                          </Stack>
                        </Grid.Col>
                      </Grid>
                    </Paper>
                  ))
                ) : (
                  <Stack align="center" py="xl" gap="xs">
                    <CalendarDaysIcon className="h-12 w-12 text-gray-300" />
                    <Text c="dimmed" ta="center">
                      No classes scheduled for today.
                    </Text>
                  </Stack>
                )}
              </Stack>
            </Card>
          </Grid.Col>

          {/* Announcements & Quick Actions */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="xl">
              {/* Announcements Section */}
              <Card withBorder radius="md" p="xl" shadow="sm">
                <Group justify="space-between" mb="lg">
                  <Title order={3} size="h4" className="flex items-center gap-2">
                    <BellAlertIcon className="h-6 w-6 text-orange-500" />
                    Recent Announcements
                  </Title>
                </Group>

                <Divider mb="lg" />

                <ScrollArea h={200} offsetScrollbars>
                  <Stack gap="md">
                    {announcements && announcements.length > 0 ? (
                      announcements.slice(0, 5).map((ann: any) => (
                        <Box key={ann.id}>
                          <Stack gap={4}>
                            <Group justify="space-between" align="flex-start" wrap="nowrap">
                              <Text size="sm" fw={600} lineClamp={1}>{ann.title}</Text>
                              <Badge size="xs" color={ann.priority === "high" ? "red" : "blue"} variant="dot">
                                {ann.priority}
                              </Badge>
                            </Group>
                            <Text size="xs" c="dimmed" lineClamp={2}>{ann.content || ann.message}</Text>
                            <Text size="8px" c="dimmed" tt="uppercase">
                              {new Date(ann.created_at).toLocaleDateString()}
                            </Text>
                          </Stack>
                          <Divider variant="dotted" mt="sm" />
                        </Box>
                      ))
                    ) : (
                      <Text c="dimmed" ta="center" py="md">No new announcements.</Text>
                    )}
                  </Stack>
                </ScrollArea>

                <Button
                  fullWidth
                  variant="light"
                  mt="xl"
                  onClick={() => setActiveSection("announcements")}
                >
                  View All
                </Button>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Box>
  );
};

// ─── Re-Registration Form Sub-Component ─────────────────────────────────────
interface ReRequestFormProps {
  batches: BatchOption[];
  semesters: SemesterOption[];
  reqBatchId: string | null;
  reqSemesterId: string | null;
  reqType: string;
  reqReason: string;
  submitting: boolean;
  setReqBatchId: (v: string | null) => void;
  setReqSemesterId: (v: string | null) => void;
  setReqType: (v: string) => void;
  setReqReason: (v: string) => void;
  onSubmit: () => void;
}

const ReRequestForm: React.FC<ReRequestFormProps> = ({
  batches, semesters, reqBatchId, reqSemesterId, reqType, reqReason,
  submitting, setReqBatchId, setReqSemesterId, setReqType, setReqReason, onSubmit
}) => (
  <Stack gap="md">
    <Text size="sm" c="dimmed">
      Select your desired batch and semester, then submit the request to your department head.
    </Text>
    <Select
      label="Request Type"
      value={reqType}
      onChange={(v) => setReqType(v || "promotion")}
      data={[
        { value: "promotion", label: "Promotion (Next Semester/Year)" },
        { value: "repeat", label: "Repeat (Same Semester)" },
        { value: "readmission", label: "Readmission" },
      ]}
      required
    />
    <Select
      label="Requested Batch"
      placeholder="Select batch"
      value={reqBatchId}
      onChange={setReqBatchId}
      data={batches.map((b) => ({ value: String(b.batch_id), label: b.batch_year }))}
      searchable
      required
    />
    <Select
      label="Requested Semester"
      placeholder="Select semester"
      value={reqSemesterId}
      onChange={setReqSemesterId}
      data={semesters.map((s) => ({ value: String(s.id), label: s.semester }))}
      required
    />
    <Textarea
      label="Additional Remarks (optional)"
      placeholder="Add any notes for the department head..."
      value={reqReason}
      onChange={(e) => setReqReason(e.currentTarget.value)}
      minRows={3}
    />
    <Button
      fullWidth
      color="orange"
      radius="md"
      size="md"
      loading={submitting}
      onClick={onSubmit}
      leftSection={<ArrowPathIcon className="h-4 w-4" />}
    >
      Submit Re-registration Request
    </Button>
  </Stack>
);

export default DashboardSection;
