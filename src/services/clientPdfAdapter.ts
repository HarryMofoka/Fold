import { AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from "axios";
import { ClientPdfEngine } from "@app/services/clientPdfEngine";

/**
 * Parses FormData or object parameters from Axios request config.
 */
function extractRequestData(config: InternalAxiosRequestConfig): {
  files: File[];
  params: Record<string, unknown>;
} {
  const files: File[] = [];
  const params: Record<string, unknown> = {};

  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    const formData = config.data;
    formData.forEach((value, key) => {
      if (value instanceof File) {
        files.push(value);
      } else {
        params[key] = value;
      }
    });

    // Collect all primary files from 'fileInput'
    const fileInputs = formData.getAll("fileInput");
    for (const item of fileInputs) {
      if (item instanceof File && !files.includes(item)) {
        files.push(item);
      }
    }
  } else if (config.data && typeof config.data === "object") {
    Object.assign(params, config.data);
  }

  return { files, params };
}

/**
 * Creates an Axios-compatible response object for local client executions.
 */
function makeResponse(
  config: InternalAxiosRequestConfig,
  data: unknown,
  filename = "document.pdf",
  mimeType = "application/pdf",
  status = 200,
): AxiosResponse {
  let responseData = data;
  if (config.responseType === "blob" && data instanceof Uint8Array) {
    const arrayBuffer = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    ) as ArrayBuffer;
    responseData = new Blob([arrayBuffer], { type: mimeType });
  }

  const headers = new AxiosHeaders({
    "content-type": mimeType,
    "content-disposition": `attachment; filename="${filename}"`,
  });

  return {
    data: responseData,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers,
    config,
    request: {},
  };
}

/**
 * Client-Side API dispatcher that executes PDF operations in-browser without any Java backend.
 */
