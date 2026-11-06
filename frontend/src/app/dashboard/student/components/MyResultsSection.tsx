/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Grid,
  ThemeIcon,
  Loader,
  Alert,
  Progress,
  Title,
  Divider,
  ActionIcon,
  Tooltip,
  Modal,
  Button,
  Select,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconAward,
  IconChartBar,
  IconBook,
  IconRefresh,
  IconCalendar,
  IconUser,
  IconInfoCircle,
  IconCheck,
  IconX,
  IconSchool,
  IconTrophy,
  IconMoodSmile,
  IconMoodSad,
  IconEye,
  IconFilter,
  IconHistory,
} from "@tabler/icons-react";
import { Found } from "@/app/auth/auth";

interface ResultItem {
  id: number;
  course_id: number;
  course_code: string;
  course_name: string;
  credit_hour: number;
  section: string;
  department_name: string;
  batch_year: string;
  semester_name: string;
  academic_year_name?: string;
  instructor_name: string;
  continuous_assessment: number;
  mid_exam: number;
  final_exam: number;
  total_score: number;
  letter_grade: string;
  grade_point: number;
  feedback: string;
  status: string;
  is_result_published: boolean;
  result_published_at: string;
}

const gradeColor = (grade: string) => {
  if (["A+", "A", "A-"].includes(grade)) return "teal";
  if (["B+", "B", "B-"].includes(grade)) return "blue";
  if (["C+", "C", "C-"].includes(grade)) return "yellow";
  if (grade === "D") return "orange";
  return "red";
};

const gradeStatus = (total: number) =>
  total >= 50 ? { label: "PASSED", color: "teal", icon: IconCheck } : { label: "FAILED", color: "red", icon: IconX };

