/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import img from "../../public/images/dbu.jpg";
import {
  Container,
  Group,
  Burger,
  Drawer,
  ScrollArea,
  Button,
  Divider,
  Text,
  Avatar,
} from "@mantine/core";
import {
  HomeIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  InformationCircleIcon as InformationCircleSolid,
} from "@heroicons/react/24/solid";

interface HeaderProps {
  isActive?: string;
}

const Header = ({ isActive = "/" }: HeaderProps) => {
  const [opened, setOpened] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState(isActive);

  const toggleMenu = () => setOpened((o) => !o);

  useEffect(() => {
    setActiveLink(isActive);
  }, [isActive]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: "/", label: "Home", icon: HomeIcon, activeIcon: HomeSolid },
    { href: "/about", label: "About Us", icon: InformationCircleIcon, activeIcon: InformationCircleSolid },
    { href: "/login", label: "Login", icon: ArrowRightOnRectangleIcon, activeIcon: ArrowRightOnRectangleIcon },
    { href: "/help", label: "Help", icon: QuestionMarkCircleIcon, activeIcon: QuestionMarkCircleIcon },
  ];

  const getIcon = (link: any) => {
    if (activeLink === link.href && link.activeIcon) {
      return link.activeIcon;
    }
    return link.icon;
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-xl border-b border-blue-100"
            : "bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700"
        }`}
      >
        <Container size="xl" className="py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3 group flex-1 md:flex-none"
              onClick={() => setActiveLink("/")}
            >
              <div className="relative">
                <Image
                  src={img}
                  alt="Debre Berhan University Logo"
                  width={60}
                  height={60}
                  className={`rounded-xl transition-all duration-300 ${
                    scrolled
                      ? "shadow-md border-2 border-blue-200"
                      : "shadow-lg border-2 border-white/20"
                  } group-hover:scale-105 group-hover:rotate-3`}
                />
              </div>

              <div className="flex flex-col">
                <Text
                  fw={800}
                  size="xl"
                  className={`transition-colors duration-300 ${
                    scrolled ? "text-blue-800" : "text-white"
                  } leading-tight`}
                >
                DEBRE BERHAN UNIVERSITY
                </Text>
                <Text
                  size="xs"
                  className={`transition-colors duration-300 ${
                    scrolled ? "text-blue-600" : "text-blue-100"
                  } font-semibold tracking-wide`}
                >
                  SCHEDULE MANAGEMENT SYSTEM
                </Text>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <Group visibleFrom="md" className="gap-1">
              {links.map((link) => {
                const IconComponent = getIcon(link);
                const isLinkActive = activeLink === link.href;

                return (
                  <Link href={link.href} key={link.label} onClick={() => setActiveLink(link.href)}>
                    <Button
                      leftSection={<IconComponent className={`h-4 w-4 ${isLinkActive ? "text-blue-600" : ""}`} />}
                      variant={isLinkActive ? "filled" : "subtle"}
                      color={scrolled ? "blue" : isLinkActive ? "gray" : "white"}
                      className={`transition-all duration-200 font-semibold rounded-lg px-4 py-2 ${
                        scrolled
                          ? isLinkActive ? "bg-blue-100 text-blue-700 shadow-sm" : "text-gray-700 hover:bg-blue-50"
                          : isLinkActive ? "bg-white/20 text-white shadow-md" : "text-white/90 hover:bg-white/10"
                      }`}
                    >
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
            </Group>

            <div className="md:hidden flex items-center gap-2">
              <Burger
                opened={opened}
                onClick={toggleMenu}
                color={scrolled ? "blue" : "white"}
                size="md"
              />
            </div>
          </div>
        </Container>
      </header>

      <div className="h-20"></div>

      <Drawer
        opened={opened}
        onClose={toggleMenu}
        padding="md"
        size="85%"
        position="right"
        transitionProps={{ transition: 'slide-left', duration: 150 }} // Faster animation
        title={
          <div className="flex items-center gap-3">
            <Avatar src={img.src} size="lg" radius="md" />
            <div>
              <Text fw={700} className="text-blue-800">DEBRE BERHAN UNIVERSITY</Text>
              <Text size="sm" className="text-gray-600">Schedule System</Text>
            </div>
          </div>
        }
      >
        <ScrollArea h="calc(100vh - 150px)" className="pr-4">
          <div className="space-y-2">
            {links.map((link) => {
              const IconComponent = getIcon(link);
              const isLinkActive = activeLink === link.href;

              return (
                <Button
                  key={link.label}
                  component={Link}
                  href={link.href}
                  fullWidth
                  justify="start"
                  size="lg"
                  leftSection={<IconComponent className="h-5 w-5" />}
                  variant={isLinkActive ? "light" : "subtle"}
                  className={`rounded-xl h-14 ${isLinkActive ? "border-l-4 border-blue-500" : ""}`}
                  onClick={() => {
                    setActiveLink(link.href);
                    setOpened(false);
                  }}
                >
                  {link.label}
                </Button>
              );
            })}
          </div>

          <Divider my="xl" label="Quick Actions" labelPosition="center" />

          {/* FIXED QUICK ACTIONS SECTION */}
          <div className="space-y-3">
            <Group grow>
              <Button
                component={Link}
                href="/view?filter=today" // Dynamic Link for Fast Action
                variant="light"
                color="green"
                size="md"
                className="rounded-lg shadow-sm"
                leftSection={<CalendarDaysIcon className="h-5 w-5" />}
                onClick={() => setOpened(false)} // Close drawer instantly
              >
                Today
              </Button>
              <Button
                component={Link}
                href="/view?filter=my-classes" // Dynamic Link for Fast Action
                variant="light"
                color="orange"
                size="md"
                className="rounded-lg shadow-sm"
                leftSection={<UserGroupIcon className="h-5 w-5" />}
                onClick={() => setOpened(false)} // Close drawer instantly
              >
                My Classes
              </Button>
            </Group>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50 text-center">
          <Text size="xs" className="text-gray-500">
            &copy; {new Date().getFullYear()} Debre Berhan University
          </Text>
        </div>
      </Drawer>
    </>
  );
};

export default Header;