/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  Textarea,
  Select,
  Button,
  LoadingOverlay,
  Notification,
  Group,
  Paper,
  Stack,
  Badge,
} from "@mantine/core";
import {
  IconPencil,
  IconCheck,
  IconX,
  IconUser,
  IconSchool,
  IconMessage,
} from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { submitFeedback } from "@/store/slices/feedbackSlice";
import { Authentication, Found } from "@/app/auth/auth";
import { useDisclosure } from "@mantine/hooks";

// ✅ Main App Wrapper
const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <SubmitFeedbackSection />
      </div>
    </div>
  );
};

// ✅ Feedback Section Component
const SubmitFeedbackSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.feedback);
  
  const [category, setCategory] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [showConfirmation, { open: openConfirmation, close: closeConfirmation }] = useDisclosure(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const categories = [
    { value: 'department', label: 'Department Feedback' },
    { value: 'general', label: 'General Feedback' },
  ];
const [user, setUser] = useState<any>(null);
   useEffect(() => {
     const checkAuth = async () => {
       const foundUser = await Found();
       setUser(foundUser);
     };
     checkAuth();
     
   }, []);
 
   if (user === null) {
     // Not logged in → show authentication page
     return <Authentication />;
   }

  // ✅ Handle errors
   

  // ✅ Handle Feedback Submission
  const handleSubmit = async () => {
    if (!category || !feedbackText.trim()) {
      setNotification({ type: 'error', message: "Please select a category and enter your feedback message." });
      return;
    }

    if (!user?.id_number) {
      setNotification({ type: 'error', message: "User information not found. Please log in again." });
      return;
    }

    try {
      const result = await dispatch(submitFeedback({
        id_number: user.id_number,
        category,
        message: feedbackText,
        role:user.role,
      })).unwrap();

      if (result) {
        openConfirmation();
        setCategory("");
        setFeedbackText("");
        setNotification({ type: 'success', message: "Feedback submitted successfully!" });
      }
    } catch (err) {
      // Error handling is done in the slice
      console.error("Submission error:", err);
    }
  };

  const handleNewFeedback = () => {
    closeConfirmation();
    setCategory("");
    setFeedbackText("");
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student":
        return <IconUser size={18} />;
      case "instructor":
        return <IconSchool size={18} />;
      case "department_head":
        return <IconUser size={18} />;
      case "admin":
        return <IconUser size={18} />;
      default:
        return <IconUser size={18} />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "student":
        return "blue";
      case "instructor":
        return "violet";
      case "department_head":
        return "orange";
      case "admin":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <>
      {notification && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <Notification 
            color={notification.type === 'success' ? 'teal' : 'red'}
            title={notification.type === 'success' ? 'Success' : 'Error'}
            onClose={() => setNotification(null)}
            icon={notification.type === 'success' ? <IconCheck size={18} /> : <IconX size={18} />}
          >
            {notification.message}
          </Notification>
        </div>
      )}

      <Card 
        shadow="lg" 
        padding="xl" 
        radius="lg"
        className="bg-white/90 backdrop-blur-sm border border-white/20 relative"
      >
        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ blur: 2 }} />

        {/* User Info Badge */}
        {user && (
          <div className="flex justify-between items-center mb-6">
            <div>
              <Text className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Submit Feedback
              </Text>
              <Text c="dimmed" size="sm">
                Share your thoughts and suggestions with us
              </Text>
            </div>
            <Badge 
              color={getRoleColor(user.role)}
              variant="light"
              size="lg"
              leftSection={getRoleIcon(user.role)}
            >
              {user.full_name} ({user.role})
            </Badge>
          </div>
        )}

        {showConfirmation ? (
          <Paper p="xl" className="text-center border border-green-200 bg-green-50/50">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <IconCheck size={32} className="text-green-600" />
              </div>
              <Text size="xl" fw={600} c="green">
                Feedback Submitted Successfully!
              </Text>
              <Text c="dimmed" className="text-center max-w-md">
                Your feedback has been submitted to the department head. 
                We appreciate your input and will review it carefully.
              </Text>
              <Button
                onClick={handleNewFeedback}
                variant="light"
                color="blue"
                size="md"
                className="mt-4"
              >
                Submit New Feedback
              </Button>
            </div>
          </Paper>
        ) : (
          <Stack gap="lg">
            {/* User Information Display */}
            {user && (
              <Paper p="md" className="bg-blue-50/50 border border-blue-200">
                <Group justify="space-between">
                  <div>
                    <Text fw={600}>{user.full_name}</Text>
                    <Group gap="xs">
                      <Text size="sm" c="dimmed">ID: {user.id_number}</Text>
                      <Text size="sm" c="dimmed">•</Text>
                      <Text size="sm" c="dimmed">{user.email}</Text>
                      {user.department_name && (
                        <>
                          <Text size="sm" c="dimmed">•</Text>
                          <Text size="sm" c="dimmed">{user.department_name}</Text>
                        </>
                      )}
                    </Group>
                  </div>
                </Group>
              </Paper>
            )}

            {/* Category Selection */}
             <Select
            label="Feedback Category"
            description="Select the most relevant category for your feedback"
            placeholder="Choose a category"
            value={category}
            onChange={(value) => setCategory(value || "")}
            data={categories}
            required
            leftSection={<IconMessage size={18} />}
          />


            {/* Feedback Textarea - FIXED VERSION */}
            <Textarea
              label="Your Feedback"
              description="Please provide detailed feedback to help us improve"
              placeholder="Write your feedback here... Be as specific as possible about your experience, suggestions, or concerns."
              value={feedbackText}
              onChange={(event) => setFeedbackText(event.currentTarget.value)}
              required
              minRows={6}
              autosize
              maxRows={10}
              className="transition-all duration-200"
            />
            {/* Character Count */}
            <div className="flex justify-between items-center text-sm">
              <Text c="dimmed">
                {feedbackText.length}/1000 characters
              </Text>
              {feedbackText.length > 800 && (
                <Text c="orange">
                  {1000 - feedbackText.length} characters remaining
                </Text>
              )}
            </div>

            {/* Submission Guidelines */}
            <Paper p="md" className="bg-gray-50 border border-gray-200">
              <Text size="sm" fw={600} mb="xs">Submission Guidelines:</Text>
              <Text size="xs" c="dimmed">
                • Be constructive and specific in your feedback<br/>
                • Focus on actionable suggestions<br/>
                • Avoid personal criticisms<br/>
                • All feedback will be reviewed by department heads
              </Text>
            </Paper>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              loading={loading}
              size="lg"
              leftSection={<IconPencil size={20} />}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              fullWidth
              disabled={!category || !feedbackText.trim() || feedbackText.length > 1000}
            >
              Submit Feedback
            </Button>

            {/* Helper Text */}
            <Text size="xs" c="dimmed" className="text-center">
              Your feedback will be reviewed and appropriate action will be taken within 3-5 business days.
            </Text>
          </Stack>
        )}
      </Card>
    </>
  );
};

export default App;