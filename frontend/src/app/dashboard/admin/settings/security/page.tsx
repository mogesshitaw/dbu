/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Found, Authentication, UnauthorizedAccess } from "@/app/auth/auth";
import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SecuritySettings() {
  const [passwordPolicy, setPasswordPolicy] = useState("Standard");
  const [enableSessionTimeout, setEnableSessionTimeout] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(30);
  const [loading, setLoading] = useState(false);
const [user, setUser] = useState<any>(null);
  useEffect(() => {
    const checkAuth = async () => {
      const foundUser = await Found();
      setUser(foundUser);
    };
    checkAuth();
  }, []);



  // 🔹 Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/security-settings/current`,
          { credentials: "include" }
        );
        const data = await res.json();

        setPasswordPolicy(data.password_policy || "Standard");
        setEnableSessionTimeout(data.enable_session_timeout ?? true);
        setSessionTimeoutMinutes(
          data.session_timeout_minutes || 30
        );
      } catch (err) {
        console.error("Failed to load security settings");
      }
    };

    loadSettings();
  }, []);
  if (user === null) { 
    return <Authentication />;
  }
  if (user.role !== 'admin') {
    return <UnauthorizedAccess />
  }
   
  // 🔹 Save settings
  const handleSave = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/security-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          password_policy: passwordPolicy,
          enable_session_timeout: enableSessionTimeout,
          session_timeout_minutes: sessionTimeoutMinutes,
          id_number:user?.id_number,
        }),
      });

      alert("Security settings updated successfully");
    } catch {
      alert("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security Settings</h1>
        <p className="text-gray-600">
          Manage security and access controls
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-lg">
        <div className="space-y-5">

          {/* 🔐 Password Policy */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password Policy
            </label>
            <select
              value={passwordPolicy}
              onChange={(e) => setPasswordPolicy(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="Standard">Standard</option>
              <option value="Strong">Strong</option>
              <option value="Very Strong">Very Strong</option>
            </select>
          </div>

          {/* ⏱ Enable Session Timeout */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={enableSessionTimeout}
                onChange={(e) =>
                  setEnableSessionTimeout(e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Enable Session Timeout
              </span>
            </label>
          </div>

          {/* ⌛ Timeout Minutes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              min={1}
              max={240}
              disabled={!enableSessionTimeout}
              value={sessionTimeoutMinutes}
              onChange={(e) =>
                setSessionTimeoutMinutes(Number(e.target.value))
              }
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
                ${!enableSessionTimeout ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
            {!enableSessionTimeout && (
              <p className="text-xs text-gray-500 mt-1">
                Enable session timeout to edit this value
              </p>
            )}
          </div>

          {/* 💾 Save Button */}
          <button
            onClick={handleSave}
            disabled={loading}
            className={`w-full bg-blue-600 text-white px-4 py-2 rounded-md
              hover:bg-blue-700 transition
              ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? "Saving..." : "Update Security Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
