import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import MobileUploadModal from "@app/components/shared/MobileUploadModal";
import * as mobileSessionModule from "@app/hooks/useMobileTransferSession";
import { ClientPdfEngine } from "@app/services/clientPdfEngine";

vi.mock("react-i18next", () => ({
  initReactI18next: { type: "3rdParty", init: () => {} },
  useTranslation: () => ({
    t: (
      key: string,
      fallback?: string | Record<string, unknown>,
      values?: Record<string, unknown>,
    ) => {
      const options = typeof fallback === "object" ? fallback : values;
      const text =
        typeof fallback === "string"
          ? fallback
          : String(options?.defaultValue ?? key);
      return text.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
        String(options?.[name] ?? ""),
      );
    },
  }),
}));

vi.mock("@app/contexts/AppConfigContext", () => ({
  useAppConfig: () => ({
    config: { mobileScannerConvertToPdf: true },
  }),
}));

describe("MobileUploadModal", () => {
  it("renders combine into one PDF switch and combines uploaded images into a single PDF", async () => {
    const mockBytes = new Uint8Array([1, 2, 3]);
    const mockImagesToPdf = vi
      .spyOn(ClientPdfEngine, "imagesToPdf")
      .mockResolvedValue(mockBytes);

    let sessionFileCallback: ((file: File) => void) | undefined;
    vi.spyOn(
      mobileSessionModule,
      "useMobileTransferSession",
    ).mockImplementation((options) => {
      sessionFileCallback = options.onFileReceived;
      return {
        mobileUrl: "https://example.com/mobile-scanner?session=123",
        sessionInfo: null,
        filesReceived: 2,
        error: null,
        timeRemaining: null,
        showExpiryWarning: false,
        regenerateSession: vi.fn(),
        isDeviceConnected: true,
        isTransferring: false,
      };
    });

    const onFilesReceived = vi.fn();
    const onClose = vi.fn();

    render(
      <MantineProvider>
        <MobileUploadModal
          opened={true}
          onClose={onClose}
          onFilesReceived={onFilesReceived}
        />
      </MantineProvider>,
    );

    expect(screen.getByText("Add images into one PDF file")).toBeDefined();

    const file1 = new File(["img1"], "photo1.png", { type: "image/png" });
    const file2 = new File(["img2"], "photo2.jpg", { type: "image/jpeg" });

    sessionFileCallback?.(file1);
    sessionFileCallback?.(file2);

    const doneBtn = screen.getByRole("button", {
      name: "Done (2 received)",
    });
    const user = userEvent.setup();
    await user.click(doneBtn);

    expect(mockImagesToPdf).toHaveBeenCalledWith([file1, file2]);
    expect(onFilesReceived).toHaveBeenCalledTimes(1);
    const resultFiles = onFilesReceived.mock.calls[0][0];
    expect(resultFiles.length).toBe(1);
    expect(resultFiles[0].name).toBe("scanned_document.pdf");
    expect(onClose).toHaveBeenCalled();

    mockImagesToPdf.mockRestore();
  });
});
