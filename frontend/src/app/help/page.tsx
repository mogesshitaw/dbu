"use client"; // This line is necessary for Next.js to treat this file as a client component
import React, { useState } from "react";
import Link from "next/link";
import Header from "@/compnent/header";

// Import icons from Heroicons
import {
  QuestionMarkCircleIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  AcademicCapIcon,
  BellAlertIcon,
  PrinterIcon,
  BugAntIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";

const Help = () => {
  // State to manage FAQ accordion toggles
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How do I view my class schedule?",
      answer:
        "Students can log in to their dashboard and navigate to the 'My Schedule' section. Faculty members can access their assigned courses and schedules through their respective portals. You will see a clear, weekly or daily breakdown of your classes.",
      icon: <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-500" />,
    },
    {
      question: "Can I make changes to my assigned schedule?",
      answer:
        "Schedule modifications are typically handled by department administrators. Please contact your department head or the Registrar's Office for any necessary adjustments. Students cannot directly modify their schedules.",
      icon: <QuestionMarkCircleIcon className="h-5 w-5 mr-2 text-yellow-500" />,
    },
    {
      question: "What should I do if a class is missing from my schedule?",
      answer:
        "First, verify your registration status with the Registrar's Office. If the issue persists, please contact your academic advisor or the IT helpdesk immediately for assistance. Provide your student ID and course details.",
      icon: <BugAntIcon className="h-5 w-5 mr-2 text-red-500" />,
    },
    {
      question: "How do I report a technical issue with the system?",
      answer:
        "For any technical difficulties, please visit our 'Contact Support' section and fill out the technical support form, or email our IT helpdesk directly at it.support@dbu.edu.et. Please include screenshots if possible.",
      icon: <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-green-500" />,
    },
    {
      question: "How do I get notifications for schedule changes?",
      answer:
        "The system is designed to send email and/or SMS notifications for any changes to your registered classes. Ensure your contact information is up-to-date in your profile settings to receive these alerts.",
      icon: <BellAlertIcon className="h-5 w-5 mr-2 text-purple-500" />,
    },
    { 
      question: "Can I print my schedule from the system?",
      answer:
        "Yes, you can print your schedule. Navigate to 'My Schedule' and look for a 'Print' button or icon. The system will generate a printer-friendly version of your current schedule.",
      icon: <PrinterIcon className="h-5 w-5 mr-2 text-gray-500" />,
    },
    {
      question: "What browsers are supported by the system?",
      answer:
        "Our system is optimized for modern web browsers including Google Chrome, Mozilla Firefox, Microsoft Edge, and Safari. For the best experience, please ensure your browser is updated to the latest version.",
      icon: <Cog6ToothIcon className="h-5 w-5 mr-2 text-orange-500" />,
    },
    {
      question: "Where can I find the academic calendar?",
      answer:
        "The official Debre Berhan University academic calendar, which includes important dates like registration periods, holidays, and exam weeks, can be found on the university's main website or linked from your dashboard.",
      icon: <CalendarDaysIcon className="h-5 w-5 mr-2 text-teal-500" />,
    },
  ];

  return (
    // Outer div for background and min-height, removed vertical padding
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header component at the very top, full width */}
      <Header isActive="/help"/>

      {/* Main content container, centered horizontally and pushed down from the header.
          The horizontal padding is now applied here. */}
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl p-8 md:p-10 transform transition-all duration-500 ease-in-out animate-fade-in mt-12 mb-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-blue-800 mb-10 tracking-tight leading-tight animate-fade-in-up">
          Help & Support for Debre Berhan University
        </h1>

        <section className="mb-12 text-center">
          <p className="text-lg text-gray-700 leading-relaxed">
            Welcome to the Help & Support section for the Class Schedule Management System. Here you&#39;ll find resources to assist you with common questions and issues.
          </p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Documentation Card */}
          <div className="bg-blue-50 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group">
            <div className="flex items-center justify-center mb-4">
              <BookOpenIcon className="h-12 w-12 text-blue-600 group-hover:text-blue-800 transition-colors duration-300" />
            </div>
            <h2 className="text-2xl font-bold text-blue-700 text-center mb-4">Documentation & Guides</h2>
            <p className="text-gray-700 text-center leading-relaxed mb-4">
              Access comprehensive user manuals and guides for students, faculty, and administrators.
            </p>
            <Link
              href="/help/viewdoc"
              className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
            >
              View Documentation
            </Link>
          </div>

          {/* Contact Support Card */}
          <div className="bg-blue-50 rounded-lg p-6 shadow-md hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group">
            <div className="flex items-center justify-center mb-4">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-green-600 group-hover:text-green-800 transition-colors duration-300" />
            </div>
            <h2 className="text-2xl font-bold text-blue-700 text-center mb-4">Contact Support</h2>
            <p className="text-gray-700 text-center leading-relaxed mb-4">
              Can&#39;t find what you&#39;re looking for? Our support team is here to help.
            </p>
            <Link
              href="/help/contact"
              className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
            >
              Get in Touch
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-blue-700 text-center mb-6 flex items-center justify-center">
            <QuestionMarkCircleIcon className="h-8 w-8 mr-3 text-blue-600" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg shadow-sm overflow-hidden border border-gray-200"
              >
                <button
                  className="flex justify-between items-center w-full p-4 text-left font-semibold text-gray-800 hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={openFaq === index}
                >
                  <span className="flex items-center">
                    {faq.icon} {faq.question}
                  </span>
                  <ChevronDownIcon
                    className={`h-5 w-5 transform transition-transform duration-200 ${
                      openFaq === index ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="p-4 pt-0 text-gray-600 border-t border-gray-200">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Help;