/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  Title,
  Text,
  Group,
  Stack,
  Button,
  ThemeIcon,
  Badge,
  ActionIcon,
  Box,
} from "@mantine/core";
import {
  IconHelp,
  IconBook,
  IconHeadphones,
  IconArrowRight,
  IconMessage,
  IconStar,
} from "@tabler/icons-react";
import { Found, Authentication, UnauthorizedAccess } from "@/app/auth/auth";

const HelpSupportSection: React.FC = () => {
  const supportItems = [
    {
      icon: IconHelp,
      title: "FAQs",
      description: "Find answers to commonly asked questions",
      href: "#",
      color: "blue",
      badge: "Quick Help",
    },
    {
      icon: IconBook,
      title: "Documentation",
      description: "Detailed guides and API references",
      href: "#",
      color: "green",
      badge: "Guides",
    },
    {
      icon: IconHeadphones,
      title: "Contact Support",
      description: "Get help from our support team",
      href: "#",
      color: "violet",
      badge: "24/7 Available",
    },
  ];
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
  return (
    <Card
      shadow="lg"
      padding="lg"
      radius="lg"
      withBorder
      className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-blue-200 hover:shadow-xl transition-all duration-300"
    >
      <Card.Section 
        withBorder 
        inheritPadding 
        py="md" 
        className="bg-gradient-to-r from-blue-600 to-indigo-600"
      >
        <Group justify="space-between">
          <Group>
            <ThemeIcon size={32} color="white" variant="transparent">
              <IconMessage size={20} />
            </ThemeIcon>
            <div>
              <Title order={3} className="text-white">
                Help & Support
              </Title>
              <Text c="white" size="sm" opacity={0.9}>
                We&apos;re here to help you succeed
              </Text>
            </div>
          </Group>
          <ThemeIcon size={40} color="white" variant="light" radius="xl">
            <IconStar size={20} />
          </ThemeIcon>
        </Group>
      </Card.Section>

      <Stack gap="lg" mt="md">
        <Text c="dimmed" size="sm" className="text-center">
          Access comprehensive resources and get the support you need to make the most of our platform
        </Text>

        <Stack gap="md">
          {supportItems.map((item, index) => (
            <Card
              key={index}
              padding="md"
              radius="md"
              withBorder
              className="bg-white/70 border-blue-100 hover:border-blue-300 hover:bg-white hover:shadow-md transition-all duration-200 group cursor-pointer"
              component="a"
              href={item.href}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap="md" wrap="nowrap">
                  <ThemeIcon 
                    size={46} 
                    color={item.color} 
                    variant="light" 
                    radius="md"
                    className="group-hover:scale-110 transition-transform duration-200"
                  >
                    <item.icon size={20} />
                  </ThemeIcon>
                  <Stack gap={2}>
                    <Group gap="xs">
                      <Text fw={600} size="lg" className="text-gray-800">
                        {item.title}
                      </Text>
                      <Badge 
                        color={item.color} 
                        variant="light" 
                        size="sm"
                      >
                        {item.badge}
                      </Badge>
                    </Group>
                    <Text c="dimmed" size="sm">
                      {item.description}
                    </Text>
                  </Stack>
                </Group>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="lg"
                  className="group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors duration-200"
                >
                  <IconArrowRight size={16} />
                </ActionIcon>
              </Group>
            </Card>
          ))}
        </Stack>

        {/* Additional Support Options */}
        <Box 
          p="md" 
          className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-200"
        >
          <Group justify="space-between">
            <Stack gap={2}>
              <Text fw={600} className="text-blue-700">
                Need Immediate Help?
              </Text>
              <Text size="sm" c="dimmed">
                Our team is ready to assist you
              </Text>
            </Stack>
            <Button
              variant="filled"
              color="blue"
              size="sm"
              rightSection={<IconHeadphones size={16} />}
              className="bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Live Chat
            </Button>
          </Group>
        </Box>

        {/* Quick Stats */}
        <Group justify="center" gap="xl" mt="sm">
          <Stack gap={2} align="center">
            <Text fw={700} size="xl" className="text-blue-600">
              24/7
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              Support Available
            </Text>
          </Stack>
          <Stack gap={2} align="center">
            <Text fw={700} size="xl" className="text-green-600">
              5min
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              Avg. Response
            </Text>
          </Stack>
          <Stack gap={2} align="center">
            <Text fw={700} size="xl" className="text-purple-600">
              98%
            </Text>
            <Text size="xs" c="dimmed" ta="center">
              Satisfaction
            </Text>
          </Stack>
        </Group>
      </Stack>
    </Card>
  );
};

export default HelpSupportSection;