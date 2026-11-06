/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Grid,
  Badge,
  ThemeIcon,
  Table,
  TextInput,
  Select,
  Loader,
  Alert,
  Progress,
  ActionIcon,
  Tooltip,
  Modal,
  Divider,
  Paper,
  Textarea,
  RingProgress,
  Avatar,
  SimpleGrid,
  Tabs,
} from "@mantine/core";
import {
  IconCheck,
  IconAlertCircle,
  IconDownload,
  IconPrinter,
  IconSearch,
  IconRefresh,
  IconAward,
  IconUsers,
  IconPercentage,
  IconChartBar,
  IconFilter,
  IconLock,
  IconLockOpen,
  IconArrowBackUp,
  IconEye,
  IconSchool,
  IconBook,
  IconClock,
  IconFileSpreadsheet,
  IconCircleCheck,
  IconCircleX,
  IconShieldCheck,
  IconBell,
  IconEdit,
  IconClipboardList,
} from "@tabler/icons-react";
import { Found } from "@/app/auth/auth";
import * as XLSX from "xlsx";
import { StudentEvaluationSection } from "../../instructor/components/StudentEvaluationSection";

// Ethiopian University Grading Scale
export const calculateGrade = (total: number) => {
  const score = Math.round(Number(total) * 100) / 100;
  if (score >= 90) return { grade: "A+", points: 4.0, status: "Excellent", color: "teal" };
  if (score >= 85) return { grade: "A", points: 4.0, status: "Excellent", color: "teal" };
  if (score >= 80) return { grade: "A-", points: 3.75, status: "Very Good", color: "green" };
  if (score >= 75) return { grade: "B+", points: 3.5, status: "Very Good", color: "lime" };
  if (score >= 70) return { grade: "B", points: 3.0, status: "Good", color: "blue" };
  if (score >= 65) return { grade: "B-", points: 2.75, status: "Good", color: "cyan" };
  if (score >= 60) return { grade: "C+", points: 2.5, status: "Satisfactory", color: "yellow" };
  if (score >= 50) return { grade: "C", points: 2.0, status: "Satisfactory", color: "orange" };
  if (score >= 45) return { grade: "C-", points: 1.75, status: "Unsatisfactory", color: "orange" };
  if (score >= 40) return { grade: "D", points: 1.0, status: "Very Poor", color: "red" };
  return { grade: "F", points: 0.0, status: "Fail", color: "red" };
};

interface SectionSummary {
  course_id: number;
  course_code: string;
  course_name: string;
  credit_hour: number;
  section: string;
  batch_id: number;
  batch_year: string;
  semester_id: number;
  semester_name: string;
  department_id: number;
  department_name: string;
  instructor_id: number | null;
  instructor_name: string | null;
  instructor_email: string | null;
  total_enrolled: number;
  evaluated_count: number;
  average_score: string | number | null;
  highest_score: string | number | null;
  lowest_score: string | number | null;
  passed_count: number;
  failed_count: number;
  pass_rate: string | number | null;
  overall_status: "not_started" | "draft" | "submitted" | "approved" | "locked" | "published";
  approved_at: string | null;
  approved_by_name: string | null;
  locked_at: string | null;
  locked_by_name: string | null;
  remarks: string | null;
  last_updated: string | null;
}

interface StudentEvaluationDetail {
  student_id: number;
  student_number: string;
  full_name: string;
  gender: string;
  department_name: string;
  batch_year: string;
  semester_name: string;
  academic_year_name: string;
  section: string;
  continuous_assessment: number;
  mid_exam: number;
  final_exam: number;
  total_score: number;
  letter_grade: string;
  grade_point: number;
  evaluation_status: string;
  feedback: string;
  evaluated_at?: string;
}

