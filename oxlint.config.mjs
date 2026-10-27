import { defineConfig } from "oxlint";

// Glob for all editor app source, and the two layers that need their own
// import scope. `no-restricted-imports` is repeated per scope on purpose:
// oxlint REPLACES (does not merge) a rule across matching overrides, so each
// scope must restate the full set of bans that apply to it.
const APP_SOURCE = "src/**/*.{js,mjs,jsx,ts,tsx}";
const DESKTOP_SOURCE = "src/desktop/**/*.{js,mjs,jsx,ts,tsx}";

// Shared import-ban building blocks -----------------------------------------

const aliasOverRelative = {
  regex: "^\\.",
  message:
    "Use a workspace alias (@app/* for editor, @portal/* for portal) instead of relative imports.",
};
const aliasOverSrc = {
  regex: "^src/",
  message: "Use a workspace alias instead of absolute src/ imports.",
};
const noTauriOutsideDesktop = {
  regex: "^@tauri-apps/",
  message:
    "Tauri APIs are desktop-only. Review DeveloperGuide.md for structure advice.",
};

// Shared-DS Button/SegmentedControl/Chip family must come from @app/ui, not
// Mantine.
const mantineDsPaths = [
  {
    name: "@mantine/core",
    importNames: [
      "Button",
      "ActionIcon",
      "UnstyledButton",
      "CloseButton",
      "FileButton",
    ],
    message:
      'Use the shared Button (@app/ui/Button) instead of the Mantine button family. variant=primary|secondary|tertiary, accent=default|neutral|brand|ai|premium|danger|success|warning; an icon-only button is `<Button leftSection={…} aria-label="…" />`. If no variant fits, extend the shared Button rather than importing Mantine.',
  },
  {
    name: "@mantine/core",
    importNames: ["SegmentedControl"],
    message:
      "Use the shared SegmentedControl (@app/ui/SegmentedControl) instead of Mantine's.",
  },
  {
    name: "@mantine/core",
    importNames: ["Chip", "Pill"],
    message:
      "Use the shared Chip (@app/ui/Chip) instead of Mantine's Chip/Pill.",
  },
];

// Modern JS globals not yet in oxlint's builtin env.
const modernGlobals = {
  AsyncDisposableStack: "readonly",
  DisposableStack: "readonly",
  SuppressedError: "readonly",
};

