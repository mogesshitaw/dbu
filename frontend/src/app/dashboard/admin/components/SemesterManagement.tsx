// SemesterManagement.tsx - For managing semester names only
import React, { useEffect, useState } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Group, 
  Text, 
  Modal, 
  TextInput, 
  Textarea,
  ActionIcon,
  Badge,
  LoadingOverlay,
  
} from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconRefresh } from '@tabler/icons-react';
import axios from 'axios';
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Semester {
  id: number;
  semester: string;
  description: string | null;
  created_at: string;
}

const SemesterManagement = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [formData, setFormData] = useState({
    semester_name: '',
    description: ''
  });

  const fetchSemesters = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/semesters`);
      setSemesters(response.data.data);
    } catch (error) {
      console.error('Error fetching semesters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingSemester) {
        await axios.put(`${API_URL}/api/semesters/${editingSemester.id}`, formData);
      } else {
        await axios.post(`${API_URL}/api/semesters`, formData);
      }
      
      setModalOpen(false);
      setEditingSemester(null);
      setFormData({ semester_name: '', description: '' });
      fetchSemesters();
    } catch (error) {
      console.error('Error saving semester:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (semester: Semester) => {
    setEditingSemester(semester);
    setFormData({
      semester_name: semester.semester,
      description: semester.description || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this semester?')) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/api/semesters/${id}`);
      fetchSemesters();
    } catch (error) {
      console.error('Error deleting semester:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  return (
    <div>
      <Card shadow="sm" padding="lg">
        <Group justify="space-between" mb="md">
          <div>
            <Text size="xl" fw={700}>Semester Names Management</Text>
            <Text c="dimmed" size="sm">Create and manage semester names (e.g., Semester 1, Semester 2)</Text>
          </div>
          <Group>
            <Button 
              leftSection={<IconRefresh size={16} />}
              onClick={fetchSemesters}
              variant="outline"
            >
              Refresh
            </Button>
            <Button 
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                setEditingSemester(null);
                setFormData({ semester_name: '', description: '' });
                setModalOpen(true);
              }}
            >
              Add Semester
            </Button>
          </Group>
        </Group>

        <LoadingOverlay visible={loading} />
        
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Semester Name</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {semesters.map((semester) => (
              <Table.Tr key={semester.id}>
                <Table.Td>{semester.id}</Table.Td>
                <Table.Td>
                  <Badge color="blue" variant="light">
                    {semester.semester}
                  </Badge>
                </Table.Td>
                <Table.Td>{new Date(semester.created_at).toLocaleDateString()}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon 
                      variant="subtle" 
                      color="blue" 
                      onClick={() => handleEdit(semester)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon 
                      variant="subtle" 
                      color="red" 
                      onClick={() => handleDelete(semester.id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSemester ? "Edit Semester" : "Add New Semester"}
      >
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Semester Name"
            placeholder="e.g., Semester 1, Semester 2, Summer"
            value={formData.semester_name}
            onChange={(e) => setFormData({...formData, semester_name: e.target.value})}
            required
            mb="md"
          />
          
          <Textarea
            label="Description"
            placeholder="Optional description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            mb="md"
          />
          
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {editingSemester ? 'Update' : 'Create'}
            </Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
};

export default SemesterManagement;