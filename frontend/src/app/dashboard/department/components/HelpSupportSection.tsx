"use client";

import React from "react";

const HelpSupportSection = () => {
  return (
    <div className="space-y-6">
      <div className="bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-700">
        <h2 className="text-xl font-semibold text-white mb-4">Help &amp; Support</h2>
        <p className="text-gray-400 text-sm">
          If you&apos;re facing any issues, feel free to reach out to our department support team.
        </p>
      </div>

      <div className="bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-2">Contact Information</h3>
        <p className="text-gray-300 text-sm">
          Email:{" "}
          <a
            href="mailto:support@university.edu"
            className="text-blue-400 hover:underline"
          >
            support@university.edu
          </a>
          <br />
          Phone: +1 (555) 123-4567
        </p>
      </div>

      <div className="bg-neutral-800 p-6 rounded-lg shadow-md border border-neutral-700">
        <h3 className="text-lg font-semibold text-white mb-2">FAQs</h3>
        <p className="text-gray-400 text-sm">
          Visit the{" "}
          <a href="/faq" className="text-blue-400 hover:underline">
            FAQ
          </a>{" "}
          page to find answers to commonly asked questions like &quot;How to
          reset my password?&quot; or &quot;How to access my course materials?&quot;
        </p>
      </div>
    </div>
  );
};

export default HelpSupportSection;