export default defineConfig({
  plugins: ["typescript", "import", "react"],
  options: {
    typeAware: true,
  },
  categories: {
    correctness: "off",
  },
  env: {
    builtin: true,
  },
  ignorePatterns: [
    "dist",
    "dist-portal",
    "node_modules",
    "playwright-report",
    "storybook-static",
    "test-results",
    "editor/dist",
    "editor/public",
    "editor/src-tauri",
    "editor/playwright-report",
    "editor/test-results",
  ],
  rules: {
    "constructor-super": "error",
    "for-direction": "error",
    "getter-return": "error",
    "no-async-promise-executor": "error",
    "no-case-declarations": "error",
    "no-class-assign": "error",
    "no-compare-neg-zero": "error",
    "no-cond-assign": "error",
    "no-const-assign": "error",
    "no-constant-binary-expression": "error",
    "no-constant-condition": "error",
    "no-control-regex": "error",
    "no-debugger": "error",
    "no-delete-var": "error",
    "no-dupe-class-members": "error",
    "no-dupe-else-if": "error",
    "no-dupe-keys": "error",
    "no-duplicate-case": "error",
    "no-empty": "error",
    "no-empty-character-class": "error",
    "no-empty-pattern": "error",
    "no-empty-static-block": "error",
    "no-ex-assign": "error",
    "no-extra-boolean-cast": "error",
    "no-fallthrough": "error",
    "no-func-assign": "error",
    "no-global-assign": "error",
    "no-import-assign": "error",
    "no-invalid-regexp": "error",
    "no-irregular-whitespace": "error",
    "no-loss-of-precision": "error",
    "no-misleading-character-class": "error",
    "no-new-native-nonconstructor": "error",
    "no-nonoctal-decimal-escape": "error",
    "no-obj-calls": "error",
    "no-prototype-builtins": "error",
    "no-redeclare": "error",
    "no-regex-spaces": "error",
    "no-self-assign": "error",
    "no-setter-return": "error",
    "no-shadow-restricted-names": "error",
    "no-sparse-arrays": "error",
    "no-this-before-super": "error",
    "no-unassigned-vars": "error",
    "no-unexpected-multiline": "error",
    "no-unreachable": "error",
    "no-unsafe-finally": "error",
    "no-unsafe-negation": "error",
    "no-unsafe-optional-chaining": "error",
    "no-unused-labels": "error",
    "no-unused-private-class-members": "error",
    "no-unused-vars": [
      "error",
      {
        args: "all",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "no-useless-backreference": "error",
    "no-useless-catch": "error",
    "no-useless-escape": "error",
    "no-with": "error",
    "preserve-caught-error": "error",
    "require-yield": "error",
    "use-isnan": "error",
    "valid-typeof": "error",
    "no-array-constructor": "error",
    "no-unused-expressions": "error",
    "no-restricted-imports": [
      "error",
      {
        patterns: [aliasOverRelative, aliasOverSrc],
      },
    ],
    "typescript/ban-ts-comment": "error",
    "typescript/no-duplicate-enum-values": "error",
    "typescript/no-empty-object-type": [
      "error",
      {
        allowInterfaces: "with-single-extends",
      },
    ],
    "typescript/no-explicit-any": "error",
    "typescript/no-extra-non-null-assertion": "error",
    "typescript/no-misused-new": "error",
    "typescript/no-namespace": "error",
    "typescript/no-non-null-asserted-optional-chain": "error",
    "typescript/no-require-imports": "error",
    "typescript/no-this-alias": "error",
    "typescript/no-unnecessary-type-assertion": "error",
    "typescript/no-unnecessary-type-constraint": "error",
    "typescript/no-unsafe-declaration-merging": "error",
    "typescript/no-unsafe-function-type": "error",
    "typescript/no-wrapper-object-types": "error",
    "typescript/prefer-as-const": "error",
    "typescript/prefer-namespace-keyword": "error",
    "typescript/triple-slash-reference": "error",
    "react/jsx-max-depth": ["error", { max: 8 }],
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
      rules: {
        "constructor-super": "off",
        "getter-return": "off",
        "no-class-assign": "off",
        "no-const-assign": "off",
        "no-dupe-class-members": "off",
        "no-dupe-keys": "off",
        "no-func-assign": "off",
        "no-import-assign": "off",
        "no-new-native-nonconstructor": "off",
        "no-obj-calls": "off",
        "no-redeclare": "off",
        "no-setter-return": "off",
        "no-this-before-super": "off",
        "no-unreachable": "off",
        "no-unsafe-negation": "off",
        "no-var": "error",
        "no-with": "off",
        "prefer-const": "error",
        "prefer-rest-params": "error",
        "prefer-spread": "error",
      },
    },
    {
      files: [APP_SOURCE],
      env: {
        browser: true,
      },
      globals: modernGlobals,
    },
    {
      files: [
        "scripts/**/*.{js,ts,mjs,mts}",
        "editor/scripts/**/*.{js,ts,mjs,mts}",
        "editor/*.config.{js,ts,mjs}",
        "*.config.{js,ts,mjs}",
        ".storybook/*.{js,ts,mjs,mts,tsx}",
      ],
      globals: modernGlobals,
      env: {
        node: true,
      },
    },
    {
      files: [APP_SOURCE],
      excludeFiles: [DESKTOP_SOURCE],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [aliasOverRelative, aliasOverSrc, noTauriOutsideDesktop],
            paths: mantineDsPaths,
          },
        ],
      },
    },
    {
      files: [DESKTOP_SOURCE],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [aliasOverRelative, aliasOverSrc],
            paths: mantineDsPaths,
          },
        ],
      },
    },
    {
      files: [
        "src/ui/**/*.{js,mjs,jsx,ts,tsx}",
        "**/*.stories.{js,mjs,jsx,ts,tsx}",
        "**/*.test.{js,mjs,jsx,ts,tsx}",
        "src/components/shared/FileSelectorPicker.tsx",
        "src/components/filesPage/FileManagerView.tsx",
        "src/pages/HomePage.tsx",
      ],
      excludeFiles: [DESKTOP_SOURCE],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [aliasOverRelative, aliasOverSrc, noTauriOutsideDesktop],
          },
        ],
      },
    },
    {
      files: [
        "editor/src/desktop/**/*.test.{js,mjs,jsx,ts,tsx}",
        "editor/src/desktop/**/*.stories.{js,mjs,jsx,ts,tsx}",
      ],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [aliasOverRelative, aliasOverSrc],
          },
        ],
      },
    },
    {
      files: [
        "editor/src/core/components/AppProviders.tsx",
        "editor/src/portal/PortalProviders.tsx",
        ".storybook/preview.tsx",
      ],
      rules: {
        "react/jsx-max-depth": "off",
      },
    },
    {
      files: ["editor/src/**/*.{ts,tsx}"],
      rules: {
        "import/no-cycle": "error",
      },
    },
  ],
});
