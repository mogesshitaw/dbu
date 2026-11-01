/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  TextInput,
  NumberInput,
  Button,
  Group,
  Stack,
  Box,
  Text,
  Paper,
  Grid,
  Select,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useAppDispatch } from "@/hooks/redux";
import { addCourse } from "@/store/slices/coursesSlice";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";
import { CheckCircleIcon, ExclamationCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";

interface AddCourseFormProps {
  onCourseAdded: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
}

const AddCourseForm: React.FC<AddCourseFormProps> = ({
  onCourseAdded,
  loading,
  setLoading,
}) => {
  const dispatch = useAppDispatch();

  const categories = ['Major Course', 'Support Course', 'Common Course', 'Core Course', 'Elective Course'];

  const form = useForm({
    initialValues: {
      course_code: "",
      course_name: "",
      credit_hour: 1,
      lec_hr: 0,
      lab_hr: 0,
      tut_hr: 0,
      category: ""
    },
    validate: {
      course_code: (value) => (value.length < 2 ? "Course code must be at least 2 characters" : null),
      course_name: (value) => (value.length < 3 ? "Course name must be at least 3 characters" : null),
      credit_hour: (value) => (value < 1 ? "Credit hours must be at least 1" : null),
      lec_hr: (value) => (value < 0 ? "Lecture hours cannot be negative" : null),
      lab_hr: (value) => (value < 0 ? "Lab hours cannot be negative" : null),
      tut_hr: (value) => (value < 0 ? "Tutorial hours cannot be negative" : null),
      category: (value) => (value.length === 0 ? "Please select category" : null),
    },
  });
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
    if (user?.role !== 'admin') {
      return <UnauthorizedAccess />
    }
  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true);
    try {
      await dispatch(addCourse({
        course_code: values.course_code.toUpperCase().trim(),
        course_name: values.course_name.trim(),
        credit_hour: values.credit_hour,
        lec_hr: values.lec_hr,
        lab_hr: values.lab_hr,
        tut_hr: values.tut_hr,
        category: values.category,
        department_id: 0
      })).unwrap();

      notifications.show({
        title: "Success!",
        message: "Course added successfully",
        color: "teal",
        icon: <CheckCircleIcon className="h-5 w-5" />,
      });

      form.reset();
      onCourseAdded();
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "Failed to create course",
        color: "red",
        icon: <ExclamationCircleIcon className="h-5 w-5" />,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Course Information */}
          <Paper withBorder p="md" radius="md">
            <Text fw={600} size="lg" mb="md">Course Information</Text>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Course Code"
                  placeholder="e.g., CS101, MATH201"
                  description="Unique identifier for the course"
                  required
                  {...form.getInputProps('course_code')}
                  classNames={{
                    input: "border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-200",
                    label: "font-semibold text-blue-700"
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Category"
                  placeholder="Select category"
                  data={categories.map(cat => ({ value: cat, label: cat }))}
                  description="Course classification type"
                  required
                  {...form.getInputProps('category')}
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
                  description="Full descriptive name of the course"
                  required
                  {...form.getInputProps('course_name')}
                  classNames={{
                    input: "border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-200",
                    label: "font-semibold text-blue-700"
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Credit Hours"
                  placeholder="Enter credit hours"
                  description="Academic credits for this course"
                  min={1}
                  max={10}
                  required
                  {...form.getInputProps('credit_hour')}
                  classNames={{
                    input: "border-2 border-blue-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 text-center transition-all duration-200",
                    label: "font-semibold text-blue-700"
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Lecture Hours"
                  placeholder="Enter lecture hours"
                  description="Weekly lecture hours"
                  min={0}
                  max={20}
                  {...form.getInputProps('lec_hr')}
                  classNames={{
                    input: "border-2 border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200/50 text-center transition-all duration-200",
                    label: "font-semibold text-green-700"
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Lab Hours"
                  placeholder="Enter lab hours"
                  description="Weekly lab hours"
                  min={0}
                  max={20}
                  {...form.getInputProps('lab_hr')}
                  classNames={{
                    input: "border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200/50 text-center transition-all duration-200",
                    label: "font-semibold text-purple-700"
                  }}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 3 }}>
                <NumberInput
                  label="Tutorial Hours"
                  placeholder="Enter tutorial hours"
                  description="Weekly tutorial hours"
                  min={0}
                  max={20}
                  {...form.getInputProps('tut_hr')}
                  classNames={{
                    input: "border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200/50 text-center transition-all duration-200",
                    label: "font-semibold text-orange-700"
                  }}
                />
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Category Information */}
          <Paper withBorder p="md" radius="md" bg="blue.0">
            <Text fw={600} size="sm" c="blue">Category Information</Text>
            <Text size="sm" c="dimmed" mt="xs">
              {form.values.category === "Major Course" && "Major courses are core requirements for specific degree programs."}
              {form.values.category === "Support Course" && "Support courses provide foundational knowledge for major courses."}
              {form.values.category === "Common Course" && "Common courses are general education requirements for all students."}
              {!form.values.category && "Select a category to see detailed information about course types."}
            </Text>
          </Paper>

          {/* Form Actions */}
          <Group justify="flex-end" mt="lg">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              disabled={loading}
              size="md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftSection={<PlusCircleIcon className="h-5 w-5" />}
              className="bg-blue-600 hover:bg-blue-700"
              size="md"
            >
              {loading ? "Creating Course..." : "Create Course"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
};

export default AddCourseForm;