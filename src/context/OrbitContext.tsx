"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SEED_WORKSPACE } from "@/data/seed";
import {
  getLocalCalendarDate,
  loadWorkspace,
  saveWorkspace,
} from "@/lib/storage";
import {
  CVProfile,
  CVVersion,
  IdeaItem,
  InboxItem,
  LibraryItem,
  MotionPreference,
  OpportunityItem,
  OpportunityStatus,
  OrbitWorkspaceState,
  Project,
  TaskItem,
  UserPreferences,
} from "@/types/orbit";

export type QuickAddKind = "task" | "link" | "idea" | "project";
export type SessionAuthMode = "unauthenticated" | "welcome_hero" | "authenticated";

export interface ToastNotice {
  id: string;
  message: string;
  tone: "neutral" | "success" | "error";
  undoLabel?: string;
  onUndo?: () => void;
}

interface OrbitContextValue {
  state: OrbitWorkspaceState;
  hydrated: boolean;
  effectiveReducedMotion: boolean;
  sessionAuthMode: SessionAuthMode;
  sessionChecked: boolean;
  showWelcomeIntro: boolean;
  welcomeExitedCount: number;
  openDemoLogin: () => void;
  dismissWelcomeIntro: () => void;
  replayWelcomeIntro: () => void;
  logout: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  quickAddOpen: boolean;
  quickAddKind: QuickAddKind;
  openQuickAdd: (kind?: QuickAddKind) => void;
  setQuickAddOpen: (open: boolean) => void;
  toasts: ToastNotice[];
  pushToast: (
    message: string,
    options?: {
      tone?: "neutral" | "success" | "error";
      undoLabel?: string;
      onUndo?: () => void;
    }
  ) => void;
  dismissToast: (id: string) => void;
  // Preferences
  updatePreferences: (patch: Partial<UserPreferences>) => void;
  resetWorkspaceData: () => void;
  // Tasks
  toggleTask: (taskId: string) => void;
  addTask: (input: {
    title: string;
    projectId?: string;
    dueLabel?: string;
    priority?: "high" | "normal" | "low";
  }) => void;
  deleteTask: (taskId: string) => void;
  // Projects
  addProject: (input: {
    name: string;
    clientOrType: string;
    deadline: string;
    summary: string;
  }) => string;
  updateProject: (projectId: string, patch: Partial<Project>) => void;
  toggleProjectTask: (projectId: string, taskId: string) => void;
  addProjectTask: (projectId: string, title: string) => void;
  toggleProjectMilestone: (projectId: string, milestoneId: string) => void;
  // Inbox
  addInboxFileItems: (files: { name: string; size: number; type: string }[]) => void;
  runSimulatedAnalysis: (inboxId: string) => void;
  convertInboxSuggestion: (
    inboxId: string,
    suggestionId: string,
    target: "task" | "idea"
  ) => void;
  deleteInboxItem: (inboxId: string) => void;
  // Ideas
  addIdea: (input: {
    title: string;
    description: string;
    tags: string[];
    source: string;
  }) => void;
  updateIdea: (ideaId: string, patch: Partial<IdeaItem>) => void;
  deleteIdea: (ideaId: string) => void;
  toggleIdeaPin: (ideaId: string) => void;
  generateIdeaPolishPreview: (ideaId: string) => void;
  convertIdeaToProject: (ideaId: string) => string | null;
  // Library
  addLibraryItem: (
    item: Omit<LibraryItem, "id" | "savedAt" | "domain"> & { domain?: string }
  ) => void;
  updateLibraryItem: (itemId: string, patch: Partial<LibraryItem>) => void;
  toggleLibraryFavorite: (itemId: string) => void;
  deleteLibraryItem: (itemId: string) => void;
  // Opportunities
  updateOpportunity: (
    oppId: string,
    patch: Partial<OpportunityItem>,
    historyNote?: string
  ) => void;
  setOpportunityStatus: (oppId: string, status: OpportunityStatus) => void;
  addOpportunityFollowUpTask: (oppId: string) => void;
  // CV Studio
  setActiveCvId: (id: string) => void;
  updateCvProfile: (patch: Partial<CVProfile>) => void;
  updateCvVersion: (cvId: string, patch: Partial<CVVersion>) => void;
  runDemoCvTailoring: (cvId: string) => void;
  // Demo settings simulation
  cycleModelCooldown: (modelId: string) => void;
}

