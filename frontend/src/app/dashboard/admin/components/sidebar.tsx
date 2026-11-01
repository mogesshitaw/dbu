/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  ScrollArea,
  Text,
  Group,
  Collapse,
  Box,
  Badge,
  Avatar,
  Divider,
  Tooltip,
  ActionIcon,
} from "@mantine/core";
import {
  AcademicCapIcon,
  BuildingLibraryIcon,
  ChatBubbleLeftRightIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  UsersIcon,
  ChevronDownIcon,
  PlusIcon,
  BuildingOffice2Icon,
  Cog6ToothIcon,
  UserPlusIcon,
  Squares2X2Icon,
  BuildingStorefrontIcon,
  BuildingOfficeIcon,
  HomeModernIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  LightBulbIcon,
  PhoneIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
  BellIcon,
  ChevronLeftIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setActiveSection } from "@/store/slices/uiSlice";

interface AdminSidebarProps {
  onItemClick?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export const AdminSidebar = ({ 
  onItemClick, 
  collapsed = false, 
  onToggle 
}: AdminSidebarProps) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { activeSection } = useAppSelector((state) => state.ui);
    const { sidebarOpened } = useAppSelector((state) => state.ui);
  
  // Use pathname to determine active section for faster updates
  const currentActiveSection = useMemo(() => {
    // Map pathnames to sections
    const pathToSection: Record<string, string> = {
      '/dashboard/admin/dashbaord': 'dashboard',
      '/dashboard/admin/manageuser': 'manageUsers',
      '/dashboard/admin/manageuser/add': 'addUser',
      '/dashboard/admin/manageCourse': 'manageCourse',
      "/dashboard/admin/manageCourse/assign_inst":"assigninst",
      '/dashboard/admin/manageCourse/add': 'addCourse',
      '/dashboard/admin/faculity': 'faculity',
      '/dashboard/admin/managedepartment': 'manageDepartments',
      '/dashboard/admin/block': 'blocks',
      '/dashboard/admin/floor': 'floors',
      '/dashboard/admin/room': 'rooms',
      '/dashboard/admin/batch': 'batch',
      '/dashboard/admin/semester': 'semester',
      '/dashboard/admin/feedback': 'viewFeedback',
      '/dashboard/admin/import-students': 'addexternalfile',
      '/dashboard/admin/studentRegister': 'addstudent',
      '/dashboard/chat': 'chat',
      '/dashboard/admin/feedback/analytics': 'feedbackAnalytics',
      '/dashboard/admin/help': 'helpSupport',
      // '/dashboard/admin/settings/general': 'generalSettings',
      // '/dashboard/admin/settings/advanced': 'advancedSettings',
      // '/dashboard/admin/settings/security': 'securitySettings',
      '/dashboard/admin/reports': 'systemReports',
    };
    
    return pathToSection[pathname] || activeSection;
  }, [pathname, activeSection]);

  // State for collapsible menus
  const [openedMenus, setOpenedMenus] = useState<Record<string, boolean>>({
    course: false,
    users: false,
    room: false,
    department: false,
    system: false,
    feedback: false,
    batch: false,
    student: false,
  });

  // Admin data
  const adminInfo = useMemo(() => ({
    name: "Administrator",
    role: "System Admin",
    totalUsers: 1247,
    systemStatus: "Online",
  }), []);

