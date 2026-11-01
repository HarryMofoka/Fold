import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Text, Group, Badge, ActionIcon, Button, Box } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Icon } from "@app/ui/Icon";
import {
  getAllLanguageDefinitions,
  getAutoOcrLanguage,
  getBrowserLanguagesForOcr,
  getOcrDisplayName,
} from "@app/utils/languageMapping";
import apiClient from "@app/services/apiClient";
import DropdownListWithFooter, {
  DropdownItem,
} from "@app/components/shared/DropdownListWithFooter";

export interface LanguageOption {
  value: string;
  label: string;
}

export interface LanguagePickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  languagesEndpoint?: string;
  autoFillFromBrowserLanguage?: boolean;
}

function buildLanguageOptions(
  languages: string[],
  t: (key: any, fallback?: any) => any,
  i18nLanguage: string,
): DropdownItem[] {
  const displayNames =
    typeof Intl.DisplayNames !== "undefined"
      ? new Intl.DisplayNames([i18nLanguage], { type: "language" })
      : null;

  return [...new Set(languages)]
    .map((lang) => {
      const displayName = getOcrDisplayName(lang);
      const browserLanguageCodes = getBrowserLanguagesForOcr(lang);

      const langKey = `lang.${lang}`;
      const translatedFromKey = t(langKey);
      const hasKeyTranslation = translatedFromKey !== langKey;

      const intlTranslatedName = displayNames
        ? browserLanguageCodes
            .map((code) => {
              try {
                return displayNames.of(code);
              } catch {
                return null;
              }
            })
            .find((name): name is string => Boolean(name))
        : null;

      const translatedName =
        (hasKeyTranslation ? translatedFromKey : null) ||
        intlTranslatedName ||
        t(`ocr.languages.${lang}`, displayName);

      return {
        value: lang,
        name: translatedName,
        label: translatedName,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, i18nLanguage));
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  label,
  languagesEndpoint = "/api/v1/ui-data/ocr-pdf",
  autoFillFromBrowserLanguage = true,
}) => {
  const { t, i18n } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t("dropdownList.selectLanguages");

  const defaultLanguages = useMemo(
    () => getAllLanguageDefinitions().map((def) => def.ocrCode),
    [],
  );

  const initialOptions = useMemo(
    () => buildLanguageOptions(defaultLanguages, t, i18n.language),
    [defaultLanguages, t, i18n.language],
  );

  const [availableLanguages, setAvailableLanguages] =
    useState<DropdownItem[]>(initialOptions);
  const [hasAutoFilled, setHasAutoFilled] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchLanguages = async () => {
      try {
        const { data } = await apiClient.get<{ languages?: string[] }>(
          languagesEndpoint,
        );

        if (
          isMounted &&
          Array.isArray(data?.languages) &&
          data.languages.length > 0
        ) {
          const languageOptions = buildLanguageOptions(
            data.languages,
            t,
            i18n.language,
          );
          setAvailableLanguages(languageOptions);
        }
      } catch (error) {
        console.warn(
          "[LanguagePicker] Using client OCR language catalog:",
          error,
        );
      }
    };

    fetchLanguages();
    return () => {
      isMounted = false;
    };
  }, [languagesEndpoint, i18n.language, t]);

  useEffect(() => {
    if (!autoFillFromBrowserLanguage || hasAutoFilled) {
      return;
    }

    if (value.length === 0) {
      const suggestedOcrLanguages = getAutoOcrLanguage(i18n.language);
      const matchingLanguage = availableLanguages.find((lang) =>
        suggestedOcrLanguages.includes(lang.value),
      );

      if (matchingLanguage) {
        onChange([matchingLanguage.value]);
      } else {
        onChange(["eng"]);
      }

      setHasAutoFilled(true);
    }
  }, [
    autoFillFromBrowserLanguage,
    availableLanguages,
    hasAutoFilled,
    value.length,
    i18n.language,
    onChange,
  ]);

  const handleRemoveLanguage = useCallback(
    (langCode: string) => {
      onChange(value.filter((v) => v !== langCode));
    },
    [onChange, value],
  );

  const footer = (
    <div className="flex flex-col items-center gap-1 text-center">
      <Text size="xs" c="dimmed" className="text-center">
        {t(
          "ocr.languagePicker.additionalLanguages",
          "Looking for additional languages?",
        )}
      </Text>
      <Text
        size="xs"
        style={{
          color: "var(--c-accent-text)",
          cursor: "pointer",
          textDecoration: "underline",
          textAlign: "center",
        }}
        onClick={() =>
          window.open(
            "https://docs.stirlingpdf.com/Configuration/OCR",
            "_blank",
          )
        }
      >
        {t("ocr.languagePicker.viewSetupGuide", "View setup guide →")}
      </Text>
    </div>
  );

  return (
    <Box>
      <DropdownListWithFooter
        value={value}
        onChange={(newValue) => onChange(newValue as string[])}
        items={availableLanguages}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        label={label}
        footer={footer}
        multiSelect={true}
        maxHeight={300}
        searchable={true}
      />

      {value.length > 0 ? (
        <Group gap="xs" mt="xs" wrap="wrap">
          {value.map((langCode) => {
            const langDef = availableLanguages.find(
              (l) => l.value === langCode,
            );
            const displayLabel = langDef?.name || getOcrDisplayName(langCode);
            return (
              <Badge
                key={langCode}
                variant="light"
                color="blue"
                size="sm"
                rightSection={
                  <ActionIcon
                    size="xs"
                    color="blue"
                    radius="xl"
                    variant="transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLanguage(langCode);
                    }}
                    aria-label={`Remove ${displayLabel}`}
                  >
                    <Icon name="x" size={10} />
                  </ActionIcon>
                }
              >
                {displayLabel}
              </Badge>
            );
          })}
        </Group>
      ) : (
        <Group gap="xs" mt="xs" justify="space-between" align="center">
          <Text size="xs" c="dimmed">
            {t(
              "ocr.settings.noLanguageWarning",
              "Select at least one language to run OCR.",
            )}
          </Text>
          <Button
            size="compact-xs"
            variant="light"
            onClick={() => onChange(["eng"])}
          >
            {t("ocr.settings.useEnglish", "Use English")}
          </Button>
        </Group>
      )}
    </Box>
  );
};

export default LanguagePicker;
