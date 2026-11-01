"use client";

import React from "react";
import Link from "next/link";
import Header from "@/compnent/header"; // Assuming this path is correct

// Import icons from Heroicons
import {
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

const ContactPage = () => {
  return (
    // The outermost div no longer centers content vertically
    // min-h-screen ensures it takes full viewport height
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* PostHeader is now outside the main content wrapper to ensure full width */}
      <Header />

      {/* Main content div is now centered and has top margin for spacing from the header */}
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-2xl p-8 md:p-10 transform transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-3xl animate-fade-in text-center my-12"> {/* Added my-12 for vertical spacing */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-blue-800 mb-8 tracking-tight leading-tight">
          Get in Touch
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed mb-10">
          We&apos;re here to help! Feel free to reach out to us through any of the
          following channels.
        </p>

        <div className="space-y-6 mb-10">
          {/* Phone Contact */}
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group">
            <PhoneIcon className="h-10 w-10 text-blue-600 mr-4 group-hover:text-blue-800 transition-colors duration-300" />
            <div>
              <h2 className="text-xl font-semibold text-blue-700">Phone</h2>
              <Link
                href="tel:+251945663473"
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 text-lg"
              >
                +251 935 94 56 58
              </Link>
            </div>
          </div>

          {/* Email Contact */}
          <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group">
            <EnvelopeIcon className="h-10 w-10 text-green-600 mr-4 group-hover:text-green-800 transition-colors duration-300" />
            <div>
              <h2 className="text-xl font-semibold text-green-700">Email</h2>
              <Link
                href="mailto:madonnaeph21@gmail.com"
                className="text-green-600 hover:text-green-800 hover:underline transition-colors duration-200 text-lg"
              >
                mogesshitaw318@gmail.com  
              </Link>
            </div>
          </div>

          {/* Telegram Contact */}
          <div className="flex items-center justify-center p-4 bg-purple-50 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group">
            <ChatBubbleLeftRightIcon className="h-10 w-10 text-purple-600 mr-4 group-hover:text-purple-800 transition-colors duration-300" />
            <div>
              <h2 className="text-xl font-semibold text-purple-700">Telegram</h2>
              <Link
                href="https://t.me/moges_shitaw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 hover:underline transition-colors duration-200 text-lg"
              >
                @moges_shitaw
              </Link>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <Link
          href="/help"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300 transform hover:scale-105"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Help
        </Link>
      </div>
    </div>
  );
};

export default ContactPage;