  // Memoize menu definitions
  const menuDefinitions = useMemo(() => ({
    submenus: {
        department: {
        key: 'manageDepartment',
        Icon: BuildingLibraryIcon,
        label: 'Department Management',
        items: [
          { key: "faculity", icon: UserGroupIcon, label: "Manage Faculty" },
          { key: "manageDepartments", icon: UserGroupIcon, label: "Manage Departments" },
        ]
      },
      users: {
        key: 'manageUsers',
        Icon: UsersIcon,
        label: 'User Management',
        items: [
          { key: "addUser", icon: UserPlusIcon, label: "Add New User" },
          { key: "manageUsers", icon: UserGroupIcon, label: "Manage Users" },
        ]
      },
      course: {
        key: 'manageCourse',
        Icon: AcademicCapIcon,
        label: 'Course Management',
        items: [
          { key: "addCourse", icon: PlusIcon, label: "Add New Course" },
          { key: "manageCourse", icon: AcademicCapIcon, label: "Manage Courses" },
          { key: "assigninst", icon: AcademicCapIcon, label: "Assing Courses" },
        ]
      },
    
      room: {
        key: 'roomManagement',
        Icon: BuildingOffice2Icon,
        label: 'Room Management',
        items: [
          { key: "blocks", icon: BuildingStorefrontIcon, label: "Manage Blocks" },
          { key: "floors", icon: Squares2X2Icon, label: "Manage Floor" },
          { key: "rooms", icon: HomeModernIcon, label: "Manage Rooms" },
        ]
      },
      batch: {
        key: 'batchManagement',
        Icon: CalendarIcon,
        label: 'Batch Management',
        items: [
          { key: "batch", icon: DocumentTextIcon, label: "Manage Batches" },
          { key: "semester", icon: CalendarIcon, label: "Manage Semesters" },
        ]
      },

      // system: {
      //   key: 'systemSettings',
      //   Icon: Cog6ToothIcon,
      //   label: 'System Settings',
      //   items: [
      //     { key: "generalSettings", icon: Cog6ToothIcon, label: "General Settings" },
      //     { key: "securitySettings", icon: ShieldCheckIcon, label: "Security Settings" },
      //     { key: "advancedSettings", icon: WrenchScrewdriverIcon, label: "Advanced Settings" },
      //     { key: "systemReports", icon: ChartBarIcon, label: "System Reports" },
      //   ]
      // },

      feedback: {
        key: 'feedback',
        Icon: ChatBubbleLeftRightIcon,
        label: 'Feedback & Support',
        items: [
          { key: "viewFeedback", icon: EyeIcon, label: "View Feedback" },
         // { key: "feedbackAnalytics", icon: DocumentChartBarIcon, label: "Feedback Analytics" },
          { key: "helpSupport", icon: LightBulbIcon, label: "Help & Support" },
        ]
      }
    },
    singleItems: [
      { key: "dashboard", Icon: HomeIcon, label: "Dashboard" },
      { key: "chat", Icon: ChatBubbleLeftRightIcon, label: "Chat" },
      { key: "addstudent", Icon: UserPlusIcon, label: "Manage Student" },
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
    
    // Navigate immediately without waiting for useEffect
    const pathMap: Record<string, string> = {
      "dashboard": "/dashboard/admin/dashbaord",
      "manageUsers": "/dashboard/admin/manageuser",
      "addUser": "/dashboard/admin/manageuser/add",
      "manageCourse": "/dashboard/admin/manageCourse",
      "assigninst":"/dashboard/admin/manageCourse/assign_inst",
      "addCourse": "/dashboard/admin/manageCourse/add",
      "faculity": "/dashboard/admin/faculity",
      "manageDepartments": "/dashboard/admin/managedepartment",
      "blocks": "/dashboard/admin/block",
      "floors": "/dashboard/admin/floor",
      "rooms": "/dashboard/admin/room",
      "batch": "/dashboard/admin/batch",
      "semester": "/dashboard/admin/semester",
      "viewFeedback": "/dashboard/admin/feedback",
      "addexternalfile": "/dashboard/admin/import-students",
      "addstudent": "/dashboard/admin/studentRegister",
      "chat": "/dashboard/chat",
      "feedbackAnalytics": "/dashboard/admin/feedback/analytics",
      "helpSupport": "/dashboard/admin/help",
      // "generalSettings": "/dashboard/admin/settings/general",
      // "advancedSettings": "/dashboard/admin/settings/advanced",
      // "securitySettings": "/dashboard/admin/settings/security",
      "systemReports": "/dashboard/admin/reports",
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
    // Find which menu contains the current active section
    Object.entries(menuDefinitions.submenus).forEach(([menuKey, menu]) => {
      if (menu.items.some(item => item.key === currentActiveSection)) {
        setOpenedMenus(prev => ({ ...prev, [menuKey]: true }));
      }
    });
  }, [currentActiveSection, menuDefinitions.submenus]);

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-100 transition-all duration-300 ${
      collapsed ? "w-16" : "w-64"
    }`}>
      {/* Header */}
      {!sidebarOpened &&
        <Box className={`p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 transition-all duration-300 ${collapsed ? "justify-center" : ""
          }`}>
           <Group className={`${collapsed ? "justify-center" : ""}`}>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <Text fw={700} size="lg" className="text-gray-900 truncate">
                {adminInfo.name}
              </Text>
            </div>
          )}
        </Group>
          {/* Collapse Toggle */}
          <div className=" border-b dark:border-gray-800 flex items-center justify-between">
            {!collapsed && <Text fw={800} size="xs" color="blue" className="tracking-widest">MENU</Text>}
            <ActionIcon
              variant="light"
              color="blue"
              onClick={onToggle}
             className={`mt-3 transition-all duration-300 ${collapsed ? "w-full justify-center" : "ml-auto"}`}>
              {collapsed ? <Bars3Icon className="h-5 w-5" /> : <ChevronLeftIcon className="h-5 w-5" />}
            </ActionIcon>
          </div>
        </Box>
      }
      {/* Navigation Links */}
      <ScrollArea className="flex-1 px-1 py-2">
        <div className="space-y-1">
          {/* Single Menu Items - Added keys */}
          {menuDefinitions.singleItems.map(item => (
            <div key={item.key}>
              {renderMenuItem(item)}
            </div>
          ))}
          {/* Submenus - Added keys */}
          {Object.keys(menuDefinitions.submenus).map(menuKey => (
            <div key={menuKey}>
              {renderSubmenu(menuKey as keyof typeof menuDefinitions.submenus)}
            </div>
          ))}
        </div>

        {/* System Status (only show when expanded) */}
        {!collapsed && (
          <Box className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <Text fw={600} size="sm" className="text-blue-800 mb-2">
              System Status
            </Text>
            <Group gap="xs">
              <Badge color="green" variant="light" size="sm">
                All Systems Online
              </Badge>
              <Badge color="blue" variant="light" size="sm">
                Monitoring
              </Badge>
            </Group>
          </Box>
        )}
      </ScrollArea>

      {/* Profile Footer (minimal when collapsed) */}
      <Box className="p-3 border-t border-gray-100">
        {collapsed ? (
          <div className="flex justify-center">
            <Badge color="green" variant="dot" size="sm" />
          </div>
        ) : (
          <Group gap="xs">
            <Badge color="green" variant="light" size="sm">
              Online
            </Badge>
            <Text size="xs" c="dimmed" className="ml-auto">
              v2.1
            </Text>
          </Group>
        )}
      </Box>
    </div>
  );
};

