/* eslint-disable */
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Container,
  Title,
  Card,
  Table,
  Button,
  Group,
  Text,
  LoadingOverlay,
  Badge,
  ActionIcon,
  Paper,
  TextInput,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconEdit, IconTrash, IconRefresh, IconSearch } from '@tabler/icons-react';

import { 
  fetchBatches, 
  deleteBatch, 
  selectBatches, 
  selectBatchesLoading, 
  selectBatchesError,
  selectBatchesSuccessMessage,
  selectCurrentBatch,
  clearError,
  clearSuccessMessage,
} from '../../../../store/slices/batchSlice';
import BatchForm from './batchForm';
import { Authentication, Found, UnauthorizedAccess } from '@/app/auth/auth';

export default function BatchManagement() {
  const dispatch = useDispatch();
  const batches = useSelector(selectBatches);
  const loading = useSelector(selectBatchesLoading);
  const error = useSelector(selectBatchesError);
  const successMessage = useSelector(selectBatchesSuccessMessage);
  const currentBatch = useSelector(selectCurrentBatch);

  const [formOpened, setFormOpened] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchBatches());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      notifications.show({
        title: 'Success',
        message: successMessage,
        color: 'green',
      });
      dispatch(clearSuccessMessage());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      notifications.show({
        title: 'Error',
        message: error,
        color: 'red',
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);
 const [currentuser, setcurrentUser] = useState(null);
       useEffect(() => {
         const checkAuth = async () => {
           const foundUser = await Found();
           setcurrentUser(foundUser);
         };
         checkAuth();
       }, []);
  
   
  const handleDelete = useCallback((batches) => {
    console.log('handleDelete called for semester:', batches);
    // Callback functions
       if (!confirm("Are you sure you want to delete this batche?")) {
        return;
      }
        
         try {
        console.log('Deleting block with ID:', batches.batch_id);
           dispatch(deleteBatch(batches.batch_id)).unwrap();            // Refresh the blocks list after deletion
            dispatch(fetchBatches());
          } catch (err) {
            console.error('Error in handleDelete:', err);
            // Error is handled by the slice
          }
        
      
    }, [dispatch]);
  const handleEdit = useCallback((batch) => {
    setEditingBatch(batch);
    setFormOpened(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpened(false);
    setEditingBatch(null);
  }, []);

  const handleFormSuccess = useCallback(() => {
    handleFormClose();
  }, [handleFormClose]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchBatches());
  }, [dispatch]);

  const getBatchBadgeColor = useCallback((batchYear) => {
    const year = batchYear.toString();
    if (year.includes('1')) return 'blue';
    if (year.includes('2')) return 'teal';
    if (year.includes('3')) return 'green';
    if (year.includes('4')) return 'orange';
    if (year.includes('5')) return 'red';
    if (year.includes('6')) return 'purple';
    if (year.match(/\d{4}/)) return 'indigo';
    return 'gray';
  }, []);

  // Filter batches based on search term
const filteredBatches = useMemo(() => {
  // Early returns for edge cases
  if (!Array.isArray(batches)) return [];
  if (!searchTerm?.trim()) return batches;

  const searchLower = searchTerm.toLowerCase().trim();
     if (currentuser === null ) { 
        return <Authentication />;
    }
      if (currentuser?.role !== 'admin') {
        return <UnauthorizedAccess />
      }
  return batches.filter(batch => {
    // Use optional chaining and nullish coalescing for safety
    const batchYear = batch?.batch_year?.toString() ?? '';
    const batchId = batch?.batch_id?.toString() ?? '';    
    return (
      batchYear.toLowerCase().includes(searchLower) ||
      batchId.includes(searchTerm)  // Case-sensitive for IDs
    );
  });
}, [batches, searchTerm]);
  const i = 0;
  const rows = useMemo(() => filteredBatches.map((batch, index) => (
    <Table.Tr key={batch.batch_id} className="hover:bg-gray-50">
      <Table.Td className="font-semibold">{index +1}</Table.Td>
      <Table.Td>
        <Badge color={getBatchBadgeColor(batch.batch_year)} variant="light" size="lg">
          {batch.batch_year}
        </Badge>
      </Table.Td>
      <Table.Td className="text-sm text-gray-600">
        {new Date(batch.created_at).toLocaleDateString()}
      </Table.Td>
      <Table.Td className="text-sm text-gray-600">
        {new Date(batch.updated_at).toLocaleDateString()}
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => handleEdit(batch)}
            className="hover:bg-blue-50"
            aria-label={`Edit batch ${batch.batch_year}`}
          >
            <IconEdit size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => handleDelete(batch)}
            className="hover:bg-red-50"
            aria-label={`Delete batch ${batch.batch_year}`}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  )), [filteredBatches, getBatchBadgeColor, handleEdit, handleDelete]);

  return (
    <Container size="xl" className="py-8">
      <div className="mb-8">
        <Group justify="space-between" className="mb-6">
          <div>
            <Title order={1} className="text-3xl font-bold text-gray-900">
              Batch Management
            </Title>
            <Text c="dimmed" className="mt-2">
              Manage academic batches with flexible year/name identifiers
            </Text>
            {currentBatch && (
              <Text size="sm" className="mt-1 text-green-600">
                Currently viewing: {currentBatch.batch_year} - {currentBatch.department_name}
              </Text>
            )}
          </div>
          <Group>
            <TextInput
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftSection={<IconSearch size={16} />}
              className="w-64"
            />
            <Button
              variant="outline"
              leftSection={<IconRefresh size={16} />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => setFormOpened(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Batch
            </Button>
          </Group>
        </Group>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <LoadingOverlay visible={loading} />
          {filteredBatches.length === 0 && !loading ? (
            <Paper className="text-center py-12">
              <Text c="dimmed" size="lg" className="mb-4">
                {searchTerm ? 'No batches match your search' : 'No batches found'}
              </Text>
              <Text size="sm" c="dimmed" className="mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Create batches with year numbers (2024), academic years (2023-2024), or names (First Year)'
                }
              </Text>
              {!searchTerm && (
                <Button
                  onClick={() => setFormOpened(true)}
                  leftSection={<IconPlus size={16} />}
                >
                  Create your first batch
                </Button>
              )}
              {searchTerm && (
                <Button
                  variant="subtle"
                  onClick={() => setSearchTerm('')}
                >
                  Clear search
                </Button>
              )}
            </Paper>
          ) : (
            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>#</Table.Th>
                    <Table.Th>Batch Year</Table.Th>
                    <Table.Th>Created Date</Table.Th>
                    <Table.Th>Updated Date</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Card>
      </div>

      <BatchForm
        opened={formOpened}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        batch={editingBatch}
      />
    </Container>
  );
}