const formatDate = (isoStr: string) => {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleDateString("en-ET", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MyResultsSection: React.FC = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<ResultItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filterAcademicYear, setFilterAcademicYear] = useState<string>("ALL");
  const [filterSemester, setFilterSemester] = useState<string>("ALL");

  // Load user session
  useEffect(() => {
    const init = async () => {
      try {
        const found = await Found();
        setCurrentUser(found);
      } catch {
        setError("Failed to load user session.");
      }
    };
    init();
  }, []);

  // Fetch published results
  const fetchResults = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const studentId = currentUser?.student_id || currentUser?.id;
      const res = await fetch(
        `${API_URL}/api/evaluations/student/results${studentId ? `?student_id=${studentId}` : ""}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        setError("Failed to fetch your results. Please try again.");
      }
    } catch {
      setError("Network error while fetching results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Unique filter options for academic year and semester across all history
  const academicYearOptions = useMemo(() => {
    const years = Array.from(
      new Set(results.map((r) => r.academic_year_name).filter(Boolean))
    );
    return [{ value: "ALL", label: "All Academic Years" }, ...years.map((y) => ({ value: y as string, label: y as string }))];
  }, [results]);

  const semesterOptions = useMemo(() => {
    const sems = Array.from(
      new Set(
        results
          .filter((r) => filterAcademicYear === "ALL" || r.academic_year_name === filterAcademicYear)
          .map((r) => r.semester_name)
          .filter(Boolean)
      )
    );
    return [{ value: "ALL", label: "All Semesters" }, ...sems.map((s) => ({ value: s as string, label: s as string }))];
  }, [results, filterAcademicYear]);

  // Filtered results
  const filteredResults = useMemo(() => {
    return results.filter((r) => {
      const matchYear = filterAcademicYear === "ALL" || r.academic_year_name === filterAcademicYear;
      const matchSem = filterSemester === "ALL" || r.semester_name === filterSemester;
      return matchYear && matchSem;
    });
  }, [results, filterAcademicYear, filterSemester]);

  // Group filtered results by Academic Year & Semester for historical transcript viewing
  const groupedResults = useMemo(() => {
    const groups: { [key: string]: { label: string; items: ResultItem[] } } = {};
    filteredResults.forEach((r) => {
      const groupKey = `${r.academic_year_name || "General"} — ${r.semester_name || "All Terms"}`;
      if (!groups[groupKey]) {
        groups[groupKey] = { label: groupKey, items: [] };
      }
      groups[groupKey].items.push(r);
    });
    return Object.values(groups);
  }, [filteredResults]);

  // Overall GPA-like summary (cumulative across all permanent results)
  const summary = useMemo(() => {
    if (results.length === 0) return null;
    const totalCredits = results.reduce((a, r) => a + Number(r.credit_hour || 3), 0);
    const weightedPoints = results.reduce(
      (a, r) => a + Number(r.grade_point) * Number(r.credit_hour || 3),
      0
    );
    const gpa = totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : "0.00";
    const passed = results.filter((r) => r.total_score >= 50).length;
    const failed = results.filter((r) => r.total_score < 50).length;
    const avgScore = (
      results.reduce((a, r) => a + Number(r.total_score), 0) / results.length
    ).toFixed(1);
    return { gpa, passed, failed, totalCredits, avgScore, total: results.length };
  }, [results]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader size="xl" color="blue" type="dots" />
        <Text c="dimmed" size="sm">Loading your results...</Text>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-purple-800 rounded-2xl p-6 md:p-8 text-white shadow-2xl">
        {/* decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ThemeIcon size={44} radius="xl" className="bg-white/20" color="white" variant="filled">
                <IconAward size={24} />
              </ThemeIcon>
              <div>
                <Title order={2} className="text-2xl font-bold tracking-tight">
                  My Academic Results
                </Title>
                <Text size="sm" className="text-blue-100">
                  Debre Berhan University — Published Grades &amp; Evaluations
                </Text>
              </div>
            </div>
            {currentUser && (
              <div className="flex items-center gap-2 text-blue-100">
                <IconUser size={14} />
                <Text size="xs">{currentUser.full_name} • {currentUser.department_name || "Student"}</Text>
              </div>
            )}
          </div>

          <Tooltip label="Refresh results" withArrow>
            <ActionIcon
              size="lg"
              radius="md"
              variant="white"
              color="blue"
              onClick={fetchResults}
              className="bg-white/15 hover:bg-white/25 text-white border-white/30"
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert icon={<IconAlertCircle size={18} />} color="red" radius="md" withCloseButton onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary KPI Cards */}
      {summary && (
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" radius="lg" p="md" withBorder className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={600} className="uppercase tracking-wider">Courses Released</Text>
                  <Title order={2} className="text-3xl font-black text-blue-700 mt-1">{summary.total}</Title>
                </div>
                <ThemeIcon size={48} radius="lg" color="blue" variant="light">
                  <IconBook size={26} />
                </ThemeIcon>
              </Group>
              <Text size="xs" c="dimmed" className="mt-2">Total credit hours: <strong>{summary.totalCredits}</strong></Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" radius="lg" p="md" withBorder className="bg-gradient-to-br from-teal-50 to-green-50 border-teal-100">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={600} className="uppercase tracking-wider">CGPA (Weighted)</Text>
                  <Title order={2} className="text-3xl font-black text-teal-700 mt-1">{summary.gpa}</Title>
                </div>
                <ThemeIcon size={48} radius="lg" color="teal" variant="light">
                  <IconTrophy size={26} />
                </ThemeIcon>
              </Group>
              <Text size="xs" c="dimmed" className="mt-2">Average score: <strong>{summary.avgScore}%</strong></Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" radius="lg" p="md" withBorder className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={600} className="uppercase tracking-wider">Passed</Text>
                  <Title order={2} className="text-3xl font-black text-green-700 mt-1">{summary.passed}</Title>
                </div>
                <ThemeIcon size={48} radius="lg" color="green" variant="light">
                  <IconMoodSmile size={26} />
                </ThemeIcon>
              </Group>
              <Progress
                value={summary.total > 0 ? (summary.passed / summary.total) * 100 : 0}
                color="green"
                size="sm"
                radius="xl"
                className="mt-3"
              />
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
            <Card shadow="sm" radius="lg" p="md" withBorder className="bg-gradient-to-br from-red-50 to-rose-50 border-red-100">
              <Group justify="space-between">
                <div>
                  <Text size="xs" c="dimmed" fw={600} className="uppercase tracking-wider">Failed / At Risk</Text>
                  <Title order={2} className="text-3xl font-black text-red-600 mt-1">{summary.failed}</Title>
                </div>
                <ThemeIcon size={48} radius="lg" color="red" variant="light">
                  <IconMoodSad size={26} />
                </ThemeIcon>
              </Group>
              <Progress
                value={summary.total > 0 ? (summary.failed / summary.total) * 100 : 0}
                color="red"
                size="sm"
                radius="xl"
                className="mt-3"
              />
            </Card>
          </Grid.Col>
        </Grid>
      )}

      {/* Results Feed */}
      {results.length === 0 ? (
        <Card shadow="sm" radius="xl" p="xl" withBorder className="text-center">
          <div className="py-10 flex flex-col items-center gap-4">
            <ThemeIcon size={64} radius="xl" color="blue" variant="light">
              <IconChartBar size={32} />
            </ThemeIcon>
            <Title order={3} className="text-gray-700">No Results Published Yet</Title>
            <Text c="dimmed" size="sm" className="max-w-sm mx-auto">
              Your instructors have not yet shared any results. You will receive an email notification when your grades are released.
            </Text>
            <div className="flex items-center gap-2 mt-2 text-xs text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
              <IconInfoCircle size={14} />
              <span>Check your email inbox for result release notifications</span>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* History filter bar */}
          <Card shadow="sm" radius="lg" p="md" withBorder className="bg-white">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <Group gap="xs">
                <ThemeIcon size={32} radius="md" color="indigo" variant="light">
                  <IconHistory size={18} />
                </ThemeIcon>
                <div>
                  <Text size="sm" fw={700} className="text-gray-900">
                    Academic Result History (Permanent Record)
                  </Text>
                  <Text size="xs" c="dimmed">
                    Your complete grade transcript across all batches and semesters
                  </Text>
                </div>
              </Group>

              <Group gap="xs" className="w-full sm:w-auto">
                {academicYearOptions.length > 2 && (
                  <Select
                    placeholder="Academic Year"
                    value={filterAcademicYear}
                    onChange={(val) => setFilterAcademicYear(val || "ALL")}
                    data={academicYearOptions}
                    size="xs"
                    radius="md"
                    className="w-44"
                  />
                )}
                {semesterOptions.length > 2 && (
                  <Select
                    placeholder="Semester"
                    value={filterSemester}
                    onChange={(val) => setFilterSemester(val || "ALL")}
                    data={semesterOptions}
                    size="xs"
                    radius="md"
                    className="w-36"
                  />
                )}
                {(filterAcademicYear !== "ALL" || filterSemester !== "ALL") && (
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    onClick={() => {
                      setFilterAcademicYear("ALL");
                      setFilterSemester("ALL");
                    }}
                  >
                    Reset
                  </Button>
                )}
              </Group>
            </div>
          </Card>

          {/* Grouped results by Academic Year / Semester */}
          {groupedResults.map((group) => (
            <div key={group.label} className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-2 border-gray-200">
                <ThemeIcon size={24} radius="xl" color="blue" variant="filled">
                  <IconCalendar size={14} />
                </ThemeIcon>
                <Text fw={700} size="sm" className="text-gray-800">
                  {group.label}
                </Text>
                <Badge size="xs" color="gray" variant="light">
                  {group.items.length} {group.items.length === 1 ? "course" : "courses"}
                </Badge>
              </div>

              <div className="space-y-3">
                {group.items.map((result) => {
                  const status = gradeStatus(result.total_score);
                  const StatusIcon = status.icon;
                  const gc = gradeColor(result.letter_grade);

                  return (
                    <Card
                      key={result.id}
                      shadow="sm"
                      radius="xl"
                      p={0}
                      withBorder
                      className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                      onClick={() => { setSelectedResult(result); setDetailOpen(true); }}
                    >
                      {/* Top accent bar */}
                      <div className={`h-1.5 w-full ${result.total_score >= 50 ? "bg-gradient-to-r from-teal-400 to-green-500" : "bg-gradient-to-r from-red-400 to-rose-500"}`} />

                      <div className="p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Course Info */}
                          <div className="flex items-start gap-4 flex-1">
                            <ThemeIcon
                              size={52}
                              radius="xl"
                              color={gc}
                              variant="light"
                              className="flex-shrink-0 mt-1"
                            >
                              <IconSchool size={28} />
                            </ThemeIcon>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Badge size="sm" color="blue" variant="light" className="font-mono font-bold">
                                  {result.course_code}
                                </Badge>
                                <Badge size="xs" color="gray" variant="outline">
                                  Sec {result.section}
                                </Badge>
                                {result.semester_name && (
                                  <Badge size="xs" color="indigo" variant="light">
                                    {result.semester_name}
                                  </Badge>
                                )}
                                {result.batch_year && (
                                  <Badge size="xs" color="violet" variant="light">
                                    {result.batch_year}
                                  </Badge>
                                )}
                                <Badge size="xs" color={status.color} variant="filled" className="font-bold">
                                  <Group gap={4}>
                                    <StatusIcon size={10} />
                                    {status.label}
                                  </Group>
                                </Badge>
                              </div>
                              <Text fw={700} size="md" className="text-gray-900 leading-tight">
                                {result.course_name}
                              </Text>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <IconUser size={11} />
                                  {result.instructor_name || "Instructor"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IconCalendar size={11} />
                                  Released: {formatDate(result.result_published_at)}
                                </span>
                                {result.credit_hour && (
                                  <span>{result.credit_hour} Cr. Hr</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Score & Grade */}
                          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
                            {/* Score breakdown mini */}
                            <div className="hidden sm:flex flex-col items-end gap-0.5">
                              <Text size="xs" c="dimmed">CA + Mid + Final</Text>
                              <Text size="sm" fw={600} className="font-mono text-gray-700">
                                {Number(result.continuous_assessment).toFixed(1)}&nbsp;+&nbsp;
                                {Number(result.mid_exam).toFixed(1)}&nbsp;+&nbsp;
                                {Number(result.final_exam).toFixed(1)}
                              </Text>
                            </div>

                            {/* Total */}
                            <div className="text-center">
                              <Text size="xs" c="dimmed" fw={500}>Total</Text>
                              <div className={`text-2xl font-black font-mono ${result.total_score >= 50 ? "text-teal-600" : "text-red-500"}`}>
                                {Number(result.total_score).toFixed(1)}
                              </div>
                              <Text size="xs" c="dimmed">/100</Text>
                            </div>

                            <Divider orientation="vertical" />

                            {/* Grade */}
                            <div className="text-center">
                              <Text size="xs" c="dimmed" fw={500}>Grade</Text>
                              <Badge
                                size="xl"
                                radius="md"
                                color={gc}
                                variant="filled"
                                className="text-xl font-black px-3 py-1 mt-0.5"
                              >
                                {result.letter_grade}
                              </Badge>
                              <Text size="xs" c="dimmed" className="mt-0.5">{Number(result.grade_point).toFixed(2)} pts</Text>
                            </div>

                            {/* View detail */}
                            <Tooltip label="View full details" withArrow>
                              <ActionIcon
                                variant="light"
                                color="blue"
                                size="lg"
                                radius="md"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <IconEye size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </div>
                        </div>

                        {/* Score progress bars */}
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {[
                            { label: "Continuous Assessment", value: result.continuous_assessment, color: "blue" },
                            { label: "Mid Exam", value: result.mid_exam, color: "violet" },
                            { label: "Final Exam", value: result.final_exam, color: "indigo" },
                          ].map((item) => (
                            <div key={item.label}>
                              <Group justify="space-between" mb={3}>
                                <Text size="xs" c="dimmed">{item.label}</Text>
                                <Text size="xs" fw={600}>{Number(item.value).toFixed(1)}</Text>
                              </Group>
                              <Progress value={Number(item.value)} color={item.color} size="xs" radius="xl" />
                            </div>
                          ))}
                        </div>

                        {result.feedback && (
                          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                            <strong>Instructor Remarks:</strong> {result.feedback}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        opened={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="blue" size={26} radius="xl">
              <IconChartBar size={15} />
            </ThemeIcon>
            <Text fw={700}>Result Detail</Text>
          </Group>
        }
        size="lg"
        radius="xl"
        centered
      >
        {selectedResult && (
          <Stack gap="md">
            {/* Course header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl p-4">
              <Badge size="sm" color="white" variant="white" className="text-blue-700 mb-2 font-mono">
                {selectedResult.course_code}
              </Badge>
              <Text fw={700} size="lg">{selectedResult.course_name}</Text>
              <Text size="xs" className="text-blue-100 mt-1">
                Section {selectedResult.section}
                {selectedResult.semester_name ? ` • ${selectedResult.semester_name}` : ""}
                {selectedResult.batch_year ? ` • Batch ${selectedResult.batch_year}` : ""}
              </Text>
            </div>

            {/* Status banner */}
            <div className={`p-3 rounded-xl text-center font-bold text-lg ${selectedResult.total_score >= 50 ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {selectedResult.total_score >= 50 ? "✅ PASSED" : "❌ FAILED"}
            </div>

            {/* Score breakdown table */}
            <div className="rounded-xl overflow-hidden border border-gray-200">
              {[
                { label: "Continuous Assessment (CA)", value: selectedResult.continuous_assessment },
                { label: "Mid Exam", value: selectedResult.mid_exam },
                { label: "Final Exam", value: selectedResult.final_exam },
              ].map((row, i) => (
                <div key={row.label} className={`flex justify-between px-4 py-3 text-sm ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                  <span className="text-gray-600 font-medium">{row.label}</span>
                  <span className="font-bold text-gray-900 font-mono">{Number(row.value).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3 text-sm bg-blue-50 border-t-2 border-blue-200">
                <span className="font-bold text-blue-800">Total Score</span>
                <span className="font-black text-blue-800 font-mono text-base">
                  {Number(selectedResult.total_score).toFixed(2)} / 100
                </span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm bg-white border-t border-gray-100">
                <span className="font-medium text-gray-600">Letter Grade</span>
                <Badge size="lg" color={gradeColor(selectedResult.letter_grade)} variant="filled" className="font-bold">
                  {selectedResult.letter_grade}
                </Badge>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm bg-gray-50 border-t border-gray-100">
                <span className="font-medium text-gray-600">Grade Points</span>
                <span className="font-bold text-gray-900">{Number(selectedResult.grade_point).toFixed(2)}</span>
              </div>
              <div className="flex justify-between px-4 py-3 text-sm bg-white border-t border-gray-100">
                <span className="font-medium text-gray-600">Credit Hours</span>
                <span className="font-bold text-gray-900">{selectedResult.credit_hour}</span>
              </div>
            </div>

            {/* Meta */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-2">
                <IconUser size={12} />
                <span>Instructor: <strong>{selectedResult.instructor_name || "N/A"}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <IconCalendar size={12} />
                <span>Released on: <strong>{formatDate(selectedResult.result_published_at)}</strong></span>
              </div>
            </div>

            {selectedResult.feedback && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
                <Text size="xs" fw={700} className="mb-1">Instructor Remarks</Text>
                <Text size="sm" className="italic">{selectedResult.feedback}</Text>
              </div>
            )}

            <Button
              fullWidth
              variant="light"
              color="blue"
              radius="md"
              onClick={() => setDetailOpen(false)}
            >
              Close
            </Button>
          </Stack>
        )}
      </Modal>
    </div>
  );
};

export default MyResultsSection;
