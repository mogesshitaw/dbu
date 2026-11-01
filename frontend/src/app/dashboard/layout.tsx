/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { AppShell, Group, Text, Drawer, ActionIcon } from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";
import PostHeader from "../../compnent/postHeader";
import { AdminSidebar } from "./admin/components/sidebar";
import { DepSidebar } from "./department/components/sidebar";
import { InstSidebar } from "./instructor/components/sidebar";
import { StudSidebar } from "./student/components/sidebar";
import { Authentication, Found } from "../auth/auth";
import { useAppSelector, useAppDispatch } from "@/hooks/redux";
import { setSidebarOpened } from "@/store/slices/uiSlice";
import { useUserActivity } from "../auth/userActivity";
import { useRouter } from "next/navigation";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  // const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const { sidebarOpened } = useAppSelector((state) => state.ui);
  const dispatch = useAppDispatch();
  // FAST ACTION: This state controls the stretch of the main content
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
const [sessionTimeout, setSessionTimeout] = useState(30 * 60 * 1000);

  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);
 const router = useRouter();
  const API_URL =process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
      if (foundUser) setSessionTimeout(foundUser.sessionTime * 60 * 1000);
    };
    checkAuth();
  }, []);

  useUserActivity(
    async () => {
      
      if (user.enable_session_timeout) {
        console.log("User is idle → locking session");
      // 🔒 lock session in backend
        await fetch(`${API_URL}/api/auth/lock`, {
        method: "POST",
        credentials: "include",
      });
      router.replace("/lock-screen");}
    },
    () => {
      console.log("User is active");
    },
    sessionTimeout // 1 minute
  );
  console.log("session time out", sessionTimeout);
  useEffect(() => {
  Found().then((result) => {
    if (result) {
      if (result.locked ) {
        router.replace("/lock-screen");
      }
    } else if (result ==null) {
      return<Authentication/>;
    }
  });
    
  }, [router]);
  
  if (user === null) {
   return <Authentication />
 }
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const renderSidebar = () => {
    // Pass the collapse state down to children
    const sidebarProps = { 
      collapsed: desktopCollapsed, 
      onToggle: () => setDesktopCollapsed(!desktopCollapsed) 
    };

    switch (user?.role) {
      case "admin": return <AdminSidebar {...sidebarProps} />;
      case "department_head": return <DepSidebar {...sidebarProps} />;
      case "instructor": return <InstSidebar {...sidebarProps} />;
      case "Student": return <StudSidebar {...sidebarProps} />;
      default: return null;
    }
  };

  return (
    <AppShell
      header={{ height: 80 }}
      navbar={{
        // DYNAMIC WIDTH: Content stretches when this changes
        width: desktopCollapsed ? 80 : 280, 
        breakpoint: 'sm',
      collapsed: { mobile: !sidebarOpened },      }}
      padding="md"
      // Optimization: Hardware accelerated transitions
      transitionDuration={300}
      transitionTimingFunction="ease-in-out"
      zIndex={100}
    >
      <AppShell.Header className="dark:bg-gray-900 border-b dark:border-gray-800">
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <PostHeader />
          </Group>
          <ActionIcon onClick={toggleDarkMode} variant="default" size="lg" radius="md">
            {darkMode ? <IconSun size={20} color="yellow" /> : <IconMoon size={20} />}
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar className="transition-all duration-300 overflow-hidden border-r dark:border-gray-800">
        <Drawer
                  opened={sidebarOpened}
                      onClose={() => dispatch(setSidebarOpened(false))}
                      padding="md"
                      size="300px"
                      title={
                        <div className="flex items-center justify-between">
                          <Text fw={700} size="lg">Menu</Text>
                        </div>
                      }
                      overlayProps={{ opacity: 0.5, blur: 2 }}
                      zIndex={1000}
                      position="left"
                >
              {renderSidebar()}
            </Drawer>
        {renderSidebar()}
      </AppShell.Navbar>

      {/* Main Content: This stretches automatically because of AppShell width logic */}
      <AppShell.Main className="bg-white transition-all duration-300">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </AppShell.Main>
    </AppShell>
  );
}