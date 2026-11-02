import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Stack, Switch, Select, Button } from "@mantine/core";
import {
  useAllFiles,
  useFileSelection,
  useFileManagement,
} from "@app/contexts/FileContext";
import { StirlingFile } from "@app/types/fileContext";
import { useViewScopedFiles } from "@app/hooks/tools/shared/useViewScopedFiles";
import { createToolFlow } from "@app/components/tools/shared/createToolFlow";
import { useConvertParameters } from "@app/hooks/tools/convert/useConvertParameters";
import { useConvertOperation } from "@app/hooks/tools/convert/useConvertOperation";
import { BaseToolProps, ToolComponent } from "@app/types/tool";
import { COLOR_TYPES, FIT_OPTIONS } from "@app/constants/convertConstants";
import { Icon } from "@app/ui/Icon";
import MobileUploadModal from "@app/components/shared/MobileUploadModal";
import { Z_INDEX_AUTOMATE_DROPDOWN } from "@app/styles/zIndex";

const ImageToPdf = ({ onPreviewFile, onComplete, onError }: BaseToolProps) => {
  const { t } = useTranslation();
  const { files: activeFiles } = useAllFiles();
  const { setSelectedFiles } = useFileSelection();
  const { addFiles } = useFileManagement();
  const selectedFiles = useViewScopedFiles();
  const [mobileModalOpen, setMobileModalOpen] = useState(false);

  const convertParams = useConvertParameters();
  const convertOperation = useConvertOperation(convertParams.parameters);

  useEffect(() => {
    convertParams.updateParameter("fromExtension", "image");
    convertParams.updateParameter("toExtension", "pdf");
    convertParams.updateParameter("imageOptions", {
      ...convertParams.parameters.imageOptions,
      combineImages: true,
    });
  }, []);

  const skipNextSelectionResetRef = useRef(false);
  const previousSelectionRef = useRef<string>("");

  const hasResults =
    convertOperation.files.length > 0 ||
    convertOperation.downloadUrl !== null ||
    Boolean(convertOperation.errorMessage);
  const settingsCollapsed = hasResults;

  useEffect(() => {
    if (hasResults) {
      skipNextSelectionResetRef.current = true;
    }
  }, [hasResults]);

  useEffect(() => {
    const currentSelection = selectedFiles
      .map((f) => f.fileId)
      .sort()
      .join(",");

    if (currentSelection === previousSelectionRef.current) return;

    if (skipNextSelectionResetRef.current) {
      skipNextSelectionResetRef.current = false;
      previousSelectionRef.current = currentSelection;
      return;
    }

    if (selectedFiles.length > 0) {
      previousSelectionRef.current = currentSelection;
      if (hasResults) {
        convertOperation.resetResults();
        onPreviewFile?.(null);
      }
    } else {
      previousSelectionRef.current = "";
    }
  }, [selectedFiles]);

  const handleConvert = async () => {
    try {
      await convertOperation.executeOperation(
        convertParams.parameters,
        selectedFiles,
      );
      if (convertOperation.files && onComplete) {
        onComplete(convertOperation.files);
      }
    } catch (error) {
      if (onError) {
        onError(
          error instanceof Error
            ? error.message
            : "Image to PDF conversion failed",
        );
      }
    }
  };

  const handleThumbnailClick = (file: File) => {
    onPreviewFile?.(file);
    sessionStorage.setItem("previousMode", "imageToPdf");
  };

  const handleSettingsReset = () => {
    skipNextSelectionResetRef.current = false;
    convertOperation.resetResults();
    onPreviewFile?.(null);
  };

  const handleUndo = async () => {
    await convertOperation.undoOperation();
    onPreviewFile?.(null);
  };

  const handleMobileFiles = useCallback(
    async (files: File[]) => {
      if (files.length > 0) {
        const added = await addFiles(files);
        setSelectedFiles(added.map((f: StirlingFile) => f.fileId));
      }
    },
    [addFiles, setSelectedFiles],
  );

  return (
    <>
      {createToolFlow({
        files: {
          selectedFiles,
          isCollapsed: hasResults,
        },
        steps: [
          {
            title: t("imageToPDF.header", "Image to PDF"),
            isCollapsed: settingsCollapsed,
            onCollapsedClick: settingsCollapsed
              ? handleSettingsReset
              : undefined,
            content: (
              <Stack gap="sm">
                <Switch
                  data-testid="combine-images-switch"
                  label={t("imageToPDF.combineImages", "Combine into one PDF")}
                  description={t(
                    "imageToPDF.combineImagesDesc",
                    "Merge all uploaded images into a single multi-page PDF document",
                  )}
                  checked={convertParams.parameters.imageOptions.combineImages}
                  onChange={(event) =>
                    convertParams.updateParameter("imageOptions", {
                      ...convertParams.parameters.imageOptions,
                      combineImages: event.currentTarget.checked,
                    })
                  }
                />

                <Select
                  data-testid="fit-option-select"
                  label={t("imageToPDF.fitOption", "Fit Option")}
                  value={convertParams.parameters.imageOptions.fitOption}
                  onChange={(val) =>
                    val &&
                    convertParams.updateParameter("imageOptions", {
                      ...convertParams.parameters.imageOptions,
                      fitOption:
                        val as (typeof FIT_OPTIONS)[keyof typeof FIT_OPTIONS],
                    })
                  }
                  data={[
                    {
                      value: FIT_OPTIONS.MAINTAIN_ASPECT,
                      label: t(
                        "imageToPDF.maintainAspect",
                        "Maintain Aspect Ratio",
                      ),
                    },
                    {
                      value: FIT_OPTIONS.FIT_PAGE,
                      label: t("imageToPDF.fitPage", "Fit Document to Page"),
                    },
                    {
                      value: FIT_OPTIONS.FILL_PAGE,
                      label: t("imageToPDF.fillPage", "Fill Page"),
                    },
                  ]}
                  comboboxProps={{
                    withinPortal: true,
                    zIndex: Z_INDEX_AUTOMATE_DROPDOWN,
                  }}
                />

                <Select
                  data-testid="color-type-select"
                  label={t("imageToPDF.colorType", "Color Type")}
                  value={convertParams.parameters.imageOptions.colorType}
                  onChange={(val) =>
                    val &&
                    convertParams.updateParameter("imageOptions", {
                      ...convertParams.parameters.imageOptions,
                      colorType:
                        val as (typeof COLOR_TYPES)[keyof typeof COLOR_TYPES],
                    })
                  }
                  data={[
                    {
                      value: COLOR_TYPES.COLOR,
                      label: t("imageToPDF.color", "Color"),
                    },
                    {
                      value: COLOR_TYPES.GRAYSCALE,
                      label: t("imageToPDF.grayscale", "Grayscale"),
                    },
                    {
                      value: COLOR_TYPES.BLACK_WHITE,
                      label: t("imageToPDF.blackwhite", "Black & White"),
                    },
                  ]}
                  comboboxProps={{
                    withinPortal: true,
                    zIndex: Z_INDEX_AUTOMATE_DROPDOWN,
                  }}
                />

                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  leftSection={<Icon name="scan" size="1.1rem" />}
                  onClick={() => setMobileModalOpen(true)}
                  mt="xs"
                >
                  {t("imageToPDF.scanFromMobile", "Scan from mobile")}
                </Button>
              </Stack>
            ),
          },
        ],
        executeButton: {
          text: t("imageToPDF.createPdf", "Create PDF"),
          loadingText: t("imageToPDF.creating", "Creating PDF…"),
          onClick: handleConvert,
          isVisible: !hasResults,
          endpointEnabled: true,
          paramsValid: selectedFiles.length > 0,
          testId: "convert-button",
        },
        review: {
          isVisible: hasResults,
          operation: convertOperation,
          title: t("imageToPDF.header", "Image to PDF"),
          onFileClick: handleThumbnailClick,
          onUndo: handleUndo,
          testId: "conversion-results",
        },
      })}

      <MobileUploadModal
        opened={mobileModalOpen}
        onClose={() => setMobileModalOpen(false)}
        onFilesReceived={handleMobileFiles}
      />
    </>
  );
};

ImageToPdf.tool = () => useConvertOperation;

export default ImageToPdf as ToolComponent;
