import { ReactNode, useRef } from "react";
import { Modal, Stack, Text, Box, Alert, Badge, Loader } from "@mantine/core";
import { Button } from "@app/ui/Button";
import { useIsMobile } from "@app/hooks/useIsMobile";
import { QRCodeSVG } from "qrcode.react";
import { Icon } from "@app/ui/Icon";
import { Z_INDEX_OVER_FILE_MANAGER_MODAL } from "@app/styles/zIndex";
import { useMobileTransferSession } from "@app/hooks/useMobileTransferSession";
import { useTranslation } from "react-i18next";

/**
 * The QR modal shell every phone-to-desktop transfer feature shares: session
 * lifecycle, QR code, expiry/error alerts, and the fallback URL line. A
 * feature supplies its copy, its public route, and what a received file
 * means — the scanner converts to PDF, the sign tool routes it to a
 * signature source.
 */
interface MobileTransferModalProps {
  opened: boolean;
  onClose: () => void;
  /** SPA route the phone opens, without slashes: "mobile-scanner", "mobile-sign". */
  routePath: string;
  /** Called once per uploaded file; arrivals are untrusted, validate inside. */
  onFileReceived: (file: File) => void | Promise<void>;
  title: string;
  description: string;
  instructions: string;
  expiryWarningTitle: string;
  /** Interpolates the seconds remaining into the feature's warning copy. */
  formatExpiryWarning: (seconds: number) => string;
  errorTitle: string;
  sessionCreateErrorMessage: string;
  pollingErrorMessage: string;
  /** Rendered under the QR once files have arrived (e.g. a received-count badge). */
  renderReceived?: (count: number) => ReactNode;
  /** Accessible name for the QR image. Defaults to the modal's own title, which
   *  already names the feature the code belongs to. */
  qrTitle?: string;
  qrSize?: number;
}

export default function MobileTransferModal({
  opened,
  onClose,
  routePath,
  onFileReceived,
  title,
  description,
  instructions,
  expiryWarningTitle,
  formatExpiryWarning,
  errorTitle,
  sessionCreateErrorMessage,
  pollingErrorMessage,
  renderReceived,
  qrTitle = title,
  qrSize = 240,
}: MobileTransferModalProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const directInputRef = useRef<HTMLInputElement>(null);

  const handleDirectSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      void onFileReceived(files[i]);
    }
  };

  const effectiveQrSize = isMobile ? Math.min(qrSize, 180) : qrSize;

  const { mobileUrl, filesReceived, error, timeRemaining, showExpiryWarning, isDeviceConnected, isTransferring } =
    useMobileTransferSession({
      active: opened,
      routePath,
      onFileReceived,
      sessionCreateErrorMessage,
      pollingErrorMessage,
    });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      size="md"
      radius="lg"
      zIndex={Z_INDEX_OVER_FILE_MANAGER_MODAL}
      overlayProps={{ opacity: 0.35, blur: 2 }}
      closeOnClickOutside={!isTransferring}
      closeOnEscape={!isTransferring}
      styles={{ body: { paddingTop: "1.5rem" } }}
    >
      <Stack gap="md">
        <Alert icon={<Icon name="info" size={"1rem"} />} color="blue" variant="light">
          <Text size="sm">{description}</Text>
        </Alert>

        {showExpiryWarning && timeRemaining !== null && (
          <Alert icon={<Icon name="triangle-alert" size={"1rem"} />} title={expiryWarningTitle} color="orange">
            <Text size="sm">{formatExpiryWarning(Math.ceil(timeRemaining / 1000))}</Text>
          </Alert>
        )}

        {error && (
          <Alert icon={<Icon name="circle-alert" size={"1rem"} />} title={errorTitle} color="red">
            <Text size="sm">{error}</Text>
          </Alert>
        )}

        {isMobile && (
          <Box
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <input
              type="file"
              ref={directInputRef}
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              multiple
              onChange={handleDirectSelect}
            />
            <Button
              variant="primary"
              size="md"
              fullWidth
              leftSection={<Icon name="upload" size="1.1rem" />}
              onClick={() => directInputRef.current?.click()}
            >
              {t("mobileTransfer.directUpload", "Upload from this device")}
            </Button>
            <Text size="xs" c="dimmed" ta="center">
              {t("mobileTransfer.orScanAnother", "Or scan below with another device")}
            </Text>
          </Box>
        )}

        <Box
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <Box
            style={{
              padding: isMobile ? "1rem" : "1.5rem",
              background: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <QRCodeSVG value={mobileUrl} size={effectiveQrSize} level="H" includeMargin title={qrTitle} />
          </Box>

          {isTransferring ? (
            <Badge variant="filled" color="blue" size="md" leftSection={<Loader size="xs" color="white" />}>
              {t("mobileTransfer.transferring", "Receiving file…")}
            </Badge>
          ) : isDeviceConnected ? (
            <Badge variant="filled" color="green" size="md" leftSection={<Icon name="check" size="0.9rem" />}>
              {t("mobileTransfer.deviceConnected", "Phone connected")}
            </Badge>
          ) : (
            <Badge variant="light" color="gray" size="sm" leftSection={<Icon name="scan" size="0.85rem" />}>
              {t("mobileTransfer.waitingForScan", "Scan code with phone camera")}
            </Badge>
          )}

          {filesReceived > 0 && renderReceived?.(filesReceived)}

          <Text size="xs" c="dimmed" ta="center" style={{ maxWidth: "300px" }}>
            {filesReceived > 0
              ? t(
                  "mobileTransfer.keepScanningOrDone",
                  "Keep this window open while scanning. You can send multiple files from your phone.",
                )
              : instructions}
          </Text>

          <Text
            size="xs"
            c="dimmed"
            style={{
              wordBreak: "break-all",
              textAlign: "center",
              fontFamily: "monospace",
            }}
          >
            {mobileUrl}
          </Text>

          {filesReceived > 0 ? (
            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={isTransferring}
              onClick={onClose}
              leftSection={<Icon name="check" size="1.1rem" />}
            >
              {t("mobileTransfer.doneWithCount", "Done ({{count}} received)", {
                count: filesReceived,
              })}
            </Button>
          ) : (
            <Button variant="secondary" accent="neutral" size="sm" fullWidth onClick={onClose}>
              {t("cancel", "Cancel")}
            </Button>
          )}
        </Box>
      </Stack>
    </Modal>
  );
}
