"use client";

import React from "react";
import { Modal, Text, Button, Group,  } from "@mantine/core";

// components/ConfirmationModal.tsx
interface ConfirmationModalProps {
  opened: boolean;
  onClose: () => void;
  message: string;
  onConfirm: () => Promise<unknown>;
  loading?: boolean; // Add this line
  error?: string | null; // Also add error if you're using it
  actionType?: "deactivate" | "activate" | null; // And actionType if needed
}

 const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  opened,
  onClose,
  message,
  onConfirm,
  loading = false, // Add default value
  error = null, // Add default value
  actionType = null, // Add default value
}) => {
  // Your component implementation
  return (
    <Modal opened={opened} onClose={onClose} title="Confirmation">
      <Text>{message}</Text>
      {error && <Text color="red">{error}</Text>}
      <Group justify="flex-end" mt="md">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          color={actionType === 'deactivate' ? 'red' : 'blue'}
          onClick={onConfirm} 
          loading={loading}
        >
          {actionType === 'deactivate' ? 'Deactivate' : 'Activate'}
        </Button>
      </Group>
    </Modal>
  );
};

export default ConfirmationModal;