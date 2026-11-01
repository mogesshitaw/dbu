/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Title,
  Text,
  Table,
  Button,
  Group,
  ActionIcon,
  Modal,
  Select,
  NumberInput,
  Loader,
  Alert,
  Badge,
  Stack,
} from "@mantine/core";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import { useForm } from "@mantine/form";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchFloors,
  fetchBlocks,
  addFloor,
  updateFloor,
  deleteFloor,
  clearError,
  clearSuccessMessage,
  Floor,
} from "@/store/slices/roomsSlice";
import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";
import { notifications } from "@mantine/notifications";



// Then adapt your form values to handle string inputs
interface FloorFormValues {
  block_id: string;
  floor_number: string;
  room_capacity: string;
}

const FloorsManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { floors, blocks, loading, error, successMessage } = useAppSelector((state) => state.rooms);

  const [modalOpened, setModalOpened] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  const form = useForm<FloorFormValues>({
    initialValues: {
      block_id: "",
      floor_number: "",
      room_capacity: "30",
    },
    validate: {
      block_id: (value) => (value ? null : "Block is required"),
      floor_number: (value) => (value ? null : "Floor number is required"),
    },
  });

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchFloors());
    dispatch(fetchBlocks());
  }, [dispatch]);

  // Clear messages after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        dispatch(clearSuccessMessage());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);
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
  // Handle form submission
  const handleSubmit = async (values: FloorFormValues) => {
    setActionLoading(true);
    try {
      const payload: Omit<Floor, 'floor_id'> = {
        block_id: parseInt(values.block_id),
        floor_number: parseInt(values.floor_number),
        room_capacity: parseInt(values.room_capacity),
        room_count: 0
      };

      if (editingFloor) {
        await dispatch(updateFloor({
          floorId: editingFloor.floor_id,
          floorData: payload
        })).unwrap();
      } else {
        await dispatch(addFloor(payload)).unwrap();
      }

      setModalOpened(false);
      form.reset();
      setEditingFloor(null);
    } catch (err) {

      notifications.show({
      title: "Error",
      message: typeof err === "string" ? err : "Failed to add floor",
      color: "red",
    });    } finally {
      setActionLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (floor: Floor) => {
    console.log('Editing floor:', floor);
    setEditingFloor(floor);
    form.setValues({
      block_id: floor.block_id.toString(),
      floor_number: floor.floor_number.toString(),
      room_capacity: (floor.room_capacity || 30).toString(),
    });
    setModalOpened(true);
  };

  // Handle delete
  const handleDelete = async (floorId: number) => {
    if (!confirm("Are you sure you want to delete this floor? This will also delete all associated rooms.")) {
      return;
    }

    setActionLoading(true);
    try {
      console.log('Deleting floor with ID:', floorId);
      await dispatch(deleteFloor(floorId)).unwrap();
      // Refresh the floors list after deletion
      dispatch(fetchFloors());
    } catch (err) {
      console.error('Error in handleDelete:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingFloor(null);
    form.reset();
  };

  const blockOptions = blocks.map(block => ({
    value: block.block_id.toString(),
    label: `${block.block_name} (${block.block_code})`
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={2} className="text-gray-900">
            Floors Management
          </Title>
          <Text c="dimmed">Manage floors within building blocks</Text>
        </div>
        <Button
          leftSection={<PlusIcon className="h-5 w-5" />}
          onClick={() => setModalOpened(true)}
          disabled={blocks.length === 0}
          loading={loading}
        >
          Add Floor
        </Button>
      </Group>

      {/* Error Alert */}
      {error && (
        <Alert color="red" title="Error" onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert color="green" title="Success" onClose={() => dispatch(clearSuccessMessage())}>
          {successMessage}
        </Alert>
      )}

      {/* No Blocks Warning */}
      {blocks.length === 0 && (
        <Alert color="yellow" title="No Blocks Found">
          You need to create blocks first before adding floors.
        </Alert>
      )}

      {/* Filters */}
      <Card withBorder radius="md">
        <Group>
          <Select
            label="Filter by Block"
            placeholder="All blocks"
            data={[
              { value: '', label: 'All blocks' },
              ...blocks.map(b => ({ value: b.block_id.toString(), label: b.block_name }))
            ]}
            value={selectedBlock}
            onChange={setSelectedBlock}
            clearable
            searchable
            className="flex-1"
          />
        </Group>
      </Card>

      {/* Floors Table */}
      <Card withBorder radius="md">
        {loading && floors.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader size="lg" />
            <Text ml="md">Loading floors...</Text>
          </div>
        ) : floors.length === 0 ? (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <Text c="dimmed" size="lg" mb="md">
              No floors found
            </Text>
            <Button
              leftSection={<PlusIcon className="h-5 w-5" />}
              onClick={() => setModalOpened(true)}
              disabled={blocks.length === 0}
              loading={loading}
            >
              Add Your First Floor
            </Button>
          </div>
        ) : (
          <Table.ScrollContainer minWidth={700}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Block</Table.Th>
                  <Table.Th>Floor Number</Table.Th>
                  <Table.Th>Room Capacity</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {floors
                  .filter(floor => !selectedBlock || floor.block_id === parseInt(selectedBlock))
                  .map((floor) => (
                    <Table.Tr key={floor.floor_id}>
                      <Table.Td>
                        <Badge variant="light" color="blue">
                          {floor.block_name} ({floor.block_code})
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={500}>G{floor.floor_number}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="outline" color="cyan">
                          {floor.room_capacity || 0} Rooms
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            color="blue"
                            variant="light"
                            onClick={() => handleEdit(floor)}
                            disabled={actionLoading}
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </ActionIcon>
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => handleDelete(floor.floor_id)}
                            disabled={actionLoading}
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
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={editingFloor ? `Edit Floor - G${editingFloor.floor_number}` : "Add New Floor"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Select
              label="Block"
              placeholder="Select a block"
              data={blockOptions}
              required
              {...form.getInputProps("block_id")}
            />
            <Select
              label="Floor Number"
              placeholder="Select a floor"
              data={(() => {
                const block = blocks.find(b => b.block_id === parseInt(form.values.block_id));
                if (!block || !block.floor_capacity) return [];
                // let length = floors.map(f => f.block_id === parseInt(form.values.block_id)).length;
                // Generate all possible floor numbers
                const allFloors = Array.from({ length: block.floor_capacity }, (_, i) => ({
                  value: i.toString(),
                  label: `G${i}`
                }));

                // Filter out already registered floors (except when editing the current floor)
                const existingFloorNumbers = floors.filter(f => f.block_id === parseInt(form.values.block_id) && (!editingFloor || f.floor_id !== editingFloor.floor_id))
                  .map(f => f.floor_number);
                return allFloors.filter(gf => !existingFloorNumbers.includes(parseInt(gf.value)));
              })()}
              required
              disabled={!form.values.block_id}
              {...form.getInputProps("floor_number")}
            />

            <NumberInput
              label="Room Capacity"
              placeholder="Number of rooms this floor can hold"
              min={1}
              required
              {...form.getInputProps("room_capacity")}
            />


            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                onClick={handleCloseModal}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={actionLoading}
              >
                {editingFloor ? "Update Floor" : "Add Floor"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  );
};

export default FloorsManager;