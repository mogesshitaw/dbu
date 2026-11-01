import React, { useState } from "react";

const initialSchedule = [
  { id: 1, day: "Monday", time: "9:00 AM - 10:30 AM", available: true },
  { id: 2, day: "Tuesday", time: "11:00 AM - 12:30 PM", available: false },
  { id: 3, day: "Wednesday", time: "2:00 PM - 3:30 PM", available: true },
  { id: 4, day: "Thursday", time: "10:00 AM - 11:30 AM", available: true },
  { id: 5, day: "Friday", time: "1:00 PM - 2:30 PM", available: false },
];

const ClassAvailabilitySection = () => {
  const [schedule, setSchedule] = useState(initialSchedule);

  const toggleAvailability = (id: number) => {
    setSchedule((prev) =>
      prev.map((slot) =>
        slot.id === id ? { ...slot, available: !slot.available } : slot
      )
    );
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-md border border-blue-100">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Manage Class Availability</h2>

      <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-blue-100 text-gray-700">
          <tr>
            <th className="py-3 px-4 text-left">Day</th>
            <th className="py-3 px-4 text-left">Time Slot</th>
            <th className="py-3 px-4 text-center">Availability</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((slot) => (
            <tr key={slot.id} className="border-t">
              <td className="py-3 px-4">{slot.day}</td>
              <td className="py-3 px-4">{slot.time}</td>
              <td className="py-3 px-4 text-center">
                <button
                  onClick={() => toggleAvailability(slot.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    slot.available
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  {slot.available ? "Available" : "Unavailable"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClassAvailabilitySection;
