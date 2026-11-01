import React from "react";
import Link from "next/link";
import { 
  Container, 
  Group, 
  Text, 
  Stack, 
  Divider,
  Anchor,
  Badge,
  ActionIcon 
} from "@mantine/core";
import { 
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline";
import { 
  AcademicCapIcon as AcademicCapSolid
} from "@heroicons/react/24/solid";

// Social media icons from Heroicons
const TwitterIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.611-3.199-1.558-.75-.947-1.011-2.168-.675-3.387.337-1.219 1.196-2.204 2.34-2.691 1.145-.487 2.446-.425 3.536.168 1.09.593 1.868 1.641 2.119 2.857.25 1.216-.052 2.457-.814 3.406-.762.949-1.913 1.56-3.21 1.56-.068 0-.136-.002-.203-.005zm7.718 1.956c-.557 0-1.007-.45-1.007-1.007 0-.557.45-1.007 1.007-1.007.557 0 1.007.45 1.007 1.007 0 .557-.45 1.007-1.007 1.007zm3.721-4.366c-.104.457-.457.812-.914.919-.457.107-.938-.052-1.273-.387-.335-.335-.494-.816-.387-1.273.104-.457.457-.812.914-.919.457-.107.938.052 1.273.387.335.335.494.816.387 1.273z" clipRule="evenodd" />
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-600 via-gray-700 to-purple-800 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full translate-x-1/2 translate-y-1/2"></div>
      
      <Container size="xl" className="relative z-10">
        <div className="py-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* University Info */}
            <Stack className="col-span-1 md:col-span-2" gap="xs">
              <Group gap="xs" className="mb-2">
                <AcademicCapSolid className="w-6 h-6 text-blue-200" />
                <Text size="lg" fw={600} className="text-white">
                  Debre Berhan University
                </Text>
              </Group>
              <Text size="xs" className="text-blue-100 max-w-md">
                Empowering minds, shaping futures. Debre Berhan University is committed to 
                excellence in education, research, and community service.
              </Text>
              
              <Group gap="xs" className="mt-2">
                <MapPinIcon className="w-4 h-4 text-blue-200" />
                <Text size="xs" className="text-blue-100">
                  Debre Berhan, Ethiopia
                </Text>
              </Group>
              
              <Group gap="xs">
                <PhoneIcon className="w-4 h-4 text-blue-200" />
                <Text size="xs" className="text-blue-100">
                  +251 935 94 56 58
                </Text>
              </Group>
              
              <Group gap="xs">
                <EnvelopeIcon className="w-4 h-4 text-blue-200" />
                <Text size="xs" className="text-blue-100">
                  info@dbu.edu.et
                </Text>
              </Group>
            </Stack>

            {/* Quick Links */}
            <Stack gap="xs">
              <Text size="sm" fw={600} className="text-white mb-1">
                Quick Links
              </Text>
              <Anchor 
                component={Link} 
                href="/" 
                className="text-blue-100 hover:text-white transition-colors duration-200 text-xs"
              >
                Home
              </Anchor>
              <Anchor 
                component={Link} 
                href="/about" 
                className="text-blue-100 hover:text-white transition-colors duration-200 text-xs"
              >
                About 
              </Anchor>
            </Stack>

            {/* Support */}
            <Stack gap="xs">
              <Text size="sm" fw={600} className="text-white mb-1">
                Support
              </Text>
              <Anchor 
                component={Link} 
                href="/help" 
                className="text-blue-100 hover:text-white transition-colors duration-200 text-xs"
              >
                <ChatBubbleLeftRightIcon className="w-3 h-3 inline mr-1" />
                Help Center
              </Anchor>
              <Anchor 
                component={Link} 
                href="/contact" 
                className="text-blue-100 hover:text-white transition-colors duration-200 text-xs"
              >
                Contact Us
              </Anchor>
              <Anchor 
                component={Link} 
                href="/feedback" 
                className="text-blue-100 hover:text-white transition-colors duration-200 text-xs"
              >
                Feedback
              </Anchor>
              <Anchor 
                component={Link} 
                href="/sitemap" 
                className="text-blue-100 hover:text-white transition-colors duration-200 text-xs"
              >
                Sitemap
              </Anchor>
            </Stack>
          </div>

          <Divider className="my-4 border-blue-500 border-opacity-30" />

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
            {/* Copyright and Legal */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
              <Group gap="xs">
                <Text size="xs" className="text-blue-100">
                  &copy; {currentYear} Debre Berhan University
                </Text>
                <Badge 
                  color="blue" 
                  variant="filled" 
                  size="xs"
                  className="bg-blue-500 bg-opacity-50"
                >
                  Beta
                </Badge>
              </Group>
              
              <Group gap="sm" className="flex-wrap">
                <Anchor 
                  component={Link} 
                  href="/privacy" 
                  className="text-blue-100 hover:text-white transition-colors duration-200 text-xs hover:underline"
                >
                  Privacy
                </Anchor>
                <Anchor 
                  component={Link} 
                  href="/terms" 
                  className="text-blue-100 hover:text-white transition-colors duration-200 text-xs hover:underline"
                >
                  Terms
                </Anchor>
                <Anchor 
                  component={Link} 
                  href="/accessibility" 
                  className="text-blue-100 hover:text-white transition-colors duration-200 text-xs hover:underline"
                >
                  Accessibility
                </Anchor>
              </Group>
            </div>

            {/* Social Media and Made with love */}
            <Group gap="md" className="flex-col md:flex-row items-center">
              {/* Social Media Icons */}
              <Group gap="xs">
                <ActionIcon 
                  size="sm" 
                  variant="filled" 
                  className="bg-blue-500 bg-opacity-50 hover:bg-blue-400 transition-all duration-200 transform hover:scale-105"
                  component="a"
                  href="#"
                  title="Twitter"
                >
                  <TwitterIcon />
                </ActionIcon>
                <ActionIcon 
                  size="sm" 
                  variant="filled" 
                  className="bg-blue-500 bg-opacity-50 hover:bg-blue-400 transition-all duration-200 transform hover:scale-105"
                  component="a"
                  href="#"
                  title="Facebook"
                >
                  <FacebookIcon />
                </ActionIcon>
                <ActionIcon 
                  size="sm" 
                  variant="filled" 
                  className="bg-blue-500 bg-opacity-50 hover:bg-blue-400 transition-all duration-200 transform hover:scale-105"
                  component="a"
                  href="#"
                  title="LinkedIn"
                >
                  <LinkedinIcon />
                </ActionIcon>
                <ActionIcon 
                  size="sm" 
                  variant="filled" 
                  className="bg-blue-500 bg-opacity-50 hover:bg-blue-400 transition-all duration-200 transform hover:scale-105"
                  component="a"
                  href="#"
                  title="Instagram"
                >
                  <InstagramIcon />
                </ActionIcon>
              </Group>

              {/* Made with love */}
              <Group gap="xs" className="text-blue-100">
                <Text size="xs">Made with</Text>
                <Text size="xs">Madonna Ephrem/zed</Text>
              </Group>
            </Group>
          </div>
        </div>
      </Container>

      {/* Wave decoration - smaller */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg 
          viewBox="0 0 1200 80" 
          preserveAspectRatio="none" 
          className="relative block w-full h-8"
        >
          <path 
            d="M0,0V30c47.79,15,103.59,22,158,19,70.36-3.7,136.33-22.8,206.8-26.2C438.64,22.2,512.34,36.5,583,48c69.27,12,138.3,17,209.4,9,36.15-4,69.85-12.5,104.45-20.5C989.49,17,1113-10,1200,36V0Z" 
            opacity=".25" 
            className="fill-current text-blue-900"
          ></path>
          <path 
            d="M0,0V10C13,25,27.64,38,47.69,48,99.41,74,165,74,224.58,64,255.73,56,284.67,46,314.25,36,355.17,24,398.98,11,445.08,9,481.34,7,516,15,543.7,30,575.47,48,606,72,647.33,80,687.77,87,728.68,74,766.46,63,801.16,47,836.76,34,898.49,21,1022,5,1200,35V0Z" 
            opacity=".5" 
            className="fill-current text-blue-800"
          ></path>
          <path 
            d="M0,0V4C149.93,39,314.09,48,475.83,28,518.83,22,560.05,14,603.43,11,662.43,6,715.91,18,769,31,827.93,51,886,62,951.2,60,1037.73,55,1123.66,31,1200,5V0Z" 
            className="fill-current text-blue-700"
          ></path>
        </svg>
      </div>
    </footer>
  );
};

export default Footer;