export type MotionPreference = "system" | "full" | "reduced";

export type WelcomePreference = "always" | "once" | "never";

export interface UserPreferences {
  name: string;
  timezone: string;
  motionPreference: MotionPreference;
  welcomeLastPlayedDate: string | null;
  demoWeatherEnabled: boolean;
  welcomePreference: WelcomePreference;
}

export interface TaskItem {
  id: string;
  title: string;
  completed: boolean;
  projectId?: string;
  dueLabel: string;
  priority: "high" | "normal" | "low";
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string;
  duration: string;
  kind: "meeting" | "reminder" | "deadline";
  location: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  targetDate: string;
  done: boolean;
}

export interface ProjectTask {
  id: string;
  title: string;
  done: boolean;
}

export interface GitHubActivityItem {
  id: string;
  commitHash: string;
  message: string;
  branch: string;
  timestamp: string;
}

export type ProjectStatus = "active" | "planning" | "paused" | "completed";

export interface Project {
  id: string;
  name: string;
  clientOrType: string;
  status: ProjectStatus;
  deadline: string;
  summary: string;
  repoName: string;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  githubActivity: GitHubActivityItem[];
}

export type InboxKind = "pdf" | "document" | "image" | "note" | "link";

export interface SuggestedAction {
  id: string;
  label: string;
  convertedTo?: "task" | "idea";
}

export interface InboxItem {
  id: string;
  title: string;
  kind: InboxKind;
  source: string;
  savedAt: string;
  fileSize?: string;
  url?: string;
  summary: string;
  tags: string[];
  suggestedActions: SuggestedAction[];
  analysisStatus: "demo_ready" | "simulated_analyzing" | "simulated_done";
}

export interface IdeaItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  source: string;
  pinnedToToday: boolean;
  polishPreview?: string;
  createdAt: string;
  convertedProjectId?: string;
}

export type LibraryCategory =
  | "Websites"
  | "Fonts"
  | "Palettes"
  | "Tools"
  | "Reading";

export interface LibraryItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  category: LibraryCategory;
  savedAt: string;
  description: string;
  tags: string[];
  favorite: boolean;
  paletteHexes?: string[];
  specimenText?: string;
}

export type OpportunityTrack = "internships" | "freelance";

export type OpportunityStatus =
  | "Saved"
  | "Preparing"
  | "Applied/Sent"
  | "Reply"
  | "Interview/Meeting"
  | "Won/Offer"
  | "Closed";

export interface OpportunityHistoryEntry {
  id: string;
  date: string;
  note: string;
}

export interface OpportunityItem {
  id: string;
  track: OpportunityTrack;
  companyOrClient: string;
  roleOrProject: string;
  listingUrl: string;
  location: string;
  compensation: string;
  deadline: string;
  feeStatus: "No fee" | "Waived" | "Paid";
  matchExplanation: string;
  cvVersionId: string;
  status: OpportunityStatus;
  notes: string;
  lastActivity: string;
  nextFollowUp: string;
  history: OpportunityHistoryEntry[];
}

export type CVSectionKey =
  | "summary"
  | "experience"
  | "projects"
  | "skills"
  | "education";

export interface CVProfile {
  fullName: string;
  headline: string;
  email: string;
  location: string;
  website: string;
  github: string;
  summary: string;
  education: {
    institution: string;
    degree: string;
    period: string;
    detail: string;
  };
  experience: {
    id: string;
    role: string;
    org: string;
    period: string;
    bullets: string[];
  }[];
  skills: {
    group: string;
    items: string[];
  }[];
}

export interface CVVersion {
  id: string;
  name: string;
  targetRole: string;
  updatedAt: string;
  summaryNote: string;
  sectionsOrder: CVSectionKey[];
  selectedProjectIds: string[];
  roleDescriptionInput: string;
  demoTailoredNote: string;
}

export interface DemoIntegration {
  id: string;
  name: string;
  category: string;
  status: "Simulated: Connected" | "Simulated: Standby" | "Planned (Phase 2)";
  lastSyncLabel: string;
  detail: string;
}

export interface DemoModelProvider {
  id: string;
  name: string;
  model: string;
  status: "Simulated: Ready" | "Simulated: Cooldown" | "Simulated: Standby";
  cooldownSeconds: number;
  latencyLabel: string;
}

export interface OrbitWorkspaceState {
  version: number;
  preferences: UserPreferences;
  tasks: TaskItem[];
  events: CalendarEvent[];
  projects: Project[];
  inbox: InboxItem[];
  ideas: IdeaItem[];
  library: LibraryItem[];
  opportunities: OpportunityItem[];
  cvProfile: CVProfile;
  cvVersions: CVVersion[];
  activeCvId: string;
  integrations: DemoIntegration[];
  modelProviders: DemoModelProvider[];
}