export default function DepartmentEvaluationPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("review");
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState({
    total_sections: 0,
    submitted: 0,
    approved: 0,
    locked: 0,
    draft: 0,
    published: 0,
    not_started: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterSemester, setFilterSemester] = useState<string>("ALL");
  const [filterBatch, setFilterBatch] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Notifications
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review Modal State
  const [selectedSection, setSelectedSection] = useState<SectionSummary | null>(null);
  const [modalOpened, setModalOpened] = useState<boolean>(false);
  const [students, setStudents] = useState<StudentEvaluationDetail[]>([]);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [actionRemarks, setActionRemarks] = useState<string>("");

  // Action Loading & Confirmation Modal
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{
    opened: boolean;
    type: "approved" | "locked" | "draft" | null;
    targetSection: SectionSummary | null;
  }>({
    opened: false,
    type: null,
    targetSection: null,
  });

  // 1. Load User Session
  useEffect(() => {
    const checkAuth = async () => {
      const user = await Found();
      setCurrentUser(user);
    };
    checkAuth();
  }, []);

  // 2. Fetch Department Sections
  const fetchSections = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const params = new URLSearchParams();
      if (currentUser?.department_id) {
        params.set("department_id", String(currentUser.department_id));
      }
      if (filterSemester !== "ALL") params.set("semester_id", filterSemester);
      if (filterBatch !== "ALL") params.set("batch_id", filterBatch);
      if (filterStatus !== "ALL") params.set("status", filterStatus);

      const res = await fetch(`${API_URL}/api/evaluations/department/sections?${params.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSections(data.sections || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        setErrorMessage(data.error || "Failed to load evaluation sections");
      }
    } catch (err) {
      console.error("fetchSections error:", err);
      setErrorMessage("Network error while connecting to server");
    } finally {
      setLoading(false);
    }
  }, [API_URL, currentUser?.department_id, filterSemester, filterBatch, filterStatus]);

  useEffect(() => {
    if (currentUser !== undefined) {
      fetchSections();
    }
  }, [currentUser, fetchSections]);

  // 3. Load Detail of Students for a Course & Section
  const handleOpenReview = async (sec: SectionSummary) => {
    setSelectedSection(sec);
    setActionRemarks(sec.remarks || "");
    setModalOpened(true);
    setLoadingDetail(true);
    try {
      const queryParams = new URLSearchParams({
        course_id: String(sec.course_id),
        section: sec.section,
      });
      if (sec.department_id) queryParams.set("department_id", String(sec.department_id));
      if (sec.batch_id) queryParams.set("batch_id", String(sec.batch_id));

      const res = await fetch(`${API_URL}/api/evaluations/course-students?${queryParams.toString()}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStudents(data.students || []);
      } else {
        setErrorMessage(data.error || "Failed to load detailed marks");
      }
    } catch (err) {
      console.error("handleOpenReview error:", err);
      setErrorMessage("Failed to load student evaluations");
    } finally {
      setLoadingDetail(false);
    }
  };

  // 4. Update Status (Approve, Lock, Revert to Draft)
  const handleUpdateStatus = async (
    targetSec: SectionSummary,
    newStatus: "approved" | "locked" | "draft",
    remarks?: string
  ) => {
    setActionLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_URL}/api/evaluations/department/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          course_id: targetSec.course_id,
          section: targetSec.section,
          status: newStatus,
          remarks: remarks || actionRemarks || null,
          head_id: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`✅ ${data.message}`);
        setConfirmModal({ opened: false, type: null, targetSection: null });

        // Update local section state
        setSections((prev) =>
          prev.map((s) => {
            if (s.course_id === targetSec.course_id && s.section === targetSec.section) {
              return {
                ...s,
                overall_status: newStatus,
                approved_at: newStatus === "approved" ? new Date().toISOString() : s.approved_at,
                approved_by_name: newStatus === "approved" ? currentUser?.full_name : s.approved_by_name,
                locked_at: newStatus === "locked" ? new Date().toISOString() : s.locked_at,
                locked_by_name: newStatus === "locked" ? currentUser?.full_name : s.locked_by_name,
                remarks: remarks || actionRemarks || s.remarks,
              };
            }
            return s;
          })
        );

        if (selectedSection && selectedSection.course_id === targetSec.course_id && selectedSection.section === targetSec.section) {
          setSelectedSection((prev) => (prev ? { ...prev, overall_status: newStatus, remarks: remarks || actionRemarks } : null));
          setStudents((prev) => prev.map((st) => ({ ...st, evaluation_status: newStatus })));
        }

        // Refresh stats
        fetchSections();
      } else {
        setErrorMessage(data.error || "Failed to update status");
      }
    } catch (err) {
      console.error("handleUpdateStatus error:", err);
      setErrorMessage("Network error while updating status");
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Excel Export
  const handleExportExcel = (sec: SectionSummary, studentList: StudentEvaluationDetail[]) => {
    try {
      const rows = studentList.map((s, idx) => ({
        "No.": idx + 1,
        "Student ID": s.student_number,
        "Full Name": s.full_name,
        Gender: s.gender,
        Department: s.department_name,
        Batch: s.batch_year,
        Semester: s.semester_name,
        Section: s.section,
        "Continuous Assessment (30%)": s.continuous_assessment,
        "Mid Exam (30%)": s.mid_exam,
        "Final Exam (40%)": s.final_exam,
        "Total Score (100)": s.total_score,
        "Letter Grade": s.letter_grade,
        "Grade Point": s.grade_point,
        Remarks: s.feedback || "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `Sec_${sec.section}_Marks`);

      const filename = `${sec.course_code}_Sec_${sec.section}_Evaluations_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error("Excel export error:", err);
      setErrorMessage("Failed to export Excel file");
    }
  };

  // Status Styling Helper
  const getStatusBadge = (status: SectionSummary["overall_status"]) => {
    switch (status) {
      case "submitted":
        return (
          <Badge color="yellow" variant="filled" size="md" leftSection={<IconClock size={14} />}>
            🟡 Submitted (Needs Review)
          </Badge>
        );
      case "approved":
        return (
          <Badge color="teal" variant="filled" size="md" leftSection={<IconShieldCheck size={14} />}>
            🟢 Approved
          </Badge>
        );
      case "locked":
        return (
          <Badge color="indigo" variant="filled" size="md" leftSection={<IconLock size={14} />}>
            🔒 Locked
          </Badge>
        );
      case "published":
        return (
          <Badge color="blue" variant="light" size="md" leftSection={<IconBell size={14} />}>
            📢 Published
          </Badge>
        );
      case "draft":
        return (
          <Badge color="gray" variant="light" size="md" leftSection={<IconClock size={14} />}>
            ⚪ Draft / In Progress
          </Badge>
        );
      default:
        return (
          <Badge color="dark" variant="subtle" size="md">
            ⚪ Not Started
          </Badge>
        );
    }
  };

  // Filtered List
  const filteredSections = useMemo(() => {
    return sections.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.course_code.toLowerCase().includes(q) ||
        s.course_name.toLowerCase().includes(q) ||
        s.section.toLowerCase().includes(q) ||
        (s.instructor_name && s.instructor_name.toLowerCase().includes(q));

      const matchSemester = filterSemester === "ALL" || String(s.semester_id) === filterSemester;
      const matchBatch = filterBatch === "ALL" || String(s.batch_id) === filterBatch;
      const matchStatus = filterStatus === "ALL" || s.overall_status === filterStatus;

      return matchSearch && matchSemester && matchBatch && matchStatus;
    });
  }, [sections, searchQuery, filterSemester, filterBatch, filterStatus]);

  // Unique Select Options
  const uniqueBatches = useMemo(() => {
    const map = new Map<number, string>();
    sections.forEach((s) => {
      if (s.batch_id && s.batch_year) map.set(s.batch_id, s.batch_year);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ value: String(id), label: name }));
  }, [sections]);

  const uniqueSemesters = useMemo(() => {
    const map = new Map<number, string>();
    sections.forEach((s) => {
      if (s.semester_id && s.semester_name) map.set(s.semester_id, s.semester_name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ value: String(id), label: name }));
  }, [sections]);

  // Grade Distribution Calculation for Modal
  const gradeDistribution = useMemo(() => {
    const grades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];
    const counts: Record<string, number> = {};
    grades.forEach((g) => (counts[g] = 0));
    students.forEach((s) => {
      if (s.letter_grade && counts[s.letter_grade] !== undefined) {
        counts[s.letter_grade]++;
      }
    });
    return grades.map((g) => ({ grade: g, count: counts[g] }));
  }, [students]);

  return (
    <div className="p-4 md:p-6 max-w-[1650px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 rounded-2xl text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <ThemeIcon size={42} radius="md" color="indigo" variant="filled" className="bg-white/20">
                <IconShieldCheck size={26} className="text-white" />
              </ThemeIcon>
              <div>
                <Title order={2} className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Student Evaluation &amp; Grade Approval Portal
                </Title>
                <Text size="sm" className="text-blue-100">
                  {currentUser?.department_name || "Department"} — Head Review &amp; Official Approval Workflow
                </Text>
              </div>
            </div>
          </div>

          <Group gap="xs">
            <Button
              variant="light"
              color="gray"
              size="sm"
              radius="md"
              leftSection={<IconRefresh size={16} />}
              onClick={fetchSections}
              loading={loading}
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              Refresh Sections
            </Button>
          </Group>
        </div>

        {/* Global Notifications */}
        {successMessage && (
          <Alert
            icon={<IconCheck size={18} />}
            title="Success"
            color="teal"
            radius="md"
            withCloseButton
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert
            icon={<IconAlertCircle size={18} />}
            title="Notice"
            color="red"
            radius="md"
            withCloseButton
            onClose={() => setErrorMessage(null)}
          >
            {errorMessage}
          </Alert>
        )}
      </div>

      {/* Main Tabs: Review & Approve vs Grade Students directly */}
      <Tabs value={activeTab} onChange={(val) => setActiveTab(val || "review")} radius="lg">
        <Tabs.List className="bg-white p-1 rounded-xl shadow-sm border border-gray-200">
          <Tabs.Tab
            value="review"
            leftSection={<IconClipboardList size={18} />}
            className="font-bold text-sm"
          >
            Review &amp; Manage Submissions
            {stats.submitted > 0 && (
              <Badge size="xs" color="yellow" variant="filled" className="ml-2">
                {stats.submitted} Pending
              </Badge>
            )}
          </Tabs.Tab>
          <Tabs.Tab
            value="grade"
            leftSection={<IconEdit size={18} />}
            className="font-bold text-sm"
          >
            Evaluate Department Students Directly
          </Tabs.Tab>
        </Tabs.List>

        {/* Tab 1: Review & Manage (existing portal) */}
        <Tabs.Panel value="review" pt="md" className="space-y-6">

      {/* Metric KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }} spacing="md">
        {/* Total Sections */}
        <Card withBorder radius="xl" padding="md" className="bg-white shadow-sm border-gray-200">
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Total Sections
              </Text>
              <Text size="xl" fw={800} className="text-gray-900 mt-1">
                {stats.total_sections}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                All assigned course batches
              </Text>
            </div>
            <ThemeIcon size={38} radius="lg" color="blue" variant="light">
              <IconBook size={20} />
            </ThemeIcon>
          </Group>
        </Card>

        {/* Submitted / Pending Review */}
        <Card
          withBorder
          radius="xl"
          padding="md"
          className="bg-amber-50/50 shadow-sm border-amber-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setFilterStatus("submitted")}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="xs" fw={700} color="yellow" tt="uppercase">
                Pending Approval
              </Text>
              <Text size="xl" fw={800} className="text-amber-700 mt-1">
                {stats.submitted}
              </Text>
              <Badge size="xs" color="yellow" variant="filled" mt={4}>
                Needs Review
              </Badge>
            </div>
            <ThemeIcon size={38} radius="lg" color="yellow" variant="filled">
              <IconClock size={20} />
            </ThemeIcon>
          </Group>
        </Card>

        {/* Approved */}
        <Card
          withBorder
          radius="xl"
          padding="md"
          className="bg-emerald-50/50 shadow-sm border-emerald-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setFilterStatus("approved")}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="xs" fw={700} color="teal" tt="uppercase">
                Approved
              </Text>
              <Text size="xl" fw={800} className="text-emerald-700 mt-1">
                {stats.approved}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Verified by Dept Head
              </Text>
            </div>
            <ThemeIcon size={38} radius="lg" color="teal" variant="light">
              <IconCircleCheck size={20} />
            </ThemeIcon>
          </Group>
        </Card>

        {/* Locked */}
        <Card
          withBorder
          radius="xl"
          padding="md"
          className="bg-indigo-50/50 shadow-sm border-indigo-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setFilterStatus("locked")}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="xs" fw={700} color="indigo" tt="uppercase">
                Locked &amp; Frozen
              </Text>
              <Text size="xl" fw={800} className="text-indigo-700 mt-1">
                {stats.locked}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Official final records
              </Text>
            </div>
            <ThemeIcon size={38} radius="lg" color="indigo" variant="light">
              <IconLock size={20} />
            </ThemeIcon>
          </Group>
        </Card>

        {/* In Progress / Draft */}
        <Card
          withBorder
          radius="xl"
          padding="md"
          className="bg-slate-50/50 shadow-sm border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setFilterStatus("draft")}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Instructor Draft
              </Text>
              <Text size="xl" fw={800} className="text-gray-700 mt-1">
                {stats.draft}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Grades being entered
              </Text>
            </div>
            <ThemeIcon size={38} radius="lg" color="gray" variant="light">
              <IconPercentage size={20} />
            </ThemeIcon>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Filters Bar */}
      <Card withBorder radius="xl" padding="md" className="bg-white shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          <Group gap="xs" className="w-full md:w-auto flex-1">
            <TextInput
              placeholder="Search course code, course name, section, instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              leftSection={<IconSearch size={16} />}
              size="sm"
              radius="md"
              className="flex-1 max-w-md"
            />

            <Select
              placeholder="Status"
              value={filterStatus}
              onChange={(val) => setFilterStatus(val || "ALL")}
              data={[
                { value: "ALL", label: "All Statuses" },
                { value: "submitted", label: "🟡 Submitted (Needs Review)" },
                { value: "approved", label: "🟢 Approved" },
                { value: "locked", label: "🔒 Locked" },
                { value: "draft", label: "⚪ Draft / In Progress" },
                { value: "published", label: "📢 Published" },
              ]}
              size="sm"
              radius="md"
              className="w-48"
            />

            {uniqueSemesters.length > 0 && (
              <Select
                placeholder="Semester"
                value={filterSemester}
                onChange={(val) => setFilterSemester(val || "ALL")}
                data={[{ value: "ALL", label: "All Semesters" }, ...uniqueSemesters]}
                size="sm"
                radius="md"
                className="w-36"
              />
            )}

            {uniqueBatches.length > 0 && (
              <Select
                placeholder="Batch / Year"
                value={filterBatch}
                onChange={(val) => setFilterBatch(val || "ALL")}
                data={[{ value: "ALL", label: "All Batches" }, ...uniqueBatches]}
                size="sm"
                radius="md"
                className="w-36"
              />
            )}
          </Group>

          <Text size="xs" c="dimmed" fw={600}>
            Showing {filteredSections.length} of {sections.length} course-sections
          </Text>
        </div>
      </Card>

      {/* Course Sections List / Table */}
      <Card withBorder radius="xl" padding="0" className="bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader size="lg" color="indigo" />
            <Text size="sm" c="dimmed">
              Loading department course sections and evaluation progress...
            </Text>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <IconSchool size={48} className="mx-auto mb-3 text-gray-400" />
            <Text fw={700} size="lg">
              No Course Sections Found
            </Text>
            <Text size="sm" c="dimmed">
              No sections match the selected filter criteria.
            </Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table striped highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
              <Table.Thead className="bg-gray-50 text-gray-700 text-xs uppercase font-bold border-b border-gray-200">
                <Table.Tr>
                  <Table.Th>Course</Table.Th>
                  <Table.Th>Section &amp; Batch</Table.Th>
                  <Table.Th>Assigned Instructor</Table.Th>
                  <Table.Th>Grading Progress</Table.Th>
                  <Table.Th>Class Performance</Table.Th>
                  <Table.Th>Approval Status</Table.Th>
                  <Table.Th style={{ textAlign: "right" }}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredSections.map((sec) => {
                  const evalProgress =
                    sec.total_enrolled > 0
                      ? Math.min(100, Math.round((sec.evaluated_count / sec.total_enrolled) * 100))
                      : sec.evaluated_count > 0
                      ? 100
                      : 0;

                  return (
                    <Table.Tr key={`${sec.course_id}-${sec.section}-${sec.batch_id}-${sec.semester_id}-${sec.department_id}`}>
                      {/* Course */}
                      <Table.Td>
                        <Group gap="sm">
                          <ThemeIcon size={34} radius="md" color="indigo" variant="light">
                            <IconBook size={18} />
                          </ThemeIcon>
                          <div>
                            <Group gap="xs">
                              <Text fw={700} size="sm" className="font-mono text-indigo-700">
                                {sec.course_code}
                              </Text>
                              <Badge size="xs" variant="outline" color="blue">
                                {sec.credit_hour} Cr. Hr
                              </Badge>
                            </Group>
                            <Text size="xs" fw={500} className="text-gray-900" lineClamp={1}>
                              {sec.course_name}
                            </Text>
                          </div>
                        </Group>
                      </Table.Td>

                      {/* Section & Batch */}
                      <Table.Td>
                        <Stack gap={3}>
                          <Group gap="xs">
                            <Badge size="sm" variant="filled" color="violet">
                              Sec. {sec.section}
                            </Badge>
                            <Badge size="xs" variant="light" color="cyan">
                              {sec.semester_name || "Semester"}
                            </Badge>
                          </Group>
                          <Text size="xs" c="dimmed">
                            {sec.batch_year || "Batch"}
                          </Text>
                        </Stack>
                      </Table.Td>

                      {/* Instructor */}
                      <Table.Td>
                        {sec.instructor_name ? (
                          <Group gap="xs">
                            <Avatar size={30} radius="xl" color="indigo">
                              {sec.instructor_name.charAt(0)}
                            </Avatar>
                            <div>
                              <Text size="xs" fw={600} className="text-gray-900">
                                {sec.instructor_name}
                              </Text>
                              <Text size="11px" c="dimmed">
                                {sec.instructor_email || "No email"}
                              </Text>
                            </div>
                          </Group>
                        ) : (
                          <Text size="xs" c="dimmed" fs="italic">
                            Unassigned
                          </Text>
                        )}
                      </Table.Td>

                      {/* Grading Progress */}
                      <Table.Td style={{ minWidth: "160px" }}>
                        <Stack gap={4}>
                          <Group justify="space-between">
                            <Text size="xs" fw={600} className="text-gray-700">
                              {sec.evaluated_count} / {sec.total_enrolled} Graded
                            </Text>
                            <Text size="xs" fw={700} color={evalProgress === 100 ? "teal" : "blue"}>
                              {evalProgress}%
                            </Text>
                          </Group>
                          <Progress
                            value={evalProgress}
                            size="sm"
                            radius="xl"
                            color={evalProgress === 100 ? "teal" : evalProgress > 0 ? "blue" : "gray"}
                          />
                        </Stack>
                      </Table.Td>

                      {/* Class Performance */}
                      <Table.Td>
                        {sec.evaluated_count > 0 ? (
                          <Stack gap={2}>
                            <Group gap="xs">
                              <Text size="xs" fw={700} className="text-gray-900">
                                Avg: {sec.average_score ?? "N/A"}
                              </Text>
                              <Badge
                                size="xs"
                                color={Number(sec.pass_rate || 0) >= 70 ? "teal" : "orange"}
                                variant="light"
                              >
                                {sec.pass_rate}% Pass
                              </Badge>
                            </Group>
                            <Text size="11px" c="dimmed">
                              High: {sec.highest_score} | Low: {sec.lowest_score}
                            </Text>
                          </Stack>
                        ) : (
                          <Text size="xs" c="dimmed">
                            No evaluations yet
                          </Text>
                        )}
                      </Table.Td>

                      {/* Approval Status */}
                      <Table.Td>
                        <Stack gap={2}>
                          {getStatusBadge(sec.overall_status)}
                          {sec.overall_status === "approved" && sec.approved_at && (
                            <Text size="10px" c="dimmed">
                              By {sec.approved_by_name || "Head"} • {new Date(sec.approved_at).toLocaleDateString()}
                            </Text>
                          )}
                          {sec.overall_status === "locked" && sec.locked_at && (
                            <Text size="10px" c="dimmed">
                              By {sec.locked_by_name || "Head"} • {new Date(sec.locked_at).toLocaleDateString()}
                            </Text>
                          )}
                          {sec.remarks && (
                            <Text size="10px" c="dimmed" fs="italic" lineClamp={1}>
                              Note: {sec.remarks}
                            </Text>
                          )}
                        </Stack>
                      </Table.Td>

                      {/* Actions */}
                      <Table.Td style={{ textAlign: "right" }}>
                        <Group gap="xs" justify="flex-end">
                          {/* Review Marks */}
                          <Button
                            size="xs"
                            radius="md"
                            variant="light"
                            color="indigo"
                            leftSection={<IconEye size={14} />}
                            onClick={() => handleOpenReview(sec)}
                          >
                            Review Marks
                          </Button>

                          {/* Quick Approve (If submitted) */}
                          {sec.overall_status === "submitted" && (
                            <Tooltip label="Approve Results">
                              <ActionIcon
                                size="sm"
                                color="teal"
                                variant="filled"
                                radius="md"
                                onClick={() =>
                                  setConfirmModal({
                                    opened: true,
                                    type: "approved",
                                    targetSection: sec,
                                  })
                                }
                              >
                                <IconCheck size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}

                          {/* Quick Lock (If approved) */}
                          {sec.overall_status === "approved" && (
                            <Tooltip label="Lock Results">
                              <ActionIcon
                                size="sm"
                                color="indigo"
                                variant="filled"
                                radius="md"
                                onClick={() =>
                                  setConfirmModal({
                                    opened: true,
                                    type: "locked",
                                    targetSection: sec,
                                  })
                                }
                              >
                                <IconLock size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}

                          {/* Revert / Send back for revision */}
                          {["submitted", "approved", "locked"].includes(sec.overall_status) && (
                            <Tooltip label="Send back to instructor for revision">
                              <ActionIcon
                                size="sm"
                                color="orange"
                                variant="light"
                                radius="md"
                                onClick={() =>
                                  setConfirmModal({
                                    opened: true,
                                    type: "draft",
                                    targetSection: sec,
                                  })
                                }
                              >
                                <IconArrowBackUp size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </div>
        )}
      </Card>

      {/* Detailed Evaluation Mark Sheet Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        size="95%"
        radius="xl"
        padding="lg"
        title={
          <Group gap="sm">
            <ThemeIcon color="indigo" size={32} radius="md">
              <IconAward size={20} />
            </ThemeIcon>
            <div>
              <Text fw={800} size="md" className="text-gray-900">
                {selectedSection?.course_code} — {selectedSection?.course_name} (Section {selectedSection?.section})
              </Text>
              <Text size="xs" c="dimmed">
                Instructor: {selectedSection?.instructor_name || "Unassigned"} • Batch: {selectedSection?.batch_year} • Semester: {selectedSection?.semester_name}
              </Text>
            </div>
          </Group>
        }
      >
        {selectedSection && (
          <Stack gap="lg">
            {/* Header Status & Class Analytics */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-4">
              <Group gap="md">
                <div>
                  <Text size="xs" fw={700} c="dimmed">
                    SECTION STATUS
                  </Text>
                  <div className="mt-1">{getStatusBadge(selectedSection.overall_status)}</div>
                </div>

                <Divider orientation="vertical" />

                <div>
                  <Text size="xs" fw={700} c="dimmed">
                    CLASS AVERAGE
                  </Text>
                  <Text size="lg" fw={800} className="text-indigo-700">
                    {selectedSection.average_score ?? "0.0"} / 100
                  </Text>
                </div>

                <Divider orientation="vertical" />

                <div>
                  <Text size="xs" fw={700} c="dimmed">
                    PASS RATE
                  </Text>
                  <Text size="lg" fw={800} color={Number(selectedSection.pass_rate || 0) >= 70 ? "teal" : "orange"}>
                    {selectedSection.pass_rate ?? 0}%
                  </Text>
                </div>

                <Divider orientation="vertical" />

                <div>
                  <Text size="xs" fw={700} c="dimmed">
                    STUDENTS EVALUATED
                  </Text>
                  <Text size="lg" fw={800} className="text-gray-900">
                    {students.length} Students
                  </Text>
                </div>
              </Group>

              {/* Export and Print Controls */}
              <Group gap="xs">
                <Button
                  size="sm"
                  radius="md"
                  variant="default"
                  leftSection={<IconFileSpreadsheet size={16} />}
                  onClick={() => handleExportExcel(selectedSection, students)}
                  disabled={students.length === 0}
                >
                  Export Excel (.xlsx)
                </Button>
                <Button
                  size="sm"
                  radius="md"
                  variant="default"
                  leftSection={<IconPrinter size={16} />}
                  onClick={() => window.print()}
                >
                  Print
                </Button>
              </Group>
            </div>

            {/* Ethiopian Standard Grade Distribution Chips */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={2}>
                Grade Distribution Summary:
              </Text>
              <Group gap="xs">
                {gradeDistribution.map((item) => (
                  <Badge
                    key={item.grade}
                    variant={item.count > 0 ? "filled" : "outline"}
                    color={
                      item.grade.startsWith("A")
                        ? "teal"
                        : item.grade.startsWith("B")
                        ? "blue"
                        : item.grade.startsWith("C")
                        ? "yellow"
                        : "red"
                    }
                    size="sm"
                  >
                    {item.grade}: {item.count}
                  </Badge>
                ))}
              </Group>
            </div>

            {/* Students Evaluation Marks Table */}
            {loadingDetail ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2">
                <Loader size="md" color="indigo" />
                <Text size="xs" c="dimmed">
                  Loading mark sheet...
                </Text>
              </div>
            ) : students.length === 0 ? (
              <Alert icon={<IconAlertCircle size={16} />} color="blue">
                No student mark records found for this section.
              </Alert>
            ) : (
              <div className="max-h-[50vh] overflow-y-auto border border-gray-200 rounded-xl">
                <Table striped highlightOnHover stickyHeader verticalSpacing="xs" horizontalSpacing="sm">
                  <Table.Thead className="bg-gray-100 text-gray-700 text-xs uppercase font-bold">
                    <Table.Tr>
                      <Table.Th>#</Table.Th>
                      <Table.Th>Student ID</Table.Th>
                      <Table.Th>Full Name</Table.Th>
                      <Table.Th>Gender</Table.Th>
                      <Table.Th>CA (30%)</Table.Th>
                      <Table.Th>Mid Exam (30%)</Table.Th>
                      <Table.Th>Final Exam (40%)</Table.Th>
                      <Table.Th>Total (100)</Table.Th>
                      <Table.Th>Grade</Table.Th>
                      <Table.Th>Points</Table.Th>
                      <Table.Th>Result</Table.Th>
                      <Table.Th>Remarks</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {students.map((st, idx) => {
                      const calc = calculateGrade(st.total_score);
                      const isPass = st.total_score >= 50;
                      return (
                        <Table.Tr key={st.student_id}>
                          <Table.Td className="text-gray-400 font-medium">{idx + 1}</Table.Td>
                          <Table.Td className="font-mono font-semibold text-blue-700 text-xs">
                            {st.student_number}
                          </Table.Td>
                          <Table.Td className="font-semibold text-xs text-gray-900">{st.full_name}</Table.Td>
                          <Table.Td>
                            <Badge size="xs" variant="light" color={st.gender === "Female" ? "pink" : "blue"}>
                              {st.gender}
                            </Badge>
                          </Table.Td>
                          <Table.Td className="font-semibold text-xs">
                            {Number(st.continuous_assessment).toFixed(1)}
                          </Table.Td>
                          <Table.Td className="font-semibold text-xs">{Number(st.mid_exam).toFixed(1)}</Table.Td>
                          <Table.Td className="font-semibold text-xs">{Number(st.final_exam).toFixed(1)}</Table.Td>
                          <Table.Td>
                            <Text fw={700} size="xs" color={isPass ? "teal" : "red"}>
                              {Number(st.total_score).toFixed(1)}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge size="sm" variant="filled" color={calc.color}>
                              {st.letter_grade || calc.grade}
                            </Badge>
                          </Table.Td>
                          <Table.Td className="font-mono text-xs">{Number(st.grade_point || calc.points).toFixed(2)}</Table.Td>
                          <Table.Td>
                            <Badge size="xs" variant="light" color={isPass ? "teal" : "red"}>
                              {isPass ? "PASS" : "FAIL"}
                            </Badge>
                          </Table.Td>
                          <Table.Td className="max-w-[200px]">
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {st.feedback || "—"}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </div>
            )}

            {/* Department Head Approval & Decision Panel */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                Department Head Approval Action:
              </Text>

              <Textarea
                placeholder="Add optional notes, endorsement remarks, or instructions for the instructor..."
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.currentTarget.value)}
                rows={2}
                radius="md"
                size="sm"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Text size="xs" c="dimmed">
                  Official decision will be recorded with timestamp and department head digital stamp.
                </Text>

                <Group gap="sm">
                  {/* Revert / Request Revision */}
                  <Button
                    color="orange"
                    variant="light"
                    size="sm"
                    radius="md"
                    leftSection={<IconArrowBackUp size={16} />}
                    onClick={() => handleUpdateStatus(selectedSection, "draft", actionRemarks)}
                    loading={actionLoading}
                  >
                    Send Back for Revision
                  </Button>

                  {/* Lock Marks */}
                  <Button
                    color="indigo"
                    size="sm"
                    radius="md"
                    leftSection={<IconLock size={16} />}
                    onClick={() => handleUpdateStatus(selectedSection, "locked", actionRemarks)}
                    loading={actionLoading}
                    disabled={selectedSection.overall_status === "locked"}
                  >
                    {selectedSection.overall_status === "locked" ? "Already Locked" : "Lock Results"}
                  </Button>

                  {/* Approve Marks */}
                  <Button
                    color="teal"
                    size="sm"
                    radius="md"
                    leftSection={<IconCheck size={16} />}
                    onClick={() => handleUpdateStatus(selectedSection, "approved", actionRemarks)}
                    loading={actionLoading}
                    disabled={selectedSection.overall_status === "approved" || selectedSection.overall_status === "locked"}
                  >
                    {selectedSection.overall_status === "approved" ? "Already Approved" : "Approve Results"}
                  </Button>
                </Group>
              </div>
            </div>
          </Stack>
        )}
      </Modal>

      {/* Confirmation Dialog for Direct Row Action */}
      <Modal
        opened={confirmModal.opened}
        onClose={() => setConfirmModal({ opened: false, type: null, targetSection: null })}
        title={
          <Group gap="xs">
            <ThemeIcon
              color={
                confirmModal.type === "approved"
                  ? "teal"
                  : confirmModal.type === "locked"
                  ? "indigo"
                  : "orange"
              }
              size={24}
              radius="xl"
            >
              {confirmModal.type === "approved" ? (
                <IconCheck size={14} />
              ) : confirmModal.type === "locked" ? (
                <IconLock size={14} />
              ) : (
                <IconArrowBackUp size={14} />
              )}
            </ThemeIcon>
            <Text fw={700}>
              {confirmModal.type === "approved"
                ? "Approve Student Results"
                : confirmModal.type === "locked"
                ? "Lock & Freeze Results"
                : "Revert to Draft for Revision"}
            </Text>
          </Group>
        }
        radius="lg"
        centered
      >
        <Stack gap="md">
          <Text size="sm" className="text-gray-700">
            {confirmModal.type === "approved" && (
              <>
                Are you sure you want to <strong>approve</strong> evaluation results for{" "}
                <strong>
                  {confirmModal.targetSection?.course_code} — Section {confirmModal.targetSection?.section}
                </strong>
                ? Approved marks will be verified for departmental records.
              </>
            )}
            {confirmModal.type === "locked" && (
              <>
                Are you sure you want to <strong>lock</strong> results for{" "}
                <strong>
                  {confirmModal.targetSection?.course_code} — Section {confirmModal.targetSection?.section}
                </strong>
                ? Once locked, instructor will not be able to edit grades without Head authorization.
              </>
            )}
            {confirmModal.type === "draft" && (
              <>
                Are you sure you want to send evaluations for{" "}
                <strong>
                  {confirmModal.targetSection?.course_code} — Section {confirmModal.targetSection?.section}
                </strong>{" "}
                back to the instructor for revision? This will unlock the mark sheet for editing.
              </>
            )}
          </Text>

          <Textarea
            placeholder="Optional remarks / note..."
            value={actionRemarks}
            onChange={(e) => setActionRemarks(e.currentTarget.value)}
            rows={2}
            size="sm"
            radius="md"
          />

          <Group justify="flex-end" mt="sm">
            <Button
              variant="default"
              onClick={() => setConfirmModal({ opened: false, type: null, targetSection: null })}
            >
              Cancel
            </Button>
            <Button
              color={
                confirmModal.type === "approved"
                  ? "teal"
                  : confirmModal.type === "locked"
                  ? "indigo"
                  : "orange"
              }
              loading={actionLoading}
              onClick={() => {
                if (confirmModal.targetSection && confirmModal.type) {
                  handleUpdateStatus(confirmModal.targetSection, confirmModal.type, actionRemarks);
                }
              }}
            >
              Confirm
            </Button>
          </Group>
        </Stack>
      </Modal>
        </Tabs.Panel>

        {/* Tab 2: Evaluate Department Students Directly */}
        <Tabs.Panel value="grade" pt="md">
          <StudentEvaluationSection isDeptHead={true} />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
