import React from "react";
import { useTranslation } from "react-i18next";
import {
  useConfigNavSections as useCoreConfigNavSections,
  extendPreferences,
  type ConfigNavSection,
} from "./CoreConfigNavSections";
import AccountCards from "@app/components/shared/config/configSections/preferences/AccountCards";
import ApiKeys from "@app/components/shared/config/configSections/ApiKeys";

export const useConfigNavSections = (
  isAdmin: boolean = false,
  runningEE: boolean = false,
  loginEnabled: boolean = false,
  onRequestClose: () => void = () => {},
  showSettingsWhenNoLogin: boolean = true,
): ConfigNavSection[] => {
  const { t } = useTranslation();

  // Core ships Preferences and About; About is the small print and stays last.
  const coreSections = useCoreConfigNavSections(
    isAdmin,
    runningEE,
    loginEnabled,
    onRequestClose,
    showSettingsWhenNoLogin,
  );
  const about = coreSections.filter((s) => s.id === "about");
  // Core owns the page; the flavor supplies what core has no concept of.
  const sections = extendPreferences(
    coreSections.filter((s) => s.id !== "about"),
    loginEnabled ? { accountSlot: <AccountCards /> } : {},
  );

  const preferences = sections.find((s) => s.id === "preferences");
  if (preferences) {
    if (loginEnabled) {
      preferences.items.push({
        key: "api-keys",
        label: t("settings.developer.apiKeys", "API Keys"),
        description: t(
          "settings.developer.apiKeysDescription",
          "Personal keys for calling the Fold API from scripts and integrations.",
        ),
        icon: "key",
        component: <ApiKeys />,
      });
    }
  }
  return [...sections, ...about];
};

// Re-export types for convenience
export type {
  ConfigNavSection,
  ConfigNavItem,
  ConfigColors,
} from "./CoreConfigNavSections";
