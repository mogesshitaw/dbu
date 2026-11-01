/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo, ReactNode } from "react";
import {
  Modal,
  TextInput,
  Button,
  Group,
  Select,
  Alert,
  LoadingOverlay,
  Stack,
  Text,
  Divider,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import {
  IconInfoCircle,
  IconTrash,
  IconCalendar,
} from "@tabler/icons-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/* ===================== TYPES ===================== */
export interface Batch {
  batch_id: number;
  batch_year: string;
}

export interface Semester {
  id: number;
  semester: string;
  description: string | null;
}

export interface AcademicYear {
  semester: ReactNode;
  id: number;
  semester_id: number;
  batch_id: number;
  academic_year: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'inactive' | 'completed' | 'upcoming';
  semester_name?: string;
  batch_year?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Props {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batches: Batch[];
  academicYear: AcademicYear | null;
  onDelete?: (id: number) => Promise<void>;
  onStatusChange?: (id: number, newStatus: 'active' | 'inactive' | 'completed' | 'upcoming') => Promise<void>;
}

/* ===================== COMPONENT ===================== */
export default function AcademicYearForm({
  opened,
  onClose,
  onSuccess,
  batches,
  academicYear,
  onDelete,
}: Props) {
  const isEditing = Boolean(academicYear);
  const [loading, setLoading] = useState(false);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [hasReset, setHasReset] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  /* ===================== FORM ===================== */
  const form = useForm({
    initialValues: {
      semester_id: "",
      batch_id: "",
      academic_year: "",
      start_date: "",
      end_date: "",
      status: "upcoming" as 'active' | 'inactive' | 'upcoming' | 'completed',
    },
    validate: {
      semester_id: (v) => (!v ? "Semester is required" : null),
      batch_id: (v) => (!v ? "Batch is required" : null),
      academic_year: (v) => {
        if (!v) return "Academic year is required";
        if (!/^\d{4}-\d{4}$/.test(v)) return "Format: YYYY-YYYY";
        const [start, end] = v.split('-').map(Number);
        if (end !== start + 1) return "End year must be start year + 1";
        return null;
      },
      start_date: (v) => (!v ? "Start date is required" : null),
      end_date: (v) => (!v ? "End date is required" : null),
    },
  });

  /* ===================== FETCH SEMESTERS ===================== */
  useEffect(() => {
    if (!opened) return;

    const fetchSemesters = async () => {
      setLoadingSemesters(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/api/semesters`);
        setSemesters(res.data.data || []);
      } catch (error) {
        console.log(error)
        notifications.show({
          title: "Error",
          message: "Failed to load semesters",
          color: "red",
        });
      } finally {
        setLoadingSemesters(false);
      }
    };

    fetchSemesters();
    setHasReset(false);
  }, [opened]);

  /* ===================== SET FORM VALUES ===================== */
  useEffect(() => {
    if (!opened || hasReset) return;

    if (academicYear) {
      form.setValues({
        semester_id: String(academicYear.semester_id),
        batch_id: String(academicYear.batch_id),
        academic_year: academicYear.academic_year,
        start_date: academicYear.start_date.split('T')[0] || academicYear.start_date,
        end_date: academicYear.end_date.split('T')[0] || academicYear.end_date,
        status: academicYear.status,
      });
    } else {
      const y = new Date().getFullYear();
      form.setValues({
        semester_id: "",
        batch_id: "",
        academic_year: `${y}-${y + 1}`,
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(
          new Date().setMonth(new Date().getMonth() + 4)
        ).toISOString().split("T")[0],
        status: "upcoming",
      });
    }
    setHasReset(true);
  }, [opened, academicYear, hasReset, form]);

  /* ===================== OPTIONS ===================== */
  const semesterOptions = useMemo(() => {
    return Array.isArray(semesters)
      ? semesters
          .filter((s) => s?.semester && typeof s.semester === "string" && s.semester.trim() !== "")
          .map((s) => ({
            value: String(s.id),
            label: s.semester,
          }))
      : [];
  }, [semesters]);

  const batchOptions = useMemo(() => {
    return batches
      .filter(b => b?.batch_id && b?.batch_year)
      .map((b) => ({
        value: String(b.batch_id),
        label: `Batch ${b.batch_year}`,
      }));
  }, [batches]);

  const academicYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => {
      const year = currentYear - 2 + i;
      return {
        value: `${year}-${year + 1}`,
        label: `${year}-${year + 1}`,
      };
    });
  }, []);

  /* ===================== DATE VALIDATION ===================== */
  const validateDates = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return "End date must be after start date";
    }
    
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + 
                      (end.getMonth() - start.getMonth());
    
    if (diffMonths < 3) {
      return "Academic year should be at least 3 months";
    }
    
    if (diffMonths > 12) {
      return "Academic year cannot exceed 12 months";
    }
    
    return null;
  };

  /* ===================== SUBMIT ===================== */
  const handleSubmit = async (values: typeof form.values) => {
    try {
      // Date validation
      const dateError = validateDates(values.start_date, values.end_date);
      if (dateError) {
        notifications.show({
          title: "Error",
          message: dateError,
          color: "red",
        });
        return;
      }

      setLoading(true);

      const payload = {
        semester_id: Number(values.semester_id),
        batch_id: Number(values.batch_id),
        academic_year: values.academic_year,
        start_date: values.start_date,
        end_date: values.end_date,
        status: values.status,
      };

      if (isEditing && academicYear) {
        await axios.put(
          `${API_BASE_URL}/api/academic-years/${academicYear.id}`,
          payload
        );
        notifications.show({
          title: "Success",
          message: "Academic year updated successfully",
          color: "green",
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/academic-years`, payload);
        notifications.show({
          title: "Success",
          message: "Academic year created successfully",
          color: "green",
        });
      }

      onSuccess();
      onClose();
    } catch (e: any) {
      notifications.show({
        title: "Error",
        message: e.response?.data?.error || "Failed to save academic year",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ===================== DELETE HANDLER ===================== */
  const handleDelete = async () => {
    if (!academicYear || !onDelete) return;
    
    try {
      setLoading(true);
      await onDelete(academicYear.id);
      setDeleteConfirmOpen(false);
      onClose();
      notifications.show({
        title: "Success",
        message: "Academic year deleted successfully",
        color: "green",
      });
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.response?.data?.error || "Failed to delete academic year",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ===================== RENDER ===================== */
  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={
        <Group gap="sm">
          <IconCalendar size={24} className="text-blue-600" />
          <div>
            <Text fw={600} size="lg">
              {isEditing ? "Edit Academic Year" : "Create Academic Year"}
            </Text>
          </div>
        </Group>
      }
      size="lg"
      radius="lg"
      padding="xl"
    >
      <LoadingOverlay visible={loadingSemesters || loading} />
      
      <form onSubmit={form.onSubmit(handleSubmit)} className="space-y-4">
        <Stack gap="md">
          <Select
            label="Semester"
            placeholder="Select semester"
            data={semesterOptions}
            {...form.getInputProps("semester_id")}
            withAsterisk
            searchable
            size="md"
            disabled={loadingSemesters}
          />

          <Select
            label="Batch"
            placeholder="Select batch"
            data={batchOptions}
            {...form.getInputProps("batch_id")}
            withAsterisk
            searchable
            size="md"
          />

          <Select
            label="Academic Year"
            placeholder="Select academic year"
            data={academicYearOptions}
            {...form.getInputProps("academic_year")}
            withAsterisk
            searchable
            size="md"
          />

          <Group grow>
            <TextInput
              type="date"
              label="Start Date"
              placeholder="Select start date"
              {...form.getInputProps("start_date")}
              withAsterisk
              size="md"
            />
            <TextInput
              type="date"
              label="End Date"
              placeholder="Select end date"
              {...form.getInputProps("end_date")}
              withAsterisk
              size="md"
            />
          </Group>

          {!isEditing && (
            <Select
              label="Status"
              placeholder="Select status"
              data={[
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'completed', label: 'Completed' },
              ]}
              {...form.getInputProps("status")}
              withAsterisk
              size="md"
            />
          )}

          {/* Date Validation Messages */}
          {form.values.start_date && form.values.end_date && (
            (() => {
              const error = validateDates(form.values.start_date, form.values.end_date);
              if (error) {
                return (
                  <Alert color="yellow" icon={<IconInfoCircle size={16} />}>
                    {error}
                  </Alert>
                );
              }
              return null;
            })()
          )}

          {/* Warning if no semesters or batches */}
          {(semesters.length === 0 || batches.length === 0) && (
            <Alert color="yellow" icon={<IconInfoCircle />}>
              Please create{" "}
              {semesters.length === 0 && "semesters"}
              {semesters.length === 0 && batches.length === 0 && " and "}
              {batches.length === 0 && "batches"} first.
            </Alert>
          )}

          <Divider my="md" />

          {/* Action Buttons */}
          <Group justify="space-between">
            {isEditing && onDelete && (
              <>
                <Button
                  color="red"
                  variant="light"
                  onClick={() => setDeleteConfirmOpen(true)}
                  leftSection={<IconTrash size={16} />}
                  loading={loading}
                >
                  Delete
                </Button>

                {/* Delete Confirmation Modal */}
                <Modal
                  opened={deleteConfirmOpen}
                  onClose={() => setDeleteConfirmOpen(false)}
                  title="Confirm Delete"
                  size="sm"
                  centered
                >
                  <Stack>
                    <Alert color="red" icon={<IconInfoCircle />}>
                      Are you sure you want to delete this academic year? This action cannot be undone.
                    </Alert>
                    <Group justify="flex-end">
                      <Button variant="subtle" onClick={() => setDeleteConfirmOpen(false)}>
                        Cancel
                      </Button>
                      <Button color="red" onClick={handleDelete} loading={loading}>
                        Delete
                      </Button>
                    </Group>
                  </Stack>
                </Modal>
              </>
            )}
            
            <Group justify="flex-end" style={{ flex: 1 }}>
              <Button variant="subtle" onClick={onClose} size="md">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!semesters.length || !batches.length}
                loading={loading}
                size="md"
                className="bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {isEditing ? "Update" : "Create"}
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
