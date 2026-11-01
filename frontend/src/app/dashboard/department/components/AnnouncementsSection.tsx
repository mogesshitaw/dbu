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
  Modal,
  Button,
  Textarea,
  Select,
  Switch,
  Grid,
  Collapse,
  Paper,
  TextInput,
  Avatar,
  ThemeIcon,
  Divider
} from "@mantine/core";
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconEye, 
  IconEyeOff,
  IconDotsVertical,
  IconInfoCircle,
  IconBell,
  IconCalendar,
  IconClock,
  IconRocket,
  IconSparkles,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconHourglass,
  IconUserCircle,
  IconBuilding,
  IconCalendarTime,
  IconCalendarOff,
  IconFlame,
  IconRefresh
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useAppDispatch } from "@/hooks/redux";
import { useAnnouncements } from "@/hooks/useAnnouncement";
import { 
  fetchAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement, 
  togglePublish,
  setCurrentAnnouncement,
  clearCurrentAnnouncement
} from "@/store/slices/announcementsSlice";
import { Authentication, Found } from "@/app/auth/auth";

const AnnouncementsSection = () => {
  const dispatch = useAppDispatch();
  const { announcements, loading, submitting, currentAnnouncement } = useAnnouncements();
  
  const [opened, { open, close }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium" as "low" | "medium" | "high",
    publish_at: null as Date | null,
    expires_at: null as Date | null,
    is_published: false
  });
  // Filter announcements based on search
  const filteredAnnouncements = announcements.filter(announcement => announcement.department_id===currentUser?.department_id && currentUser?.id===announcement.author_id &&
    (announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    announcement.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  ));

  // Fetch user session and announcements
  useEffect(() => {
    dispatch(fetchAnnouncements());
    const checkAuth = async () => {
      const foundUser = await Found();
      setCurrentUser(foundUser);
    };
    checkAuth();
  }, [dispatch]);

  useEffect(() => {
    if (currentAnnouncement && opened) {
      setFormData({
        title: currentAnnouncement.title,
        content: currentAnnouncement.content,
        priority: currentAnnouncement.priority,
        publish_at: currentAnnouncement.publish_at ? new Date(currentAnnouncement.publish_at) : null,
        expires_at: currentAnnouncement.expires_at ? new Date(currentAnnouncement.expires_at) : null,
        is_published: currentAnnouncement.is_published
      });
    }
  }, [currentAnnouncement, opened]);

  if (currentUser === null) {
    return <Authentication />;
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      priority: "medium",
      publish_at: null,
      expires_at: null,
      is_published: false
    });
    dispatch(clearCurrentAnnouncement());
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.title && formData.content) {
        const safeToISOString = (date: any): string | null => {
          if (!date) return null;
          if (date instanceof Date && !isNaN(date.getTime())) {
            return date.toISOString();
          }
          if (typeof date === 'string') {
            const parsedDate = new Date(date);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString();
            }
          }
          return null;
        };

        const apiData = {
          title: formData.title,
          content: formData.content,
          priority: formData.priority,
          is_published: formData.is_published,
          publish_at: safeToISOString(formData.publish_at),
          expires_at: safeToISOString(formData.expires_at),
        };

        if (currentAnnouncement) {
          await dispatch(updateAnnouncement({
            id: currentAnnouncement.id,
            data: apiData
          })).unwrap();
        } else {
          await dispatch(createAnnouncement(apiData)).unwrap();
        }
        
        resetForm();
        close();
        dispatch(fetchAnnouncements());
      }
    } catch (error) {
      console.error("Failed to save announcement:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      await dispatch(deleteAnnouncement(id));
      dispatch(fetchAnnouncements());
    }
  };

  const handleTogglePublish = async (id: number) => {
    await dispatch(togglePublish(id));
    dispatch(fetchAnnouncements());
  };



  // Date formatting
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isRecent = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
  };
  const priorityOption = [{ value: 'low', label: '💙 Low Priority', color: 'blue' },
  { value: 'medium', label: '💎 Medium Priority', color: 'cyan' },
  { value: 'high', label: '🚨 High Priority', color: 'red' }
  ];
  // // Calculate stats
  // const stats = {
  //   total: announcements.filter(announcement =>announcement.department_id===currentUser?.department_id ).length,
  //   published: announcements.filter(a => a.is_published && a.department_id===currentUser?.department_id ).length,
  //   drafts: announcements.filter(a => !a.is_published &&  a.department_id===currentUser?.department_id).length,
  //   highPriority: announcements.filter(a => a.priority === 'high' &&  a.department_id===currentUser?.department_id).length,
  //   expired: announcements.filter(a =>  a.department_id===currentUser?.department_id &&
  //     a.expires_at && new Date(a.expires_at) < new Date()
  //   ).length,
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-900 via-b-900 to-white-950 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <ThemeIcon 
                size="xl" 
                radius="lg" 
                variant="gradient" 
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                <IconRocket size={24} />
              </ThemeIcon>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
                  Announcements Hub
                </h1>
                <p className="text-blue-300/80 text-sm md:text-base">
                  Stay connected with {currentUser.department_name} updates
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <Avatar 
                size="sm" 
                radius="xl" 
                className="ring-2 ring-blue-500/30"
              />
              <div>
                <Text className="text-white font-medium">{currentUser.full_name}</Text>
                <Text className="text-blue-300/70 text-xs flex items-center gap-1">
                  <IconBuilding size={12} />
                  {currentUser.department_name}
                </Text>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <TextInput
              placeholder="Search announcements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftSection={<IconSparkles size={16} className="text-blue-400" />}
              className="w-full sm:w-64"
              classNames={{
                input: "bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 backdrop-blur-sm",
              }}
            />
            <Button
              leftSection={<IconPlus size={18} />}
              rightSection={<IconSparkles size={14} />}
              onClick={() => { resetForm(); open(); }}
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
              className="shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300"
              size="md"
            >
              New Announcement
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <Paper className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-2xl font-bold text-white">{stats.total}</Text>
                <Text className="text-blue-300/70 text-xs">Total</Text>
              </div>
              <IconBell className="text-blue-400" size={20} />
            </div>
          </Paper>
          
          <Paper className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-2xl font-bold text-white">{stats.published}</Text>
                <Text className="text-green-400/70 text-xs">Published</Text>
              </div>
              <IconEye className="text-green-400" size={20} />
            </div>
          </Paper>
          
          <Paper className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-2xl font-bold text-white">{stats.drafts}</Text>
                <Text className="text-yellow-400/70 text-xs">Drafts</Text>
              </div>
              <IconEyeOff className="text-yellow-400" size={20} />
            </div>
          </Paper>
          
          <Paper className="bg-slate-800/40 backdrop-blur-sm border border-red-500/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-2xl font-bold text-white">{stats.highPriority}</Text>
                <Text className="text-red-400/70 text-xs">High Priority</Text>
              </div>
              <IconAlertCircle className="text-red-400" size={20} />
            </div>
          </Paper>
          
          <Paper className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-2xl font-bold text-white">{stats.expired}</Text>
                <Text className="text-gray-400/70 text-xs">Expired</Text>
              </div>
              <IconHourglass className="text-gray-400" size={20} />
            </div>
          </Paper>
          
          <Paper className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <Text className="text-2xl font-bold text-white">
                  {announcements.length > 0 ? Math.round((stats.published / stats.total) * 100) : 0}%
                </Text>
                <Text className="text-cyan-400/70 text-xs">Published Rate</Text>
              </div>
              <IconTrendingUp className="text-cyan-400" size={20} />
            </div>
          </Paper>
        </div> */}
      </div>

      {/* Announcements Grid */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-xl animate-pulse">
              <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
            <IconBell size={48} className="text-blue-400/50" />
          </div>
          <Text className="text-2xl font-bold text-white mb-2">No announcements found</Text>
          <Text className="text-blue-300/70 mb-6">
            {searchQuery ? "Try a different search term" : `Create the first announcement for ${currentUser.department_name}`}
          </Text>
          {searchQuery && (
            <Button
              variant="subtle"
              onClick={() => setSearchQuery("")}
              leftSection={<IconRefresh size={16} />}
              className="text-blue-400"
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAnnouncements.map((announcement) => (
            <Card 
              key={announcement.id}
              className={`bg-slate-800/40 backdrop-blur-sm border rounded-xl hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 hover:translate-y-[-2px] ${
                !announcement.is_published ? 'opacity-90' : ''
              }`}
            >
              <div className="flex flex-col md:flex-row gap-4">
                {/* Priority Indicator */}
                <div className={`w-2 md:w-1.5 rounded-full ${
                  announcement.priority === 'high' ? 'bg-gradient-to-b from-red-500 to-orange-500' :
                  announcement.priority === 'medium' ? 'bg-gradient-to-b from-blue-500 to-cyan-500' :
                  'bg-gradient-to-b from-indigo-500 to-purple-500'
                }`} />
                
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          size="lg"
                          radius="sm"
                          variant="light"
                        
                          className="font-semibold"
                        >
                          {announcement.priority.toUpperCase()}
                        </Badge>
                        
                        {!announcement.is_published && (
                          <Badge color="yellow" variant="light" size="sm" radius="sm">
                            <IconEyeOff size={12} className="mr-1" />
                            Draft
                          </Badge>
                        )}
                        
                        {announcement.expires_at && new Date(announcement.expires_at) < new Date() && (
                          <Badge color="red" variant="light" size="sm" radius="sm">
                            <IconHourglass size={12} className="mr-1" />
                            Expired
                          </Badge>
                        )}
                        
                        {isRecent(announcement.created_at) && (
                          <Badge color="green" variant="light" size="sm" radius="sm">
                            <IconFlame size={12} className="mr-1" />
                            New
                          </Badge>
                        )}
                      </div>
                      
                      <Text className="text-xl font-bold text-white mb-2">
                        {announcement.title}
                      </Text>
                    </div>
                    
                    <Menu position="bottom-end" shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon 
                          variant="subtle" 
                          size="lg"
                          className="hover:bg-blue-500/20 text-blue-400"
                        >
                          <IconDotsVertical size={18} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown className="bg-slate-800/95 backdrop-blur-sm border border-slate-700">
                        <Menu.Label className="text-blue-300">Actions</Menu.Label>
                        <Menu.Item
                          leftSection={<IconEye size={16} className="text-blue-400" />}
                          onClick={() => {
                            dispatch(setCurrentAnnouncement(announcement));
                            openView();
                          }}
                          className="text-slate-200 hover:bg-blue-500/20"
                        >
                          View Details
                        </Menu.Item>
                        <Menu.Item
                          leftSection={announcement.is_published ? 
                            <IconEyeOff size={16} className="text-yellow-400" /> : 
                            <IconEye size={16} className="text-green-400" />
                          }
                          onClick={() => handleTogglePublish(announcement.id)}
                          className="text-slate-200 hover:bg-blue-500/20"
                        >
                          {announcement.is_published ? "Unpublish" : "Publish"}
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconEdit size={16} className="text-blue-400" />}
                          onClick={() => {
                            dispatch(setCurrentAnnouncement(announcement));
                            open();
                          }}
                          className="text-slate-200 hover:bg-blue-500/20"
                        >
                          Edit
                        </Menu.Item>
                        <Menu.Divider className="border-slate-700" />
                        <Menu.Item
                          leftSection={<IconTrash size={16} className="text-red-400" />}
                          color="red"
                          onClick={() => handleDelete(announcement.id)}
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          Delete
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </div>
                  
                  {/* Content Preview */}
                  <Collapse in={expandedId === announcement.id}>
                    <div className={` p-4 rounded-lg mb-4`}>
                      <Text className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {announcement.content}
                      </Text>
                    </div>
                  </Collapse>
                  
                  {/* Expand/Collapse Button */}
                  <Button
                    variant="subtle"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === announcement.id ? null : announcement.id)}
                    rightSection={expandedId === announcement.id ? 
                      <IconChevronUp size={14} /> : 
                      <IconChevronDown size={14} />
                    }
                    className="text-blue-400 hover:text-blue-300 mb-4"
                  >
                    {expandedId === announcement.id ? "Show less" : "Read more"}
                  </Button>
                  
                  {/* Footer */}
                  <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <Avatar 
                        size="sm" 
                        radius="xl" 
                        className="ring-1 ring-blue-500/30"
                      />
                      <div>
                        <Text className="text-white text-sm font-medium">
                          {announcement.author_name}
                        </Text>
                        <Text className="text-blue-300/70 text-xs">
                          Author
                        </Text>
                      </div>
                    </div>
                    
                    <Divider orientation="vertical" className="h-6 border-slate-700" />
                    
                    <div className="flex items-center gap-2">
                      <IconCalendar size={14} className="text-blue-400" />
                      <div>
                        <Text className="text-white text-sm">
                          {formatDateShort(announcement.created_at)}
                        </Text>
                        <Text className="text-blue-300/70 text-xs">
                          Created
                        </Text>
                      </div>
                    </div>
                    
                    {announcement.expires_at && (
                      <>
                        <Divider orientation="vertical" className="h-6 border-slate-700" />
                        <div className="flex items-center gap-2">
                          <IconClock size={14} className={
                            new Date(announcement.expires_at) < new Date() ? 
                            'text-red-400' : 'text-green-400'
                          } />
                          <div>
                            <Text className={
                              `text-sm ${
                                new Date(announcement.expires_at) < new Date() ? 
                                'text-red-400' : 'text-white'
                              }`
                            }>
                              {formatDateShort(announcement.expires_at)}
                            </Text>
                            <Text className="text-blue-300/70 text-xs">
                              Expires
                            </Text>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal 
        opened={opened} 
        onClose={() => { close(); resetForm(); }}
        size="lg"
        radius="lg"
        overlayProps={{
          backgroundOpacity: 0.7,
          blur: 8,
        }}
        classNames={{
          content: "0 border border-blue-500/20 shadow-2xl",
          header: "border-b border-slate-700/50",
          body: "p-6"
        }}
      >
        <div className="relative">
          {/* Decorative gradient */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <ThemeIcon 
                size="lg" 
                radius="lg" 
                variant="gradient" 
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                {currentAnnouncement ? <IconEdit size={20} /> : <IconPlus size={20} />}
              </ThemeIcon>
              <div>
                <Text className="text-2xl font-bold text-white">
                  {currentAnnouncement ? 'Edit Announcement' : 'New Announcement'}
                </Text>
                <Text className="text-blue-300/70 text-sm">
                  {currentAnnouncement ? 'Update your announcement details' : 'Share updates with your department'}
                </Text>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <TextInput
                label="Title"
                placeholder="What's the announcement about?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                size="md"
                classNames={{
                  label: "text-blue-300 font-semibold mb-2",
                  input: "bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm",
                }}
              />
              
              <Textarea
                label="Content"
                placeholder="Write your announcement here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                minRows={4}
                size="md"
                classNames={{
                  label: "text-blue-300 font-semibold mb-2",
                  input: "bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm",
                }}
              />
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Select
                    label="Priority Level"
                    value={formData.priority}
                    onChange={(value) => setFormData({ ...formData, priority: value as "low" | "medium" | "high" })}
                    data={priorityOption}
                    size="md"
                    classNames={{
                      label: "text-blue-300 font-semibold mb-2",
                      input: "bg-slate-800/50 border-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm",
                      dropdown: "bg-slate-800 border-slate-700 backdrop-blur-sm",
                      option: "hover:bg-blue-500/20 text-slate-200"
                    }}
                  />
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <div className="pt-8">
                    <Switch
                      label="Publish Immediately"
                      checked={formData.is_published}
                      onChange={(e) => setFormData({ ...formData, is_published: e.currentTarget.checked })}
                      size="md"
                      classNames={{
                        label: "text-blue-300 font-semibold cursor-pointer",
                        track: "cursor-pointer bg-slate-700",
                        thumb: formData.is_published ? "bg-gradient-to-r from-blue-500 to-cyan-500" : "bg-slate-400"
                      }}
                    />
                  </div>
                </Grid.Col>
              </Grid>
     <Grid>
  <Grid.Col span={{ base: 12, sm: 6 }}>
    <TextInput
      label="Schedule Publish Date"
      type="date"
      value={formData.publish_at ? formData.publish_at.toISOString().split('T')[0] : ''}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        setFormData({ ...formData, publish_at: date });
      }}
      placeholder="YYYY-MM-DD"
      leftSection={<IconCalendarTime size={16} className="text-blue-400" />}
      size="md"
      classNames={{
        label: "text-blue-300 font-semibold mb-2",
        input: "bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm",
      }}
    />
  </Grid.Col>
  
  <Grid.Col span={{ base: 12, sm: 6 }}>
    <TextInput
      label="Expiration Date"
      type="date"
      value={formData.expires_at ? formData.expires_at.toISOString().split('T')[0] : ''}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        setFormData({ ...formData, expires_at: date });
      }}
      placeholder="YYYY-MM-DD"
      leftSection={<IconCalendarOff size={16} className="text-blue-400" />}
      size="md"
      classNames={{
        label: "text-blue-300 font-semibold mb-2",
        input: "bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm",
      }}
    />
  </Grid.Col>
</Grid>
              
              {/* Preview Card */}
              <Paper className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
                <Group gap="sm" align="flex-start">
                  <IconInfoCircle size={20} className="text-blue-400 mt-0.5" />
                  <div>
                    <Text className="text-blue-300 font-semibold mb-1">
                      {formData.is_published ? 'Ready to Publish' : 'Saving as Draft'}
                    </Text>
                    <Text className="text-blue-300/70 text-sm">
                      {formData.is_published 
                        ? `This announcement will be immediately visible to everyone in ${currentUser.department_name}.` 
                        : `Save this announcement as a draft for ${currentUser.department_name}. You can publish it later.`}
                    </Text>
                  </div>
                </Group>
              </Paper>
              
              {/* Form Actions */}
              <Group justify="flex-end" className="pt-6 border-t border-slate-700/50">
                <Button 
                  variant="subtle" 
                  onClick={() => { close(); resetForm(); }}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                  size="md"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  loading={submitting}
                  disabled={!formData.title.trim() || !formData.content.trim()}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  rightSection={formData.is_published ? <IconRocket size={16} /> : <IconCheck size={16} />}
                  className="shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                  size="md"
                >
                  {currentAnnouncement ? 'Update' : formData.is_published ? 'Publish Now' : 'Save Draft'}
                </Button>
              </Group>
            </form>
          </div>
        </div>
      </Modal>

      {/* View Announcement Modal */}
      <Modal 
        opened={viewOpened} 
        onClose={() => { closeView(); dispatch(clearCurrentAnnouncement()); }}
        size="lg"
        radius="lg"
        overlayProps={{
          backgroundOpacity: 0.7,
          blur: 8,
        }}
        classNames={{
          content: "bg-gradient-to-br from-slate-900 to-slate-800 border border-blue-500/20 shadow-2xl",
          header: "border-b border-slate-700/50",
          body: "p-6"
        }}
      >
        {currentAnnouncement && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <ThemeIcon 
                  size="lg" 
                  radius="lg" 
                  variant="light" 
                >
                </ThemeIcon>
                <div>
                  <Text className="text-xl font-bold text-white">
                    Announcement Details
                  </Text>
                  <Text className="text-blue-300/70 text-sm">
                    View all details and metadata
                  </Text>
                </div>
              </div>
              
              <Badge 
                size="lg"
                radius="sm"
                variant="light"
                color={currentAnnouncement.is_published ? "blue" : "yellow"}
                leftSection={currentAnnouncement.is_published ? 
                  <IconEye size={14} /> : <IconEyeOff size={14} />
                }
              >
                {currentAnnouncement.is_published ? "Published" : "Draft"}
              </Badge>
            </div>
            
            {/* Content */}
            <div className="space-y-6">
              <div>
                <Text className="text-sm text-blue-300 font-semibold mb-2">Title</Text>
                <Text className="text-2xl font-bold text-white">
                  {currentAnnouncement.title}
                </Text>
              </div>
              
              <div>
                <Text className="text-sm text-blue-300 font-semibold mb-2">Content</Text>
                <Paper className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 backdrop-blur-sm">
                  <Text className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {currentAnnouncement.content}
                  </Text>
                </Paper>
              </div>
              
              {/* Metadata Grid */}
              <Grid gutter="lg">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Paper className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <Text className="text-sm text-blue-300 font-semibold mb-3 flex items-center gap-2">
                      <IconUserCircle size={14} />
                      Author Information
                    </Text>
                    <div className="flex items-center gap-3">
                      <Avatar size="md" radius="xl" />
                      <div>
                        <Text className="text-white font-bold">{currentAnnouncement.author_name}</Text>
                        <Text className="text-blue-300/70 text-sm">Author</Text>
                      </div>
                    </div>
                  </Paper>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Paper className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <Text className="text-sm text-blue-300 font-semibold mb-3 flex items-center gap-2">
                      <IconBuilding size={14} />
                      Department
                    </Text>
                    <div>
                      <Text className="text-white font-bold">{currentAnnouncement.department_name}</Text>
                      <Text className="text-blue-300/70 text-sm">Target Audience</Text>
                    </div>
                  </Paper>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Paper className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <Text className="text-sm text-blue-300 font-semibold mb-3 flex items-center gap-2">
                      <IconCalendar size={14} />
                      Timeline
                    </Text>
                    <div className="space-y-2">
                      <div>
                        <Text className="text-white text-sm">Created</Text>
                        <Text className="text-blue-300 font-semibold">{formatDate(currentAnnouncement.created_at)}</Text>
                      </div>
                      <div>
                        <Text className="text-white text-sm">Last Updated</Text>
                        <Text className="text-blue-300 font-semibold">{formatDate(currentAnnouncement.updated_at)}</Text>
                      </div>
                    </div>
                  </Paper>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Paper className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                    <Text className="text-sm text-blue-300 font-semibold mb-3 flex items-center gap-2">
                      <IconClock size={14} />
                      Schedule & Expiry
                    </Text>
                    <div className="space-y-2">
                      {currentAnnouncement.publish_at && (
                        <div>
                          <Text className="text-white text-sm">Scheduled For</Text>
                          <Text className="text-blue-300 font-semibold">{formatDate(currentAnnouncement.publish_at)}</Text>
                        </div>
                      )}
                      {currentAnnouncement.expires_at && (
                        <div>
                          <Text className="text-white text-sm">Expires</Text>
                          <Text className={`font-semibold ${
                            new Date(currentAnnouncement.expires_at) < new Date() 
                              ? 'text-red-400' 
                              : 'text-green-400'
                          }`}>
                            {formatDate(currentAnnouncement.expires_at)}
                          </Text>
                        </div>
                      )}
                    </div>
                  </Paper>
                </Grid.Col>
              </Grid>
              
              {/* Action Buttons */}
              <Group justify="flex-end" className="pt-6 border-t border-slate-700/50">
                <Button 
                  variant="subtle" 
                  onClick={() => { closeView(); dispatch(clearCurrentAnnouncement()); }}
                  className="text-slate-400 hover:text-white hover:bg-slate-700/50"
                  size="md"
                >
                  Close
                </Button>
                <Button 
                  leftSection={<IconEdit size={16} />}
                  onClick={() => { closeView(); open(); }}
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan' }}
                  className="shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                  size="md"
                >
                  Edit Announcement
                </Button>
              </Group>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AnnouncementsSection;