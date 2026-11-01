/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  ScrollArea,
  Text,
  Group,
  Collapse,
  Box,
  Badge,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import {
  BellIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  UsersIcon,
  ChevronDownIcon,
  EyeIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  BookOpenIcon,
  LightBulbIcon,
  ChevronLeftIcon,
  BuildingStorefrontIcon,
  Bars3Icon,
  PlusCircleIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

import { Authentication, Found } from "@/app/auth/auth";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setActiveSection } from "@/store/slices/uiSlice";
import { ShieldCheckIcon } from "@heroicons/react/24/solid";

interface DepSidebarProps {
  onItemClick?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export const DepSidebar = ({ 
  onItemClick, 
  collapsed = false, 
  onToggle 
}: DepSidebarProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { activeSection } = useAppSelector((state) => state.ui);
  const { sidebarOpened } = useAppSelector((state) => state.ui);
  const [user, setUser] = useState<any>(null);

  // Use pathname to determine active section for faster updates
  const currentActiveSection = useMemo(() => {
    const pathToSection: Record<string, string> = {
      '/dashboard/department/dashboard': 'dashboard',
      '/dashboard/department/manageinstructor': 'manageinst',
      '/dashboard/department/manageschedule': 'addSchedule',
      '/dashboard/department/manageschedule/view': 'viewSchedule',
      '/dashboard/department/viewStudent': 'managestudent',
      '/dashboard/department/manageschedule/view/instructorschedule': 'View-instructor-Schedule',
      '/dashboard/department/viewCourse': 'viewcourse',
      '/dashboard/department/course_batch': 'mangebatchcourse', 
      '/dashboard/department/evaluation': 'evaluation', 
      '/dashboard/department/manageschedule/view/myschedule': 'myschedule',
      '/dashboard/department/section-room-management': 'mangeroom',
      '/dashboard/department/time_Slot':'timeslot',
      '/dashboard/chat': 'chat',
      '/dashboard/department/announcement/viewannounce': 'Viewall',
      '/dashboard/department/announcement': 'manageannounce',
      '/dashboard/department/feedback': 'viewFeedback',
      '/dashboard/department/feedback/analytics': 'feedbackAnalytics',
      '/dashboard/department/feedback/settings': 'feedbackSettings',
      '/dashboard/department/help': 'helpSupport',
    };
    
    return pathToSection[pathname] || activeSection;
  }, [pathname, activeSection]);

  // State for collapsible menus
  const [openedMenus, setOpenedMenus] = useState<Record<string, boolean>>({
    schedule: false,
    feedback: false,
    announce: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);

  // Department data
  const departmentInfo = useMemo(() => ({
    name: user?.department_name || "Department",
    code: user?.department_name?.charAt(0) || "D",
    head: user?.full_name || "Head",
  }), [user]);

  // Memoize menu definitions
  const menuDefinitions = useMemo(() => ({
    submenus: {
      schedule: {
        key: 'manageSchedule',
        Icon: CalendarDaysIcon,
        label: 'Schedule Management',
        items: [
          { key: "addSchedule", icon: PlusCircleIcon, label: "Add New Schedule" },
          { key: "viewSchedule", icon: CalendarDaysIcon, label: "View Schedules" },
          { key: "View-instructor-Schedule", icon: MagnifyingGlassIcon, label: "Instructor Search" },
          { key: "myschedule", icon: EyeIcon, label: "My Schedule" },


        ]
      },
        course: {
        key: 'coursemange',
        Icon: AcademicCapIcon,
        label: 'Course',
        items: [
          { key: "viewcourse", icon: BookOpenIcon, label: "Course Overview" },
          { key: "mangebatchcourse", icon: ClipboardDocumentListIcon, label: "Course Batch " },
          { key: "evaluation", icon: ClipboardDocumentCheckIcon, label: "Student Evaluations" }
        ]
      },
      announce: {
        key: 'Announcement',
        Icon: BellIcon,
        label: 'Announcement',
        items: [
          { key: "Viewall", icon: EyeIcon, label: "View All" },
          { key: "manageannounce", icon: ShieldCheckIcon, label: "Manage Announcement" },
        ]
      },
      feedback: {
        key: 'feedback',
        Icon: ChatBubbleLeftRightIcon,
        label: 'Feedback & Support',
        items: [
          { key: "viewFeedback", icon: EyeIcon, label: "View Feedback" },
          { key: "feedbackAnalytics", icon: ChartBarIcon, label: "Feedback Analytics" },
          { key: "helpSupport", icon: LightBulbIcon, label: "Help & Support" },
        ]
      }
    },
    singleItems: [
      { key: "dashboard", Icon: HomeIcon, label: "Dashboard" },
      { key: "manageinst", Icon: UsersIcon, label: "Manage Instructors" },
      { key: "managestudent", Icon: UsersIcon, label: "Manage Students" },
      { key: "mangeroom", Icon: BuildingStorefrontIcon, label: "Section room management" },
      { key: "timeslot", Icon: ClockIcon, label: "Time Slot" },
      { key: "chat", Icon: ChatBubbleLeftRightIcon, label: "Chat" },
    ]
  }), []);

  // Check if a menu is active
  const isMenuActive = useCallback((menuKey: string) => {
    const menu = menuDefinitions.submenus[menuKey as keyof typeof menuDefinitions.submenus];
    if (!menu) return false;
    
    return menu.items.some(item => item.key === currentActiveSection);
  }, [currentActiveSection, menuDefinitions]);

  // Optimized handler for setting active section
  const handleSetActiveSection = useCallback((section: string) => {
    dispatch(setActiveSection(section));
    
    const pathMap: Record<string, string> = {
      "dashboard": "/dashboard/department/dashboard",
      "manageinst": "/dashboard/department/manageinstructor",
      "addSchedule": "/dashboard/department/manageschedule",
      "viewSchedule": "/dashboard/department/manageschedule/view",
      "managestudent": "/dashboard/department/viewStudent",
      "View-instructor-Schedule": "/dashboard/department/manageschedule/view/instructorschedule",
      'myschedule' : '/dashboard/department/manageschedule/view/myschedule',
      "viewcourse": "/dashboard/department/viewCourse",
      'mangebatchcourse': '/dashboard/department/course_batch',
      'evaluation': '/dashboard/department/evaluation',
       'mangeroom':'/dashboard/department/section-room-management',
      'timeslot':'/dashboard/department/time_Slot',
      "chat": "/dashboard/chat",
      "Viewall": "/dashboard/department/announcement/viewannounce",
      "manageannounce": "/dashboard/department/announcement",
      "viewFeedback": "/dashboard/department/feedback",
      "feedbackAnalytics": "/dashboard/department/feedback/analytics",
      "feedbackSettings": "/dashboard/department/feedback/settings",
      "helpSupport": "/dashboard/department/help",
    };

    const path = pathMap[section];
    if (path) {
      router.push(path);
      if (onItemClick) onItemClick();
    }
  }, [dispatch, router, onItemClick]);

  // Toggle menu function
  const toggleMenu = useCallback((menu: string) => {
    setOpenedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  }, []);

  // Render a submenu (collapsed or expanded view)
  const renderSubmenu = useCallback((menuKey: keyof typeof menuDefinitions.submenus) => {
    const menu = menuDefinitions.submenus[menuKey];
    if (!menu) return null;

    const isActive = isMenuActive(menuKey);
    const isOpened = openedMenus[menuKey];
    
    if (collapsed) {
      return (
        <Tooltip key={menu.key} label={menu.label} position="right" withArrow>
          <button
            onClick={() => {
              if (!isOpened) {
                setOpenedMenus(prev => ({ ...prev, [menuKey]: true }));
              }
              handleSetActiveSection(menu.items[0].key);
            }}
            className={`w-full flex items-center justify-center p-3 mb-1 rounded-xl transition-all duration-200 ${
              isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-600 hover:bg-blue-50"
            }`}
          >
            <menu.Icon className="h-6 w-6 flex-shrink-0" />
          </button>
        </Tooltip>
      );
    }

    return (
      <div key={menu.key} className="space-y-1">
        {/* Main Menu Button */}
        <button
          onClick={() => toggleMenu(menuKey)}
          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group ${
            isActive
              ? "bg-gradient-to-r from-blue-600 to-blue-600 text-white shadow-lg shadow-blue-500/25"
              : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:shadow-md"
          }`}
        >
          <Group gap="xs">
            <div className={`p-0 rounded-lg ${
              isActive 
                ? "bg-white/20" 
                : "bg-blue-50 group-hover:bg-blue-100"
            }`}>
              <menu.Icon className={`h-5 w-5 ${
                isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'
              }`} />
            </div>
            <span className="font-semibold text-sm">{menu.label}</span>
          </Group>
          <ChevronDownIcon 
            className={`h-4 w-4 transition-transform duration-300 ${
              isOpened ? 'rotate-180' : ''
            } ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} 
          />
        </button>

        {/* Submenu Items */}
        <Collapse in={isOpened}>
          <div className="ml-6 space-y-2 border-l-2 border-blue-100 pl-3 py-2">
            {menu.items.map((item) => (
              <button
                key={item.key}
                onClick={() => handleSetActiveSection(item.key)}
                className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 group ${
                  currentActiveSection === item.key
                    ? "bg-blue-100 text-blue-700 shadow-sm border border-blue-200 transform scale-105"
                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:translate-x-1"
                }`}
              >
                <div className={`p-1.5 rounded-md ${
                  currentActiveSection === item.key
                    ? "bg-blue-200"
                    : "bg-gray-100 group-hover:bg-blue-100"
                }`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="font-medium text-sm ml-3">{item.label}</span>
              </button>
            ))}
          </div>
        </Collapse>
      </div>
    );
  }, [menuDefinitions, isMenuActive, openedMenus, collapsed, handleSetActiveSection, toggleMenu, currentActiveSection]);

  // Render a single menu item
  const renderMenuItem = useCallback((item: { key: string; Icon: any; label: string }) => {
    const isActive = currentActiveSection === item.key;
    
    if (collapsed) {
      return (
        <Tooltip key={item.key} label={item.label} position="right" withArrow>
          <button
            onClick={() => handleSetActiveSection(item.key)}
            className={`w-full flex items-center justify-center p-3 mb-1 rounded-xl transition-all duration-200 ${
              isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" 
                : "text-gray-600 hover:bg-blue-50"
            }`}
          >
            <item.Icon className="h-6 w-6 flex-shrink-0" />
          </button>
        </Tooltip>
      );
    }

    return (
      <button
        key={item.key}
        onClick={() => handleSetActiveSection(item.key)}
        className={`w-full flex items-center p-3 mb-1 rounded-lg transition-all duration-300 group ${
          isActive
            ? "bg-gradient-to-r from-blue-600 to-blue-600 text-white shadow-md shadow-blue-500/25"
            : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 hover:shadow-md"
        }`}
      >
        <Group gap="xs">
          <div className={`p-0 rounded-lg ${
            isActive 
              ? "bg-white/20" 
              : "bg-blue-50 group-hover:bg-blue-100"
          }`}>
            <item.Icon className={`h-5 w-5 ${
              isActive ? 'text-white' : 'text-blue-600 group-hover:text-blue-700'
            }`} />
          </div>
          <span className={`font-semibold text-sm transition-all duration-300 whitespace-nowrap overflow-hidden ${
            collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
          }`}>
            {item.label}
          </span>
        </Group>
      </button>
    );
  }, [collapsed, currentActiveSection, handleSetActiveSection]);

  // Auto-open current active menu
  useEffect(() => {
    Object.entries(menuDefinitions.submenus).forEach(([menuKey, menu]) => {
      if (menu.items.some(item => item.key === currentActiveSection)) {
        setOpenedMenus(prev => ({ ...prev, [menuKey]: true }));
      }
    });
  }, [currentActiveSection, menuDefinitions.submenus]);
  if (user === null) {
  return <Authentication />
}
  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-100 transition-all duration-300 ${
      collapsed ? "w-16" : "w-64"
      }`}>
      {/* Header */}
      {!sidebarOpened && (
        <Box className={`p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-300 ${
          collapsed ? "justify-center" : ""
        }`}>
       {!collapsed && (
            <Group className="mb-4">
              <div className="flex-1 overflow-hidden">
                <Text fw={700} size="lg" className="text-gray-900 truncate">
                  {departmentInfo.name}
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
          
          {/* Submenus */}
          {Object.keys(menuDefinitions.submenus).map(menuKey => (
            <div key={menuKey}>
              {renderSubmenu(menuKey as keyof typeof menuDefinitions.submenus)}
            </div>
          ))}
        </div>

        {/* Quick Actions Footer (only show when expanded) */}
        {!collapsed && (
          <Box className="mt-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
            <Text fw={600} size="sm" className="text-green-800 mb-2">
              Quick Actions
            </Text>
            <Group gap="xs">
              <Badge color="green" variant="light" size="sm">
                New Semester
              </Badge>
              <Badge color="blue" variant="light" size="sm">
                Reports Due
              </Badge>
              <Badge color="orange" variant="light" size="sm">
                Meetings
              </Badge>
            </Group>
          </Box>
        )}
      </ScrollArea>

      {/* Status Footer */}
      <Box className="p-3 border-t border-gray-100">
        {collapsed ? (
          <div className="flex justify-center">
            <Badge color="green" variant="dot" size="sm" />
          </div>
        ) : (
          <Group gap="xs">
            <Badge color="green" variant="light" size="sm">
              Active
            </Badge>
            <Text size="xs" c="dimmed" className="ml-auto">
              Dept v1.0
            </Text>
          </Group>
        )}
      </Box>
    </div>
  );
};