/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  ScrollArea,
  Text,
  Group,
  Box,
  Badge,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import {
  HomeIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  BellAlertIcon,
  QuestionMarkCircleIcon,
  ChevronLeftIcon,
  Bars3Icon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

import { Found } from "@/app/auth/auth";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setActiveSection } from "@/store/slices/uiSlice";
import { useAnnouncements } from "@/hooks/useAnnouncement";
import { fetchAnnouncements } from "@/store/slices/announcementsSlice";

interface InstSidebarProps {
  onItemClick?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export const InstSidebar = ({
  onItemClick,
  collapsed = false,
  onToggle
}: InstSidebarProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { activeSection } = useAppSelector((state) => state.ui);
  const { sidebarOpened } = useAppSelector((state) => state.ui);
  const [user, setUser] = useState<any>(null);

  const { announcements } = useAnnouncements();
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<number[]>([]);

  // Use pathname to determine active section for faster updates
  const currentActiveSection = useMemo(() => {
    const pathToSection: Record<string, string> = {
      '/dashboard/instructor/dashboard': 'dashboard',
      '/dashboard/instructor/view': 'myschedule',
      '/dashboard/instructor/evaluations': 'evaluations',
      '/dashboard/instructor/announcement': 'announcements',
      '/dashboard/instructor/feedback': 'SubmitFeedback',
      '/dashboard/instructor/help': 'helpSupport',
      '/dashboard/chat': 'chat',
    };

    return pathToSection[pathname] || activeSection;
  }, [pathname, activeSection]);

  useEffect(() => {
    dispatch(fetchAnnouncements());
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, [dispatch]);

  // Load read announcements from local storage
  useEffect(() => {
    if (user?.id) {
      const loadReadStatus = () => {
        const stored = localStorage.getItem(`read_announcements_${user.id}`);
        if (stored) {
          try {
            setReadAnnouncementIds(JSON.parse(stored));
          } catch (e) {
            console.error("Failed to parse read announcements", e);
          }
        }
      }
      loadReadStatus();

      const handleAnnouncementRead = () => loadReadStatus();
      window.addEventListener('announcement-read', handleAnnouncementRead);

      return () => {
        window.removeEventListener('announcement-read', handleAnnouncementRead);
      };
    }
  }, [user, pathname]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    if (!user?.id) return 0;
    const filtered = announcements.filter(a =>
      a.is_published &&
      (!a.expires_at || new Date(a.expires_at) > new Date()) &&
      (a.department_id === user.department_id)
    );
    return filtered.filter(a => !readAnnouncementIds.includes(a.id)).length;
  }, [announcements, readAnnouncementIds, user]);


  // Instructor data
  const instructorInfo = useMemo(() => ({
    name: user?.full_name || "Instructor",
    code: user?.full_name?.charAt(0) || "I",
    department: user?.department_name || "Department",
  }), [user]);

  // Memoize menu definitions
  const menuDefinitions = useMemo(() => ({
    singleItems: [
      { key: "dashboard", Icon: HomeIcon, label: "Dashboard" },
      { key: "myschedule", Icon: CalendarDaysIcon, label: "My Teaching Schedule" },
      { key: "evaluations", Icon: AcademicCapIcon, label: "Student Evaluations" },
      { key: "announcements", Icon: BellIcon, label: "Announcements" },
      { key: "chat", Icon: ChatBubbleLeftRightIcon, label: "Chat" },
      { key: "SubmitFeedback", Icon: ChatBubbleLeftRightIcon, label: "Submit Feedback" },
      { key: "helpSupport", Icon: QuestionMarkCircleIcon, label: "Help & Support" },
    ]
  }), []);

  // Optimized handler for setting active section
  const handleSetActiveSection = useCallback((section: string) => {
    dispatch(setActiveSection(section));

    const pathMap: Record<string, string> = {
      "dashboard": "/dashboard/instructor/dashboard",
      "myschedule": "/dashboard/instructor/view",
      "evaluations": "/dashboard/instructor/evaluations",
      "announcements": "/dashboard/instructor/announcement",
      "SubmitFeedback": "/dashboard/instructor/feedback",
      "helpSupport": "/dashboard/instructor/help",
      'chat': '/dashboard/chat',
    };

    const path = pathMap[section];
    if (path) {
      router.push(path);
      if (onItemClick) onItemClick();
    }
  }, [dispatch, router, onItemClick]);

  // Render a single menu item
  const renderMenuItem = useCallback((item: { key: string; Icon: any; label: string }) => {
    const isActive = currentActiveSection === item.key;
    const showBadge = item.key === 'announcements' && unreadCount > 0;

    // Dynamic Icon Logic
    let IconToRender = item.Icon;
    if (item.key === 'announcements' && unreadCount > 0) {
      IconToRender = BellAlertIcon;
    }

    if (collapsed) {
      return (
        <Tooltip key={item.key} label={item.label} position="right" withArrow>
          <button
            onClick={() => handleSetActiveSection(item.key)}
            className={`w-full relative flex items-center justify-center p-3 mb-1 rounded-xl transition-all duration-200 ${isActive
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
              : "text-gray-600 hover:bg-blue-50"
              }`}
          >
            <IconToRender className="h-6 w-6 flex-shrink-0" />
            {showBadge && (
              <Badge
                size="xs"
                circle
                color="red"
                className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 pointer-events-none"
              >
                {unreadCount}
              </Badge>
            )}
          </button>
        </Tooltip>
      );
    }

    return (
      <button
        key={item.key}
        onClick={() => handleSetActiveSection(item.key)}
        className={`w-full flex items-center p-3 mb-1 rounded-lg transition-all duration-300 group relative ${isActive
          ? "bg-gradient-to-r from-blue-600 to-blue-600 text-white shadow-md shadow-blue-500/25"
          : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:shadow-md"
          }`}
      >
        <Group gap="xs" className="flex-1">
          <div className={`p-0 rounded-lg relative ${isActive
            ? "bg-white/20"
            : "bg-blue-50 group-hover:bg-blue-100"
            }`}>
            <IconToRender className={`h-5 w-5 ${isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'
              }`} />
            {showBadge && (
              <Badge
                size="xs"
                circle
                color="red"
                className="absolute -top-1 -right-1 min-w-[0.85rem] h-3.5 px-0 flex items-center justify-center pointer-events-none text-[0.6rem]"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
          <span className={`font-semibold text-sm transition-all duration-300 whitespace-nowrap overflow-hidden ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            }`}>
            {item.label}
          </span>
        </Group>
      </button>
    );
  }, [collapsed, currentActiveSection, handleSetActiveSection, unreadCount]);

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-100 transition-all duration-300 ${collapsed ? "w-16" : "w-64"
      }`}>
      {/* Header */}
      {!sidebarOpened && (
        <Box className={`p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-300 ${collapsed ? "justify-center" : ""
          }`}>
          {!collapsed && (
            <Group className="mb-4">

              <div className="flex-1 overflow-hidden">

                <Text size="sm" c="dimmed" className="mt-1 truncate">
                  {instructorInfo.department}
                </Text>
              </div>
            </Group>
          )}

          {/* Collapse Toggle */}
          <div className="border-b dark:border-gray-800 flex items-center justify-between">
            {!collapsed && <Text fw={800} size="xs" color="blue" className="tracking-widest">MENU</Text>}
            <ActionIcon
              variant="light"
              color="blue"
              onClick={onToggle}
              className={`transition-all duration-300 ${collapsed ? "w-full justify-center" : "ml-auto"}`}
            >
              {collapsed ? <Bars3Icon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
            </ActionIcon>
          </div>
        </Box>
      )}

      {/* Navigation Links */}
      <ScrollArea className="flex-1 px-1 py-2">
        <div className="space-y-1">
          {/* Single Menu Items */}
          {menuDefinitions.singleItems.map(item => (
            <div key={item.key}>
              {renderMenuItem(item)}
            </div>
          ))}
        </div>


      </ScrollArea>

      {/* Status Footer */}
      <Box className="p-3 border-t border-gray-100">
        {collapsed ? (
          <div className="flex justify-center">
            <Badge color="blue" variant="dot" size="sm" />
          </div>
        ) : (
          <Group gap="xs">
            <Badge color="blue" variant="light" size="sm">
              Instructor
            </Badge>
            <Text size="xs" c="dimmed" className="ml-auto">
              v1.0
            </Text>
          </Group>
        )}
      </Box>
    </div>
  );
};