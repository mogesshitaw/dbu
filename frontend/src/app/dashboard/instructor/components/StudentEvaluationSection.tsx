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
  NumberInput,
  TextInput,
  Select,
  Loader,
  Alert,
  Progress,
  ActionIcon,
  Tooltip,
  Modal,
  Divider,
} from "@mantine/core";
import {
  IconCheck,
  IconAlertCircle,
  IconDownload,
  IconPrinter,
  IconDeviceFloppy,
  IconSend,
  IconSearch,
  IconRefresh,
  IconInfoCircle,
  IconAward,
  IconUsers,
  IconPercentage,
  IconChartBar,
  IconBell,
  IconShare,
  IconFilter,
  IconCalendar,
  IconFileSpreadsheet,
  IconSchool,
  IconLock,
  IconLockOpen,
  IconClock,
  IconCircleCheck,
} from "@tabler/icons-react";
import { Found } from "@/app/auth/auth";
import * as XLSX from "xlsx";


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

interface AcademicYear {
  id: number;
  academic_year: string;
  semester: string;
  batch_year: string;
  status: string;
  semester_id: number;
  batch_id: number;
}

interface AssignedCourse {
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
}

interface StudentRow {
  student_id: number;
  student_number: string;
  full_name: string;
  gender: string;
  department_name: string;
  batch_year: string;
  semester_name: string;
  academic_year_name: string;
  academic_year_id: number | null;
  section: string;
  continuous_assessment: number;
  mid_exam: number;
  final_exam: number;
  total_score: number;
  letter_grade: string;
  grade_point: number;
  feedback: string;
  evaluation_status: string;
}

