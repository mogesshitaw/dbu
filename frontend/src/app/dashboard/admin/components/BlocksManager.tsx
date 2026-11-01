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
  TextInput,
  Textarea,
  Loader,
  Alert,
  Badge,
  Stack,
} from "@mantine/core";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { useForm } from "@mantine/form";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchBlocks,
  addBlock,
  updateBlock,
  deleteBlock,
  clearError,
  clearSuccessMessage,
} from "@/store/slices/roomsSlice";
import { Authentication, Found, UnauthorizedAccess } from "@/app/auth/auth";

// Make sure this interface matches your Redux Block interface
interface Block {
  block_id: number;
  block_name: string;
  block_code: string;
  floor_capacity: number;
  description?: string;
  created_at?: string;
}

const BlocksManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { blocks, loading, error, successMessage } = useAppSelector((state) => state.rooms);

  const [modalOpened, setModalOpened] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const form = useForm({
    initialValues: {
      block_name: "",
      block_code: "",
      floor_capacity: 1,
      description: "",
    },
    validate: {
      block_name: (value) => (value.trim().length < 2 ? "Block name must be at least 2 characters" : null),
      block_code: (value) => (value.trim().length < 1 ? "Block code is required" : null),
    },
  });

  // Fetch blocks on component mount
  useEffect(() => {
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
  if (user === null) {
   return <Authentication />
  }
  if (user?.role !== 'admin') {
    return <UnauthorizedAccess />
  }
  // Handle form submission
  const handleSubmit = async (values: typeof form.values) => {
    // Client-side Duplicate Check
    const isDuplicate = blocks.some(block => {
      // If editing, skip the current block being edited
      if (editingBlock && block.block_id === editingBlock.block_id) {
        return false;
      }
      return (
        block.block_name.toLowerCase() === values.block_name.toLowerCase() ||
        block.block_code.toLowerCase() === values.block_code.toLowerCase()
      );
    });

    if (isDuplicate) {
      // Set error manually in the form or show notification (using alert here via slice if needed, but easier to use form error)
      form.setErrors({
        block_name: 'Block name or code already exists',
        block_code: 'Block name or code already exists'
      });
      return;
    }

    setActionLoading(true);
    try {
      if (editingBlock) {
        console.log('Updating block with ID:', editingBlock.block_id);
        await dispatch(updateBlock({
          blockId: editingBlock.block_id,
          blockData: values
        })).unwrap();
      } else {
        await dispatch(addBlock(values)).unwrap();
      }

      setModalOpened(false);
      form.reset();
      setEditingBlock(null);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      // Error is handled by the slice
    } finally {
      setActionLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (block: Block) => {
    console.log('Editing block:', block);
    setEditingBlock(block);
    form.setValues({
      block_name: block.block_name,
      block_code: block.block_code,
      floor_capacity: block.floor_capacity || 1,
      description: block.description || "",
    });
    setModalOpened(true);
  };

  // Handle delete
  const handleDelete = async (blockId: number) => {
    if (!confirm("Are you sure you want to delete this block? This will also delete all associated floors and rooms.")) {
      return;
    }

    setActionLoading(true);
    try {
      console.log('Deleting block with ID:', blockId);
      await dispatch(deleteBlock(blockId)).unwrap();
      // Refresh the blocks list after deletion
      dispatch(fetchBlocks());
    } catch (err) {
      console.error('Error in handleDelete:', err);
      // Error is handled by the slice
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpened(false);
    setEditingBlock(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Title order={2} className="text-gray-900">
            Building Blocks
          </Title>
          <Text c="dimmed">Manage building blocks and their details</Text>
        </div>
        <Button
          leftSection={<PlusIcon className="h-5 w-5" />}
          onClick={() => setModalOpened(true)}
          loading={loading}
        >
          Add Block
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

      {/* Blocks Table */}
      <Card withBorder radius="md">
        {loading && blocks.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader size="lg" />
            <Text ml="md">Loading blocks...</Text>
          </div>
        ) : blocks.length === 0 ? (
          <div className="text-center py-12">
            <BuildingStorefrontIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <Text c="dimmed" size="lg" mb="md">
              No blocks found
            </Text>
            <Button
              leftSection={<PlusIcon className="h-5 w-5" />}
              onClick={() => setModalOpened(true)}
              loading={loading}
            >
              Add Your First Block
            </Button>
          </div>
        ) : (
          <Table.ScrollContainer minWidth={600}>
            <Table verticalSpacing="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>Block Code</Table.Th>
                  <Table.Th>Block Name</Table.Th>
                  <Table.Th>Floor Capacity</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {blocks.map((block, index) => (
                  <Table.Tr key={block.block_id}>
                    <Table.Td> {index + 1}</Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue">
                        {block.block_code}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={500}>{block.block_name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="outline" color="gray">
                        {block.floor_capacity || 0} Floors
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text c="dimmed" size="sm">
                        {block.description || "No description"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          color="blue"
                          variant="light"
                          onClick={() => handleEdit(block)}
                          disabled={actionLoading}
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </ActionIcon>
                        <ActionIcon
                          color="red"
                          variant="light"
                          onClick={() => handleDelete(block.block_id)}
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
        title={editingBlock ? `Edit Block - ${editingBlock.block_name}` : "Add New Block"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Block Name"
              placeholder="e.g., Science Building"
              required
              {...form.getInputProps("block_name")}
            />
            <TextInput
              label="Block Code"
              placeholder="e.g., SB"
              required
              {...form.getInputProps("block_code")}
            />
            <TextInput
              label="Floor Capacity"
              placeholder="e.g., 5"
              type="number"
              required
              {...form.getInputProps("floor_capacity")}
            />
            <Textarea
              label="Description"
              placeholder="Optional description of the block"
              rows={3}
              {...form.getInputProps("description")}
            />

            {/* Debug info - remove in production */}
            {editingBlock && (
              <Text size="xs" c="dimmed">
                Block ID: {editingBlock.block_id}
              </Text>
            )}

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
                {editingBlock ? "Update Block" : "Add Block"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  );
};

export default BlocksManager;