const OrbitContext = createContext<OrbitContextValue | null>(null);

function safeDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "local.note";
  }
}

export function OrbitProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OrbitWorkspaceState>(SEED_WORKSPACE);
  const [hydrated, setHydrated] = useState(false);
  const [osReducedMotion, setOsReducedMotion] = useState(false);
  const [sessionAuthMode, setSessionAuthMode] = useState<SessionAuthMode>("unauthenticated");
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(false);
  const [welcomeExitedCount, setWelcomeExitedCount] = useState(0);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddKind, setQuickAddKind] = useState<QuickAddKind>("task");
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  const pushToast = useCallback(
    (
      message: string,
      options?: {
        tone?: "neutral" | "success" | "error";
        undoLabel?: string;
        onUndo?: () => void;
      }
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [
        ...prev.slice(-2),
        {
          id,
          message,
          tone: options?.tone ?? "neutral",
          undoLabel: options?.undoLabel,
          onUndo: options?.onUndo,
        },
      ]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4800);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Hydrate from localStorage + check OS reduced motion + check session
  useEffect(() => {
    let cancelled = false;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setOsReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setOsReducedMotion(e.matches);
    mq.addEventListener("change", onChange);

    const { state: loaded, recoveredFromCorrupt } = loadWorkspace();
    setState(loaded);
    setHydrated(true);

    // Check for valid session via API
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.authenticated) {
          setSessionAuthMode("authenticated");

          // A fresh successful login is flagged by the access screen.
          let freshLogin = false;
          try {
            freshLogin =
              window.sessionStorage.getItem("orbit_fresh_login") === "1";
            if (freshLogin) {
              window.sessionStorage.removeItem("orbit_fresh_login");
            }
          } catch {
            freshLogin = false;
          }

          let alreadyWelcomedInSession = false;
          try {
            alreadyWelcomedInSession =
              window.sessionStorage.getItem("orbit_session_welcomed") === "1";
          } catch {
            alreadyWelcomedInSession = false;
          }

          const preference = loaded.preferences.welcomePreference;

          // "never" only plays via the explicit Replay Welcome control.
          const shouldPlay =
            preference === "never"
              ? false
              : freshLogin
                ? true
                : preference === "always" && !alreadyWelcomedInSession;

          if (shouldPlay) {
            setSessionAuthMode("welcome_hero");
            setShowWelcomeIntro(true);
          }
        } else {
          setSessionAuthMode("unauthenticated");
          if (window.location.pathname !== "/login") window.location.replace("/login");
        }
      } catch {
        setSessionAuthMode("unauthenticated");
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    };

    checkSession();

    if (recoveredFromCorrupt) {
      pushToast("Stored workspace data was malformed and reset to demo defaults.", {
        tone: "error",
      });
    }

    return () => {
      cancelled = true;
      mq.removeEventListener("change", onChange);
    };
  }, [pushToast]);

  // Persist to localStorage after hydration
  useEffect(() => {
    if (!hydrated) return;
    saveWorkspace(state);
  }, [state, hydrated]);

  // Global Cmd/Ctrl+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const effectiveReducedMotion = useMemo(() => {
    const pref: MotionPreference = state.preferences.motionPreference;
    if (pref === "reduced") return true;
    if (pref === "full") return false;
    return osReducedMotion;
  }, [state.preferences.motionPreference, osReducedMotion]);

  const dismissWelcomeIntro = useCallback(() => {
    setShowWelcomeIntro(false);
    setSessionAuthMode("authenticated");
    setWelcomeExitedCount((c) => c + 1);
    try {
      window.sessionStorage.setItem("orbit_session_welcomed", "1");
    } catch {
      // ignore storage restrictions
    }
    setState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        welcomeLastPlayedDate: getLocalCalendarDate(prev.preferences.timezone),
      },
    }));
  }, []);

  const replayWelcomeIntro = useCallback(() => {
    setSessionAuthMode("welcome_hero");
    setShowWelcomeIntro(true);
  }, []);

  const openDemoLogin = useCallback(() => {
    try {
      window.sessionStorage.removeItem("orbit_session_welcomed");
    } catch {
      // ignore
    }
    setShowWelcomeIntro(false);
    setSessionAuthMode("unauthenticated");
    // Redirect to login page
    window.location.href = "/login";
  }, []);

  const logout = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok && response.status !== 401) throw new Error("Logout failed");
    } catch {
      pushToast("Could not sign out. Check your connection and try again.", { tone: "error" });
      return;
    }
    // Clear local session flag
    try {
      window.sessionStorage.removeItem("orbit_session_welcomed");
      window.sessionStorage.removeItem("orbit_fresh_login");
    } catch {
      // ignore
    }
    // Redirect to login
    window.location.href = "/login";
  }, [pushToast]);

  const openQuickAdd = useCallback((kind: QuickAddKind = "task") => {
    setQuickAddKind(kind);
    setQuickAddOpen(true);
  }, []);

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...patch },
    }));
  }, []);

  const resetWorkspaceData = useCallback(() => {
    setState(SEED_WORKSPACE);
    saveWorkspace(SEED_WORKSPACE);
    pushToast("Workspace restored to default mock dataset.", { tone: "success" });
  }, [pushToast]);

  const toggleTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      ),
    }));
  }, []);

  const addTask = useCallback(
    (input: {
      title: string;
      projectId?: string;
      dueLabel?: string;
      priority?: "high" | "normal" | "low";
    }) => {
      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        title: input.title.trim(),
        completed: false,
        projectId: input.projectId || undefined,
        dueLabel: input.dueLabel?.trim() || "Today",
        priority: input.priority ?? "normal",
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
      pushToast(`Task added: ${newTask.title}`, { tone: "success" });
    },
    [pushToast]
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      let removed: TaskItem | undefined;
      setState((prev) => {
        removed = prev.tasks.find((t) => t.id === taskId);
        return { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) };
      });
      if (removed) {
        const snapshot = removed;
        pushToast("Task removed.", {
          undoLabel: "Undo",
          onUndo: () =>
            setState((prev) => ({ ...prev, tasks: [snapshot, ...prev.tasks] })),
        });
      }
    },
    [pushToast]
  );

  const addProject = useCallback(
    (input: {
      name: string;
      clientOrType: string;
      deadline: string;
      summary: string;
    }) => {
      const id = `proj-${Date.now()}`;
      const newProj: Project = {
        id,
        name: input.name.trim(),
        clientOrType: input.clientOrType.trim() || "Personal",
        status: "active",
        deadline: input.deadline || "2026-12-30",
        summary: input.summary.trim() || "New project workspace.",
        repoName: `aarav/${input.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}`,
        milestones: [
          {
            id: `ms-${Date.now()}`,
            title: "Initial scope & setup",
            targetDate: input.deadline || "2026-12-15",
            done: false,
          },
        ],
        tasks: [
          { id: `pt-${Date.now()}-1`, title: "Define architecture & milestones", done: false },
          { id: `pt-${Date.now()}-2`, title: "Ship first working slice", done: false },
        ],
        githubActivity: [
          {
            id: `gh-${Date.now()}`,
            commitHash: "init001",
            message: "chore: initialized project repository (Simulated)",
            branch: "main",
            timestamp: "Just now (Simulated)",
          },
        ],
      };
      setState((prev) => ({ ...prev, projects: [newProj, ...prev.projects] }));
      pushToast(`Project created: ${newProj.name}`, { tone: "success" });
      return id;
    },
    [pushToast]
  );

  const updateProject = useCallback((projectId: string, patch: Partial<Project>) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId ? { ...p, ...patch } : p
      ),
    }));
  }, []);

  const toggleProjectTask = useCallback((projectId: string, taskId: string) => {
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t
              ),
            }
          : p
      ),
    }));
  }, []);

  const addProjectTask = useCallback((projectId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tasks: [
                ...p.tasks,
                { id: `pt-${Date.now()}`, title: trimmed, done: false },
              ],
            }
          : p
      ),
    }));
  }, []);

  const toggleProjectMilestone = useCallback(
    (projectId: string, milestoneId: string) => {
      setState((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId
            ? {
                ...p,
                milestones: p.milestones.map((m) =>
                  m.id === milestoneId ? { ...m, done: !m.done } : m
                ),
              }
            : p
        ),
      }));
    },
    []
  );

  const addInboxFileItems = useCallback(
    (files: { name: string; size: number; type: string }[]) => {
      const nowLabel = new Date().toISOString().slice(0, 16).replace("T", " · ");
      const created: InboxItem[] = files.map((f, idx) => {
        const lower = f.name.toLowerCase();
        const kind: InboxItem["kind"] = lower.endsWith(".pdf")
          ? "pdf"
          : f.type.startsWith("image/") || /\.(png|jpg|jpeg|webp|svg)$/.test(lower)
            ? "image"
            : "document";
        const sizeKb = Math.max(1, Math.round(f.size / 1024));
        const sizeLabel =
          sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;
        return {
          id: `inb-${Date.now()}-${idx}`,
          title: f.name,
          kind,
          source: "Local file picker (metadata only)",
          savedAt: nowLabel,
          fileSize: sizeLabel,
          summary:
            "Local file metadata stored in browser persistence. Click 'Run simulated analysis' to preview demo extraction.",
          tags: ["Local Upload", kind.toUpperCase()],
          suggestedActions: [
            { id: `sa-${Date.now()}-${idx}-1`, label: `Review ${f.name} details` },
          ],
          analysisStatus: "demo_ready",
        };
      });
      setState((prev) => ({ ...prev, inbox: [...created, ...prev.inbox] }));
      pushToast(`Saved ${created.length} local file metadata record(s) to Inbox.`, {
        tone: "success",
      });
    },
    [pushToast]
  );

  const runSimulatedAnalysis = useCallback(
    (inboxId: string) => {
      setState((prev) => ({
        ...prev,
        inbox: prev.inbox.map((item) =>
          item.id === inboxId
            ? { ...item, analysisStatus: "simulated_analyzing" }
            : item
        ),
      }));

      window.setTimeout(() => {
        setState((prev) => ({
          ...prev,
          inbox: prev.inbox.map((item) => {
            if (item.id !== inboxId) return item;
            return {
              ...item,
              analysisStatus: "simulated_done",
              summary: `[Simulated Demo Summary] Structured key points prepared for "${item.title}". No remote AI call or PDF binary parsing was performed in this frontend-only phase.`,
              suggestedActions:
                item.suggestedActions.length >= 2
                  ? item.suggestedActions
                  : [
                      ...item.suggestedActions,
                      {
                        id: `sa-sim-${Date.now()}`,
                        label: `Create follow-up task from ${item.title}`,
                      },
                    ],
            };
          }),
        }));
        pushToast("Simulated analysis complete (demo output).", { tone: "success" });
      }, 650);
    },
    [pushToast]
  );

  const convertInboxSuggestion = useCallback(
    (inboxId: string, suggestionId: string, target: "task" | "idea") => {
      const item = state.inbox.find((i) => i.id === inboxId);
      const suggestion = item?.suggestedActions.find((s) => s.id === suggestionId);
      if (!item || !suggestion) return;

      if (target === "task") {
        const newTask: TaskItem = {
          id: `task-${Date.now()}`,
          title: suggestion.label,
          completed: false,
          dueLabel: "Today",
          priority: "normal",
          createdAt: new Date().toISOString(),
        };
        setState((prev) => ({
          ...prev,
          tasks: [newTask, ...prev.tasks],
          inbox: prev.inbox.map((i) =>
            i.id === inboxId
              ? {
                  ...i,
                  suggestedActions: i.suggestedActions.map((s) =>
                    s.id === suggestionId ? { ...s, convertedTo: "task" } : s
                  ),
                }
              : i
          ),
        }));
        pushToast("Suggestion converted to Today task.", { tone: "success" });
      } else {
        const newIdea: IdeaItem = {
          id: `idea-${Date.now()}`,
          title: suggestion.label,
          description: `Captured from Inbox item "${item.title}".`,
          tags: item.tags.slice(0, 2),
          source: `Inbox · ${item.title}`,
          pinnedToToday: false,
          createdAt: getLocalCalendarDate(state.preferences.timezone),
        };
        setState((prev) => ({
          ...prev,
          ideas: [newIdea, ...prev.ideas],
          inbox: prev.inbox.map((i) =>
            i.id === inboxId
              ? {
                  ...i,
                  suggestedActions: i.suggestedActions.map((s) =>
                    s.id === suggestionId ? { ...s, convertedTo: "idea" } : s
                  ),
                }
              : i
          ),
        }));
        pushToast("Suggestion saved to Ideas.", { tone: "success" });
      }
    },
    [state.inbox, state.preferences.timezone, pushToast]
  );

  const deleteInboxItem = useCallback(
    (inboxId: string) => {
      const snapshot = state.inbox.find((i) => i.id === inboxId);
      setState((prev) => ({
        ...prev,
        inbox: prev.inbox.filter((i) => i.id !== inboxId),
      }));
      if (snapshot) {
        pushToast(`Removed "${snapshot.title}" from Inbox.`, {
          undoLabel: "Undo",
          onUndo: () =>
            setState((prev) => ({ ...prev, inbox: [snapshot, ...prev.inbox] })),
        });
      }
    },
    [state.inbox, pushToast]
  );

  const addIdea = useCallback(
    (input: { title: string; description: string; tags: string[]; source: string }) => {
      const newIdea: IdeaItem = {
        id: `idea-${Date.now()}`,
        title: input.title.trim(),
        description: input.description.trim(),
        tags: input.tags,
        source: input.source.trim() || "Manual note",
        pinnedToToday: false,
        createdAt: getLocalCalendarDate(state.preferences.timezone),
      };
      setState((prev) => ({ ...prev, ideas: [newIdea, ...prev.ideas] }));
      pushToast(`Idea added: ${newIdea.title}`, { tone: "success" });
    },
    [state.preferences.timezone, pushToast]
  );

  const updateIdea = useCallback((ideaId: string, patch: Partial<IdeaItem>) => {
    setState((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) => (i.id === ideaId ? { ...i, ...patch } : i)),
    }));
  }, []);

  const deleteIdea = useCallback(
    (ideaId: string) => {
      const snapshot = state.ideas.find((i) => i.id === ideaId);
      setState((prev) => ({
        ...prev,
        ideas: prev.ideas.filter((i) => i.id !== ideaId),
      }));
      if (snapshot) {
        pushToast(`Deleted idea "${snapshot.title}".`, {
          undoLabel: "Undo",
          onUndo: () =>
            setState((prev) => ({ ...prev, ideas: [snapshot, ...prev.ideas] })),
        });
      }
    },
    [state.ideas, pushToast]
  );

  const toggleIdeaPin = useCallback((ideaId: string) => {
    setState((prev) => ({
      ...prev,
      ideas: prev.ideas.map((i) =>
        i.id === ideaId ? { ...i, pinnedToToday: !i.pinnedToToday } : i
      ),
    }));
  }, []);

  const generateIdeaPolishPreview = useCallback(
    (ideaId: string) => {
      setState((prev) => ({
        ...prev,
        ideas: prev.ideas.map((i) =>
          i.id === ideaId
            ? {
                ...i,
                polishPreview: `Demo Polish Output: "${i.title}" — ${i.description} Framed as a focused 2-week build with measurable local-first milestones and clean typographic hierarchy.`,
              }
            : i
        ),
      }));
      pushToast("Generated demo polish preview.", { tone: "success" });
    },
    [pushToast]
  );

  const convertIdeaToProject = useCallback(
    (ideaId: string) => {
      const idea = state.ideas.find((i) => i.id === ideaId);
      if (!idea) return null;
      const projId = addProject({
        name: idea.title,
        clientOrType: "Idea Conversion · Personal",
        deadline: "2026-12-28",
        summary: idea.description,
      });
      setState((prev) => ({
        ...prev,
        ideas: prev.ideas.map((i) =>
          i.id === ideaId ? { ...i, convertedProjectId: projId } : i
        ),
      }));
      return projId;
    },
    [state.ideas, addProject]
  );

  const addLibraryItem = useCallback(
    (item: Omit<LibraryItem, "id" | "savedAt" | "domain"> & { domain?: string }) => {
      const newItem: LibraryItem = {
        ...item,
        id: `lib-${Date.now()}`,
        domain: item.domain || safeDomainFromUrl(item.url),
        savedAt: getLocalCalendarDate(state.preferences.timezone),
      };
      setState((prev) => ({ ...prev, library: [newItem, ...prev.library] }));
      pushToast(`Saved to Library: ${newItem.title}`, { tone: "success" });
    },
    [state.preferences.timezone, pushToast]
  );

  const updateLibraryItem = useCallback((itemId: string, patch: Partial<LibraryItem>) => {
    setState((prev) => ({
      ...prev,
      library: prev.library.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...patch,
              domain: patch.url ? safeDomainFromUrl(patch.url) : item.domain,
            }
          : item
      ),
    }));
  }, []);

  const toggleLibraryFavorite = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      library: prev.library.map((item) =>
        item.id === itemId ? { ...item, favorite: !item.favorite } : item
      ),
    }));
  }, []);

  const deleteLibraryItem = useCallback(
    (itemId: string) => {
      const snapshot = state.library.find((i) => i.id === itemId);
      setState((prev) => ({
        ...prev,
        library: prev.library.filter((i) => i.id !== itemId),
      }));
      if (snapshot) {
        pushToast(`Removed "${snapshot.title}" from Library.`, {
          undoLabel: "Undo",
          onUndo: () =>
            setState((prev) => ({ ...prev, library: [snapshot, ...prev.library] })),
        });
      }
    },
    [state.library, pushToast]
  );

  const updateOpportunity = useCallback(
    (oppId: string, patch: Partial<OpportunityItem>, historyNote?: string) => {
      const today = getLocalCalendarDate(state.preferences.timezone);
      setState((prev) => ({
        ...prev,
        opportunities: prev.opportunities.map((o) => {
          if (o.id !== oppId) return o;
          return {
            ...o,
            ...patch,
            lastActivity: today,
            history: historyNote
              ? [{ id: `h-${Date.now()}`, date: today, note: historyNote }, ...o.history]
              : o.history,
          };
        }),
      }));
    },
    [state.preferences.timezone]
  );

  const setOpportunityStatus = useCallback(
    (oppId: string, status: OpportunityStatus) => {
      updateOpportunity(oppId, { status }, `Status updated to "${status}".`);
      pushToast(`Opportunity moved to ${status}.`, { tone: "success" });
    },
    [updateOpportunity, pushToast]
  );

  const addOpportunityFollowUpTask = useCallback(
    (oppId: string) => {
      const opp = state.opportunities.find((o) => o.id === oppId);
      if (!opp) return;
      addTask({
        title: `Follow up: ${opp.companyOrClient} — ${opp.roleOrProject}`,
        dueLabel: opp.nextFollowUp || "Tomorrow",
        priority: "high",
      });
      updateOpportunity(oppId, {}, "Created follow-up reminder task on Today.");
    },
    [state.opportunities, addTask, updateOpportunity]
  );

  const setActiveCvId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeCvId: id }));
  }, []);

  const updateCvProfile = useCallback((patch: Partial<CVProfile>) => {
    setState((prev) => ({
      ...prev,
      cvProfile: { ...prev.cvProfile, ...patch },
    }));
  }, []);

  const updateCvVersion = useCallback((cvId: string, patch: Partial<CVVersion>) => {
    const today = getLocalCalendarDate(state.preferences.timezone);
    setState((prev) => ({
      ...prev,
      cvVersions: prev.cvVersions.map((cv) =>
        cv.id === cvId ? { ...cv, ...patch, updatedAt: today } : cv
      ),
    }));
  }, [state.preferences.timezone]);

  const runDemoCvTailoring = useCallback(
    (cvId: string) => {
      const cv = state.cvVersions.find((c) => c.id === cvId);
      if (!cv) return;
      const roleText = cv.roleDescriptionInput.toLowerCase();
      const projects = state.projects;
      const scored = [...projects].sort((a, b) => {
        const aScore =
          (roleText.includes("cli") || roleText.includes("full-stack") || roleText.includes("parser")
            ? a.id === "proj-fieldnote"
              ? 3
              : 0
            : 0) +
          (roleText.includes("frontend") || roleText.includes("webgl") || roleText.includes("design")
            ? a.id === "proj-portfolio"
              ? 3
              : 0
            : 0) +
          (roleText.includes("client") || roleText.includes("storefront")
            ? a.id === "proj-koma"
              ? 3
              : 0
            : 0);
        const bScore =
          (roleText.includes("cli") || roleText.includes("full-stack") || roleText.includes("parser")
            ? b.id === "proj-fieldnote"
              ? 3
              : 0
            : 0) +
          (roleText.includes("frontend") || roleText.includes("webgl") || roleText.includes("design")
            ? b.id === "proj-portfolio"
              ? 3
              : 0
            : 0) +
          (roleText.includes("client") || roleText.includes("storefront")
            ? b.id === "proj-koma"
              ? 3
              : 0
            : 0);
        return bScore - aScore;
      });
      const topIds = scored.slice(0, 3).map((p) => p.id);
      const topNames = scored
        .slice(0, 3)
        .map((p) => p.name)
        .join(", ");

      updateCvVersion(cvId, {
        selectedProjectIds: topIds,
        demoTailoredNote: `Demo Tailoring Output: Ordered verified projects (${topNames}) to align with role keywords. No fabricated metrics or unverified experience added.`,
      });
      pushToast("Updated demo tailoring order from verified projects.", {
        tone: "success",
      });
    },
    [state.cvVersions, state.projects, updateCvVersion, pushToast]
  );

  const cycleModelCooldown = useCallback((modelId: string) => {
    setState((prev) => ({
      ...prev,
      modelProviders: prev.modelProviders.map((m) => {
        if (m.id !== modelId) return m;
        if (m.status === "Simulated: Ready") {
          return {
            ...m,
            status: "Simulated: Cooldown",
            cooldownSeconds: 30,
            latencyLabel: "Rate-limit sim",
          };
        }
        if (m.status === "Simulated: Cooldown") {
          return {
            ...m,
            status: "Simulated: Standby",
            cooldownSeconds: 0,
            latencyLabel: "Standby",
          };
        }
        return {
          ...m,
          status: "Simulated: Ready",
          cooldownSeconds: 0,
          latencyLabel: "~240ms (Mock)",
        };
      }),
    }));
  }, []);

  const value = useMemo<OrbitContextValue>(
    () => ({
      state,
      hydrated,
      effectiveReducedMotion,
      sessionAuthMode,
      sessionChecked,
      showWelcomeIntro,
      welcomeExitedCount,
      openDemoLogin,
      dismissWelcomeIntro,
      replayWelcomeIntro,
      logout,
      commandPaletteOpen,
      setCommandPaletteOpen,
      quickAddOpen,
      quickAddKind,
      openQuickAdd,
      setQuickAddOpen,
      toasts,
      pushToast,
      dismissToast,
      updatePreferences,
      resetWorkspaceData,
      toggleTask,
      addTask,
      deleteTask,
      addProject,
      updateProject,
      toggleProjectTask,
      addProjectTask,
      toggleProjectMilestone,
      addInboxFileItems,
      runSimulatedAnalysis,
      convertInboxSuggestion,
      deleteInboxItem,
      addIdea,
      updateIdea,
      deleteIdea,
      toggleIdeaPin,
      generateIdeaPolishPreview,
      convertIdeaToProject,
      addLibraryItem,
      updateLibraryItem,
      toggleLibraryFavorite,
      deleteLibraryItem,
      updateOpportunity,
      setOpportunityStatus,
      addOpportunityFollowUpTask,
      setActiveCvId,
      updateCvProfile,
      updateCvVersion,
      runDemoCvTailoring,
      cycleModelCooldown,
    }),
    [
      state,
      hydrated,
      effectiveReducedMotion,
      sessionAuthMode,
      sessionChecked,
      showWelcomeIntro,
      welcomeExitedCount,
      openDemoLogin,
      dismissWelcomeIntro,
      replayWelcomeIntro,
      logout,
      commandPaletteOpen,
      quickAddOpen,
      quickAddKind,
      openQuickAdd,
      toasts,
      pushToast,
      dismissToast,
      updatePreferences,
      resetWorkspaceData,
      toggleTask,
      addTask,
      deleteTask,
      addProject,
      updateProject,
      toggleProjectTask,
      addProjectTask,
      toggleProjectMilestone,
      addInboxFileItems,
      runSimulatedAnalysis,
      convertInboxSuggestion,
      deleteInboxItem,
      addIdea,
      updateIdea,
      deleteIdea,
      toggleIdeaPin,
      generateIdeaPolishPreview,
      convertIdeaToProject,
      addLibraryItem,
      updateLibraryItem,
      toggleLibraryFavorite,
      deleteLibraryItem,
      updateOpportunity,
      setOpportunityStatus,
      addOpportunityFollowUpTask,
      setActiveCvId,
      updateCvProfile,
      updateCvVersion,
      runDemoCvTailoring,
      cycleModelCooldown,
    ]
  );

  return <OrbitContext.Provider value={value}>{children}</OrbitContext.Provider>;
}

export function useOrbit(): OrbitContextValue {
  const ctx = useContext(OrbitContext);
  if (!ctx) {
    throw new Error("useOrbit must be used inside OrbitProvider");
  }
  return ctx;
}
