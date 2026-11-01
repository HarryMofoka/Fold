import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import MobileTransferModal from "@app/components/shared/MobileTransferModal";
import * as mobileSessionModule from "@app/hooks/useMobileTransferSession";

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (key: string, fallback?: string | Record<string, unknown>, values?: Record<string, unknown>) => {
      const options = typeof fallback === "object" ? fallback : values;
      const text = typeof fallback === "string" ? fallback : String(options?.defaultValue ?? key);
      return text.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options?.[name] ?? ""));
    },
  }),
}));

describe("MobileTransferModal", () => {
  const defaultProps = {
    opened: true,
    onClose: vi.fn(),
    routePath: "mobile-scanner",
    onFileReceived: vi.fn(),
    title: "Upload from Mobile",
    description: "Scan QR code to upload photos",
    instructions: "Open phone camera and scan this code",
    expiryWarningTitle: "Expiring Soon",
    formatExpiryWarning: (s: number) => `Expires in ${s}s`,
    errorTitle: "Connection Error",
    sessionCreateErrorMessage: "Session failed",
    pollingErrorMessage: "Polling failed",
  };

  it("renders QR and cancel button when no files are received", async () => {
    vi.spyOn(mobileSessionModule, "useMobileTransferSession").mockReturnValue({
      mobileUrl: "https://example.com/mobile-scanner?session=123",
      sessionInfo: null,
      filesReceived: 0,
      error: null,
      timeRemaining: null,
      showExpiryWarning: false,
      regenerateSession: vi.fn(),
      isDeviceConnected: false,
      isTransferring: false,
    });

    const onClose = vi.fn();
    render(
      <MantineProvider>
        <MobileTransferModal {...defaultProps} onClose={onClose} />
      </MantineProvider>,
    );

    expect(screen.getByRole("heading", { name: "Upload from Mobile" })).toBeDefined();
    expect(screen.getByText("Scan code with phone camera")).toBeDefined();
    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    expect(cancelBtn).toBeDefined();

    const user = userEvent.setup();
    await user.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open across multiple received files and enables Done button", async () => {
    vi.spyOn(mobileSessionModule, "useMobileTransferSession").mockReturnValue({
      mobileUrl: "https://example.com/mobile-scanner?session=123",
      sessionInfo: null,
      filesReceived: 3,
      error: null,
      timeRemaining: null,
      showExpiryWarning: false,
      regenerateSession: vi.fn(),
      isDeviceConnected: true,
      isTransferring: false,
    });

    const onClose = vi.fn();
    render(
      <MantineProvider>
        <MobileTransferModal
          {...defaultProps}
          onClose={onClose}
          renderReceived={(count) => <span>{count} files received</span>}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("Phone connected")).toBeDefined();
    expect(screen.getByText("3 files received")).toBeDefined();
    expect(
      screen.getByText("Keep this window open while scanning. You can send multiple files from your phone."),
    ).toBeDefined();

    const doneBtn = screen.getByRole("button", {
      name: "Done (3 received)",
    });
    expect(doneBtn).toBeDefined();
    expect(doneBtn.hasAttribute("disabled")).toBe(false);

    const user = userEvent.setup();
    await user.click(doneBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("indicates when a file is actively transferring and disables Done button", () => {
    vi.spyOn(mobileSessionModule, "useMobileTransferSession").mockReturnValue({
      mobileUrl: "https://example.com/mobile-scanner?session=123",
      sessionInfo: null,
      filesReceived: 2,
      error: null,
      timeRemaining: null,
      showExpiryWarning: false,
      regenerateSession: vi.fn(),
      isDeviceConnected: true,
      isTransferring: true,
    });

    render(
      <MantineProvider>
        <MobileTransferModal {...defaultProps} renderReceived={(count) => <span>{count} files received</span>} />
      </MantineProvider>,
    );

    expect(screen.getByText("Receiving file…")).toBeDefined();
    const doneBtn = screen.getByRole("button", {
      name: "Done (2 received)",
    });
    expect(doneBtn.hasAttribute("disabled")).toBe(true);
  });
});
