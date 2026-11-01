"use client";

import React from "react";
import DashboardSection from "../components/DashboardSection";
import { useAppDispatch } from "@/hooks/redux";
import { setActiveSection } from "@/store/slices/uiSlice";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleSetSection = (section: string) => {
    dispatch(setActiveSection(section));

    const pathMap: Record<string, string> = {
      "dashboard": "/dashboard/student/dashboard",
      "mySchedule": "/dashboard/student/view",
      "announcements": "/dashboard/student/announcement",
      "myResults": "/dashboard/student/results",
      "myresults": "/dashboard/student/results",
      "results": "/dashboard/student/results",
      "submitFeedback": "/dashboard/student/feedback",
      "helpSupport": "/dashboard/student/help",
    };

    const path = pathMap[section];
    if (path) {
      router.push(path);
    }
  };

  return <DashboardSection setActiveSection={handleSetSection} />;
}
