"use client";

import { useAppDispatch } from "@/hooks/redux";
import { setActiveSection } from "@/store/slices/uiSlice";
import DashboardSection from "./department/components/DashboardSection";

export default function Page() {
  const dispatch = useAppDispatch();
  
  const handleSetActiveSection = (section: string) => {
    dispatch(setActiveSection(section));
  };

  return <DashboardSection setActiveSection={handleSetActiveSection} />;
}