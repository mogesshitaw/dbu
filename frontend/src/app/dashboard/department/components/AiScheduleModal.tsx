/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Modal,
  Title,
  Text,
  Badge,
  Button,
  Group,
  Stack,
  Card,
  ThemeIcon,
  Loader,
  Alert,
  Divider,
  Paper,
  ScrollArea,
  Tooltip,
  ActionIcon,
  CopyButton,
  RingProgress,
  Center,
} from "@mantine/core";
import {
  IconSparkles,
  IconRobot,
  IconAlertTriangle,
  IconCheck,
  IconCopy,
  IconRefresh,
  IconSchool,
  IconClock,
  IconAlertCircle,
  IconBulb,
  IconShieldCheck,
  IconShare,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

interface AiScheduleModalProps {
  opened: boolean;
  onClose: () => void;
  scheduleId?: number | string | null;
  scheduleInfo?: {
    department?: string;
    batch?: string;
    semester?: string;
    section?: string;
    status?: string;
  };
  mode?: "analysis" | "conflicts";
  // Data for analysis
  aiData?: {
    text: string;
    model?: string;
    schedule_info?: any;
    disclaimer?: string;
  } | null;
  // Data for conflicts
  conflictPlan?: {
    recommendations: string;
    model?: string;
    conflicts_count?: number;
    disclaimer?: string;
  } | null;
  loading: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export const AiScheduleModal: React.FC<AiScheduleModalProps> = ({
  opened,
  onClose,
  scheduleInfo,
  mode = "analysis",
  aiData,
  conflictPlan,
  loading,
  error,
  onRefresh,
}) => {
  const [copied, setCopied] = useState(false);

  const rawContent = mode === "conflicts" 
    ? (conflictPlan?.recommendations || "")
    : (aiData?.text || "");

  const activeModel = mode === "conflicts"
    ? (conflictPlan?.model || "Gemini 2.5 Flash")
    : (aiData?.model || "Gemini 2.5 Flash");

  // Extract score if present in the text (e.g., "Score: 8/10" or "Quality Score: 8")
  const scoreMatch = rawContent.match(/(?:Quality\s*Score|Score)[\s:*#]*(\d{1,2})\s*(?:\/\s*10)?/i);
  const parsedScore = scoreMatch ? Math.min(10, Math.max(1, parseInt(scoreMatch[1]))) : null;

  // Simple markdown renderer for clean, professional look
  const formatMarkdown = (text: string) => {
    if (!text) return null;

    const sections = text.split(/\n\n+/);

    return sections.map((sec, idx) => {
      // Headers
      if (sec.startsWith("### ") || sec.startsWith("## ") || sec.startsWith("# ")) {
        const cleanTitle = sec.replace(/^#+\s*/, "");
        return (
          <Title key={idx} order={4} className="text-indigo-900 mt-3 mb-1 font-bold flex items-center gap-2">
            <ThemeIcon size="sm" variant="light" color="indigo" radius="xl">
              <IconSparkles size={12} />
            </ThemeIcon>
            {cleanTitle}
          </Title>
        );
      }

      // Numbered or bullet list items
      if (sec.includes("\n* ") || sec.includes("\n- ") || sec.startsWith("* ") || sec.startsWith("- ") || /^\d+\.\s/.test(sec)) {
        const lines = sec.split("\n").filter(l => l.trim().length > 0);
        return (
          <Paper key={idx} p="sm" radius="md" withBorder className="bg-slate-50/70 border-slate-200/80 my-1">
            <Stack gap="xs">
              {lines.map((line, lIdx) => {
                const isBullet = line.trim().startsWith("* ") || line.trim().startsWith("- ") || /^\d+\.\s/.test(line.trim());
                const cleanLine = line.replace(/^[\*\-\d\.]+\s*/, "").trim();

                // Check for bold lead-ins e.g. **Issue Detected**: text
                const boldMatch = cleanLine.match(/^\*\*([^*]+)\*\*[:\s-]*(.*)/);

                return (
                  <Group key={lIdx} align="flex-start" gap="xs" wrap="nowrap">
                    {isBullet && (
                      <ThemeIcon size={18} variant="subtle" color="indigo" className="mt-0.5 shrink-0">
                        <IconBulb size={13} />
                      </ThemeIcon>
                    )}
                    <Text size="sm" className="leading-relaxed text-slate-700">
                      {boldMatch ? (
                        <>
                          <strong className="text-slate-900 font-semibold">{boldMatch[1]}: </strong>
                          {boldMatch[2]}
                        </>
                      ) : (
                        cleanLine
                      )}
                    </Text>
                  </Group>
                );
              })}
            </Stack>
          </Paper>
        );
      }

      // Normal paragraph with bold parsing
      return (
        <Text key={idx} size="sm" className="text-slate-700 leading-relaxed my-1">
          {sec}
        </Text>
      );
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      radius="lg"
      padding="lg"
      centered
      scrollAreaComponent={ScrollArea.Autosize}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      title={
        <Group justify="space-between" className="w-full pr-4">
          <Group gap="xs">
            <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: "indigo", to: "cyan" }}>
              <IconRobot size={20} />
            </ThemeIcon>
            <div>
              <Title order={3} className="text-slate-900 font-bold tracking-tight">
                {mode === "conflicts" ? "AI Conflict Resolution Plan" : "AI Schedule Optimization & Analysis"}
              </Title>
              <Text size="xs" c="dimmed">
                Debre Berhan University • Intelligent Academic Scheduling
              </Text>
            </div>
          </Group>
          <Badge variant="light" color="indigo" size="sm" leftSection={<IconSparkles size={11} />}>
            Powered by {activeModel}
          </Badge>
        </Group>
      }
    >
      <Stack gap="md">
        {/* Schedule metadata banner */}
        {scheduleInfo && (
          <Paper p="sm" radius="md" withBorder className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-purple-50/70 border-indigo-100">
            <Group justify="space-between" wrap="wrap">
              <Group gap="md">
                {scheduleInfo.department && (
                  <Group gap={4}>
                    <IconSchool size={14} className="text-indigo-600" />
                    <Text size="xs" fw={600} c="dark">
                      {scheduleInfo.department}
                    </Text>
                  </Group>
                )}
                {scheduleInfo.batch && (
                  <Badge size="xs" variant="outline" color="blue">
                    Batch: {scheduleInfo.batch}
                  </Badge>
                )}
                {scheduleInfo.semester && (
                  <Badge size="xs" variant="outline" color="cyan">
                    Semester: {scheduleInfo.semester}
                  </Badge>
                )}
                {scheduleInfo.section && (
                  <Badge size="xs" variant="outline" color="grape">
                    Section {scheduleInfo.section}
                  </Badge>
                )}
              </Group>

              {parsedScore !== null && (
                <Group gap="xs">
                  <Text size="xs" fw={600} c="indigo">Quality Score:</Text>
                  <Badge
                    size="md"
                    color={parsedScore >= 8 ? "teal" : parsedScore >= 5 ? "yellow" : "red"}
                    variant="filled"
                  >
                    {parsedScore}/10
                  </Badge>
                </Group>
              )}
            </Group>
          </Paper>
        )}

        {/* Loading State */}
        {loading && (
          <Card p="xl" radius="md" withBorder className="bg-slate-50 border-dashed border-indigo-200">
            <Stack align="center" gap="md" py="xl">
              <Loader size="lg" color="indigo" type="dots" />
              <div className="text-center">
                <Text fw={600} size="md" className="text-indigo-950">
                  {mode === "conflicts"
                    ? "Gemini is analyzing scheduling constraints and resolving conflicts..."
                    : "Gemini is evaluating course distribution, instructor workloads, and room utilization..."}
                </Text>
                <Text size="xs" c="dimmed" mt={4}>
                  Evaluating DBU operational guidelines and prayer/break constraints
                </Text>
              </div>
            </Stack>
          </Card>
        )}

        {/* Error State */}
        {!loading && error && (
          <Alert
            icon={<IconAlertTriangle size={18} />}
            title="AI Analysis Unavailable"
            color="red"
            variant="light"
            radius="md"
          >
            <Text size="sm">{error}</Text>
            {onRefresh && (
              <Button
                variant="subtle"
                color="red"
                size="xs"
                mt="xs"
                leftSection={<IconRefresh size={14} />}
                onClick={onRefresh}
              >
                Retry Analysis
              </Button>
            )}
          </Alert>
        )}

        {/* Success State — Content */}
        {!loading && !error && rawContent && (
          <ScrollArea.Autosize mah={480} offsetScrollbars>
            <Stack gap="sm">
              {formatMarkdown(rawContent)}
            </Stack>
          </ScrollArea.Autosize>
        )}

        {/* Empty state */}
        {!loading && !error && !rawContent && (
          <Card p="lg" radius="md" withBorder className="bg-slate-50 text-center">
            <Text size="sm" c="dimmed">
              No analysis available. Click Generate or Refresh to analyze this schedule.
            </Text>
          </Card>
        )}

        <Divider my="xs" />

        {/* Modal Footer Controls */}
        <Group justify="space-between">
          <Group gap="xs">
            <CopyButton value={rawContent} timeout={2000}>
              {({ copied, copy }) => (
                <Button
                  variant="light"
                  color={copied ? "teal" : "gray"}
                  size="xs"
                  leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                  onClick={copy}
                  disabled={!rawContent}
                >
                  {copied ? "Copied" : "Copy Insights"}
                </Button>
              )}
            </CopyButton>

            {onRefresh && (
              <Button
                variant="light"
                color="indigo"
                size="xs"
                leftSection={<IconRefresh size={14} />}
                onClick={onRefresh}
                loading={loading}
              >
                Regenerate Analysis
              </Button>
            )}
          </Group>

          <Button variant="default" size="xs" onClick={onClose}>
            Close
          </Button>
        </Group>

        {/* Institutional Disclaimer */}
        <Text size="10px" c="dimmed" ta="center">
          ⚠️ AI-generated analysis is an advisory tool. Always verify with official department curricula and room allocations.
        </Text>
      </Stack>
    </Modal>
  );
};

export default AiScheduleModal;
