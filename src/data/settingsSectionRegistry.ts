import { NavKey } from "@app/components/shared/config/types";
import { HAS_PORTAL } from "@app/routes/hasPortal";

export interface SettingsSectionEntry {
  key: NavKey;
  labelKey: string;
  labelFallback: string;
  groupLabelKey?: string;
  groupLabelFallback?: string;
  keywords?: string[];
  requiresLogin?: boolean;
  adminArea?: boolean;
  requiresAccount?: boolean;
  requiresPortalAccess?: boolean;
}

const CORE_SETTINGS_SECTION_REGISTRY: SettingsSectionEntry[] = [
  {
    key: "general",
    labelKey: "settings.general.title",
    labelFallback: "General",
    keywords: [
      "theme",
      "language",
      "appearance",
      "preferences",
      "startup",
      "hotkey",
      "shortcut",
      "keybinding",
      "keyboard",
    ],
    groupLabelKey: "settings.preferences.title",
    groupLabelFallback: "Preferences",
  },
  {
    key: "about",
    labelKey: "settings.about.title",
    labelFallback: "About",
    keywords: [
      "about",
      "tours",
      "walkthrough",
      "legal",
      "terms",
      "privacy",
      "cookie",
      "licence",
      "license",
      "attribution",
      "dependencies",
    ],
    groupLabelKey: "settings.about.title",
    groupLabelFallback: "About",
  },
];

export const SETTINGS_SECTION_REGISTRY: SettingsSectionEntry[] = [
  ...CORE_SETTINGS_SECTION_REGISTRY,
  {
    key: "account",
    labelKey: "account.accountSettings",
    labelFallback: "Account",
    keywords: ["profile", "email", "password", "user"],
    requiresLogin: true,
    groupLabelKey: "settings.preferences.title",
    groupLabelFallback: "Preferences",
  },
  {
    key: "api-keys",
    labelKey: "settings.developer.apiKeys",
    labelFallback: "API Keys",
    keywords: ["api", "token", "developer", "key"],
    requiresLogin: true,
    groupLabelKey: "settings.preferences.title",
    groupLabelFallback: "Preferences",
  },
  // --- Workspace ---
  // The shared roster needs login and admin access. Carries the words the
  // retired People and Teams sections were found by.
  {
    key: "users",
    labelKey: "portal.nav.users",
    labelFallback: "Users",
    keywords: [
      "users",
      "people",
      "members",
      "roster",
      "invite",
      "add member",
      "roles",
      "teams",
      "team",
      "group",
      "create team",
      "processor access",
    ],
    requiresLogin: true,
    adminArea: true,
    groupLabelKey: "settings.workspace.title",
    groupLabelFallback: "Workspace",
  },
  // --- Configuration ---
  {
    key: "adminGeneral",
    labelKey: "settings.configuration.systemSettings",
    labelFallback: "System Settings",
    keywords: [
      "system",
      "config",
      "server",
      "features",
      "toggles",
      "flags",
      "storage",
      "sharing",
      "files",
      "folders",
      "access",
      "permissions",
      "scanning",
      "endpoints",
      "api",
      "routes",
      "mcp",
      "server",
      "ai",
      "model context protocol",
    ],
    adminArea: true,
    groupLabelKey: "settings.server.title",
    groupLabelFallback: "Server",
  },
  {
    key: "adminAdvanced",
    labelKey: "settings.configuration.advanced",
    labelFallback: "Advanced",
    keywords: ["advanced", "expert", "database", "db", "backup"],
    adminArea: true,
    groupLabelKey: "settings.server.title",
    groupLabelFallback: "Server",
  },
  // --- AI ---
  {
    key: "adminAi",
    labelKey: "settings.ai.general",
    labelFallback: "AI Engine",
    keywords: [
      "ai",
      "assistant",
      "enable",
      "models",
      "providers",
      "llm",
      "openai",
      "anthropic",
      "rag",
      "embedding",
      "retrieval",
      "documents",
      "limits",
      "tokens",
      "rate",
      "performance",
    ],
    adminArea: true,
    groupLabelKey: "settings.server.title",
    groupLabelFallback: "Server",
  },
  // --- Security & Authentication ---
  {
    key: "adminSecurity",
    labelKey: "settings.securityAuth.security",
    labelFallback: "Security",
    keywords: [
      "security",
      "authentication",
      "auth",
      "password",
      "sessions",
      "connections",
      "oauth",
      "sso",
      "integrations",
      "privacy",
      "gdpr",
      "data",
      "legal",
      "terms",
      "agreement",
    ],
    adminArea: true,
    groupLabelKey: "settings.server.title",
    groupLabelFallback: "Server",
  },
  // --- Licensing & Analytics ---
  {
    key: "adminAudit",
    labelKey: "settings.licensingAnalytics.audit",
    labelFallback: "Audit",
    keywords: ["audit", "logs", "events", "history"],
    adminArea: true,
    groupLabelKey: "settings.monitoring.title",
    groupLabelFallback: "Monitoring",
  },
  {
    key: "adminUsage",
    labelKey: "settings.licensingAnalytics.usageAnalytics",
    labelFallback: "Usage Analytics",
    keywords: ["usage", "analytics", "stats", "metrics"],
    adminArea: true,
    groupLabelKey: "settings.monitoring.title",
    groupLabelFallback: "Monitoring",
  },
  // --- Workspace (moved off the processor's own nav). Present only where the
  // nav can actually show them: a processor build, and a session that can
  // enter it. ---
  ...(HAS_PORTAL
    ? ([
        {
          key: "billing",
          labelKey: "portal.nav.usage",
          labelFallback: "Usage & Billing",
          keywords: [
            "billing",
            "wallet",
            "credits",
            "invoice",
            "spend",
            "payg",
          ],
          adminArea: true,
          requiresPortalAccess: true,
          groupLabelKey: "settings.workspace.title",
          groupLabelFallback: "Workspace",
        },
      ] satisfies SettingsSectionEntry[])
    : []),
  // --- Policies & Privacy ---
];
