import { SEED_WORKSPACE, WORKSPACE_VERSION } from "@/data/seed";
import {
  CVProfile,
  CVVersion,
  OrbitWorkspaceState,
  Project,
} from "@/types/orbit";

export const STORAGE_KEY = "orbit_workspace_v1";

export function isValidWorkspace(data: unknown): data is OrbitWorkspaceState {
  if (!data || typeof data !== "object") return false;
  const candidate = data as Partial<OrbitWorkspaceState>;
  return (
    typeof candidate.version === "number" &&
    candidate.preferences != null &&
    typeof candidate.preferences.name === "string" &&
    typeof candidate.preferences.timezone === "string" &&
    ["system", "full", "reduced"].includes(candidate.preferences.motionPreference) &&
    (candidate.preferences.welcomeLastPlayedDate === null ||
      typeof candidate.preferences.welcomeLastPlayedDate === "string") &&
    typeof candidate.preferences.demoWeatherEnabled === "boolean" &&
    (candidate.preferences.welcomePreference === undefined ||
      ["always", "once", "never"].includes(candidate.preferences.welcomePreference)) &&
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.projects) &&
    Array.isArray(candidate.inbox) &&
    Array.isArray(candidate.ideas) &&
    Array.isArray(candidate.library) &&
    Array.isArray(candidate.opportunities) &&
    Array.isArray(candidate.cvVersions) &&
    candidate.cvProfile !== undefined
  );
}

export function loadWorkspace(): {
  state: OrbitWorkspaceState;
  recoveredFromCorrupt: boolean;
} {
  if (typeof window === "undefined") {
    return { state: SEED_WORKSPACE, recoveredFromCorrupt: false };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { state: SEED_WORKSPACE, recoveredFromCorrupt: false };
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isValidWorkspace(parsed)) {
      return { state: SEED_WORKSPACE, recoveredFromCorrupt: true };
    }
    // Merge missing top-level keys defensively in case of older partial state
    return {
      state: {
        ...SEED_WORKSPACE,
        ...parsed,
        version: WORKSPACE_VERSION,
        preferences: {
          ...SEED_WORKSPACE.preferences,
          ...parsed.preferences,
          welcomePreference: parsed.preferences.welcomePreference ?? "once",
        },
      },
      recoveredFromCorrupt: false,
    };
  } catch {
    return { state: SEED_WORKSPACE, recoveredFromCorrupt: true };
  }
}

export function saveWorkspace(state: OrbitWorkspaceState): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function computeProjectProgress(project: Project): {
  completed: number;
  total: number;
  percent: number;
} {
  const total = project.tasks.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };
  const completed = project.tasks.filter((t) => t.done).length;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
  };
}

export function getLocalCalendarDate(timezone: string, now = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);
    const y = parts.find((p) => p.type === "year")?.value ?? "2026";
    const m = parts.find((p) => p.type === "month")?.value ?? "01";
    const d = parts.find((p) => p.type === "day")?.value ?? "01";
    return `${y}-${m}-${d}`;
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

export function getHourInTimezone(timezone: string, now = new Date()): number {
  try {
    const hourStr = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(now);
    const parsed = parseInt(hourStr, 10);
    return Number.isNaN(parsed) ? now.getHours() : parsed % 24;
  } catch {
    return now.getHours();
  }
}

export type TimePeriod = "morning" | "afternoon" | "evening" | "night";

export interface GreetingData {
  greeting: string;
  message: string;
  period: TimePeriod;
}

const SUPPORTING_MESSAGES: Record<TimePeriod, string[]> = {
  morning: [
    "A fresh orbit. One clear priority.",
    "Morning light. Clean slate.",
    "Start small. Build momentum.",
    "Today's arc begins now.",
  ],
  afternoon: [
    "Keep the momentum. Make room for good work.",
    "Midday stride. Focus on what moves forward.",
    "Progress compounds. Stay in rhythm.",
    "The work speaks. Listen.",
  ],
  evening: [
    "Bring today's loose ends into orbit.",
    "Evening calm. Gather the threads.",
    "Close loops. Prepare the next turn.",
    "Day's work settles. Tomorrow awaits.",
  ],
  night: [
    "A quieter world. A little room to think.",
    "Night hours. Deep focus available.",
    "Rest the noise. Keep the signal.",
    "Stillness. Where the next idea forms.",
  ],
};

/** Tracks the last supporting message shown per period so consecutive logins differ. */
const lastMessageIndex: Record<TimePeriod, number> = {
  morning: -1,
  afternoon: -1,
  evening: -1,
  night: -1,
};

function getPeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function getGreetingText(period: TimePeriod, name: string): string {
  const safeName = name.trim() || "sir";
  switch (period) {
    case "morning":
      return `Good morning, ${safeName}.`;
    case "afternoon":
      return `Good afternoon, ${safeName}.`;
    case "evening":
      return `Good evening, ${safeName}.`;
    case "night":
      return `Welcome back, ${safeName}.`;
  }
}

