/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Text,
  TextInput,
  Button,
  Group,
  Avatar,
  Stack,
  LoadingOverlay,
  Notification,
  Divider,
  Badge,
  Modal,
  PasswordInput,
  ActionIcon,
  FileInput,
} from "@mantine/core";
import {
  IconUser,
  IconMail,
  IconSchool,
  IconId,
  IconCheck,
  IconX,
  IconEdit,
  IconLock,
  IconCamera,
  IconDeviceFloppy,
} from "@tabler/icons-react";
import { useAppDispatch } from "@/hooks/redux";
import { Found } from "@/app/auth/auth";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/store/slices/checkSession";
import { useDisclosure } from "@mantine/hooks";

interface UserProfile {
  id: number;
  id_number: string;
  full_name: string;
  username: string;
  email: string;
  role: string;
  status: string;
  department_id: number;
  department_name: string;
  phone?: string;
  address?: string;
  profile_picture?: string;
}

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [changePasswordOpened, { open: openChangePassword, close: closeChangePassword }] = useDisclosure(false);
  
  // Form states
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Load user data
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const foundUser = await Found();
        setUser(foundUser);
        setFormData({
          full_name: foundUser?.full_name || "",
          email: foundUser?.email || "",
          phone: foundUser?.phone || "",
          address: foundUser?.address || "",
        });
        setImagePreview(foundUser?.profile_picture || "");
      } catch (error) {
        console.error("Failed to load user profile:", error);
        setNotification({ type: 'error', message: "Failed to load profile data" });
      } finally {
        setLoading(false);
      }
    };
    
    loadUserProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (file: File | null) => {
    setProfileImage(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaving(true);
      
      // Prepare form data for file upload
      const submitData = new FormData();
      submitData.append('full_name', formData.full_name);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone || '');
      submitData.append('address', formData.address || '');
      
      if (profileImage) {
        submitData.append('profile_picture', profileImage);
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        body: submitData,
        credentials: 'include',
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setEditMode(false);
        setNotification({ type: 'success', message: "Profile updated successfully!" });
        
        // Refresh user data
        const foundUser = await Found();
        setUser(foundUser);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setNotification({ type: 'error', message: "New passwords do not match" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setNotification({ type: 'error', message: "Password must be at least 6 characters long" });
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setNotification({ type: 'success', message: "Password changed successfully!" });
        closeChangePassword();
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change password");
      }
    } catch (error: any) {
      setNotification({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const result = await dispatch(logoutUser());
    if (logoutUser.fulfilled.match(result)) {
      router.push("/login");
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
      case "inactive":
        return "red";
      case "pending":
        return "yellow";
      default:
        return "gray";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 p-6">
        <div className="max-w-4xl mx-auto">
          <Card shadow="lg" padding="xl" radius="lg" className="bg-white/90 backdrop-blur-sm">
            <LoadingOverlay visible={true} overlayProps={{ blur: 2 }} />
            <div className="h-96 flex items-center justify-center">
              <Text size="xl" fw={600}>Loading profile...</Text>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 p-6">
        <div className="max-w-4xl mx-auto">
          <Card shadow="lg" padding="xl" radius="lg" className="bg-white/90 backdrop-blur-sm text-center">
            <IconX size={48} className="mx-auto text-red-500 mb-4" />
            <Text size="xl" fw={600} c="red" mb="md">Failed to load profile</Text>
            <Button onClick={() => window.location.reload()} variant="light">
              Try Again
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 p-6">
      {notification && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full">
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

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card shadow="lg" padding="xl" radius="lg" className="bg-white/90 backdrop-blur-sm">
          <Group justify="space-between" align="flex-start">
            <Group>
              <div className="relative">
                <Avatar 
                  src={imagePreview} 
                  size={120} 
                  radius="xl"
                  className="border-4 border-white shadow-lg"
                >
                  <IconUser size={48} />
                </Avatar>
                {editMode && (
                  <FileInput
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute bottom-0 right-0"
                    size="xs"
                  >
                    <ActionIcon 
                      variant="filled" 
                      color="blue" 
                      size="lg" 
                      radius="xl"
                    >
                      <IconCamera size={16} />
                    </ActionIcon>
                  </FileInput>
                )}
              </div>
              
              <Stack gap="xs">
                <Text className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {user.full_name}
                </Text>
                <Group gap="xs">
                  <Badge color={getRoleColor(user.role)} size="lg">
                    {user.role}
                  </Badge>
                  <Badge color={getStatusColor(user.status)} size="lg">
                    {user.status}
                  </Badge>
                </Group>
                <Text c="dimmed" size="lg">
                  {user.department_name || "No department assigned"}
                </Text>
              </Stack>
            </Group>

            <Group>
              {editMode ? (
                <Group>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditMode(false)}
                    leftSection={<IconX size={18} />}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveProfile}
                    loading={saving}
                    leftSection={<IconDeviceFloppy size={18} />}
                  >
                    Save Changes
                  </Button>
                </Group>
              ) : (
                <Group>
                  <Button 
                    variant="light" 
                    onClick={openChangePassword}
                    leftSection={<IconLock size={18} />}
                  >
                    Change Password
                  </Button>
                  <Button 
                    onClick={() => setEditMode(true)}
                    leftSection={<IconEdit size={18} />}
                  >
                    Edit Profile
                  </Button>
                </Group>
              )}
            </Group>
          </Group>
        </Card>

        {/* Profile Information */}
        <Card shadow="lg" padding="xl" radius="lg" className="bg-white/90 backdrop-blur-sm">
          <Text className="text-2xl font-bold mb-6">Profile Information</Text>
          
          <Stack gap="lg">
            <Group grow>
              <TextInput
                label="ID Number"
                value={user.id_number}
                leftSection={<IconId size={18} />}
                disabled
                description="Your unique identification number"
              />
              <TextInput
                label="Username"
                value={user.username}
                leftSection={<IconUser size={18} />}
                disabled
                description="Your system username"
              />
            </Group>

            <Group grow>
              <TextInput
                label="Full Name"
                value={editMode ? formData.full_name : user.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                leftSection={<IconUser size={18} />}
                disabled={!editMode}
                required
              />
              <TextInput
                label="Email Address"
                value={editMode ? formData.email : user.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                leftSection={<IconMail size={18} />}
                disabled={!editMode}
                required
                type="email"
              />
            </Group>

            <Group grow>
              <TextInput
                label="Phone Number"
                value={editMode ? formData.phone : (user.phone || "Not provided")}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                leftSection={<IconUser size={18} />}
                disabled={!editMode}
                placeholder="Enter your phone number"
              />
              <TextInput
                label="Department"
                value={user.department_name || "Not assigned"}
                leftSection={<IconSchool size={18} />}
                disabled
              />
            </Group>

            <TextInput
              label="Address"
              value={editMode ? formData.address : (user.address || "Not provided")}
              onChange={(e) => handleInputChange('address', e.target.value)}
              leftSection={<IconUser size={18} />}
              disabled={!editMode}
              placeholder="Enter your address"
            />
          </Stack>
        </Card>

        {/* Account Information */}
        <Card shadow="lg" padding="xl" radius="lg" className="bg-white/90 backdrop-blur-sm">
          <Text className="text-2xl font-bold mb-6">Account Information</Text>
          
          <Stack gap="md">
            <Group justify="apart">
              <Text fw={600}>Account Created</Text>
              <Text c="dimmed">{new Date().toLocaleDateString()}</Text>
            </Group>
            
            <Group justify="apart">
              <Text fw={600}>Last Login</Text>
              <Text c="dimmed">{new Date().toLocaleString()}</Text>
            </Group>
            
            <Group justify="apart">
              <Text fw={600}>Account Status</Text>
              <Badge color={getStatusColor(user.status)} size="lg">
                {user.status.toUpperCase()}
              </Badge>
            </Group>

            <Divider my="md" />

            <Group justify="center">
              <Button 
                variant="outline" 
                color="red" 
                onClick={handleLogout}
                leftSection={<IconX size={18} />}
              >
                Logout
              </Button>
            </Group>
          </Stack>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Modal 
        opened={changePasswordOpened} 
        onClose={closeChangePassword}
        title="Change Password"
        size="md"
        radius="lg"
      >
        <Stack gap="md">
          <PasswordInput
            label="Current Password"
            value={passwordData.currentPassword}
            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
            leftSection={<IconLock size={18} />}
            required
          />
          
          <PasswordInput
            label="New Password"
            value={passwordData.newPassword}
            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
            leftSection={<IconLock size={18} />}
            required
            description="Password must be at least 6 characters long"
          />
          
          <PasswordInput
            label="Confirm New Password"
            value={passwordData.confirmPassword}
            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            leftSection={<IconLock size={18} />}
            required
          />
          
          <Group justify="right" className="mt-6">
            <Button variant="outline" onClick={closeChangePassword}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangePassword}
              loading={saving}
              disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            >
              Change Password
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}