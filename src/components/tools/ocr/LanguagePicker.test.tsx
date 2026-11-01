import "@testing-library/jest-dom";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import {
  render as rtlRender,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import LanguagePicker from "@app/components/tools/ocr/LanguagePicker";
import {
  validateOCRParameters,
  defaultParameters,
} from "@app/hooks/tools/ocr/useOCRParameters";

vi.mock("@app/ui/Icon", () => ({
  Icon: ({ name }: { name: string }) => (
    <span data-testid={`icon-${name}`}>{name}</span>
  ),
}));

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, fallback?: string) =>
        typeof fallback === "string" ? fallback : key,
      i18n: { language: "en" },
    }),
  };
});

const render = (ui: React.ReactNode) =>
  rtlRender(<MantineProvider>{ui}</MantineProvider>);

describe("LanguagePicker and OCR parameters", () => {
  it("defaultParameters has english selected so OCR is valid out of the box", () => {
    expect(defaultParameters.languages).toContain("eng");
    expect(validateOCRParameters(defaultParameters)).toBe(true);
  });

  it("validates that at least one language must be chosen", () => {
    expect(validateOCRParameters({ ...defaultParameters, languages: [] })).toBe(
      false,
    );
    expect(
      validateOCRParameters({ ...defaultParameters, languages: ["spa"] }),
    ).toBe(true);
  });

  it("renders selected language badge with remove icon", () => {
    const onChange = vi.fn();
    render(
      <LanguagePicker
        value={["eng"]}
        onChange={onChange}
        autoFillFromBrowserLanguage={false}
      />,
    );

    expect(screen.getAllByText("English").length).toBeGreaterThanOrEqual(1);
    const removeBtn = screen.getByLabelText("Remove English");
    expect(removeBtn).toBeInTheDocument();
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("provides a quick 'Use English' action when no language is selected", () => {
    const onChange = vi.fn();
    render(
      <LanguagePicker
        value={[]}
        onChange={onChange}
        autoFillFromBrowserLanguage={false}
      />,
    );

    expect(
      screen.getByText("Select at least one language to run OCR."),
    ).toBeInTheDocument();
    const useEnglishBtn = screen.getByRole("button", { name: "Use English" });
    expect(useEnglishBtn).toBeInTheDocument();
    fireEvent.click(useEnglishBtn);
    expect(onChange).toHaveBeenCalledWith(["eng"]);
  });
});
