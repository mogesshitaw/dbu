 
import React, { useEffect, useState } from 'react';
import { Modal, TextInput, Button, Group, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import axios, { AxiosError } from 'axios';

// Define types
interface Batch {
  batch_id: number;
  batch_year: string;
  created_at?: string;
  updated_at?: string;
}

interface BatchFormProps {
  opened: boolean;
  onClose: () => void;
  onSuccess: () => void;
  batch?: Batch | null;
}

interface FormValues {
  batch_year: string;
}

interface ApiError {
  error?: string;
  message?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function BatchForm({ opened, onClose, onSuccess, batch }: BatchFormProps) {
  const isEditing = !!batch;
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      batch_year: '',
    },
    validate: {
      batch_year: (value) => {
        if (!value) return 'Batch year is required';
        if (value.length > 20) return 'Batch year must be less than 20 characters';
        if (value.length < 2) return 'Batch year must be at least 2 characters';
        return null;
      },
    },
  });

  // Reset form when modal opens/closes or batch changes
  useEffect(() => {
    if (opened) {
      if (batch) {
        form.setValues({
          batch_year: batch.batch_year,
        });
      } else {
        form.reset();
      }
    }
  }, [batch, opened]);

  const handleSubmit = async (values: FormValues) => {
    try {
      setLoading(true);

      const payload = {
        batch_year: values.batch_year.trim(),
      };

      if (isEditing && batch) {
        await axios.put(`${API_URL}/api/batches/${batch.batch_id}`, payload);
        notifications.show({
          title: 'Success',
          message: 'Batch updated successfully',
          color: 'green',
          autoClose: 3000,
        });
      } else {
        await axios.post(`${API_URL}/api/batches`, payload);
        notifications.show({
          title: 'Success',
          message: 'Batch created successfully',
          color: 'green',
          autoClose: 3000,
        });
      }

      onSuccess();
      onClose(); // Close modal after success
    } catch (error) {
      // Handle different types of errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiError>;
        const errorMessage = axiosError.response?.data?.error || 
                            axiosError.response?.data?.message || 
                            'Failed to save batch';
        
        notifications.show({
          title: 'Error',
          message: errorMessage,
          color: 'red',
          autoClose: 5000,
        });
      } else {
        notifications.show({
          title: 'Error',
          message: 'An unexpected error occurred',
          color: 'red',
          autoClose: 5000,
        });
      }
      console.error('Batch form error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text size="xl" fw={600}>
          {isEditing ? 'Edit Batch' : 'Create New Batch'}
        </Text>
      }
      size="md"
      radius="md"
      closeOnClickOutside={!loading}
      closeOnEscape={!loading}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <div className="space-y-4">
          <TextInput
            label="Batch Year/Name"
            placeholder="Enter batch year or name (e.g., First Year, Second Year, 2023-2024)"
            required
            disabled={loading}
            {...form.getInputProps('batch_year')}
            description="Enter batch identifier (2-20 characters)"
            error={form.errors.batch_year}
          />
          
          {form.values.batch_year && !form.errors.batch_year && (
            <Text size="sm" c="blue">
              Preview: Batch {form.values.batch_year}
            </Text>
          )}
        </div>

        <Group justify="flex-end" className="mt-8 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700"
            loading={loading}
            disabled={!form.isValid()}
          >
            {isEditing ? 'Update Batch' : 'Create Batch'}
          </Button>
        </Group>
      </form>
    </Modal>
  );
}