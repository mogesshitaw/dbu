/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  Text,
  Group,
  Badge,
  ActionIcon,
  Menu,
  Stack,
  Grid,
  Select,
  Button,
  LoadingOverlay,
  Paper,
  Avatar,
  Modal,
  Divider,
  ScrollArea,
  Tooltip,
  TextInput,
  Textarea,
  Notification,
  Alert,
} from "@mantine/core";
import {
  IconCheck,
  IconX,
  IconClock,
  IconDotsVertical,
  IconFilter,
  IconRefresh,
  IconMessage,
  IconUser,
  IconSchool,
  IconCalendar,
  IconEye,
  IconTrash,
  IconPlus,
  IconSearch,
} from "@tabler/icons-react";
import { useAppDispatch, useFeedback } from "@/hooks/redux";
import { 
  fetchFeedbacks, 
  updateFeedbackStatus, 
  setStatusFilter, 
  setRoleFilter,
  deleteFeedback,
  submitFeedback,
  searchFeedbacks
} from "@/store/slices/feedbackSlice";
import { useDisclosure } from "@mantine/hooks";
import { Authentication, Found } from "@/app/auth/auth";

const ViewFeedbackSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { feedbacks, loading, error, filters, searchResults } = useFeedback();
  const [opened, { open, close }] = useDisclosure(false);
  const [submitOpened, { open: openSubmit, close: closeSubmit }] = useDisclosure(false);
  const [deleteOpened, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form state for new feedback
  const [formData, setFormData] = useState({
    id_number: "",
    category: "",
    message: "",
    role:""
  });

  useEffect(() => {
    dispatch(fetchFeedbacks());
  }, [dispatch]);

  const [currentUser, setCurrentUser] = useState<any>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setCurrentUser(foundUser);
    };
    checkAuth();
  }, []);

  if (currentUser === null) {
    return <Authentication />;
  }

  const handleStatusUpdate = async (id: number, status: 'approved' | 'rejected' | 'pending') => {
    try {
      await dispatch(updateFeedbackStatus({ id, status })).unwrap();
      showNotification('success', `Feedback ${status} successfully`);
    } catch (err) {
      showNotification('error', 'Failed to update feedback status');
    }
  };

  const handleDeleteFeedback = async (id: number) => {
    try {
      await dispatch(deleteFeedback(id)).unwrap();
      closeDelete();
      showNotification('success', 'Feedback deleted successfully');
    } catch (err) {
      showNotification('error', 'Failed to delete feedback');
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await dispatch(submitFeedback(formData)).unwrap();
      closeSubmit();
      setFormData({ id_number: "", category: "", message: "", role:"" });
      showNotification('success', 'Feedback submitted successfully');
      dispatch(fetchFeedbacks());
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to submit feedback');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      dispatch(searchFeedbacks(query));
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <IconCheck size={18} className="text-green-600" />;
      case "pending":
        return <IconClock size={18} className="text-yellow-500" />;
      case "rejected":
        return <IconX size={18} className="text-red-600" />;
      default:
        return <IconClock size={18} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "green";
      case "pending":
        return "yellow";
      case "rejected":
        return "red";
      default:
        return "gray";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student":
        return <IconUser size={16} />;
      case "instructor":
        return <IconSchool size={16} />;
      default:
        return <IconUser size={16} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "student":
        return "blue";
      case "instructor":
        return "violet";
      default:
        return "gray";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const displayFeedbacks = searchQuery.trim() ? searchResults : feedbacks;
  const filteredFeedbacks = displayFeedbacks.filter(feedback => {
    const statusMatch = (filters.status === 'all' || feedback.status === filters.status) && feedback.department_id===currentUser.department_id && feedback.mes_category==="department";
    const roleMatch = (filters.role === 'all' || feedback.role_type === filters.role) && feedback.department_id===currentUser.department_id && feedback.mes_category==="department" ;
    return statusMatch && roleMatch;
  });

  const stats = {
    total: feedbacks.filter((feedback) =>feedback.department_id === currentUser.department_id).length,
    pending: feedbacks.filter(feedback => feedback.status === 'pending' && feedback.department_id===currentUser.department_id ).length,
    approved: feedbacks.filter(feedback => feedback.status === 'approved' && feedback.department_id===currentUser.department_id).length,
    rejected: feedbacks.filter(feedback => feedback.status === 'rejected' && feedback.department_id===currentUser.department_id).length,
  };

  const openFeedbackModal = (feedback: any) => {
    setSelectedFeedback(feedback);
    open();
  };

  const openDeleteModal = (feedback: any) => {
    setSelectedFeedback(feedback);
    openDelete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <Notification 
            color={notification.type === 'success' ? 'teal' : 'red'}
            title={notification.type === 'success' ? 'Success' : 'Error'}
            onClose={() => setNotification(null)}
          >
            {notification.message}
          </Notification>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <Card 
          shadow="sm" 
          padding="lg" 
          radius="lg"
          className="bg-white/80 backdrop-blur-sm border border-white/20"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <Text className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Feedback Management
              </Text>
              <Text c="dimmed" className="text-lg">
                Manage and review user feedback submissions
              </Text>
            </div>
            <Group>
              
              <Button
                leftSection={<IconRefresh size={20} />}
                onClick={() => dispatch(fetchFeedbacks())}
                variant="light"
                color="blue"
                loading={loading}
              >
                Refresh
              </Button>
            </Group>
          </div>

          {/* Stats Cards */}
          <Grid gutter="md" className="mt-6">
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Paper 
                p="md" 
                radius="md" 
                className="bg-blue-50/50 border border-blue-200 text-center hover:shadow-md transition-all"
              >
                <Text className="text-2xl font-bold text-blue-700">{stats.total}</Text>
                <Text size="sm" c="blue" fw={500}>Total Feedback</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Paper 
                p="md" 
                radius="md" 
                className="bg-yellow-50/50 border border-yellow-200 text-center hover:shadow-md transition-all"
              >
                <Text className="text-2xl font-bold text-yellow-700">{stats.pending}</Text>
                <Text size="sm" c="yellow" fw={500}>Pending</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Paper 
                p="md" 
                radius="md" 
                className="bg-green-50/50 border border-green-200 text-center hover:shadow-md transition-all"
              >
                <Text className="text-2xl font-bold text-green-700">{stats.approved}</Text>
                <Text size="sm" c="green" fw={500}>Approved</Text>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3 }}>
              <Paper 
                p="md" 
                radius="md" 
                className="bg-red-50/50 border border-red-200 text-center hover:shadow-md transition-all"
              >
                <Text className="text-2xl font-bold text-red-700">{stats.rejected}</Text>
                <Text size="sm" c="red" fw={500}>Rejected</Text>
              </Paper>
            </Grid.Col>
          </Grid>
        </Card>

        {/* Filters Section */}
        <Card shadow="sm" padding="md" radius="lg" className="bg-white/80 backdrop-blur-sm">
          <Group justify="space-between" className="mb-4">
            <Group gap="xs">
              <IconFilter size={20} className="text-blue-600" />
              <Text fw={600} className="text-lg">Filters & Search</Text>
            </Group>
            <Text c="dimmed" size="sm">
              Showing {filteredFeedbacks.filter((feedback) => feedback.mes_category==="department" && feedback.department_id === currentUser.department_id).length} of {stats.total} feedbacks
              {searchQuery && ` (${searchResults.filter((feedback) => feedback.mes_category==="department" && feedback.department_id === currentUser.department_id).length} search results)`}
            </Text>
          </Group>
          
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Status"
                value={filters.status}
                onChange={(value) => dispatch(setStatusFilter(value as any))}
                data={[
                  { value: 'all', label: 'All Status' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                leftSection={<IconClock size={16} />}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Role Type"
                value={filters.role}
                onChange={(value) => dispatch(setRoleFilter(value as any))}
                data={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'student', label: 'Students' },
                  { value: 'instructor', label: 'Instructors' },
                ]}
                leftSection={<IconUser size={16} />}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 6 }}>
              <TextInput
                label="Search Feedback"
                placeholder="Search by name, message, or ID..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                leftSection={<IconSearch size={16} />}
              />
            </Grid.Col>
          </Grid>
        </Card>

        {/* Feedback List */}
        <Card 
          shadow="sm" 
          padding="md" 
          radius="lg" 
          className="bg-white/80 backdrop-blur-sm relative"
        >
          <LoadingOverlay visible={loading} zIndex={1000} />
          
          {error && (
            <Alert color="red" title="Error" className="mb-4">
              {error}
            </Alert>
          )}

          {filteredFeedbacks.filter((feedback) => feedback.mes_category==="department" &&feedback.department_id === currentUser.department_id).length === 0 ? (
            <Paper p="xl" className="text-center">
              <IconMessage size={48} className="mx-auto text-gray-400 mb-4" />
              <Text c="dimmed" size="lg" fw={500}>
                No feedback found
              </Text>
              <Text c="dimmed" size="sm">
                {feedbacks.length === 0 ? 'No feedback submissions yet.' : 'No feedback matches your filters.'}
              </Text>
              <Button 
                leftSection={<IconPlus size={16} />} 
                className="mt-4"
                onClick={openSubmit}
              >
                Submit First Feedback
              </Button>
            </Paper>
          ) : (
            <ScrollArea h={600}>
              <Stack gap="md">
                  {filteredFeedbacks.filter((feedback) => feedback.mes_category==="department" &&feedback.department_id === currentUser.department_id).map((feedback) => (
                  <Paper 
                    key={feedback.id}
                    p="lg" 
                    radius="lg"
                    className="border border-gray-200/60 hover:border-blue-300/50 hover:shadow-lg transition-all duration-300 bg-white/90 backdrop-blur-sm"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar 
                            color={getRoleColor(feedback.role_type)} 
                            radius="xl"
                            size="md"
                          >
                            {getRoleIcon(feedback.role_type)}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Text fw={600} size="lg" className="text-gray-900 truncate">
                                {feedback.name}
                              </Text>
                              <Badge 
                                color={getRoleColor(feedback.role_type)}
                                variant="light"
                                leftSection={getRoleIcon(feedback.role_type)}
                              >
                                {feedback.role_type}
                              </Badge>
                              <Badge 
                                color={getStatusColor(feedback.status)}
                                variant="light"
                                leftSection={getStatusIcon(feedback.status)}
                              >
                                {feedback.status}
                              </Badge>
                              {feedback.mes_category && (
                                <Badge color="gray" variant="outline">
                                  {feedback.mes_category}
                                </Badge>
                              )}
                            </div>
                            
                            <Text className="text-gray-700 leading-relaxed mb-3 line-clamp-2">
                              {feedback.message}
                            </Text>
                            
                            <Group gap="xs" className="text-sm text-gray-500">
                              <IconCalendar size={14} />
                              <Text>{formatDate(feedback.created_at)}</Text>
                              {feedback.student_id && (
                                <>
                                  <Text>•</Text>
                                  <Text>Student ID: {feedback.student_id}</Text>
                                  <Text>dep ID: {feedback.mes_category==="department" &&feedback.department_id}</Text>
                                </>
                              )}
                              {feedback.id_number && (
                                <>
                                  <Text>•</Text>
                                  <Text>ID: {feedback.id_number}</Text>
                                  <Text>dep ID: {feedback.mes_category==="department" &&feedback.department_id}</Text>
                                </>
                              )}
                            </Group>
                          </div>
                        </div>
                      </div>
                      
                      <Group gap="xs" className="flex-shrink-0">
                        <Tooltip label="View Details">
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => openFeedbackModal(feedback)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        
                        {feedback.status === 'pending' && (
                          <>
                            <Tooltip label="Approve">
                              <ActionIcon
                                variant="light"
                                color="green"
                                onClick={() => handleStatusUpdate(feedback.id, 'approved')}
                              >
                                <IconCheck size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Reject">
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => handleStatusUpdate(feedback.id, 'rejected')}
                              >
                                <IconX size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </>
                        )}
                        
                        <Menu position="bottom-end" shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEye size={16} />}
                              onClick={() => openFeedbackModal(feedback)}
                            >
                              View Details
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              leftSection={<IconTrash size={16} />}
                              color="red"
                              onClick={() => openDeleteModal(feedback)}
                            >
                              Delete Feedback
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </div>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          )}
        </Card>
      </div>

      {/* Feedback Detail Modal */}
      <Modal 
        opened={opened} 
        onClose={close}
        title={
          <Text className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Feedback Details
          </Text>
        }
        size="lg"
        radius="lg"
        overlayProps={{ blur: 3 }}
      >
        {selectedFeedback && (
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="sm">
                <Avatar 
                  color={getRoleColor(selectedFeedback.role_type)} 
                  radius="xl"
                  size="lg"
                >
                  {getRoleIcon(selectedFeedback.role_type)}
                </Avatar>
                <div>
                  <Text fw={600} size="xl">{selectedFeedback.name}</Text>
                  <Group gap="xs">
                    <Badge color={getRoleColor(selectedFeedback.role_type)}>
                      {selectedFeedback.role_type}
                    </Badge>
                    <Badge color={getStatusColor(selectedFeedback.status)}>
                      {selectedFeedback.status}
                    </Badge>
                    {selectedFeedback.mes_category && (
                      <Badge color="blue" variant="light">
                        {selectedFeedback.mes_category}
                      </Badge>
                    )}
                  </Group>
                </div>
              </Group>
            </Group>

            <Divider />

            <div>
              <Text fw={600} mb="xs" className="text-gray-700">Message</Text>
              <Paper p="md" className="bg-gray-50/50 border">
                <Text className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {selectedFeedback.message}
                </Text>
              </Paper>
            </div>

            <Grid>
              <Grid.Col span={6}>
                <Text fw={600} size="sm" c="dimmed">Submitted</Text>
                <Text>{formatDate(selectedFeedback.created_at)}</Text>
              </Grid.Col>
              {selectedFeedback.id_number && (
                <Grid.Col span={6}>
                  <Text fw={600} size="sm" c="dimmed">ID Number</Text>
                  <Text>{selectedFeedback.id_number}</Text>
                </Grid.Col>
              )}
              {selectedFeedback.mes_category && (
                <Grid.Col span={6}>
                  <Text fw={600} size="sm" c="dimmed">Category</Text>
                  <Text>{selectedFeedback.mes_category}</Text>
                </Grid.Col>
              )}
            </Grid>

            {selectedFeedback.status === 'pending' && (
              <Group justify="center" gap="md" className="pt-4">
                <Button
                  leftSection={<IconCheck size={16} />}
                  color="green"
                  onClick={() => {
                    handleStatusUpdate(selectedFeedback.id, 'approved');
                    close();
                  }}
                >
                  Approve Feedback
                </Button>
                <Button
                  leftSection={<IconX size={16} />}
                  color="red"
                  variant="outline"
                  onClick={() => {
                    handleStatusUpdate(selectedFeedback.id, 'rejected');
                    close();
                  }}
                >
                  Reject Feedback
                </Button>
              </Group>
            )}
          </Stack>
        )}
      </Modal>

      {/* Submit Feedback Modal */}
      <Modal 
        opened={submitOpened} 
        onClose={closeSubmit}
        title="Submit New Feedback"
        size="lg"
        radius="lg"
      >
        <Stack gap="md">
          <TextInput
            label="Your ID Number"
            placeholder="Enter your student/instructor ID"
            value={formData.id_number}
            onChange={(e) => setFormData({...formData, id_number: e.target.value})}
            required
          />
          <TextInput
            label="Category"
            placeholder="e.g., Course Feedback, Technical Issue, Suggestion"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            required
          />
          <Textarea
            label="Message"
            placeholder="Enter your feedback message..."
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            rows={6}
            required
          />
          <Group justify="right" className="pt-4">
            <Button variant="outline" onClick={closeSubmit}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitFeedback}
              disabled={!formData.id_number || !formData.category || !formData.message}
            >
              Submit Feedback
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        opened={deleteOpened} 
        onClose={closeDelete}
        title="Delete Feedback"
        size="md"
        radius="lg"
      >
        <Stack gap="md">
          <Text>Are you sure you want to delete this feedback? This action cannot be undone.</Text>
          {selectedFeedback && (
            <Paper p="md" className="bg-red-50 border border-red-200">
              <Text fw={600}>From: {selectedFeedback.name}</Text>
              <Text size="sm" c="dimmed" className="mt-1 line-clamp-2">
                {selectedFeedback.message}
              </Text>
            </Paper>
          )}
          <Group justify="right" className="pt-4">
            <Button variant="outline" onClick={closeDelete}>
              Cancel
            </Button>
            <Button 
              color="red" 
              onClick={() => handleDeleteFeedback(selectedFeedback?.id)}
              leftSection={<IconTrash size={16} />}
            >
              Delete Feedback
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
};

export default ViewFeedbackSection;