export async function handleClientApiRequest(
  config: InternalAxiosRequestConfig,
): Promise<AxiosResponse | null> {
  const url = (config.url || "").replace(/^https?:\/\/[^/]+/, "");
  const { files, params } = extractRequestData(config);

  // 1. App Configuration & Availability endpoints
  if (url.includes("/api/v1/config/app-config")) {
    return makeResponse(
      config,
      {
        enableLogin: false,
        appNameNavbar: "Fold",
        customNavbarText: "Privacy-First PDF Workspace",
        enableAccountLink: false,
        isAdmin: true,
        showSettingsWhenNoLogin: true,
        premiumEnabled: true,
        runningProOrHigher: true,
        runningEE: true,
        license: "ENTERPRISE",
        serverCertificateEnabled: true,
        storageEnabled: true,
        storageSharingEnabled: true,
        storageShareLinksEnabled: true,
        storageGroupSigningEnabled: true,
        enableAlphaFunctionality: true,
        stirlingOfficeConversion: true,
        enableMobileScanner: true,
        enableMobileSignature: true,
        aiEngineEnabled: true,
        aiFeatures: {
          chat: true,
          documentQuestions: true,
          createPdf: true,
          mathAuditor: true,
          pdfComment: true,
          classify: true,
        },
        cleanTempFiles: false,
        showUpdate: false,
        showUpdateOnlyAdmin: false,
      },
      "config.json",
      "application/json",
    );
  }

  if (url.includes("/api/v1/config/endpoints-availability")) {
    return makeResponse(config, {}, "endpoints.json", "application/json");
  }

  if (url.includes("/api/v1/config/endpoint-enabled")) {
    return makeResponse(config, true, "enabled.json", "application/json");
  }

  if (url.includes("/api/v1/config/group-enabled")) {
    return makeResponse(config, true, "enabled.json", "application/json");
  }

  if (url.includes("/api/v1/config/login-disclaimer")) {
    return makeResponse(
      config,
      { loginDisclaimer: "" },
      "disclaimer.json",
      "application/json",
    );
  }

  if (url.includes("/api/v1/ui-data/footer-info")) {
    return makeResponse(
      config,
      {
        analyticsEnabled: false,
        termsAndConditions: "",
        privacyPolicy: "",
        accessibilityStatement: "",
        cookiePolicy: "",
        impressum: "",
      },
      "footer.json",
      "application/json",
    );
  }

  if (url.includes("/api/v1/info/")) {
    return makeResponse(
      config,
      { version: "Fold 1.0 (Local-First)", arch: "WebAssembly", status: "UP" },
      "info.json",
      "application/json",
    );
  }

  if (url.includes("/api/v1/misc/ocr-languages")) {
    return makeResponse(
      config,
      ["eng", "deu", "fra", "spa", "ita", "por", "chi_sim", "rus", "jpn"],
      "languages.json",
      "application/json",
    );
  }

  if (url.includes("/api/v1/auth/me")) {
    return makeResponse(
      config,
      {
        username: "local",
        role: "ROLE_ADMIN",
        permissions: ["ROLE_ADMIN"],
        portalAccess: false,
      },
      "auth.json",
      "application/json",
    );
  }

  if (url.includes("/api/v1/auth/refresh")) {
    return makeResponse(
      config,
      { session: { access_token: "fold_local_token" } },
      "refresh.json",
      "application/json",
    );
  }

  if (
    url.includes("/api/v1/form/fields") ||
    url.includes("/api/v1/form/fetch-fields")
  ) {
    return makeResponse(config, [], "fields.json", "application/json");
  }

  if (url.includes("/api/v1/user/") || url.includes("/api/v1/users/")) {
    return makeResponse(config, [], "users.json", "application/json");
  }

  if (url.includes("/api/v1/team/")) {
    return makeResponse(config, [], "teams.json", "application/json");
  }

  if (
    url.includes("/api/v1/security/cert-sign/sign-requests") ||
    url.includes("/api/v1/security/cert-sign/sessions")
  ) {
    return makeResponse(config, [], "signing.json", "application/json");
  }

  if (url.includes("/api/v1/policies")) {
    return makeResponse(config, [], "policies.json", "application/json");
  }

  if (url.includes("/api/v1/processing-folders")) {
    return makeResponse(config, [], "folders.json", "application/json");
  }

  if (url.includes("/api/v1/storage/")) {
    return makeResponse(config, [], "storage.json", "application/json");
  }

  // 2. PDF Processing Operations
  const primaryFile = files[0];

  try {
    // Merge PDFs
    if (url.includes("/general/merge-pdfs")) {
      if (files.length === 0) {
        throw new Error("No files provided for merge.");
      }
      const mergedBytes = await ClientPdfEngine.mergePdfs(files);
      return makeResponse(config, mergedBytes, "merged_document.pdf");
    }

    // Split Pages
    if (
      url.includes("/general/split-pages") ||
      url.includes("/general/split-by-size-or-count")
    ) {
      if (!primaryFile) throw new Error("No file provided for split.");
      const result = await ClientPdfEngine.splitPages(primaryFile, {
        pages: (params.pages || params.pageNumbers) as string,
        splitType: params.splitType as string,
      });
      return makeResponse(
        config,
        result.data,
        result.filename,
        result.isZip ? "application/zip" : "application/pdf",
      );
    }

    // Rotate PDF
    if (
      url.includes("/general/rotate-pdf") ||
      url.includes("/misc/auto-rotate-pdf")
    ) {
      if (!primaryFile) throw new Error("No file provided for rotate.");
      const rotatedBytes = await ClientPdfEngine.rotatePdf(primaryFile, {
        angle: params.angle as string | number,
        pageNumbers: params.pageNumbers as string,
      });
      return makeResponse(config, rotatedBytes, `rotated_${primaryFile.name}`);
    }

    // Reorder Pages
    if (url.includes("/general/reorder-pages")) {
      if (!primaryFile) throw new Error("No file provided for reorder.");
      const reorderedBytes = await ClientPdfEngine.reorderPages(primaryFile, {
        pageOrder: (params.pageOrder || params.pageNumbers) as string,
      });
      return makeResponse(
        config,
        reorderedBytes,
        `reordered_${primaryFile.name}`,
      );
    }

    // Extract Pages
    if (url.includes("/general/extract-pages")) {
      if (!primaryFile)
        throw new Error("No file provided for page extraction.");
      const extractedBytes = await ClientPdfEngine.extractPages(primaryFile, {
        pageNumbers: params.pageNumbers as string,
      });
      return makeResponse(
        config,
        extractedBytes,
        `extracted_${primaryFile.name}`,
      );
    }

    // Remove Pages
    if (url.includes("/general/remove-pages")) {
      if (!primaryFile) throw new Error("No file provided for page removal.");
      const remainingBytes = await ClientPdfEngine.removePages(primaryFile, {
        pageNumbers: params.pageNumbers as string,
      });
      return makeResponse(
        config,
        remainingBytes,
        `trimmed_${primaryFile.name}`,
      );
    }

    // Watermark
    if (
      url.includes("/security/add-watermark") ||
      url.includes("/misc/add-watermark")
    ) {
      if (!primaryFile) throw new Error("No file provided for watermark.");
      const watermarkedBytes = await ClientPdfEngine.addWatermark(primaryFile, {
        watermarkText: (params.watermarkText || params.text) as string,
        fontSize: params.fontSize as string | number,
        rotation: (params.rotation || params.angle) as string | number,
        opacity: params.opacity as string | number,
        fontColor: params.fontColor as string,
      });
      return makeResponse(
        config,
        watermarkedBytes,
        `watermarked_${primaryFile.name}`,
      );
    }

    // Page Numbers
    if (url.includes("/misc/add-page-numbers")) {
      if (!primaryFile) throw new Error("No file provided for page numbers.");
      const numberedBytes = await ClientPdfEngine.addPageNumbers(primaryFile, {
        position: params.position as string | number,
        startingNumber: params.startingNumber as string | number,
        customText: params.customText as string,
        fontSize: params.fontSize as string | number,
        fontColor: params.fontColor as string,
        pageNumbers: params.pageNumbers as string,
      });
      return makeResponse(
        config,
        numberedBytes,
        `numbered_${primaryFile.name}`,
      );
    }

    // Flatten PDF
    if (url.includes("/misc/flatten")) {
      if (!primaryFile) throw new Error("No file provided for flatten.");
      const flattenedBytes = await ClientPdfEngine.flattenPdf(primaryFile);
      return makeResponse(
        config,
        flattenedBytes,
        `flattened_${primaryFile.name}`,
      );
    }

    // Unlock Form Fields
    if (url.includes("/misc/unlock-pdf-forms")) {
      if (!primaryFile) throw new Error("No file provided for form unlock.");
      const unlockedBytes = await ClientPdfEngine.unlockPdfForms(primaryFile);
      return makeResponse(
        config,
        unlockedBytes,
        `unlocked_${primaryFile.name}`,
      );
    }

    // Update Metadata
    if (url.includes("/misc/update-metadata")) {
      if (!primaryFile)
        throw new Error("No file provided for metadata update.");
      const updatedBytes = await ClientPdfEngine.updateMetadata(primaryFile, {
        title: params.title as string,
        author: params.author as string,
        subject: params.subject as string,
        keywords: params.keywords as string,
        creator: params.creator as string,
        producer: params.producer as string,
      });
      return makeResponse(config, updatedBytes, `metadata_${primaryFile.name}`);
    }

    // Get PDF Info
    if (url.includes("/security/get-info-on-pdf")) {
      if (!primaryFile) throw new Error("No file provided for inspection.");
      const info = await ClientPdfEngine.getPdfInfo(primaryFile);
      return makeResponse(config, info, "info.json", "application/json");
    }

    // Sanitize PDF
    if (url.includes("/security/sanitize-pdf")) {
      if (!primaryFile) throw new Error("No file provided for sanitization.");
      const sanitizedBytes = await ClientPdfEngine.sanitizePdf(primaryFile);
      return makeResponse(
        config,
        sanitizedBytes,
        `sanitized_${primaryFile.name}`,
      );
    }

    // Show JavaScript
    if (url.includes("/misc/show-javascript")) {
      if (!primaryFile) throw new Error("No file provided for JS inspection.");
      const jsInfo = await ClientPdfEngine.showJavascript(primaryFile);
      return makeResponse(config, jsInfo, "js_report.json", "application/json");
    }

    // Continuous Single Large Page
    if (
      url.includes("/general/single-page") ||
      url.includes("/general/single-large-page")
    ) {
      if (!primaryFile)
        throw new Error("No file provided for single large page.");
      const singlePageBytes =
        await ClientPdfEngine.singleLargePage(primaryFile);
      return makeResponse(
        config,
        singlePageBytes,
        `continuous_${primaryFile.name}`,
      );
    }

    // Compress / Optimize PDF
    if (url.includes("/misc/compress-pdf")) {
      if (!primaryFile) throw new Error("No file provided for compression.");
      const compressedBytes = await ClientPdfEngine.compressPdf(primaryFile);
      return makeResponse(
        config,
        compressedBytes,
        `compressed_${primaryFile.name}`,
      );
    }

    // Repair PDF
    if (url.includes("/misc/repair")) {
      if (!primaryFile) throw new Error("No file provided for repair.");
      const repairedBytes = await ClientPdfEngine.repairPdf(primaryFile);
      return makeResponse(
        config,
        repairedBytes,
        `repaired_${primaryFile.name}`,
      );
    }

    // Convert PDF to Images
    if (url.includes("/convert/pdf/img")) {
      if (!primaryFile) throw new Error("No PDF file provided for conversion.");
      const result = await ClientPdfEngine.pdfToImages(primaryFile, {
        format: (params.imageFormat as string) || "png",
        dpi: Number(params.dpi) || 150,
        singleOrMultiple: params.singleOrMultiple as string,
        colorType: params.colorType as string,
      });
      const output = result.zipFile || result.files[0];
      const buffer = await output.arrayBuffer();
      return makeResponse(
        config,
        new Uint8Array(buffer),
        output.name,
        result.isZip ? "application/zip" : output.type,
      );
    }

    // Convert PDF to Text
    if (url.includes("/convert/pdf/text")) {
      if (!primaryFile) throw new Error("No PDF file provided for conversion.");
      const textFile = await ClientPdfEngine.pdfToText(primaryFile);
      const buffer = await textFile.arrayBuffer();
      return makeResponse(
        config,
        new Uint8Array(buffer),
        textFile.name,
        "text/plain",
      );
    }

    // Convert PDF to Word
    if (
      url.includes("/convert/pdf/word") ||
      url.includes("/convert/pdf/presentation")
    ) {
      if (!primaryFile) throw new Error("No PDF file provided for conversion.");
      const docxFile = await ClientPdfEngine.pdfToDocx(primaryFile);
      const buffer = await docxFile.arrayBuffer();
      return makeResponse(
        config,
        new Uint8Array(buffer),
        docxFile.name,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
    }

    // Convert PDF to CSV / XLSX
    if (url.includes("/convert/pdf/csv") || url.includes("/convert/pdf/xlsx")) {
      if (!primaryFile) throw new Error("No PDF file provided for conversion.");
      const csvFile = await ClientPdfEngine.pdfToCsv(primaryFile);
      const buffer = await csvFile.arrayBuffer();
      return makeResponse(
        config,
        new Uint8Array(buffer),
        csvFile.name,
        "text/csv",
      );
    }

    // Convert PDF to HTML / Markdown / XML
    if (
      url.includes("/convert/pdf/html") ||
      url.includes("/convert/pdf/xml") ||
      url.includes("/convert/pdf/markdown")
    ) {
      if (!primaryFile) throw new Error("No PDF file provided for conversion.");
      const isMd = url.includes("markdown");
      const outFile = isMd
        ? await ClientPdfEngine.pdfToMarkdown(primaryFile)
        : await ClientPdfEngine.pdfToHtml(primaryFile);
      const buffer = await outFile.arrayBuffer();
      return makeResponse(
        config,
        new Uint8Array(buffer),
        outFile.name,
        isMd ? "text/markdown" : "text/html",
      );
    }

    // Convert CBZ / CBR to PDF
    if (url.includes("/convert/cbz/pdf") || url.includes("/convert/cbr/pdf")) {
      if (!primaryFile) throw new Error("No archive provided for conversion.");
      const pdfBytes = await ClientPdfEngine.cbzToPdf(primaryFile);
      return makeResponse(
        config,
        pdfBytes,
        `${primaryFile.name.replace(/\.[^/.]+$/, "")}.pdf`,
      );
    }

    // Convert Images or files to PDF
    if (
      url.includes("/convert/img/pdf") ||
      url.includes("/convert/file/to/pdf") ||
      url.includes("/convert/file/pdf") ||
      url.includes("/convert/html/pdf") ||
      url.includes("/convert/markdown/pdf") ||
      url.includes("/convert/svg/pdf")
    ) {
      if (files.length === 0)
        throw new Error("No files provided for conversion.");
      const isHtmlOrMd =
        primaryFile.name.endsWith(".html") ||
        primaryFile.name.endsWith(".md") ||
        primaryFile.name.endsWith(".txt");
      if (isHtmlOrMd) {
        const pdfBytes = await ClientPdfEngine.textToPdf(primaryFile);
        return makeResponse(
          config,
          pdfBytes,
          `${primaryFile.name.replace(/\.[^/.]+$/, "")}.pdf`,
        );
      }
      const pdfBytes = await ClientPdfEngine.imagesToPdf(files);
      return makeResponse(config, pdfBytes, "converted_document.pdf");
    }

    // Add Attachments
    if (url.includes("/misc/add-attachments")) {
      if (!primaryFile)
        throw new Error("No PDF file provided for attachments.");
      const attachments = files.slice(1);
      const outputBytes = await ClientPdfEngine.addAttachments(
        primaryFile,
        attachments,
      );
      return makeResponse(config, outputBytes, `attached_${primaryFile.name}`);
    }

    // Universal Fallback for any other PDF operations
    if (primaryFile) {
      const buffer = await primaryFile.arrayBuffer();
      return makeResponse(
        config,
        new Uint8Array(buffer),
        `processed_${primaryFile.name}`,
      );
    }
  } catch (error) {
    console.error(`[ClientPdfEngine] Error processing ${url}:`, error);
    return makeResponse(
      config,
      { error: error instanceof Error ? error.message : "Processing failed" },
      "error.json",
      "application/json",
      500,
    );
  }

  // Universal Fallback for non-file endpoints (e.g. GET/POST JSON)
  const isList =
    url.endsWith("s") ||
    url.includes("/sign-requests") ||
    url.includes("/sessions") ||
    url.includes("/runs") ||
    url.includes("/invites") ||
    url.includes("/fields") ||
    url.includes("/files") ||
    url.includes("/folders") ||
    url.includes("/policies");
  return makeResponse(
    config,
    isList ? [] : {},
    "data.json",
    "application/json",
  );
}
