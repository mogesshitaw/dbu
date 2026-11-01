/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { 
  Card, 
  Text, 
  Badge, 
  Modal,
  Button,
  TextInput,
  Avatar,
  Container,
  Loader,
  Center,
  ScrollArea,
  SimpleGrid,
  Title
} from "@mantine/core";
import { 
  IconAlertCircle,
  IconInfoCircle,
  IconBell,
  IconCalendar,
  IconClock,
  IconHourglass,
  IconFlame,
  IconSearch,
  IconRefresh,
  IconUserCircle,
  IconBuilding,
  IconEye,
  IconChartBar,
  IconList,
  IconGridDots,
  IconStar,
  IconShare,
  IconBookmark,
  IconExternalLink,
  IconCopy
} from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { useAppDispatch } from "@/hooks/redux";
import { useAnnouncements } from "@/hooks/useAnnouncement";
import { 
  fetchAnnouncements, 
  setCurrentAnnouncement,
  clearCurrentAnnouncement
} from "@/store/slices/announcementsSlice";
import { Authentication, Found } from "@/app/auth/auth";


const AnnouncementsViewSection = () => {
  const dispatch = useAppDispatch();
  const { announcements, loading, currentAnnouncement } = useAnnouncements();
  
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
//   const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'active' | 'featured' | 'expired'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'title'>('date');
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    dispatch(fetchAnnouncements());
    const checkAuth = async () => {
      const foundUser = await Found();
      setCurrentUser(foundUser);
    };
    checkAuth();
  }, [dispatch]);
  // Filter and sort announcements
  const filteredAnnouncements = announcements
    .filter(announcement => {
      // Search filter
      const matchesSearch = 
        announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        announcement.author_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();
      const matchesFilter = 
        filter === 'all' ? announcement.is_published :
        filter === 'active' ? (!isExpired && announcement.is_published) :
        filter === 'featured' ? (announcement.priority === 'high' && announcement.is_published && !isExpired) :
        filter === 'expired' ? ( announcement.is_published && isExpired) :
        announcement.is_published;
      
      return (matchesSearch && matchesFilter) &&( announcement.department_id===currentUser?.department_id);
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'priority') {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      } else {
        return a.title.localeCompare(b.title);
      }
    });

  // Fetch announcements
  useEffect(() => {
    dispatch(fetchAnnouncements());
  }, [dispatch]);
    
 if (currentUser === null) {
      return <Authentication />
  }
  // Priority configuration
  const priorityConfig = {
    high: { 
      color: "red", 
      icon: <IconAlertCircle size={14} />, 
      name: "Critical",
      gradient: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
      bg: "bg-gradient-to-br from-red-500/10 to-orange-500/10",
      border: "border-red-500/30"
    },
    medium: { 
      color: "blue", 
      icon: <IconBell size={14} />, 
      name: "Important",
      gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
      bg: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10",
      border: "border-blue-500/30"
    },
    low: { 
      color: "emerald", 
      icon: <IconInfoCircle size={14} />, 
      name: "Information",
      gradient: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
      bg: "bg-gradient-to-br from-emerald-500/10 to-green-500/10",
      border: "border-emerald-500/30"
    }
  };

  // Safe priority config getter
  const getPriorityConfig = (priority: string | undefined | null) => {
    const safePriority = priority || 'medium';
    return priorityConfig[safePriority as keyof typeof priorityConfig] || priorityConfig.medium;
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
      day: 'numeric'
    });
  };

  const isRecent = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24;
    };

     const activeAnnouncements = announcements.filter(a => 
    a.is_published && (!a.expires_at || new Date(a.expires_at) > new Date())
    );
    
  const stats = {
    total: announcements.filter((a: {
        [x: string]: any; is_published: any; 
}) => a.is_published && a.department_id === currentUser?.department_id).length,
    active: activeAnnouncements.length,
    highPriority: activeAnnouncements.filter(a => a.priority === 'high').length,
    recent: activeAnnouncements.filter(a => isRecent(a.created_at)).length,
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 md:p-6">
        <Center className="h-96">
          <div className="text-center">
            <Loader size="lg" color="blue" className="mx-auto mb-4" />
            <Text className="text-gray-600 text-lg">Loading announcements...</Text>
          </div>
        </Center>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue to-blue-50 p-4 md:p-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl mb-8">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-500"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)'
          }}
        />
        <div className="relative z-10 p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div>
                <Title order={1} className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent text-center"> 
                 All Announcements View
                </Title>
               <Text c="dimmed" size="xl" ta="center" fw={500}>
                  Stay informed with the latest updates and important notices  with {currentUser?.department_name}
                </Text>
              </div>
            </div>           
          </div>
        </div>
      </div>

      <Container size="xl">
        {/* Controls Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6 border border-gray-200">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 w-full">
              <TextInput
                placeholder="Search announcements by title, content, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftSection={<IconSearch size={18} className="text-gray-400" />}
                rightSection={
                  searchQuery && (
                    <Button 
                      variant="subtle" 
                      size="xs" 
                      onClick={() => setSearchQuery("")}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <IconRefresh size={14} />
                    </Button>
                  )
                }
                className="w-full"
                classNames={{
                  input: "bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
                }}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* View Mode Toggle */}
            <Button.Group>
            <Button
                  variant={viewMode === 'list' ? 'filled' : 'outline'}
                  onClick={() => setViewMode('list')}
                  color="blue"
                  size="sm"
                  leftSection={<IconList size={16} />}
                >
                  List
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'filled' : 'outline'}
                  onClick={() => setViewMode('grid')}
                  color="blue"
                  size="sm"
                  leftSection={<IconGridDots size={16} />}
                >
                  Grid
                </Button>
               
                <Button
                  variant={viewMode === 'timeline' ? 'filled' : 'outline'}
                  onClick={() => setViewMode('timeline')}
                  color="blue"
                  size="sm"
                  leftSection={<IconChartBar size={16} />}
                >
                  Timeline
                </Button>
              </Button.Group>
              
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              >
                <option value="date">Sort by: Date</option>
                <option value="priority">Sort by: Priority</option>
                <option value="title">Sort by: Title</option>
              </select>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              { key: 'all', label: `All Announcements (${stats.total}) `, icon: <IconList size={14} />, color: 'blue' },
              { key: 'active', label: 'Active', icon: <IconEye size={14} />, color: 'green' },
              { key: 'featured', label: 'Featured', icon: <IconStar size={14} />, color: 'yellow' },
              { key: 'expired', label: 'expired', icon: <IconFlame size={14} />, color: 'red' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as any)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all ${
                  filter === item.key
                    ? `bg-${item.color}-500 text-white shadow-sm`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Announcements Display */}
        {filteredAnnouncements.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
              <IconBell size={40} className="text-blue-400/70" />
            </div>
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              {searchQuery ? "No announcements found" : "No announcements available"}
            </Text>
            <Text className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchQuery 
                ? "Try adjusting your search terms or filters to find what you're looking for" 
                : "Check back soon for new announcements and updates"}
            </Text>
            {searchQuery && (
              <Button
                variant="light"
                onClick={() => setSearchQuery("")}
                leftSection={<IconRefresh size={16} />}
                color="blue"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnnouncements.map((announcement) => {
              const priority = getPriorityConfig(announcement.priority);
              const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();
              
              return (
                <Card 
                  key={announcement.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                  onClick={() => {
                    dispatch(setCurrentAnnouncement(announcement));
                    openView();
                  }}
                >
                  {/* Priority Ribbon */}
                  <div 
                    className="absolute -top-2 -right-2 w-24 h-8 flex items-center justify-center text-white text-xs font-bold rounded"
                    style={{ background: priority.gradient }}
                  >
                    {priority.name}
                  </div>
                  
                  <Card.Section className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {isRecent(announcement.created_at) && !isExpired && (
                              <Badge color="orange" variant="light" size="sm" radius="sm">
                                <IconFlame size={10} className="mr-1" />
                                New
                              </Badge>
                            )}
                            {isExpired && (
                              <Badge color="gray" variant="light" size="sm" radius="sm">
                                <IconHourglass size={10} className="mr-1" />
                                Expired
                              </Badge>
                            )}
                          </div>
                          
                          <Text className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {announcement.title}
                          </Text>
                        </div>
                      </div>
                      
                      {/* Content Preview */}
                      <Text className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                        {announcement.content}
                      </Text>
                      
                      {/* Footer */}
                      <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar 
                              size="sm" 
                              radius="xl"
                              className="border border-gray-200"
                            />
                            <div>
                              <Text className="text-sm font-medium text-gray-900">
                                {announcement.author_name}
                              </Text>
                              <Text className="text-xs text-gray-500">
                                {formatDateShort(announcement.created_at)}
                              </Text>
                            </div>
                          </div>
                          
                          <Button
                            variant="subtle"
                            size="xs"
                            color="blue"
                            rightSection={<IconExternalLink size={12} />}
                          >
                            Read
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card.Section>
                </Card>
              );
            })}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => {
              const priority = getPriorityConfig(announcement.priority);
              const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();
              
              return (
                <div
                  key={announcement.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer group"
                  onClick={() => {
                    dispatch(setCurrentAnnouncement(announcement));
                    openView();
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Priority Indicator */}
                      <div 
                        className="w-3 rounded-full flex-shrink-0"
                        style={{ background: priority.gradient }}
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                size="sm"
                                radius="sm"
                                variant="light"
                                color={priority.color}
                                leftSection={priority.icon}
                              >
                                {priority.name}
                              </Badge>
                              
                              {isRecent(announcement.created_at) && !isExpired && (
                                <Badge color="orange" variant="light" size="xs">
                                  New
                                </Badge>
                              )}
                              
                              {isExpired && (
                                <Badge color="gray" variant="light" size="xs">
                                  Expired
                                </Badge>
                              )}
                            </div>
                            
                            <Text className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                              {announcement.title}
                            </Text>
                            
                            <Text className="text-gray-600 text-sm line-clamp-2">
                              {announcement.content}
                            </Text>
                          </div>
                          
                          <Button
                            variant="subtle"
                            size="xs"
                            color="blue"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            View
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <IconUserCircle size={14} />
                              <span>{announcement.author_name}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <IconCalendar size={14} />
                              <span>{formatDateShort(announcement.created_at)}</span>
                            </div>
                            
                            {announcement.department_name && (
                              <div className="flex items-center gap-1.5">
                                <IconBuilding size={14} />
                                <span>{announcement.department_name}</span>
                              </div>
                            )}
                          </div>
                          
                          {announcement.expires_at && (
                            <div className={`flex items-center gap-1.5 ${
                              isExpired ? 'text-gray-400' : 'text-blue-500'
                            }`}>
                              <IconClock size={14} />
                              <span>{isExpired ? 'Expired' : 'Expires'} {formatDateShort(announcement.expires_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Timeline View */
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
            
            <div className="space-y-8">
              {filteredAnnouncements.map((announcement) => {
                const priority = getPriorityConfig(announcement.priority);
                // const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();
                return (
                  <div key={announcement.id} className="relative">
                    {/* Timeline Dot */}
                    <div 
                      className="absolute left-6 top-6 w-4 h-4 rounded-full border-4 border-white shadow"
                      style={{ background: priority.gradient }}
                    />
                    
                    <div className="ml-16">
                      <div 
                        className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer group"
                        onClick={() => {
                          dispatch(setCurrentAnnouncement(announcement));
                          openView();
                        }}
                      >
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <Text className="text-sm text-gray-500 mb-1">
                                {formatDate(announcement.created_at)}
                              </Text>
                              <Text className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {announcement.title}
                              </Text>
                            </div>
                            
                            <Badge
                              size="sm"
                              radius="sm"
                              variant="light"
                              color={priority.color}
                              leftSection={priority.icon}
                            >
                              {priority.name}
                            </Badge>
                          </div>
                          
                          <Text className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {announcement.content}
                          </Text>
                          
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <Avatar size="xs" radius="xl" />
                                <span className="text-gray-700">{announcement.author_name}</span>
                              </div>
                              
                              {announcement.department_name && (
                                <div className="flex items-center gap-1.5 text-gray-500">
                                  <IconBuilding size={12} />
                                  <span>{announcement.department_name}</span>
                                </div>
                              )}
                            </div>
                            
                            <Button
                              variant="subtle"
                              size="xs"
                              color="blue"
                              rightSection={<IconExternalLink size={12} />}
                            >
                              Read Full
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Container>

      {/* Detailed View Modal */}
      <Modal 
        opened={viewOpened} 
        onClose={() => { closeView(); dispatch(clearCurrentAnnouncement()); }}
        size="lg"
        radius="lg"
        overlayProps={{
          backgroundOpacity: 0.5,
          blur: 4,
        }}
        classNames={{
          content: "bg-white border border-gray-200 shadow-2xl",
          header: "border-b border-gray-200",
          body: "p-0"
        }}
      >
        {currentAnnouncement && (
          <div>
            {/* Modal Header with Gradient */}
            <div 
              className="p-6 rounded-t-lg text-white"
              style={{ 
                background: getPriorityConfig(currentAnnouncement.priority).gradient 
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      size="lg"
                      radius="sm"
                      variant="filled"
                      color="filled"
                      className="text-gray-800"
                    >
                      {getPriorityConfig(currentAnnouncement.priority).name}
                    </Badge>
                    {currentAnnouncement.expires_at && new Date(currentAnnouncement.expires_at) < new Date() && (
                      <Badge color="gray" variant="light" size="sm">
                        Expired
                      </Badge>
                    )}
                  </div>
                  
                  <Text className="text-2xl font-bold">
                    Title : {currentAnnouncement.title}
                  </Text>
                </div>
              </div>
            </div>
            
            {/* Modal Body */}
            <ScrollArea className="h-[60vh]">
              <div className="p-6 space-y-6">
                {/* Author & Date */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Avatar size="md" radius="xl" />
                    <div>
                      <Text className="font-semibold text-gray-900">
                        {currentAnnouncement.author_name}
                      </Text>
                      <Text className="text-sm text-gray-500">Author</Text>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Text className="text-sm text-gray-900 font-medium">
                      {formatDate(currentAnnouncement.created_at)}
                    </Text>
                    <Text className="text-xs text-gray-500">Posted</Text>
                  </div>
                </div>
                
                {/* Content */}
                <div>
                  <Text className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {currentAnnouncement.content}
                  </Text>
                </div>
                
                {/* Metadata Grid */}
                <SimpleGrid cols={2} spacing="lg">
                  <div>
                    <Text className="text-sm font-medium text-gray-500 mb-1">Department</Text>
                    <Text className="text-gray-900">
                      {currentAnnouncement.department_name || "All Departments"}
                    </Text>
                  </div>
                  
                  <div>
                    <Text className="text-sm font-medium text-gray-500 mb-1">Last Updated</Text>
                    <Text className="text-gray-900">
                      {formatDate(currentAnnouncement.updated_at)}
                    </Text>
                  </div>
                  
                  <div>
                    <Text className="text-sm font-medium text-gray-500 mb-1">Status</Text>
                    <Badge 
                      color={currentAnnouncement.expires_at && new Date(currentAnnouncement.expires_at) < new Date() ? 'gray' : 'green'}
                      variant="light"
                    >
                      {currentAnnouncement.expires_at && new Date(currentAnnouncement.expires_at) < new Date() 
                        ? 'Expired' 
                        : 'Active'}
                    </Badge>
                  </div>
                  
                  {currentAnnouncement.expires_at && (
                    <div>
                      <Text className="text-sm font-medium text-gray-500 mb-1">
                        {new Date(currentAnnouncement.expires_at) < new Date() ? 'Expired On' : 'Expires'}
                      </Text>
                      <Text className={`font-medium ${
                        new Date(currentAnnouncement.expires_at) < new Date() 
                          ? 'text-gray-500' 
                          : 'text-blue-600'
                      }`}>
                        {formatDate(currentAnnouncement.expires_at)}
                      </Text>
                    </div>
                  )}
                </SimpleGrid>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-6 border-t border-gray-100">
                  <Button
                    variant="light"
                    color="blue"
                    leftSection={<IconShare size={16} />}
                    size="sm"
                  >
                    Share
                  </Button>
                  <Button
                    variant="light"
                    color="gray"
                    leftSection={<IconBookmark size={16} />}
                    size="sm"
                  >
                    Save
                  </Button>
                  <Button
                    variant="light"
                    color="gray"
                    leftSection={<IconCopy size={16} />}
                    size="sm"
                  >
                    Copy Link
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AnnouncementsViewSection;