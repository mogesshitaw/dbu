"use client";

import React, { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  role: "student" | "instructor";
  department: string;
}

interface Schedule {
  course: string;
  room: string;
  day: string;
  time: string;
  instructor: string;
  department: string;
}

const ViewPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [schedule, setSchedule] = useState<Schedule[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error("Error fetching user:", err));

    fetch("/api/schedules")
      .then((res) => res.json())
      .then((data) => setSchedule(data))
      .catch((err) => console.error("Error fetching schedules:", err));
  }, []);

  if (!user) return <p className="p-6">Loading user info...</p>;

  const filteredSchedule =
    user.role === "instructor"
      ? schedule.filter((s) => s.instructor === user.name)
      : schedule.filter((s) => s.department === user.department);

  return (
    <div>
      <h1 className="text-3xl font-bold text-blue-700 mb-4">
        Welcome, {user.name} ({user.role})
      </h1>

      <h2 className="text-xl font-semibold mb-2">Your Schedule</h2>
      {filteredSchedule.length > 0 ? (
        <ul className="space-y-3">
          {filteredSchedule.map((s, index) => (
            <li
              key={index}
              className="p-4 border rounded-lg shadow-sm bg-white hover:bg-blue-50 transition"
            >
              <p>
                <span className="font-bold">Course:</span> {s.course}
              </p>
              <p>
                <span className="font-bold">Room:</span> {s.room}
              </p>
              <p>
                <span className="font-bold">Day:</span> {s.day}
              </p>
              <p>
                <span className="font-bold">Time:</span> {s.time}
              </p>
              <p>
                <span className="font-bold">Instructor:</span> {s.instructor}
              </p>
              <p>
                <span className="font-bold">Department:</span> {s.department}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No schedules found for your role/department.</p>
      )}
    </div>
  );
};

export default ViewPage;