function pickSupportingMessage(period: TimePeriod): string {
  const messages = SUPPORTING_MESSAGES[period];
  let lastIdx = lastMessageIndex[period];
  try {
    const saved = window.localStorage.getItem(`orbit_message_${period}`);
    if (saved !== null) lastIdx = Number(saved);
  } catch {
    // Storage restrictions still allow in-memory variation.
  }
  let idx = Math.floor(Math.random() * messages.length);
  // Avoid repeating the same message consecutively
  if (messages.length > 1 && idx === lastIdx) {
    idx = (idx + 1) % messages.length;
  }
  lastMessageIndex[period] = idx;
  try {
    window.localStorage.setItem(`orbit_message_${period}`, String(idx));
  } catch {
    // Storage is optional for supporting copy.
  }
  return messages[idx];
}

export function getTimeAwareGreeting(name: string, timezone: string, now = new Date()): GreetingData {
  const hour = getHourInTimezone(timezone, now);
  const period = getPeriod(hour);
  return {
    greeting: getGreetingText(period, name),
    message: pickSupportingMessage(period),
    period,
  };
}

export function formatTimeInZone(timezone: string, now = new Date()): {
  time: string;
  dateLong: string;
  dateShort: string;
  tzShort: string;
} {
  try {
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(now);
    const dateLong = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(now);
    const dateShort = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      month: "short",
      day: "2-digit",
    }).format(now);
    const tzParts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(now);
    const tzShort = tzParts.find((p) => p.type === "timeZoneName")?.value ?? timezone;
    return { time, dateLong, dateShort, tzShort };
  } catch {
    return {
      time: now.toTimeString().slice(0, 8),
      dateLong: now.toDateString(),
      dateShort: now.toISOString().slice(5, 10),
      tzShort: "LOCAL",
    };
  }
}

export function escapeLatex(text: string): string {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}");
}

export function generateLatexSource(
  profile: CVProfile,
  cv: CVVersion,
  allProjects: Project[]
): string {
  const selectedProjects = cv.selectedProjectIds
    .map((id) => allProjects.find((p) => p.id === id))
    .filter((p): p is Project => Boolean(p));

  const sections: Record<string, string> = {
    summary: `\\section*{Summary}
${escapeLatex(profile.summary)}`,
    projects: `\\section*{Selected Projects}
\\begin{itemize}[leftmargin=1.2em, itemsep=4pt]
${selectedProjects
  .map((proj) => {
    const progress = computeProjectProgress(proj);
    return `  \\item \\textbf{${escapeLatex(proj.name)}} (${escapeLatex(proj.clientOrType)}) \\hfill \\texttt{${escapeLatex(proj.repoName)}}\\\\
  ${escapeLatex(proj.summary)} (${progress.completed}/${progress.total} tracked tasks completed)`;
  })
  .join("\n")}
\\end{itemize}`,
    experience: `\\section*{Experience}
${profile.experience
  .map(
    (exp) => `\\textbf{${escapeLatex(exp.role)}} --- ${escapeLatex(exp.org)} \\hfill ${escapeLatex(exp.period)}
\\begin{itemize}[leftmargin=1.2em, itemsep=2pt]
${exp.bullets.map((b) => `  \\item ${escapeLatex(b)}`).join("\n")}
\\end{itemize}`
  )
  .join("\n\n")}`,
    skills: `\\section*{Technical Skills}
\\begin{itemize}[leftmargin=1.2em, itemsep=2pt]
${profile.skills
  .map(
    (s) =>
      `  \\item \\textbf{${escapeLatex(s.group)}:} ${escapeLatex(s.items.join(", "))}`
  )
  .join("\n")}
\\end{itemize}`,
    education: `\\section*{Education}
\\textbf{${escapeLatex(profile.education.institution)}} \\hfill ${escapeLatex(profile.education.period)}\\\\
${escapeLatex(profile.education.degree)}\\\\
\\small{${escapeLatex(profile.education.detail)}}`,
  };

  return `% ORBIT CV Studio — ${escapeLatex(cv.name)}
% Target: ${escapeLatex(cv.targetRole)}
\\documentclass[10.5pt,letterpaper]{article}
\\usepackage[margin=0.6in]{geometry}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\pagestyle{empty}

\\begin{document}

\\begin{center}
  {\\LARGE\\bfseries ${escapeLatex(profile.fullName)}}\\\\[4pt]
  ${escapeLatex(profile.location)} $\\cdot$ ${escapeLatex(profile.email)} $\\cdot$ ${escapeLatex(profile.website)} $\\cdot$ ${escapeLatex(profile.github)}
\\end{center}

\\vspace{4pt}
${cv.sectionsOrder.map((key) => sections[key] ?? "").join("\n\n")}

\\end{document}
`;
}

export const COMMON_TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
];
