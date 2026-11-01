/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  Modal,
  TextInput,
  NumberInput,
  Button,
  Group,
  Stack,
  Grid,
  Text,
  Select,
} from "@mantine/core";
import { IconEdit, IconCheck, IconX } from "@tabler/icons-react";

interface EditCourseModalProps {
  opened: boolean;
  onClose: () => void;
  editingCourse: any;
  editForm: {
    course_code: string;
    course_name: string;
    credit_hour: number;
    lec_hr: number;
    lab_hr: number;
    tut_hr: number;
    category: string;
  };
  setEditForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting?: boolean;
  categories: string[];
}

const EditCourseModal: React.FC<EditCourseModalProps> = ({
  opened,
  onClose,
  editForm,
  setEditForm,
  onSubmit,
  submitting = false,
  categories,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconEdit size={24} className="text-blue-600" />
          <Text fw={700} size="xl">Edit Course</Text>
        </Group>
      }
      size="lg"
      centered
      radius="xl"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <form onSubmit={onSubmit}>
        <Stack gap="lg">
          <Grid gutter="lg">
            <Grid.Col span={12}>
              <TextInput
                label="Course Code"
                placeholder="e.g., CS101"
                value={editForm.course_code}
                onChange={(e) => setEditForm((prev: any) => ({ ...prev, course_code: e.target.value }))}
                required
                size="md"
                classNames={{
                  input: "border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-200",
                  label: "font-semibold text-blue-700"
                }}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                label="Course Name"
                placeholder="e.g., Introduction to Computer Science"
                value={editForm.course_name}
                onChange={(e) => setEditForm((prev: any) => ({ ...prev, course_name: e.target.value }))}
                required
                size="md"
                classNames={{
                  input: "border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-200",
                  label: "font-semibold text-blue-700"
                }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <NumberInput
                label="Credit Hours"
                value={editForm.credit_hour}
                onChange={(value) => setEditForm((prev: any) => ({ ...prev, credit_hour: Number(value) }))}
                min={1}
                max={10}
                required
                size="md"
                classNames={{
                  input: "border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 text-center transition-all duration-200",
                  label: "font-semibold text-blue-700"
                }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <NumberInput
                label="Lecture Hours"
                value={editForm.lec_hr}
                onChange={(value) => setEditForm((prev: any) => ({ ...prev, lec_hr: Number(value) }))}
                min={0}
                max={20}
                size="md"
                classNames={{
                  input: "border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200/50 text-center transition-all duration-200",
                  label: "font-semibold text-green-700"
                }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <NumberInput
                label="Lab Hours"
                value={editForm.lab_hr}
                onChange={(value) => setEditForm((prev: any) => ({ ...prev, lab_hr: Number(value) }))}
                min={0}
                max={20}
                size="md"
                classNames={{
                  input: "border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 text-center transition-all duration-200",
                  label: "font-semibold text-purple-700"
                }}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <NumberInput
                label="Tutorial Hours"
                value={editForm.tut_hr}
                onChange={(value) => setEditForm((prev: any) => ({ ...prev, tut_hr: Number(value) }))}
                min={0}
                max={20}
                size="md"
                classNames={{
                  input: "border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200/50 text-center transition-all duration-200",
                  label: "font-semibold text-orange-700"
                }}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <Select
                label="Category"
                value={editForm.category}
                onChange={(value) => setEditForm((prev: any) => ({ ...prev, category: value || '' }))}
                data={categories.map(cate => ({
                  value: cate,
                  label: cate,
                }))}
                required
                size="md"
                classNames={{
                  input: "border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-200",
                  label: "font-semibold text-blue-700"
                }}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              color="gray"
              onClick={onClose}
              disabled={submitting}
              leftSection={<IconX size={18} />}
              size="md"
              radius="xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="blue"
              loading={submitting}
              leftSection={<IconCheck size={18} />}
              size="md"
              radius="xl"
              className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg"
            >
              {submitting ? "Updating..." : "Update Course"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
};

export default EditCourseModal;