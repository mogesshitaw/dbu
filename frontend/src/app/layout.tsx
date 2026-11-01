// src/app/layout.tsx
import type { Metadata } from "next";
import React from "react";
import "./globals.css";

//  Mantine imp
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { ColorSchemeScript } from "@mantine/core";

//  ማስተካከያ የተደረገበት Metadata (LinkedIn እንዲያነበው)
export const metadata: Metadata = {
  title: "Debre Berhan University Class Schedule System",
description: "A professional automated scheduling application designed to eliminate course conflicts and optimize classroom utilization for Debre Berhan University department heads and instructors using Next.js and PostgreSQL.",  
openGraph: {
    title: "Debre Berhan University Class Schedule System",
    description: "A professional automated scheduling application designed to eliminate course conflicts and optimize classroom utilization for Debre Berhan University department heads and instructors using Next.js and PostgreSQL.",  
    url: "https://classschedule-dbu.vercel.app", 
    siteName: "DBU Scheduling System",
    images: [
      {
        url: "https://classschedule-dbu.vercel.app/images/thumbnail.jpg", 
        width: 1200,
        height: 630,
        alt: "DBU Scheduling System Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

//  Client provider wrappers
import MantineClientProvider from "@/app/providers/MantineClientProvider";
import ReduxProvider from "@/app/providers/ReduxProvider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-mantine-color-scheme="light">
      <head>
        <link rel="shortcut icon" href="/images/dbu.jpg" type="image/x-icon" />
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className="antialiased">
        <ReduxProvider>
          <MantineClientProvider>
            {children}
          </MantineClientProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}