/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  BellAlertIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

// Redux Imports
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchTodaySchedule,
  fetchAnnouncements,
  selectTodaySchedules,
  selectAnnouncements,
  selectScheduleLoading,
} from "@/store/slices/dashboardSlice";
import { Authentication, Found } from "@/app/auth/auth";

interface Props {
  setActiveSection: (section: string) => void;
}

const DashboardSection: React.FC<Props> = ({ setActiveSection }) => {
  const dispatch = useAppDispatch();

  // Redux selectors with safe defaults
  const todaySchedules = useAppSelector(selectTodaySchedules);
  const announcements = useAppSelector(selectAnnouncements);
  const scheduleLoading = useAppSelector(selectScheduleLoading);

  // Fetch today's schedule and announcements on component mount
  useEffect(() => {
    dispatch(fetchTodaySchedule());
    dispatch(fetchAnnouncements());
  }, [dispatch]);

  const handleClick = (section: string) => {
    setActiveSection(section);
  };

  // Get today's day name
  const getTodayDayName = () => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.log("Time parsing error:", error);
      return timeString; // Fallback to original string if parsing fails
    }
  };
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
  const cards = [
    {
      label: "My Courses",
      icon: BookOpenIcon,
      section: "myCourses",
      color: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800",
      badge: todaySchedules && todaySchedules.length > 0 ? todaySchedules.length.toString() : undefined
    },
    {
      label: "Class Schedule",
      icon: CalendarDaysIcon,
      section: "classSchedule",
      color: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-100 dark:hover:bg-indigo-800",
    },
    {
      label: "Class Availability",
      icon: PencilSquareIcon,
      section: "classAvailability",
      color: "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-800",
    },
    {
      label: "Notifications",
      icon: BellAlertIcon,
      section: "notifications",
      color: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:bg-yellow-800",
      badge: announcements && announcements.length > 0 ? announcements.length.toString() : undefined
    },
    {
      label: "Account Update",
      icon: UserCircleIcon,
      section: "accountUpdate",
      color: "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:hover:bg-purple-800",
    },
    {
      label: "Downloads",
      icon: ArrowDownTrayIcon,
      section: "downloads",
      color: "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800",
    },
  ];

  // Safe array checks
  const safeTodaySchedules = Array.isArray(todaySchedules) ? todaySchedules : [];
  const safeAnnouncements = Array.isArray(announcements) ? announcements : [];

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-blue-800 dark:text-blue-200">
            Instructor Dashboard
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-2">
            Welcome! Quickly navigate to key sections below.
          </p>
        </div>
        
        {/* Today's Schedule Quick View */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700 min-w-[300px]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
              Today&apos;s Schedule ({getTodayDayName()})
            </h3>
            {scheduleLoading && (
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            )}
          </div>
          
          {scheduleLoading ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">Loading today&apos;s classes...</div>
          ) : safeTodaySchedules.length > 0 ? (
            <div className="space-y-2">
              {safeTodaySchedules.slice(0, 2).map((schedule, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {schedule.course_name}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                  </span>
                </div>
              ))}
              {safeTodaySchedules.length > 2 && (
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  +{safeTodaySchedules.length - 2} more classes
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-600 dark:text-gray-400">No classes scheduled for today</div>
          )}
        </div>
      </div>

      {/* Announcements Banner */}
      {safeAnnouncements.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <BellAlertIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm">
                Latest Announcement
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1 line-clamp-2">
                {safeAnnouncements[0].title}
              </p>
            </div>
            <button
              onClick={() => handleClick("notifications")}
              className="text-xs bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full font-medium transition-colors"
            >
              View All
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {cards.map(({ label, icon: Icon, section, color, badge }) => (
          <button
            key={section}
            role="button"
            aria-label={`Go to ${label}`}
            onClick={() => handleClick(section)}
            className={`flex flex-col items-center justify-center p-6 rounded-lg shadow-md transform transition-all hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-700 relative ${color}`}
          >
            {/* Badge for notifications */}
            {badge && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {badge}
              </span>
            )}
            
            <Icon className="h-12 w-12 mb-3" />
            <span className="text-lg font-semibold">{label}</span>
            
            {/* Additional info for specific cards */}
            {section === "myCourses" && safeTodaySchedules.length > 0 && (
              <span className="text-sm mt-2 text-blue-600 dark:text-blue-300">
                {safeTodaySchedules.length} classes today
              </span>
            )}
            
            {section === "notifications" && safeAnnouncements.length > 0 && (
              <span className="text-sm mt-2 text-yellow-600 dark:text-yellow-300">
                {safeAnnouncements.length} unread
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
            {safeTodaySchedules.length}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Today&apos;s Classes</div>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
          <div className="text-2xl font-bold text-green-800 dark:text-green-200">
            {safeAnnouncements.length}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">Announcements</div>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
            {safeTodaySchedules.filter(s => {
              try {
                return new Date(`1970-01-01T${s.start_time}`) > new Date();
              } catch {
                return false;
              }
            }).length}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">Upcoming Today</div>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-700">
          <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">
            {new Date().getDate()}
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">
            {new Date().toLocaleDateString('en-US', { month: 'long' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSection;