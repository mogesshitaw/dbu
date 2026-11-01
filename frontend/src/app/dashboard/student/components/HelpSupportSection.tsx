"use client";
import React from "react";

const HelpSupportSection: React.FC = () => {
  return (
    <section className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
      <h2 className="text-3xl font-semibold mb-6 text-indigo-700 border-b-2 border-indigo-300 pb-2">
        Help & Support
      </h2>
      <p className="text-gray-700 mb-6">
        Need help with the platform? Reach out to our support team or consult the FAQ section.
      </p>
      <ul className="list-disc pl-6 space-y-3 text-indigo-600">
        <li>
          Email:{" "}
          <a
            className="hover:underline cursor-pointer"
            href="mailto:support@university.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            support@university.com
          </a>
        </li>
        <li>Phone: +1 (800) 123-4567</li>
        <li>
          <a
            className="hover:underline cursor-pointer"
            href="#"
            onClick={() => alert("Redirecting to FAQs...")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && alert("Redirecting to FAQs...")}
          >
            View FAQs
          </a>
        </li>
      </ul>
    </section>
  );
};

export default HelpSupportSection;
