import { useCallback, useRef, useState } from "react";
import { Badge, Switch, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useAppConfig } from "@app/contexts/AppConfigContext";
import { Icon } from "@app/ui/Icon";
import MobileTransferModal from "@app/components/shared/MobileTransferModal";
import { ClientPdfEngine } from "@app/services/clientPdfEngine";
import { isImageFile } from "@app/utils/imageToPdfUtils";

interface MobileUploadModalProps {
  opened: boolean;
  onClose: () => void;
  onFilesReceived: (files: File[]) => void;
}

export default function MobileUploadModal({
  opened,
  onClose,
  onFilesReceived,
}: MobileUploadModalProps) {
  const { t } = useTranslation();
  const { config } = useAppConfig();
  const convertToPdf = config?.mobileScannerConvertToPdf !== false;
  const [combineIntoSinglePdf, setCombineIntoSinglePdf] = useState(true);
  const receivedFilesRef = useRef<File[]>([]);

  const handleFileReceived = useCallback((received: File) => {
    receivedFilesRef.current.push(received);
  }, []);

  const finalizeFiles = useCallback(async () => {
    const files = [...receivedFilesRef.current];
    receivedFilesRef.current = [];
    if (files.length === 0) return;

    const imageFiles = files.filter(isImageFile);
    const nonImageFiles = files.filter((f) => !isImageFile(f));

    if (imageFiles.length > 0 && convertToPdf) {
      try {
        if (combineIntoSinglePdf) {
          const pdfBytes = await ClientPdfEngine.imagesToPdf(imageFiles);
          const combinedPdf = new File(
            [pdfBytes as unknown as BlobPart],
            t("mobileUpload.combinedDocumentName", "scanned_document.pdf"),
            { type: "application/pdf" },
          );
          onFilesReceived([combinedPdf, ...nonImageFiles]);
        } else {
          const convertedPdfs: File[] = [];
          for (const img of imageFiles) {
            const bytes = await ClientPdfEngine.imagesToPdf([img]);
            const pdfFilename = img.name.replace(/\.[^.]+$/, ".pdf");
            convertedPdfs.push(
              new File([bytes as unknown as BlobPart], pdfFilename, {
                type: "application/pdf",
              }),
            );
          }
          onFilesReceived([...convertedPdfs, ...nonImageFiles]);
        }
      } catch (err) {
        console.warn(
          "[MobileUploadModal] Error converting images to PDF:",
          err,
        );
        onFilesReceived(files);
      }
    } else {
      onFilesReceived(files);
    }
  }, [combineIntoSinglePdf, convertToPdf, onFilesReceived, t]);

  const handleDone = useCallback(async () => {
    await finalizeFiles();
    onClose();
  }, [finalizeFiles, onClose]);

  const handleClose = useCallback(async () => {
    if (receivedFilesRef.current.length > 0) {
      await finalizeFiles();
    }
    onClose();
  }, [finalizeFiles, onClose]);

  const optionsNode = convertToPdf ? (
    <Stack gap="xs" style={{ width: "100%" }}>
      <Switch
        label={t("mobileUpload.combineImages", "Add images into one PDF file")}
        description={t(
          "mobileUpload.combineImagesDesc",
          "Combines all photos into a single multi-page PDF at original quality",
        )}
        checked={combineIntoSinglePdf}
        onChange={(e) => setCombineIntoSinglePdf(e.currentTarget.checked)}
      />
    </Stack>
  ) : null;

  return (
    <MobileTransferModal
      opened={opened}
      onClose={handleClose}
      onDone={handleDone}
      optionsNode={optionsNode}
      routePath="mobile-scanner"
      onFileReceived={handleFileReceived}
      qrSize={256}
      title={t("mobileUpload.title", "Upload from Mobile")}
      description={
        convertToPdf
          ? t(
              "mobileUpload.description",
              "Scan this QR code with your mobile device to upload photos. Images will be automatically converted to PDF.",
            )
          : t(
              "mobileUpload.descriptionNoConvert",
              "Scan this QR code with your mobile device to upload photos.",
            )
      }
      instructions={
        convertToPdf
          ? t(
              "mobileUpload.instructions",
              "Open the camera app on your phone and scan this code. Images will be automatically converted to PDF.",
            )
          : t(
              "mobileUpload.instructionsNoConvert",
              "Open the camera app on your phone and scan this code. Files will be uploaded through the server.",
            )
      }
      expiryWarningTitle={t(
        "mobileUpload.expiryWarning",
        "Session Expiring Soon",
      )}
      formatExpiryWarning={(seconds) =>
        t(
          "mobileUpload.expiryWarningMessage",
          "This QR code will expire in {{seconds}} seconds. A new code will be generated automatically.",
          { seconds },
        )
      }
      errorTitle={t("mobileUpload.error", "Connection Error")}
      sessionCreateErrorMessage={t(
        "mobileUpload.sessionCreateError",
        "Failed to create session",
      )}
      pollingErrorMessage={t(
        "mobileUpload.pollingError",
        "Error checking for files",
      )}
      renderReceived={(count) => (
        <Badge
          variant="filled"
          color="green"
          size="lg"
          leftSection={<Icon name="check" size={"1rem"} />}
        >
          {t("mobileUpload.filesReceived", "{{count}} file(s) received", {
            count,
          })}
        </Badge>
      )}
    />
  );
}
