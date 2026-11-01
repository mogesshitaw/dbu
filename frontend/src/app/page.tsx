"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarIcon, 
  ClockIcon, 
  UserGroupIcon, 
  AcademicCapIcon,
  ChevronRightIcon,
  BellAlertIcon,
  BuildingLibraryIcon,
  ComputerDesktopIcon,
  BookOpenIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Header from "../compnent/header";
import Footer from "@/compnent/footer";

// Types
interface Statistic {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  gradient: string;
}

interface Announcement {
  id: number;
  title: string;
  date: string;
  category: 'academic' | 'event' | 'exam' | 'holiday';
}

const ScheduleHomePage = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const heroRef = useRef<HTMLDivElement>(null);

  // Typing effect configuration
  const fullText = useMemo(() => 
    "Welcome to Debre Berhan University\nClass Schedule Management System", 
    []
  );
  const typingSpeed = 60;
  const cursorBlinkSpeed = 530;
  const textIndex = useRef(0);

  // Typing effect
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout;

    const typeNextChar = () => {
      if (textIndex.current >= fullText.length) {
        typingTimeout = setTimeout(() => {
          setDisplayedText("");
          textIndex.current = 0;
          typeNextChar();
        }, 3000);
      } else {
        setDisplayedText(fullText.substring(0, textIndex.current + 1));
        textIndex.current++;
        typingTimeout = setTimeout(typeNextChar, typingSpeed);
      }
    };

    typeNextChar();
    const cursorInterval = setInterval(() => setShowCursor((prev) => !prev), cursorBlinkSpeed);
    setIsVisible(true);

    return () => {
      clearTimeout(typingTimeout);
      clearInterval(cursorInterval);
    };
  }, [fullText]);

  // Statistics data
  const statistics: Statistic[] = useMemo(() => [
    { 
      label: "Active Students", 
      value: "15,000+", 
      icon: <UserGroupIcon className="w-6 h-6" />,
      trend: 12 
    },
    { 
      label: "Faculty Members", 
      value: "850+", 
      icon: <AcademicCapIcon className="w-6 h-6" />,
      trend: 8 
    },
    { 
      label: "Daily Classes", 
      value: "450+", 
      icon: <CalendarIcon className="w-6 h-6" />,
      trend: 5 
    },
    { 
      label: "Programs", 
      value: "65+", 
      icon: <BookOpenIcon className="w-6 h-6" />,
      trend: 15 
    },
  ], []);

  // Features data
  const features: Feature[] = useMemo(() => [
    {
      icon: <CalendarIcon className="w-8 h-8" />,
      title: "Real-time Schedule Management",
      description: "Access and manage class schedules in real-time with automatic updates and conflict detection.",
      color: "from-blue-500 to-cyan-500",
      gradient: "bg-gradient-to-br from-blue-50 to-cyan-50"
    },
    {
      icon: <ClockIcon className="w-8 h-8" />,
      title: "Automated Timetable Generation",
      description: "Intelligent timetable generation that optimizes resource allocation and prevents scheduling conflicts.",
      color: "from-purple-500 to-pink-500",
      gradient: "bg-gradient-to-br from-purple-50 to-pink-50"
    },
    {
      icon: <BuildingLibraryIcon className="w-8 h-8" />,
      title: "Resource Management",
      description: "Efficiently manage classrooms, labs, and other facilities with real-time availability tracking.",
      color: "from-green-500 to-emerald-500",
      gradient: "bg-gradient-to-br from-green-50 to-emerald-50"
    },
    {
      icon: <ComputerDesktopIcon className="w-8 h-8" />,
      title: "Digital Integration",
      description: "Seamlessly integrate with existing university systems and digital platforms for enhanced accessibility.",
      color: "from-orange-500 to-red-500",
      gradient: "bg-gradient-to-br from-orange-50 to-red-50"
    },
    {
      icon: <BellAlertIcon className="w-8 h-8" />,
      title: "Instant Notifications",
      description: "Receive real-time alerts for schedule changes, cancellations, and important announcements.",
      color: "from-indigo-500 to-blue-500",
      gradient: "bg-gradient-to-br from-indigo-50 to-blue-50"
    },
    {
      icon: <ChartBarIcon className="w-8 h-8" />,
      title: "Analytics & Insights",
      description: "Comprehensive analytics and reporting tools for better decision-making and resource planning.",
      color: "from-teal-500 to-cyan-500",
      gradient: "bg-gradient-to-br from-teal-50 to-cyan-50"
    }
  ], []);

  // Announcements data
  const announcements: Announcement[] = useMemo(() => [
    { id: 1, title: "Final Exam Schedule Published", date: "2024-01-15", category: "exam" },
    { id: 2, title: "New Semester Registration Open", date: "2024-01-10", category: "academic" },
    { id: 3, title: "Faculty Development Workshop", date: "2024-01-20", category: "event" },
    { id: 4, title: "Spring Break Announcement", date: "2024-02-01", category: "holiday" },
    { id: 5, title: "Course Registration Deadline", date: "2024-01-25", category: "academic" },
  ], []);

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    if (selectedCategory === 'all') return announcements;
    return announcements.filter(a => a.category === selectedCategory);
  }, [announcements, selectedCategory]);

  // Testimonials data
  const testimonials = useMemo(() => [
    {
      name: "Dr. Alemitu Bekele",
      role: "Dean, College of Natural Sciences",
      content: "This system has revolutionized how we manage our academic schedules. It's intuitive, reliable, and has significantly reduced scheduling conflicts.",
      avatar: "/images/testimonials/avatar1.jpg"
    },
    {
      name: "Prof. Tadesse Hailu",
      role: "Department Head, Computer Science",
      content: "The automated timetable generation feature saves us weeks of manual work. Our faculty and students love the real-time updates.",
      avatar: "/images/testimonials/avatar2.jpg"
    },
    {
      name: "Meron Ayele",
      role: "Student Representative",
      content: "As a student, having instant access to my schedule and receiving notifications about changes has made my academic life so much easier.",
      avatar: "/images/testimonials/avatar3.jpg"
    }
  ], []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Quick actions
  const quickActions = [
    { label: "View Schedule", href: "/schedule", icon: CalendarIcon, color: "bg-blue-500" },
    { label: "Find Classroom", href: "/rooms", icon: BuildingLibraryIcon, color: "bg-green-500" },
    { label: "Check Exams", href: "/exams", icon: BookOpenIcon, color: "bg-purple-500" },
    { label: "Faculty Directory", href: "/faculty", icon: AcademicCapIcon, color: "bg-orange-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <Header isActive="/" />

      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-20 pb-16 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-1/2 -left-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              x: [0, 100, 0],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 15, repeat: Infinity }}
            className="absolute -bottom-1/2 -right-1/2 w-[600px] h-[600px] bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* University Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg mb-8"
            >
              <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Debre Berhan University</span>
            </motion.div>

            {/* Main Title with Typing Effect */}
            <div className="relative mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-4 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                  {displayedText.split('\n')[0]}
                </span>
                <br />
                <span className="text-gray-800">
                  {displayedText.split('\n')[1]}
                </span>
                <span className={`inline-block w-1 h-12 ml-1 bg-blue-600 transition-opacity duration-500 ${showCursor ? 'opacity-100' : 'opacity-0'}`}>|</span>
              </h1>
              
              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 hidden lg:block"
              >
                <SparklesIcon className="w-8 h-8 text-yellow-400" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-4 hidden lg:block"
              >
                <ArrowPathIcon className="w-8 h-8 text-blue-400" />
              </motion.div>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
            >
              Your centralized platform for managing and accessing academic schedules with real-time updates,
              intelligent automation, and comprehensive resource management.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link href="/dashboard" className="group">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                >
                  Get Started
                  <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              <Link href="/about">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
                >
                  Learn More
                </motion.button>
              </Link>
            </motion.div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
            >
              {statistics.map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-100"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg text-white mb-3 mx-auto">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                  {stat.trend && (
                    <div className="text-xs text-green-600 mt-1">
                      ↑ {stat.trend}% this year
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg className="relative block w-full h-[50px] sm:h-[100px]" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
              className="fill-white opacity-30"></path>
          </svg>
        </div>
      </section>

      {/* Quick Actions Bar */}
      <section className="py-8 bg-white/50 backdrop-blur-sm border-y border-gray-200">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-700">{action.label}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto max-w-7xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                Powerful Features
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to manage academic schedules efficiently and effectively
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`${feature.gradient} rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20`}
              >
                <div className={`inline-flex p-3 bg-gradient-to-r ${feature.color} rounded-xl text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements & Updates */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Announcements */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BellAlertIcon className="w-6 h-6 text-blue-600" />
                Latest Announcements
              </h3>
              
              {/* Category filters */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {['all', 'academic', 'event', 'exam', 'holiday'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <AnimatePresence>
                  {filteredAnnouncements.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">{item.date}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.category === 'exam' ? 'bg-red-100 text-red-700' :
                          item.category === 'event' ? 'bg-green-100 text-green-700' :
                          item.category === 'holiday' ? 'bg-purple-100 text-purple-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Testimonials */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <CheckBadgeIcon className="w-6 h-6 text-blue-600" />
                What People Say
              </h3>

              <div className="relative h-[300px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTestimonial}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                  >
                    <div className="bg-white rounded-2xl p-8 shadow-xl h-full flex flex-col">
                      <div className="flex-1">
                        <p className="text-gray-600 italic mb-6">{testimonials[activeTestimonial].content}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {testimonials[activeTestimonial].name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{testimonials[activeTestimonial].name}</h4>
                          <p className="text-sm text-gray-500">{testimonials[activeTestimonial].role}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Testimonial dots */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-2 mt-4">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTestimonial(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === activeTestimonial
                          ? 'w-8 bg-blue-600'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* <div className="container mx-auto max-w-7xl px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Schedule Management?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students and faculty members already using our platform
            </p>
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Get Started Today
              </motion.button>
            </Link>
          </motion.div>
        </div> */}
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ScheduleHomePage;