"use client";
import React from "react";

const ReportGenerationSection: React.FC = () => {
  return (
    <section className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4">Report Generation</h2>
      <p className="text-gray-700 mb-6">
        Generate academic, user activity, and system reports.
      </p>

      <div className="space-y-3">
        {["Course Enrollments", "Instructor Load", "Room Usage"].map((report, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-gray-100 rounded-lg">
            <span>{report}</span>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
              Generate
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ReportGenerationSection;
