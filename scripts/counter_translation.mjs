#!/usr/bin/env node
/**
 * Translation progress counter and validator written in pure JavaScript (ESM).
 * Compares locale translation files with en-US and computes translation completeness.
 * Zero external dependencies: works immediately with standard Node.js.
 */

import fs from "node:fs";
import path from "node:path";

const LOCALES_DIR = path.resolve("frontend/editor/public/locales");
const REF_FILE = path.join(LOCALES_DIR, "en-US/translation.toml");

/**
 * Parses key count from a TOML file by matching key-value pairs and headers.
 */
function extractKeysFromToml(content) {
  const keys = new Set();
  let currentSection = "";

  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const sectionMatch = trimmed.match(/^\[(.*)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }

    const kvMatch = trimmed.match(/^([a-zA-Z0-9_\-\.]+)\s*=/);
    if (kvMatch) {
      const keyName = currentSection
        ? `${currentSection}.${kvMatch[1]}`
        : kvMatch[1];
      keys.add(keyName);
    }
  }

  return keys;
}

function countTranslations(targetLocale = null, showPercentageOnly = false) {
  if (!fs.existsSync(REF_FILE)) {
    console.error(`Reference file not found: ${REF_FILE}`);
    process.exit(1);
  }

  const refContent = fs.readFileSync(REF_FILE, "utf-8");
  const refKeys = extractKeysFromToml(refContent);
  const totalKeys = refKeys.size;

  if (!fs.existsSync(LOCALES_DIR)) {
    console.error(`Locales directory not found: ${LOCALES_DIR}`);
    process.exit(1);
  }

  const locales = fs.readdirSync(LOCALES_DIR).filter((dir) => {
    return (
      fs.statSync(path.join(LOCALES_DIR, dir)).isDirectory() && dir !== "en-US"
    );
  });

  const results = [];

  for (const locale of locales) {
    if (targetLocale && locale !== targetLocale) continue;
    const localeFile = path.join(LOCALES_DIR, locale, "translation.toml");
    if (!fs.existsSync(localeFile)) continue;

    try {
      const content = fs.readFileSync(localeFile, "utf-8");
      const keys = extractKeysFromToml(content);
      const translatedCount = keys.size;
      const percentage = Math.min(
        100,
        Math.round((translatedCount / totalKeys) * 100),
      );

      results.push({ locale, percentage, translatedCount, totalKeys });

      if (targetLocale && showPercentageOnly) {
        console.log(percentage);
        return;
      }
    } catch (err) {
      console.warn(`Error parsing ${locale}:`, err.message);
    }
  }

  if (targetLocale) {
    const res = results[0];
    if (res) {
      console.log(
        `Locale: ${res.locale} — ${res.percentage}% (${res.translatedCount}/${res.totalKeys} keys)`,
      );
    } else {
      console.error(`Locale ${targetLocale} not found.`);
    }
    return;
  }

  console.log(
    `Translation Completeness (Reference: en-US with ${totalKeys} keys):`,
  );
  console.log(
    "-----------------------------------------------------------------",
  );
  for (const res of results.sort((a, b) => b.percentage - a.percentage)) {
    console.log(
      `${res.locale.padEnd(10)}: ${String(res.percentage).padStart(3)}% (${res.translatedCount}/${res.totalKeys})`,
    );
  }
}

const args = process.argv.slice(2);
const langIdx = args.indexOf("--lang");
const targetLang = langIdx !== -1 ? args[langIdx + 1] : null;
const showPercentage = args.includes("--show-percentage");

countTranslations(targetLang, showPercentage);
