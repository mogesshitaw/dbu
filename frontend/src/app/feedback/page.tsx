"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Add this for navigation

// Remove the onClose prop
const StudentFeedback = () => {
  const router = useRouter(); // Add router for navigation
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!name || !studentId || !feedbackText) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: studentId,
          name,
          message: feedbackText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowConfirmation(true);
        setName("");
        setStudentId("");
        setFeedbackText("");
      } else {
        setError(data.message || "Failed to submit feedback.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Navigate back or to a different page
    router.back(); // Goes back to previous page
    // or router.push('/student/dashboard'); // Goes to dashboard
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    handleClose(); // Use the same close function
  };

  // This is a page, so we don't need the fixed positioning overlay
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-black to-blue-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 text-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative">
        {/* Close button - now using handleClose */}
        <button
          className="absolute top-3 right-3 text-gray-300 hover:text-white"
          onClick={handleClose}
        >
          ✖
        </button>

        {showConfirmation ? (
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Feedback Submitted!</h2>
            <p className="mb-4">Thank you for your feedback.</p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full text-sm"
              onClick={handleCloseConfirmation}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4 text-center">Student Feedback</h2>

            {/* Name input */}
            <div className="mb-3">
              <label className="block mb-1 font-medium text-sm">Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* ID input */}
            <div className="mb-3">
              <label className="block mb-1 font-medium text-sm">Student ID</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Enter your student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
            </div>

            {/* Feedback textarea */}
            <textarea
              className="w-full p-2 border rounded-md bg-gray-800 text-white mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={4}
              placeholder="Enter your feedback as a student"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />

            {/* Error message */}
            {error && (
              <p className="text-red-400 text-sm mb-3 text-center">{error}</p>
            )}

            {/* Submit button */}
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition w-full text-sm disabled:opacity-50"
              onClick={handleSubmitFeedback}
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit"}
            </button>

            {/* Helper text */}
            <p className="mt-3 text-xs text-gray-300 text-center">
              Students can report issues or suggestions about the system.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentFeedback;