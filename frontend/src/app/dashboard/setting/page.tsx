 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Found, Authentication } from "@/app/auth/auth";
import { useEffect, useState } from "react";

const API_URL =process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function SecuritySettings() {
  const [passwordPolicy, setPasswordPolicy] = useState("Standard");
  const [enableSessionTimeout, setEnableSessionTimeout] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 🔐 Auth check
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
        const profileRes = await fetch(`${API_URL}/api/auth/profile`, {
          credentials: "include",
          cache: "no-store",
        });

        const profileData = await profileRes.json();

        if (!profileData?.user?.id_number) return;

        const res = await fetch(
          `${API_URL}/api/security-settings/${profileData.user.id_number}`,
          { credentials: "include" }
        );

        if (!res.ok) return;

        const data = await res.json();

        setPasswordPolicy(data.password_policy ?? "Standard");
        setEnableSessionTimeout(data.enable_session_timeout ?? true);
        setSessionTimeoutMinutes(
          Number(data.session_timeout_minutes ?? 30)
        );
      } catch (err) {
        console.error("Failed to load security settings", err);
      }
    };

    loadSettings();
  }, []);

  if (user === null) {
    return <Authentication />;
  }

  // 🔹 Save settings
  const handleSave = async () => {
    if (enableSessionTimeout && sessionTimeoutMinutes <= 0) {
      alert("Session timeout minutes must be greater than zero");
      return;
    }

    setLoading(true);

    try {
     
      await fetch(`${API_URL}/api/security-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          id_number: user?.id_number,
          password_policy: passwordPolicy,
          enable_session_timeout: enableSessionTimeout,
          session_timeout_minutes: enableSessionTimeout
            ? sessionTimeoutMinutes
            : null,
        }),
      });
     await fetch(`${API_URL}/api/auth/secure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          enable_session_timeout: enableSessionTimeout,
          session_timeout_minutes: enableSessionTimeout
            ? sessionTimeoutMinutes
            : null,
        }),
      });
      alert("Security settings updated successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Security Settings</h1>
        <p className="text-gray-600">Manage security and access controls</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-lg">
        <div className="space-y-5">

          {/* 🔐 Password Policy (Admin only) */}
          {user?.role === "admin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password Policy
              </label>
              <select
                value={passwordPolicy}
                onChange={(e) => setPasswordPolicy(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                  focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="Standard">Standard</option>
                <option value="Strong">Strong</option>
                {/* <option value="Very Strong">Very Strong</option> */}
              </select>
            </div>
          )}

          {/* ⏱ Enable Session Timeout */}
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={enableSessionTimeout}
              onChange={(e) =>
                setEnableSessionTimeout(e.target.checked)
              }
              className="rounded border-gray-300 text-blue-600 shadow-sm
                focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Enable Session Timeout
            </span>
          </label>

          {/* ⌛ Timeout Minutes */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              disabled={!enableSessionTimeout}
              value={sessionTimeoutMinutes}
              onChange={(e) =>
                setSessionTimeoutMinutes(Number(e.target.value))
              }
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm
                focus:border-blue-500 focus:ring-blue-500
                ${!enableSessionTimeout
                  ? "bg-gray-100 cursor-not-allowed"
                  : ""}`}
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
