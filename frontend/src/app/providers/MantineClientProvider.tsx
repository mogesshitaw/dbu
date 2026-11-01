"use client";

import React from "react";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

export default function MantineClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MantineProvider defaultColorScheme="light">
      <Notifications position="top-right" zIndex={1000} />
      {children}
    </MantineProvider>
  );
}
