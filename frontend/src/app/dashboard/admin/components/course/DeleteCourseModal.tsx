 
"use client";

import React from "react";
import {
  Modal,
  Text,
  Button,
  Group,
  Stack,
  Alert,
} from "@mantine/core";
import { IconAlertCircle, IconTrash, IconX } from "@tabler/icons-react";

interface DeleteCourseModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting?: boolean;
  error?: string | null;
}

const DeleteCourseModal: React.FC<DeleteCourseModalProps> = ({
  opened,
  onClose,
  onConfirm,
  submitting = false,
  error = null,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconAlertCircle size={24} className="text-red-600" />
          <Text fw={700} size="xl">Confirm Deletion</Text>
        </Group>
      }
      centered
      size="sm"
      radius="xl"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack>
        <Text>
          Are you sure you want to delete this course? This action cannot be undone and will remove all associated data.
        </Text>
        
        {error && (
          <Alert 
            icon={<IconAlertCircle size={20} />} 
            title="Error" 
            color="red" 
            variant="light"
            className="rounded-xl border-2"
          >
            <Text className="text-sm">{error}</Text>
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={submitting}
            leftSection={<IconX size={16} />}
            radius="xl"
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={onConfirm}
            loading={submitting}
            leftSection={<IconTrash size={16} />}
            radius="xl"
            className="bg-gradient-to-r from-red-600 to-red-700"
          >
            {submitting ? "Deleting..." : "Delete Course"}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default DeleteCourseModal;