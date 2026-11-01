"use client";

import React from "react";

// This is the main component for displaying announcements.
const NotificationSection = () => {
  // We can use an array to manage our notifications. This makes it easy
  // to add new notifications later. Each object now includes a 'sender' property.
  const announcements = [
    {
      type: "Urgent",
      message: "Midterm exams will be held next week. Please check the schedule.",
      sender: "Administration",
      color: "bg-blue-100",
      textColor: "text-blue-800",
    },
    {
      type: "Info",
      message: "Don't forget to submit your project proposal by Friday.",
      sender: "Instructor",
      color: "bg-blue-100",
      textColor: "text-blue-800",
    },
    {
      type: "Announcement",
      message: "The main hall will be closed for maintenance on Friday.",
      sender: "Department Head",
      color: "bg-blue-100",
      textColor: "text-blue-800",
    },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-4 font-sans">
      <h2 className="text-xl font-bold text-blue-800 mb-2">Announcements</h2>
      <p className="text-gray-700 text-sm">
        Stay updated with the latest news and events. Check here regularly for important updates from your instructors and administration.
      </p>
      <div className="mt-4 space-y-2">
        {announcements.map((announcement, index) => (
          <div key={index} className={`${announcement.color} p-3 rounded-lg shadow-sm border border-gray-200`}>
            <div className="flex justify-between items-center mb-1">
              {/* Display the sender and announcement type */}
              <strong className={`${announcement.textColor} text-sm`}>[{announcement.type}]</strong>
              <span className="text-gray-500 text-xs">From: {announcement.sender}</span>
            </div>
            <p className="text-gray-800 text-sm">{announcement.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationSection;
