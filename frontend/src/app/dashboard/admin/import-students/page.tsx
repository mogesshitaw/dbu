/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Found, Authentication, UnauthorizedAccess } from "@/app/auth/auth";
import { useEffect, useState } from "react";

export default function ImportStudents() {
  const [loading, setLoading] = useState(false);

   const [currentuser, setcurrentUser] = useState<any>(null);
         useEffect(() => {
           const checkAuth = async () => {
             const foundUser = await Found();
             setcurrentUser(foundUser);
           };
           checkAuth();
         }, []);
    
        if (currentuser === null ) { 
          return <Authentication />;
      }
        if (currentuser?.role !== 'admin') {
          return <UnauthorizedAccess />
      }
  
  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("http://localhost:5000/api/importstudents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      alert(data.message);
    } catch (error) {
      console.error(error);
      alert("Failed to upload file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg border border-gray-200">
      <h2 className="text-xl font-semibold mb-4 text-center">Import Students</h2>
      <form onSubmit={handleUpload} className="space-y-4">
        <label className="block">
          <span className="text-gray-700 font-medium">Select Excel File (.xlsx)</span>
          <input
            type="file"
            name="file"
            accept=".xlsx"
            required
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Import Students"}
        </button>
      </form>
    </div>
  );
}