export const StudentEvaluationSection: React.FC = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [courses, setCourses] = useState<AssignedCourse[]>([]);
  const [selectedCourseKey, setSelectedCourseKey] = useState<string | null>(null);

  // Academic Year
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string | null>(null);
  const [loadingAcademicYears, setLoadingAcademicYears] = useState(false);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState<string>("ALL");
  const [filterDept, setFilterDept] = useState<string>("ALL");
  const [filterBatch, setFilterBatch] = useState<string>("ALL");
  const [filterSemester, setFilterSemester] = useState<string>("ALL");
  const [filterSection, setFilterSection] = useState<string>("ALL");
  const [submitModalOpened, setSubmitModalOpened] = useState(false);
  const [publishModalOpened, setPublishModalOpened] = useState(false);

  // Department Head Review & Approval Status
  const [sectionStatus, setSectionStatus] = useState<string>("not_started");
  const [sectionMetadata, setSectionMetadata] = useState<{
    approved_at?: string | null;
    approved_by_name?: string | null;
    locked_at?: string | null;
    locked_by_name?: string | null;
    remarks?: string | null;
  }>({});

  const isFormReadOnly = useMemo(() => {
    return ["submitted", "approved", "locked", "published"].includes(sectionStatus);
  }, [sectionStatus]);

  // Check if results are already published
  const isPublished = sectionStatus === "published" || (students.length > 0 && students.every((s) => s.evaluation_status === "published"));

  // 1. Load User Session
  useEffect(() => {
    const init = async () => {
      try {
        const found = await Found();
        setCurrentUser(found);
      } catch (err) {
        console.error("Failed to fetch user session", err);
      }
    };
    init();
  }, []);

  // 2. Fetch Academic Years
  const fetchAcademicYears = useCallback(async () => {
    setLoadingAcademicYears(true);
    try {
      const res = await fetch(`${API_URL}/api/academic-years`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const list: AcademicYear[] = data.data || [];
        setAcademicYears(list);
        const active = list.find((ay) => ay.status === "active");
        if (active) {
          setSelectedAcademicYearId(String(active.id));
        } else if (list.length > 0) {
          setSelectedAcademicYearId(String(list[0].id));
        }
      }
    } catch (err) {
      console.error("Failed to fetch academic years:", err);
    } finally {
      setLoadingAcademicYears(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  // Selected academic year details
  const activeAcademicYear = useMemo(() => {
    if (!selectedAcademicYearId) return null;
    return academicYears.find((ay) => String(ay.id) === selectedAcademicYearId) || null;
  }, [academicYears, selectedAcademicYearId]);

  // 2. Fetch Assigned Courses for Instructor
  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    try {
      const instructorId = currentUser?.id;
      const res = await fetch(
        `${API_URL}/api/evaluations/instructor/courses${instructorId ? `?instructor_id=${instructorId}` : ""}`,
        { credentials: "include" }
      );
      if (res.ok) {
        const data = await res.json();
        const list: AssignedCourse[] = data.courses || [];
        setCourses(list);
        if (list.length > 0 && !selectedCourseKey) {
          // Select first course by default
          const first = list[0];
          setSelectedCourseKey(
            `${first.course_id}_${first.section}_${first.department_id || ""}_${first.batch_id || ""}`
          );
        }
      }
    } catch (err) {
      console.error("Failed to fetch instructor courses:", err);
      setErrorMessage("Could not load assigned courses");
    } finally {
      setLoadingCourses(false);
    }
  }, [API_URL, currentUser?.id, selectedCourseKey]);

  useEffect(() => {
    if (currentUser) {
      fetchCourses();
    }
  }, [currentUser, fetchCourses]);

  // Filter options derived from instructor's assigned courses
  const departmentOptions = useMemo(() => {
    const depts = Array.from(new Set(courses.map((c) => c.department_name).filter(Boolean)));
    return [{ value: "ALL", label: "All Departments" }, ...depts.map((d) => ({ value: d, label: d }))];
  }, [courses]);

  const batchOptions = useMemo(() => {
    const batches = Array.from(
      new Set(
        courses
          .filter((c) => filterDept === "ALL" || c.department_name === filterDept)
          .map((c) => c.batch_year)
          .filter(Boolean)
      )
    );
    return [{ value: "ALL", label: "All Batches" }, ...batches.map((b) => ({ value: b, label: b }))];
  }, [courses, filterDept]);

  const semesterOptions = useMemo(() => {
    const sems = Array.from(
      new Set(
        courses
          .filter(
            (c) =>
              (filterDept === "ALL" || c.department_name === filterDept) &&
              (filterBatch === "ALL" || c.batch_year === filterBatch)
          )
          .map((c) => c.semester_name)
          .filter(Boolean)
      )
    );
    return [{ value: "ALL", label: "All Semesters" }, ...sems.map((s) => ({ value: s, label: s }))];
  }, [courses, filterDept, filterBatch]);

  const sectionOptions = useMemo(() => {
    const secs = Array.from(
      new Set(
        courses
          .filter(
            (c) =>
              (filterDept === "ALL" || c.department_name === filterDept) &&
              (filterBatch === "ALL" || c.batch_year === filterBatch) &&
              (filterSemester === "ALL" || c.semester_name === filterSemester)
          )
          .map((c) => c.section)
          .filter(Boolean)
      )
    );
    return [{ value: "ALL", label: "All Sections" }, ...secs.map((s) => ({ value: s, label: `Sec ${s}` }))];
  }, [courses, filterDept, filterBatch, filterSemester]);

  // Filtered courses based on Department, Batch, Semester, and Section filters
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchDept = filterDept === "ALL" || c.department_name === filterDept;
      const matchBatch = filterBatch === "ALL" || c.batch_year === filterBatch;
      const matchSem = filterSemester === "ALL" || c.semester_name === filterSemester;
      const matchSec = filterSection === "ALL" || c.section === filterSection;
      return matchDept && matchBatch && matchSem && matchSec;
    });
  }, [courses, filterDept, filterBatch, filterSemester, filterSection]);

  // Keep selected course synchronized when filters change
  useEffect(() => {
    if (filteredCourses.length > 0) {
      const exists = filteredCourses.some(
        (c) => `${c.course_id}_${c.section}_${c.department_id || ""}_${c.batch_id || ""}` === selectedCourseKey
      );
      if (!exists) {
        const first = filteredCourses[0];
        setSelectedCourseKey(`${first.course_id}_${first.section}_${first.department_id || ""}_${first.batch_id || ""}`);
      }
    } else if (courses.length > 0) {
      setSelectedCourseKey(null);
    }
  }, [filteredCourses, selectedCourseKey, courses.length]);

  // Selected Course details
  const activeCourse = useMemo(() => {
    if (!selectedCourseKey) return null;
    return courses.find((c) => {
      const key = `${c.course_id}_${c.section}_${c.department_id || ""}_${c.batch_id || ""}`;
      return key === selectedCourseKey;
    });
  }, [courses, selectedCourseKey]);

  // 4. Fetch Students for Selected Course & Section & Academic Year
  const fetchStudents = useCallback(async () => {
    if (!activeCourse) return;
    setLoadingStudents(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const queryParams = new URLSearchParams({
        course_id: String(activeCourse.course_id),
        section: activeCourse.section,
        department_id: String(activeCourse.department_id || ""),
        batch_id: String(activeCourse.batch_id || ""),
        semester_id: String(activeCourse.semester_id || ""),
      });
      if (selectedAcademicYearId) {
        queryParams.set("academic_year_id", selectedAcademicYearId);
      }

      const res = await fetch(`${API_URL}/api/evaluations/course-students?${queryParams.toString()}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setSectionStatus(data.section_status || "draft");
        setSectionMetadata(data.section_metadata || {});

        const mapped: StudentRow[] = (data.students || []).map((s: any) => {
          const ca = Number(s.continuous_assessment || 0);
          const mid = Number(s.mid_exam || 0);
          const final = Number(s.final_exam || 0);
          const total = Math.min(100, Math.round((ca + mid + final) * 100) / 100);
          const calc = calculateGrade(total);

          return {
            student_id: s.student_id,
            student_number: s.student_number,
            full_name: s.full_name,
            gender: s.gender || "N/A",
            department_name: s.department_name || activeCourse?.department_name || "N/A",
            batch_year: s.batch_year || activeCourse?.batch_year || "N/A",
            semester_name: s.semester_name || activeCourse?.semester_name || "N/A",
            academic_year_name: s.academic_year_name || activeAcademicYear?.academic_year || "N/A",
            academic_year_id: s.academic_year_id || (selectedAcademicYearId ? Number(selectedAcademicYearId) : null),
            section: s.section || activeCourse?.section || "N/A",
            continuous_assessment: ca,
            mid_exam: mid,
            final_exam: final,
            total_score: total,
            letter_grade: s.letter_grade || calc.grade,
            grade_point: Number(s.grade_point || calc.points),
            feedback: s.feedback || "",
            evaluation_status: s.evaluation_status || "draft",
          };
        });

        setStudents(mapped);
      } else {
        setErrorMessage("Failed to load enrolled students for this course");
      }
    } catch (err) {
      console.error("fetchStudents error:", err);
      setErrorMessage("Network error while loading students");
    } finally {
      setLoadingStudents(false);
    }
  }, [API_URL, activeCourse, selectedAcademicYearId, activeAcademicYear]);

  useEffect(() => {
    if (activeCourse) {
      fetchStudents();
    }
  }, [activeCourse, fetchStudents]);

  // 4. Handle Score Input Changes
  const handleScoreChange = (
    studentId: number,
    field: "continuous_assessment" | "mid_exam" | "final_exam" | "feedback",
    value: number | string
  ) => {
    setStudents((prev) =>
      prev.map((row) => {
        if (row.student_id !== studentId) return row;

        const updated = { ...row, [field]: value };
        if (field !== "feedback") {
          const ca = Math.max(0, Math.min(100, Number(updated.continuous_assessment || 0)));
          const mid = Math.max(0, Math.min(100, Number(updated.mid_exam || 0)));
          const final = Math.max(0, Math.min(100, Number(updated.final_exam || 0)));
          const total = Math.min(100, Math.round((ca + mid + final) * 100) / 100);
          const calc = calculateGrade(total);

          updated.total_score = total;
          updated.letter_grade = calc.grade;
          updated.grade_point = calc.points;
        }
        return updated;
      })
    );
  };

  // 5a. Publish Results (share with students as announcement)
  const handlePublishResults = async () => {
    if (!activeCourse) return;
    setPublishing(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const payload = {
        course_id: activeCourse.course_id,
        section: activeCourse.section,
        department_id: activeCourse.department_id,
        batch_id: activeCourse.batch_id,
        semester_id: activeCourse.semester_id,
      };

      const res = await fetch(`${API_URL}/api/evaluations/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`📢 ${data.message}`);
        setStudents((prev) =>
          prev.map((s) => ({ ...s, evaluation_status: "published" }))
        );
      } else {
        setErrorMessage(data.error || "Failed to publish results");
      }
    } catch (err) {
      console.error("handlePublishResults error:", err);
      setErrorMessage("Network error while publishing results");
    } finally {
      setPublishing(false);
      setPublishModalOpened(false);
    }
  };

  // 5. Save Evaluations (Draft or Final)
  const handleSave = async (isFinal = false) => {
    if (!activeCourse || students.length === 0) return;
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        course_id: activeCourse.course_id,
        section: activeCourse.section,
        department_id: activeCourse.department_id,
        batch_id: activeCourse.batch_id,
        semester_id: activeCourse.semester_id,
        academic_year_id: selectedAcademicYearId ? Number(selectedAcademicYearId) : null,
        is_final_submission: isFinal,
        evaluations: students.map((s) => ({
          student_id: s.student_id,
          continuous_assessment: s.continuous_assessment,
          mid_exam: s.mid_exam,
          final_exam: s.final_exam,
          feedback: s.feedback,
        })),
      };

      const res = await fetch(`${API_URL}/api/evaluations/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(
          isFinal
            ? "✅ Result evaluation officially submitted to Department Head for review and approval."
            : "💾 Result draft saved successfully."
        );
        if (isFinal) {
          setSectionStatus("submitted");
        }
        setStudents((prev) =>
          prev.map((s) => ({
            ...s,
            evaluation_status: isFinal ? "submitted" : "draft",
          }))
        );
        if (isFinal) setSubmitModalOpened(false);
      } else {
        setErrorMessage(data.error || "Failed to save evaluations");
      }
    } catch (err) {
      console.error("handleSave error:", err);
      setErrorMessage("Network error while saving evaluations");
    } finally {
      setSaving(false);
    }
  };

  // 6. Excel Export using SheetJS (proper .xlsx)
  const handleExportExcel = async () => {
    if (!activeCourse) return;
    setExporting(true);
    try {
      const queryParams = new URLSearchParams({
        course_id: String(activeCourse.course_id),
        section: activeCourse.section,
        department_id: String(activeCourse.department_id || ""),
        batch_id: String(activeCourse.batch_id || ""),
        semester_id: String(activeCourse.semester_id || ""),
      });
      if (selectedAcademicYearId) {
        queryParams.set("academic_year_id", selectedAcademicYearId);
      }

      const res = await fetch(`${API_URL}/api/evaluations/export?${queryParams.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) {
        setErrorMessage("Failed to fetch export data from server");
        return;
      }

      const exportData = await res.json();
      if (!exportData.success) {
        setErrorMessage(exportData.error || "Export failed");
        return;
      }

      const course = exportData.course || activeCourse;
      const ayInfo = exportData.academic_year;
      const rows: any[] = exportData.students || [];
      const ayLabel = ayInfo?.academic_year || activeAcademicYear?.academic_year || "N/A";

      const wb = XLSX.utils.book_new();
      const wsData: any[][] = [];

      // ── Header block ──────────────────────────────────────────────
      wsData.push(["DEBRE BERHAN UNIVERSITY"]);
      wsData.push(["Student Result Evaluation Sheet"]);
      wsData.push([]);
      wsData.push(["Course Code:", course.course_code || "", "Course Name:", course.course_name || ""]);
      wsData.push(["Credit Hours:", course.credit_hour || "", "Section:", activeCourse.section]);
      wsData.push(["Department:", activeCourse.department_name || "", "Batch / Year:", activeCourse.batch_year || ""]);
      wsData.push(["Semester:", activeCourse.semester_name || "", "Academic Year:", ayLabel]);
      wsData.push(["Exported At:", new Date().toLocaleString()]);
      wsData.push([]);

      // ── Column headers ────────────────────────────────────────────
      wsData.push([
        "No.",
        "Student ID",
        "Full Name",
        "Gender",
        "Department",
        "Batch / Year",
        "Semester",
        "Academic Year",
        "Section",
        "Continuous Assessment (30%)",
        "Mid Exam (30%)",
        "Final Exam (40%)",
        "Total Score (100)",
        "Letter Grade",
        "Grade Point",
        "Pass / Fail",
        "Remarks / Feedback",
        "Evaluation Status",
      ]);

      // ── Data rows ─────────────────────────────────────────────────
      rows.forEach((s: any, idx: number) => {
        const total = Number(s.total_score || 0);
        wsData.push([
          idx + 1,
          s.student_number || "",
          s.full_name || "",
          s.gender || "",
          s.department_name || activeCourse.department_name || "",
          s.batch_year || activeCourse.batch_year || "",
          s.semester_name || activeCourse.semester_name || "",
          s.academic_year_name || ayLabel,
          s.section || activeCourse.section || "",
          Number(s.continuous_assessment || 0),
          Number(s.mid_exam || 0),
          Number(s.final_exam || 0),
          total,
          s.letter_grade || "",
          Number(s.grade_point || 0),
          total >= 50 ? "PASS" : "FAIL",
          s.feedback || "",
          s.evaluation_status || "draft",
        ]);
      });

      // ── Summary rows ──────────────────────────────────────────────
      const totalStudents = rows.length;
      const passed = rows.filter((s: any) => Number(s.total_score || 0) >= 50).length;
      const failed = totalStudents - passed;
      const avgScore =
        totalStudents > 0
          ? (rows.reduce((sum: number, s: any) => sum + Number(s.total_score || 0), 0) / totalStudents).toFixed(2)
          : "0.00";

      wsData.push([]);
      wsData.push(["SUMMARY"]);
      wsData.push(["Total Students:", totalStudents, "Passed:", passed, "Failed:", failed, "Class Average:", avgScore]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [
        { wch: 5 },   // No.
        { wch: 16 },  // Student ID
        { wch: 26 },  // Full Name
        { wch: 10 },  // Gender
        { wch: 30 },  // Department
        { wch: 14 },  // Batch
        { wch: 14 },  // Semester
        { wch: 16 },  // Academic Year
        { wch: 10 },  // Section
        { wch: 26 },  // CA
        { wch: 18 },  // Mid
        { wch: 18 },  // Final
        { wch: 16 },  // Total
        { wch: 14 },  // Grade
        { wch: 12 },  // GP
        { wch: 12 },  // Pass/Fail
        { wch: 30 },  // Remarks
        { wch: 18 },  // Status
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Student Evaluations");

      const fileName = `Student_Evaluation_${course.course_code}_Sec${activeCourse.section}_${ayLabel.replace(/[/\\:*?"<>|]/g, "-")}.xlsx`;
      XLSX.writeFile(wb, fileName);
      setSuccessMessage(`✅ Excel file "${fileName}" downloaded successfully.`);
    } catch (err) {
      console.error("handleExportExcel error:", err);
      setErrorMessage("Failed to generate Excel file");
    } finally {
      setExporting(false);
    }
  };

  // 7. CSV Export (fixed — no trailing commas, proper escaping)
  const handleExportCSV = () => {
    if (students.length === 0 || !activeCourse) return;

    const escape = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;
    const ayLabel = activeAcademicYear?.academic_year || "N/A";

    const headers = [
      "No.", "Student ID", "Full Name", "Gender", "Department",
      "Batch / Year", "Semester", "Academic Year", "Section",
      "Continuous Assessment (30%)", "Mid Exam (30%)", "Final Exam (40%)",
      "Total Score (100)", "Letter Grade", "Grade Point", "Pass / Fail", "Remarks / Feedback",
    ];

    const metaLines = [
      escape("DEBRE BERHAN UNIVERSITY – Student Result Evaluation"),
      escape(`Course: ${activeCourse.course_code} – ${activeCourse.course_name} | Section: ${activeCourse.section}`),
      escape(`Dept: ${activeCourse.department_name || "N/A"} | Batch: ${activeCourse.batch_year || "N/A"} | Semester: ${activeCourse.semester_name || "N/A"} | Academic Year: ${ayLabel}`),
      escape(`Exported At: ${new Date().toLocaleString()}`),
      "",
    ];

    const dataRows = students.map((s, idx) => {
      const total = s.total_score;
      return [
        idx + 1,
        escape(s.student_number),
        escape(s.full_name),
        escape(s.gender),
        escape(s.department_name),
        escape(s.batch_year),
        escape(s.semester_name),
        escape(s.academic_year_name || ayLabel),
        escape(s.section),
        s.continuous_assessment,
        s.mid_exam,
        s.final_exam,
        total,
        escape(s.letter_grade),
        s.grade_point.toFixed(2),
        escape(total >= 50 ? "PASS" : "FAIL"),
        escape(s.feedback || ""),
      ].join(",");
    });

    const csvLines = [
      ...metaLines,
      headers.map(escape).join(","),
      ...dataRows,
    ];

    const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Student_Evaluation_${activeCourse.course_code}_Sec${activeCourse.section}_${ayLabel.replace(/[/\\:*?"<>|]/g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  // 7. Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_number.toLowerCase().includes(searchQuery.toLowerCase());

      const matchFilter =
        filterGrade === "ALL" ||
        (filterGrade === "PASS" && s.total_score >= 50) ||
        (filterGrade === "FAIL" && s.total_score < 50) ||
        s.letter_grade === filterGrade;

      return matchSearch && matchFilter;
    });
  }, [students, searchQuery, filterGrade]);

  // 8. Statistics Calculation
  const stats = useMemo(() => {
    const total = students.length;
    if (total === 0)
      return { total: 0, evaluated: 0, average: 0, highest: 0, lowest: 0, passRate: 0, passed: 0, failed: 0 };

    const evaluated = students.filter((s) => s.total_score > 0).length;
    const scores = students.map((s) => s.total_score);
    const sum = scores.reduce((a, b) => a + b, 0);
    const average = evaluated > 0 ? (sum / total).toFixed(1) : "0.0";
    const highest = Math.max(...scores, 0);
    const lowest = Math.min(...scores);
    const passed = students.filter((s) => s.total_score >= 50).length;
    const failed = students.filter((s) => s.total_score < 50).length;
    const passRate = evaluated > 0 ? Math.round((passed / total) * 100) : 0;

    return { total, evaluated, average, highest, lowest, passRate, passed, failed };
  }, [students]);

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 rounded-2xl text-white shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ThemeIcon size={36} radius="md" color="blue" variant="filled" className="bg-white/20">
                <IconAward size={22} className="text-white" />
              </ThemeIcon>
              <Title order={2} className="text-xl md:text-2xl font-bold tracking-tight">
                Student Result & Assessment Evaluation
              </Title>
            </div>
            <Text size="sm" className="text-blue-100">
              Debre Berhan University Standard Grading System (Scale: A+ to F)
            </Text>
          </div>

          <Tooltip label="Refresh Student List">
            <ActionIcon
              variant="light"
              color="gray"
              size="lg"
              radius="md"
              onClick={fetchStudents}
              loading={loadingStudents}
              className="bg-white/10 hover:bg-white/20 text-white self-start md:self-auto"
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </div>

        {/* Academic Year Selector */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-100 mr-1">
              <IconCalendar size={15} />
              <span>Academic Year:</span>
            </div>
            {loadingAcademicYears ? (
              <Group gap="xs">
                <Loader size="xs" color="white" />
                <Text size="xs" className="text-white">Loading academic years...</Text>
              </Group>
            ) : (
              <Select
                placeholder="Select Academic Year"
                value={selectedAcademicYearId}
                onChange={(val) => setSelectedAcademicYearId(val)}
                data={academicYears.map((ay) => ({
                  value: String(ay.id),
                  label: `${ay.academic_year} — ${ay.semester} (${ay.batch_year})${ay.status === "active" ? " ★ Active" : ""}`,
                }))}
                size="xs"
                radius="md"
                className="w-80"
                styles={{
                  input: {
                    backgroundColor: "white",
                    color: "#1e293b",
                    fontWeight: 600,
                    fontSize: "12px",
                  },
                }}
              />
            )}
            {activeAcademicYear && (
              <Badge
                size="sm"
                color={
                  activeAcademicYear.status === "active"
                    ? "teal"
                    : activeAcademicYear.status === "completed"
                    ? "gray"
                    : "yellow"
                }
                variant="filled"
              >
                {activeAcademicYear.status?.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Filter & Select Class by Department, Batch, Semester, Section, and Course */}
        <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-100 mr-1">
              <IconFilter size={15} />
              <span>Filter Class:</span>
            </div>

            {/* Department Filter */}
            <Select
              placeholder="Department"
              value={filterDept}
              onChange={(val) => setFilterDept(val || "ALL")}
              data={departmentOptions}
              size="xs"
              radius="md"
              className="w-44"
              styles={{
                input: {
                  backgroundColor: "white",
                  color: "#1e293b",
                  fontWeight: 600,
                  fontSize: "12px",
                },
              }}
            />

            {/* Batch Filter */}
            <Select
              placeholder="Batch / Year"
              value={filterBatch}
              onChange={(val) => setFilterBatch(val || "ALL")}
              data={batchOptions}
              size="xs"
              radius="md"
              className="w-36"
              styles={{
                input: {
                  backgroundColor: "white",
                  color: "#1e293b",
                  fontWeight: 600,
                  fontSize: "12px",
                },
              }}
            />

            {/* Semester Filter */}
            <Select
              placeholder="Semester"
              value={filterSemester}
              onChange={(val) => setFilterSemester(val || "ALL")}
              data={semesterOptions}
              size="xs"
              radius="md"
              className="w-36"
              styles={{
                input: {
                  backgroundColor: "white",
                  color: "#1e293b",
                  fontWeight: 600,
                  fontSize: "12px",
                },
              }}
            />

            {/* Section Filter */}
            <Select
              placeholder="Section"
              value={filterSection}
              onChange={(val) => setFilterSection(val || "ALL")}
              data={sectionOptions}
              size="xs"
              radius="md"
              className="w-32"
              styles={{
                input: {
                  backgroundColor: "white",
                  color: "#1e293b",
                  fontWeight: 600,
                  fontSize: "12px",
                },
              }}
            />

            {/* Course Selector (Searchable) */}
            <div className="flex-1 min-w-[280px]">
              {loadingCourses ? (
                <Group gap="xs">
                  <Loader size="xs" color="white" />
                  <Text size="xs">Loading assigned classes...</Text>
                </Group>
              ) : filteredCourses.length > 0 ? (
                <Select
                  placeholder="Select Course & Section"
                  searchable
                  clearable={false}
                  value={selectedCourseKey}
                  onChange={(val) => setSelectedCourseKey(val)}
                  data={filteredCourses.map((c) => ({
                    value: `${c.course_id}_${c.section}_${c.department_id || ""}_${c.batch_id || ""}`,
                    label: `${c.course_code} - ${c.course_name} (Sec ${c.section}${c.batch_year ? ` • ${c.batch_year}` : ""})`,
                  }))}
                  size="xs"
                  radius="md"
                  styles={{
                    input: {
                      backgroundColor: "white",
                      color: "#1e293b",
                      fontWeight: 700,
                      fontSize: "12px",
                    },
                  }}
                />
              ) : (
                <Badge color="yellow" variant="light" size="md">
                  No courses match selected filters
                </Badge>
              )}
            </div>

            {(filterDept !== "ALL" || filterBatch !== "ALL" || filterSemester !== "ALL" || filterSection !== "ALL") && (
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                className="text-white hover:bg-white/20 text-xs h-7 px-2"
                onClick={() => {
                  setFilterDept("ALL");
                  setFilterBatch("ALL");
                  setFilterSemester("ALL");
                  setFilterSection("ALL");
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <Alert
          icon={<IconCheck size={18} />}
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
          color="red"
          radius="md"
          withCloseButton
          onClose={() => setErrorMessage(null)}
        >
          {errorMessage}
        </Alert>
      )}

      {/* Overview KPI Cards */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" radius="lg" p="md" withBorder className="bg-white">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" fw={600} className="uppercase tracking-wider">
                  Enrolled Students
                </Text>
                <Title order={3} className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.total}
                </Title>
              </div>
              <ThemeIcon size={46} radius="lg" variant="light" color="blue">
                <IconUsers size={24} />
              </ThemeIcon>
            </Group>
            <div className="mt-3">
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">
                  Evaluated: {stats.evaluated} of {stats.total}
                </Text>
                <Text size="xs" fw={700} c="blue">
                  {stats.total > 0 ? Math.round((stats.evaluated / stats.total) * 100) : 0}%
                </Text>
              </Group>
              <Progress
                value={stats.total > 0 ? (stats.evaluated / stats.total) * 100 : 0}
                size="sm"
                radius="xl"
                color="blue"
              />
            </div>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" radius="lg" p="md" withBorder className="bg-white">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" fw={600} className="uppercase tracking-wider">
                  Class Average
                </Text>
                <Title order={3} className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.average} / 100
                </Title>
              </div>
              <ThemeIcon size={46} radius="lg" variant="light" color="indigo">
                <IconChartBar size={24} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed" className="mt-3">
              Highest: <strong className="text-green-600">{stats.highest}</strong> | Lowest:{" "}
              <strong className="text-red-500">{stats.lowest}</strong>
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" radius="lg" p="md" withBorder className="bg-white">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" fw={600} className="uppercase tracking-wider">
                  Pass Rate
                </Text>
                <Title order={3} className="text-2xl font-bold text-gray-800 mt-1">
                  {stats.passRate}%
                </Title>
              </div>
              <ThemeIcon size={46} radius="lg" variant="light" color="teal">
                <IconPercentage size={24} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed" className="mt-3">
              Passed: <strong className="text-teal-600">{stats.passed}</strong> | Failed:{" "}
              <strong className="text-red-500">{stats.failed}</strong>
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card shadow="sm" radius="lg" p="md" withBorder className="bg-white">
            <Group justify="space-between">
              <div>
                <Text size="xs" c="dimmed" fw={600} className="uppercase tracking-wider">
                  Credit Hours
                </Text>
                <Title order={3} className="text-2xl font-bold text-gray-800 mt-1">
                  {activeCourse?.credit_hour || 3} Cr. Hr
                </Title>
              </div>
              <ThemeIcon size={46} radius="lg" variant="light" color="orange">
                <IconSchool size={24} />
              </ThemeIcon>
            </Group>
            <Text size="xs" c="dimmed" className="mt-3 truncate">
              {activeCourse?.department_name || "Department"}
            </Text>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Ethiopian Grading Scale Summary Banner */}
      <Card shadow="xs" radius="md" p="sm" withBorder className="bg-blue-50/50 border-blue-100">
        <Group justify="space-between" className="flex-wrap gap-2 text-xs text-gray-700">
          <Group gap="xs">
            <IconInfoCircle size={16} className="text-blue-600" />
            <span className="font-semibold text-blue-900">Ethiopian Grading Scale:</span>
          </Group>
          <Group gap="xs" className="flex-wrap">
            <Badge size="sm" color="teal" variant="light">A+ (≥90 • 4.0)</Badge>
            <Badge size="sm" color="teal" variant="light">A (85-89 • 4.0)</Badge>
            <Badge size="sm" color="green" variant="light">A- (80-84 • 3.75)</Badge>
            <Badge size="sm" color="lime" variant="light">B+ (75-79 • 3.5)</Badge>
            <Badge size="sm" color="blue" variant="light">B (70-74 • 3.0)</Badge>
            <Badge size="sm" color="cyan" variant="light">B- (65-69 • 2.75)</Badge>
            <Badge size="sm" color="yellow" variant="light">C+ (60-64 • 2.5)</Badge>
            <Badge size="sm" color="orange" variant="light">C (50-59 • 2.0)</Badge>
            <Badge size="sm" color="orange" variant="light">C- (45-49 • 1.75)</Badge>
            <Badge size="sm" color="red" variant="light">D (40-44 • 1.0)</Badge>
            <Badge size="sm" color="red" variant="filled">F (&lt;40 • 0.0)</Badge>
          </Group>
        </Group>
      </Card>

      {/* Main Table Card */}
      <Card shadow="md" radius="xl" p="lg" withBorder className="bg-white">
        {/* Table Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <TextInput
              placeholder="Search by student name or ID..."
              leftSection={<IconSearch size={16} className="text-gray-400" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
              radius="md"
              className="w-full sm:w-64"
            />

            <Select
              placeholder="Grade Filter"
              value={filterGrade}
              onChange={(val) => setFilterGrade(val || "ALL")}
              data={[
                { value: "ALL", label: "All Grades" },
                { value: "PASS", label: "Passed (≥50)" },
                { value: "FAIL", label: "Failed (<50)" },
                { value: "A+", label: "Grade A+" },
                { value: "A", label: "Grade A" },
                { value: "A-", label: "Grade A-" },
                { value: "B+", label: "Grade B+" },
                { value: "B", label: "Grade B" },
                { value: "C+", label: "Grade C+" },
                { value: "C", label: "Grade C" },
                { value: "D", label: "Grade D" },
                { value: "F", label: "Grade F" },
              ]}
              size="sm"
              radius="md"
              className="w-36"
            />
          </div>

          {/* Action Buttons */}
          <Group gap="xs" className="w-full md:w-auto justify-end">
            <Button
              variant="default"
              size="sm"
              radius="md"
              leftSection={<IconDownload size={16} />}
              onClick={handleExportCSV}
              disabled={students.length === 0}
            >
              Export CSV
            </Button>

            <Button
              variant="default"
              size="sm"
              radius="md"
              leftSection={<IconPrinter size={16} />}
              onClick={() => window.print()}
            >
              Print
            </Button>

            <Button
              color="blue"
              size="sm"
              radius="md"
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={() => handleSave(false)}
              loading={saving}
              disabled={students.length === 0 || isFormReadOnly}
            >
              Save Draft
            </Button>

            <Button
              color="teal"
              size="sm"
              radius="md"
              leftSection={sectionStatus === "submitted" ? <IconClock size={16} /> : sectionStatus === "approved" || sectionStatus === "locked" ? <IconLock size={16} /> : <IconSend size={16} />}
              onClick={() => setSubmitModalOpened(true)}
              disabled={students.length === 0 || saving || isFormReadOnly}
            >
              {sectionStatus === "submitted"
                ? "Submitted to Dept Head"
                : sectionStatus === "approved"
                ? "Approved by Dept Head"
                : sectionStatus === "locked"
                ? "Locked by Dept Head"
                : "Finalize & Submit"}
            </Button>

            <Divider orientation="vertical" />

            <Tooltip
              label={isPublished ? "Results already shared with students" : "Share results with students via email & their dashboard"}
              withArrow
              position="top"
            >
              <Button
                color={isPublished ? "green" : "violet"}
                variant={isPublished ? "light" : "filled"}
                size="sm"
                radius="md"
                leftSection={isPublished ? <IconCheck size={16} /> : <IconBell size={16} />}
                onClick={() => setPublishModalOpened(true)}
                disabled={students.length === 0 || publishing}
                loading={publishing}
              >
                {isPublished ? "Results Shared ✓" : "Share Results"}
              </Button>
            </Tooltip>
          </Group>
        </div>

        {/* Department Head Status Notification Banners */}
        {activeCourse && (
          <div className="space-y-2">
            {sectionStatus === "submitted" && (
              <Alert
                icon={<IconClock size={18} />}
                title="Evaluations Submitted to Department Head"
                color="yellow"
                variant="light"
                radius="md"
              >
                Your grade evaluation for <strong>{activeCourse.course_code} (Section {activeCourse.section})</strong> has been finalized and submitted to the Department Head for review and approval. The mark sheet is currently in <strong>read-only</strong> mode. If adjustments are required, please contact your Department Head to unlock the section.
              </Alert>
            )}

            {sectionStatus === "approved" && (
              <Alert
                icon={<IconCircleCheck size={18} />}
                title="Evaluations Approved by Department Head"
                color="teal"
                variant="light"
                radius="md"
              >
                Results for Section {activeCourse.section} were officially approved by {sectionMetadata.approved_by_name || "Department Head"}{sectionMetadata.approved_at ? ` on ${new Date(sectionMetadata.approved_at).toLocaleDateString()}` : ""}. Grades are confirmed.
              </Alert>
            )}

            {sectionStatus === "locked" && (
              <Alert
                icon={<IconLock size={18} />}
                title="Results Officially Locked"
                color="indigo"
                variant="light"
                radius="md"
              >
                Grades for Section {activeCourse.section} have been officially locked by {sectionMetadata.locked_by_name || "Department Head"}. All student evaluation records are frozen.
              </Alert>
            )}

            {sectionStatus === "draft" && sectionMetadata.remarks && (
              <Alert
                icon={<IconAlertCircle size={18} />}
                title="Reverted for Revision by Department Head"
                color="orange"
                variant="light"
                radius="md"
              >
                The Department Head returned this section for revision with note: <em>&ldquo;{sectionMetadata.remarks}&rdquo;</em>. You can now adjust student marks, save drafts, and click Finalize &amp; Submit again once ready.
              </Alert>
            )}
          </div>
        )}

        {/* Evaluation Table */}
        {loadingStudents ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader size="lg" color="blue" />
            <Text size="sm" c="dimmed">
              Loading enrolled students and mark sheets...
            </Text>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <IconUsers size={40} className="mx-auto mb-2 text-gray-400" />
            <Text fw={600} size="md">
              No students found for this class
            </Text>
            <Text size="xs" c="dimmed">
              Ensure students are assigned to Section {activeCourse?.section} in Batch{" "}
              {activeCourse?.batch_year || ""}.
            </Text>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table striped highlightOnHover withTableBorder withColumnBorders verticalSpacing="sm">
              <Table.Thead className="bg-gray-50 text-gray-700 text-xs uppercase font-bold">
                <Table.Tr>
                  <Table.Th style={{ width: "60px" }}>#</Table.Th>
                  <Table.Th style={{ minWidth: "140px" }}>Student ID</Table.Th>
                  <Table.Th style={{ minWidth: "180px" }}>Student Name</Table.Th>
                  <Table.Th style={{ width: "90px" }}>Gender</Table.Th>
                  <Table.Th style={{ minWidth: "160px" }}>Department</Table.Th>
                  <Table.Th style={{ minWidth: "110px" }}>Batch / Year</Table.Th>
                  <Table.Th style={{ minWidth: "110px" }}>Semester</Table.Th>
                  <Table.Th style={{ width: "90px" }}>Section</Table.Th>
                  <Table.Th style={{ minWidth: "125px" }}>Assessment (30%)</Table.Th>
                  <Table.Th style={{ minWidth: "125px" }}>Mid Exam (30%)</Table.Th>
                  <Table.Th style={{ minWidth: "125px" }}>Final Exam (40%)</Table.Th>
                  <Table.Th style={{ width: "100px" }}>Total (100)</Table.Th>
                  <Table.Th style={{ width: "90px" }}>Grade</Table.Th>
                  <Table.Th style={{ width: "90px" }}>Points</Table.Th>
                  <Table.Th style={{ minWidth: "180px" }}>Remarks / Feedback</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredStudents.map((student, idx) => {
                  const gradeData = calculateGrade(student.total_score);

                  return (
                    <Table.Tr key={student.student_id}>
                      <Table.Td className="text-gray-500 font-medium">{idx + 1}</Table.Td>

                      <Table.Td>
                        <Text fw={600} size="sm" className="font-mono text-blue-700">
                          {student.student_number}
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        <Text fw={600} size="sm" className="text-gray-900">
                          {student.full_name}
                        </Text>
                      </Table.Td>

                      <Table.Td>
                        <Badge size="xs" variant="light" color={student.gender === "Female" ? "pink" : "blue"}>
                          {student.gender}
                        </Badge>
                      </Table.Td>

                      {/* Department */}
                      <Table.Td>
                        <Text size="xs" fw={500} className="text-gray-700" lineClamp={2}>
                          {student.department_name}
                        </Text>
                      </Table.Td>

                      {/* Batch / Year */}
                      <Table.Td>
                        <Badge size="sm" variant="outline" color="indigo">
                          {student.batch_year}
                        </Badge>
                      </Table.Td>

                      {/* Semester */}
                      <Table.Td>
                        <Badge size="sm" variant="light" color="cyan">
                          {student.semester_name}
                        </Badge>
                      </Table.Td>

                      {/* Section */}
                      <Table.Td>
                        <Badge size="sm" variant="filled" color="violet">
                          {student.section}
                        </Badge>
                      </Table.Td>

                      {/* Continuous Assessment (0-30) */}
                      <Table.Td>
                        <NumberInput
                          value={student.continuous_assessment}
                          onChange={(val) =>
                            handleScoreChange(student.student_id, "continuous_assessment", Number(val) || 0)
                          }
                          min={0}
                          max={100}
                          step={0.5}
                          decimalScale={2}
                          size="xs"
                          radius="md"
                          disabled={isFormReadOnly}
                          className="w-24"
                        />
                      </Table.Td>

                      {/* Mid Exam (0-30) */}
                      <Table.Td>
                        <NumberInput
                          value={student.mid_exam}
                          onChange={(val) =>
                            handleScoreChange(student.student_id, "mid_exam", Number(val) || 0)
                          }
                          min={0}
                          max={100}
                          step={0.5}
                          decimalScale={2}
                          size="xs"
                          radius="md"
                          disabled={isFormReadOnly}
                          className="w-24"
                        />
                      </Table.Td>

                      {/* Final Exam (0-40) */}
                      <Table.Td>
                        <NumberInput
                          value={student.final_exam}
                          onChange={(val) =>
                            handleScoreChange(student.student_id, "final_exam", Number(val) || 0)
                          }
                          min={0}
                          max={100}
                          step={0.5}
                          decimalScale={2}
                          size="xs"
                          radius="md"
                          disabled={isFormReadOnly}
                          className="w-24"
                        />
                      </Table.Td>

                      {/* Total Score */}
                      <Table.Td>
                        <Badge
                          size="lg"
                          radius="md"
                          variant="light"
                          color={student.total_score >= 50 ? "teal" : "red"}
                          className="font-bold font-mono text-sm"
                        >
                          {student.total_score.toFixed(1)}
                        </Badge>
                      </Table.Td>

                      {/* Letter Grade */}
                      <Table.Td>
                        <Badge size="md" color={gradeData.color} variant="filled" className="font-bold">
                          {gradeData.grade}
                        </Badge>
                      </Table.Td>

                      {/* Grade Point */}
                      <Table.Td>
                        <Text size="sm" fw={600} className="font-mono text-gray-700">
                          {gradeData.points.toFixed(2)}
                        </Text>
                      </Table.Td>

                      {/* Feedback / Remarks */}
                      <Table.Td>
                        <TextInput
                          placeholder="Optional comment..."
                          value={student.feedback}
                          onChange={(e) =>
                            handleScoreChange(student.student_id, "feedback", e.target.value)
                          }
                          size="xs"
                          radius="md"
                          disabled={isFormReadOnly}
                        />
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </div>
        )}
      </Card>

      {/* Publish / Share Results Confirmation Modal */}
      <Modal
        opened={publishModalOpened}
        onClose={() => setPublishModalOpened(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="violet" size={24} radius="xl">
              <IconShare size={14} />
            </ThemeIcon>
            <Text fw={700}>Share Results with Students</Text>
          </Group>
        }
        radius="lg"
        centered
      >
        <Stack gap="md">
          <Text size="sm" className="text-gray-700">
            You are about to share the results for{" "}
            <strong>
              {activeCourse?.course_code} – Section {activeCourse?.section}
            </strong>{" "}
            with all enrolled students.
          </Text>
          <div className="bg-violet-50 p-3 rounded-lg border border-violet-200 text-xs text-violet-900 space-y-1">
            <p className="font-semibold">📢 What will happen:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>All evaluations for this class will be marked as <strong>Published</strong>.</li>
              <li>Each student will receive an <strong>email notification</strong> with their individual grade breakdown.</li>
              <li>Students will be able to view their results on their <strong>My Results</strong> dashboard page.</li>
            </ul>
          </div>
          {isPublished && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900">
              ⚠️ Results are already published. Sharing again will resend email notifications.
            </div>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setPublishModalOpened(false)}>
              Cancel
            </Button>
            <Button
              color="violet"
              leftSection={<IconBell size={16} />}
              onClick={handlePublishResults}
              loading={publishing}
            >
              Confirm &amp; Share
            </Button>
          </Group>
        </Stack>
      </Modal>
      {/* Confirmation Modal for Final Submission */}
      <Modal
        opened={submitModalOpened}
        onClose={() => setSubmitModalOpened(false)}
        title={
          <Group gap="xs">
            <ThemeIcon color="teal" size={24} radius="xl">
              <IconCheck size={14} />
            </ThemeIcon>
            <Text fw={700}>Submit &amp; Lock Final Grades</Text>
          </Group>
        }
        radius="lg"
        centered
      >
        <Stack gap="md">
          <Text size="sm" className="text-gray-700">
            Are you sure you want to finalize and submit student grades for{" "}
            <strong>
              {activeCourse?.course_code} - Section {activeCourse?.section}
            </strong>
            ?
          </Text>
          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-semibold">⚠️ Department Head Review Notice:</p>
            <p>
              Once finalized and submitted, results will be officially forwarded to the <strong>Department Head</strong> for review and approval. The mark sheet will become read-only until approved or unlocked by your Department Head.
            </p>
          </div>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={() => setSubmitModalOpened(false)}>
              Cancel
            </Button>
            <Button
              color="teal"
              leftSection={<IconSend size={16} />}
              onClick={() => handleSave(true)}
              loading={saving}
            >
              Confirm &amp; Submit
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default StudentEvaluationSection;

