import React, { useState } from "react";
import {
  PlusIcon,
  CalendarDaysIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  Container,
  Title,
  Text,
  Table,
  Button,
  Group,
  TextInput,
  Select,
  ActionIcon,
  Box,
  Stack,
  Grid,
  Card,
  Alert,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";

// --- Type Definitions ---
interface AcademicYear {
  id: number;
  year: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  semester: string;
}

const AcademicYearsSection: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([
    {
      id: 1,
      year: "2024–2025",
      startDate: "2024-09-01",
      endDate: "2025-06-30",
      semester: "1st Semester",
    },
    {
      id: 2,
      year: "2024–2025",
      startDate: "2025-02-01",
      endDate: "2025-06-30",
      semester: "2nd Semester",
    },
  ]);

  // Form for new academic year
  const newYearForm = useForm({
    initialValues: {
      year: "",
      semester: "",
      startDate: "",
      endDate: "",
    },
    validate: {
      year: (value) => (value.trim().length < 1 ? 'Year is required' : null),
      semester: (value) => (value.trim().length < 1 ? 'Semester is required' : null),
      startDate: (value) => (value.trim().length < 1 ? 'Start date is required' : null),
      endDate: (value) => (value.trim().length < 1 ? 'End date is required' : null),
    },
  });

  const handleAddYear = (values: typeof newYearForm.values) => {
    const newId = academicYears.length
      ? Math.max(...academicYears.map((ay) => ay.id)) + 1
      : 1;
    
    setAcademicYears([
      ...academicYears,
      {
        id: newId,
        year: values.year,
        startDate: values.startDate,
        endDate: values.endDate,
        semester: values.semester,
      },
    ]);

    newYearForm.reset();
    
    notifications.show({
      title: 'Success',
      message: 'Academic year added successfully',
      color: 'green',
    });
  };

  const handleChange = (
    id: number,
    field: keyof AcademicYear,
    value: string
  ) => {
    setAcademicYears((prevYears) =>
      prevYears.map((ay) =>
        ay.id === id ? { ...ay, [field]: value } : ay
      )
    );
  };

  const handleRemoveYear = (yearId: number) => {
    setAcademicYears((prevYears) => prevYears.filter((ay) => ay.id !== yearId));
    
    notifications.show({
      title: 'Success',
      message: 'Academic year removed successfully',
      color: 'green',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting academic years:", academicYears);
    
    notifications.show({
      title: 'Success',
      message: 'Academic years submitted successfully',
      color: 'green',
    });
  };

  const semesterOptions = [
    { value: "1st Semester", label: "1st Semester" },
    { value: "2nd Semester", label: "2nd Semester" },
    { value: "Summer", label: "Summer" },
  ];

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Box>
          <Title order={1} mb="xs" className="flex items-center">
            <CalendarDaysIcon className="h-6 w-6 mr-2 text-blue-600" />
            Academic Years & Semesters
          </Title>
          <Text c="dimmed">
            Define academic years and semester periods for course scheduling.
          </Text>
        </Box>

        {/* Add New Academic Year Form */}
        <Card withBorder radius="md" p="lg">
          <Title order={2} size="h4" mb="md">Add New Academic Year</Title>
          <form onSubmit={newYearForm.onSubmit(handleAddYear)}>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <TextInput
                  label="Academic Year"
                  placeholder="e.g. 2024–2025"
                  {...newYearForm.getInputProps('year')}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <Select
                  label="Semester"
                  placeholder="Select Semester"
                  data={semesterOptions}
                  {...newYearForm.getInputProps('semester')}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                <TextInput
                  label="Start Date"
                  type="date"
                  {...newYearForm.getInputProps('startDate')}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                <TextInput
                  label="End Date"
                  type="date"
                  {...newYearForm.getInputProps('endDate')}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 1 }}>
                <Box style={{ display: 'flex', alignItems: 'end', height: '100%' }}>
                  <Button 
                    type="submit" 
                    leftSection={<PlusIcon className="h-4 w-4" />}
                    fullWidth
                  >
                    Add
                  </Button>
                </Box>
              </Grid.Col>
            </Grid>
          </form>
        </Card>

        {/* Academic Years Table */}
        <Card withBorder radius="md" p={0}>
          <Box p="md" className="bg-blue-600">
            <Title order={2} size="h4" c="white">Academic Years List</Title>
          </Box>
          
          {academicYears.length === 0 ? (
            <Box py="xl" style={{ textAlign: 'center' }}>
              <Text c="dimmed" size="lg">
                No academic years available.
              </Text>
              <Text c="dimmed" size="sm" mt="xs">
                Add a new academic year using the form above.
              </Text>
            </Box>
          ) : (
            <Box style={{ overflowX: 'auto' }}>
              <Table.ScrollContainer minWidth={600}>
                <Table verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Academic Year</Table.Th>
                      <Table.Th>Semester</Table.Th>
                      <Table.Th>Start Date</Table.Th>
                      <Table.Th>End Date</Table.Th>
                      <Table.Th style={{ textAlign: 'center' }}>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {academicYears.map(({ id, year, startDate, endDate, semester }) => (
                      <Table.Tr key={id}>
                        <Table.Td>
                          <TextInput
                            value={year}
                            placeholder="e.g. 2024–2025"
                            onChange={(e) => handleChange(id, "year", e.target.value)}
                            size="xs"
                            required
                          />
                        </Table.Td>
                        <Table.Td>
                          <Select
                            value={semester}
                            onChange={(value) => handleChange(id, "semester", value || "")}
                            data={semesterOptions}
                            size="xs"
                            required
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            type="date"
                            value={startDate}
                            onChange={(e) => handleChange(id, "startDate", e.target.value)}
                            size="xs"
                            required
                          />
                        </Table.Td>
                        <Table.Td>
                          <TextInput
                            type="date"
                            value={endDate}
                            onChange={(e) => handleChange(id, "endDate", e.target.value)}
                            size="xs"
                            required
                          />
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" justify="center">
                            <ActionIcon
                              color="red"
                              variant="light"
                              onClick={() => handleRemoveYear(id)}
                              aria-label="Remove academic year"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Box>
          )}
        </Card>

        {/* Submit Button */}
        {academicYears.length > 0 && (
          <Card withBorder radius="md" p="lg">
            <Group justify="flex-end">
              <Button
                type="button"
                onClick={handleSubmit}
                size="md"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Submit All Academic Years
              </Button>
            </Group>
          </Card>
        )}

        {/* Information Alert */}
        <Alert color="blue" title="Information">
          <Text size="sm">
            All academic years and semesters will be saved to the database when you click &quot;Submit All Academic Years&quot;.
            You can edit individual fields directly in the table.
          </Text>
        </Alert>
      </Stack>
    </Container>
  );
};

export default AcademicYearsSection;