import { AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from "axios";
import { ClientPdfEngine } from "@app/services/clientPdfEngine";

// In-memory sessions for mobile transfers
const mobileSessions = new Map<
  string,
  { createdAt: number; expiresAt: number; files: File[] }
>();

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
  extraHeaders?: Record<string, string>,
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
    ...(extraHeaders || {}),
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
        serverCertificateEnabled: false,
        storageEnabled: false,
        storageSharingEnabled: false,
        storageShareLinksEnabled: false,
        storageGroupSigningEnabled: false,
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

  // Mobile Scanner session endpoints
  if (url.includes("/api/v1/mobile-scanner/create-session/")) {
    const sessId =
      url.split("/create-session/")[1]?.split("?")[0] || "session";
    mobileSessions.set(sessId, {
      createdAt: Date.now(),
      expiresAt: Date.now() + 600000,
      files: [],
    });
    return makeResponse(
      config,
      {
        sessionId: sessId,
        createdAt: Date.now(),
        expiresAt: Date.now() + 600000,
        timeoutMs: 600000,
      },
      "session.json",
      "application/json",
    );
  }

  if (url.includes("/api/v1/mobile-scanner/validate-session/")) {
    const sessId =
      url.split("/validate-session/")[1]?.split("?")[0] || "";
    const valid =
      mobileSessions.has(sessId) || Boolean(sessId && sessId.length > 5);
    return makeResponse(
      config,
      { valid },
      "validate.json",
      "application/json",
    );
  }

  if (url.includes("/api/v1/mobile-scanner/files/")) {
    const sessId = url.split("/files/")[1]?.split("?")[0] || "";
    const session = mobileSessions.get(sessId);
    const sessionFiles = (session?.files || []).map((f) => ({
      filename: f.name,
      contentType: f.type,
    }));
    return makeResponse(
      config,
      { files: sessionFiles },
      "files.json",
      "application/json",
    );
  }

  if (url.includes("/api/v1/mobile-scanner/upload/")) {
    const sessId = url.split("/upload/")[1]?.split("?")[0] || "";
    let session = mobileSessions.get(sessId);
    if (!session) {
      session = {
        createdAt: Date.now(),
        expiresAt: Date.now() + 600000,
        files: [],
      };
      mobileSessions.set(sessId, session);
    }
    session.files.push(...files);
    return makeResponse(
      config,
      { success: true, count: files.length },
      "upload.json",
      "application/json",
    );
  }

  if (url.includes("/api/v1/mobile-scanner/download/")) {
    const parts = url.split("/download/")[1]?.split("/") || [];
    const sessId = parts[0];
    const filename = parts[1];
    const session = mobileSessions.get(sessId);
    const targetFile =
      session?.files.find((f) => f.name === filename) || files[0];
    if (targetFile) {
      const buf = await targetFile.arrayBuffer();
      return makeResponse(
        config,
        new Uint8Array(buf),
        targetFile.name,
        targetFile.type || "image/jpeg",
      );
    }
    return makeResponse(config, new Uint8Array([]), "file.jpg", "image/jpeg");
  }

  if (url.includes("/api/v1/mobile-scanner/session/")) {
    const sessId = url.split("/session/")[1]?.split("?")[0] || "";
    mobileSessions.delete(sessId);
    return makeResponse(
      config,
      { success: true },
      "session.json",
      "application/json",
    );
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
      url.includes("/general/split-by-size-or-count") ||
      url.includes("/general/split-pdf-by-sections") ||
      url.includes("/general/split-pdf-by-chapters") ||
      url.includes("/misc/auto-split-pdf") ||
      url.includes("/general/split-for-poster-print")
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

    // Rotate PDF & Auto Rotate
    if (url.includes("/misc/auto-rotate-pdf")) {
      if (!primaryFile) throw new Error("No file provided for auto-rotate.");
      if (params.dryRun === "true" || params.dryRun === true) {
        const report = await ClientPdfEngine.autoRotateReport(primaryFile);
        return makeResponse(config, report, "report.json", "application/json");
      }
      const rotatedBytes = await ClientPdfEngine.autoRotate(primaryFile);
      return makeResponse(config, rotatedBytes, `rotated_${primaryFile.name}`);
    }

    if (url.includes("/general/rotate-pdf")) {
      if (!primaryFile) throw new Error("No file provided for rotate.");
      const rotatedBytes = await ClientPdfEngine.rotatePdf(primaryFile, {
        angle: params.angle as string | number,
        pageNumbers: params.pageNumbers as string,
      });
      return makeResponse(config, rotatedBytes, `rotated_${primaryFile.name}`);
    }

    // Reorder / Rearrange Pages
    if (
      url.includes("/general/reorder-pages") ||
      url.includes("/general/rearrange-pages")
    ) {
      if (!primaryFile) throw new Error("No file provided for reorder.");
      const reorderedBytes = await ClientPdfEngine.reorderPages(primaryFile, {
        pageOrder: (params.pageOrder ||
          params.pageNumbers ||
          params.pages) as string,
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
      if (config.responseType === "text") {
        return makeResponse(
          config,
          jsInfo.scriptText,
          `${primaryFile.name.replace(/\.[^/.]+$/, "")}.js`,
          "application/javascript",
        );
      }
      return makeResponse(config, jsInfo, "js_report.json", "application/json");
    }

    // Continuous Single Large Page
    if (
      url.includes("/general/single-page") ||
      url.includes("/general/single-large-page") ||
      url.includes("/general/pdf-to-single-page")
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

    // Add Password & Permissions
    if (url.includes("/security/add-password")) {
      if (!primaryFile) throw new Error("No file provided to add password.");
      const protectedBytes = await ClientPdfEngine.addPassword(
        primaryFile,
        params,
      );
      return makeResponse(
        config,
        protectedBytes,
        `protected_${primaryFile.name}`,
      );
    }

    // Remove Password
    if (url.includes("/security/remove-password")) {
      if (!primaryFile) throw new Error("No file provided to remove password.");
      const decryptedBytes = await ClientPdfEngine.removePassword(
        primaryFile,
        params,
      );
      return makeResponse(
        config,
        decryptedBytes,
        `unlocked_${primaryFile.name}`,
      );
    }

    // Crop PDF
    if (url.includes("/general/crop")) {
      if (!primaryFile) throw new Error("No file provided for cropping.");
      const croppedBytes = await ClientPdfEngine.cropPdf(primaryFile, params);
      return makeResponse(config, croppedBytes, `cropped_${primaryFile.name}`);
    }

    // Extract Images
    if (url.includes("/misc/extract-images")) {
      if (!primaryFile)
        throw new Error("No file provided for image extraction.");
      const result = await ClientPdfEngine.pdfToImages(primaryFile, {
        format: (params.format as string) || "png",
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

    // Remove Blank Pages
    if (url.includes("/misc/remove-blanks")) {
      if (!primaryFile) throw new Error("No file provided to remove blanks.");
      const cleanBytes = await ClientPdfEngine.removeBlankPages(
        primaryFile,
        params,
      );
      return makeResponse(config, cleanBytes, `noblanks_${primaryFile.name}`);
    }

    // Overlay PDFs
    if (url.includes("/general/overlay-pdfs")) {
      if (!primaryFile) throw new Error("No file provided for overlay.");
      const overlayFiles = files.slice(1);
      const overlaidBytes = await ClientPdfEngine.overlayPdfs(
        primaryFile,
        overlayFiles,
        params,
      );
      return makeResponse(
        config,
        overlaidBytes,
        `overlaid_${primaryFile.name}`,
      );
    }

    // Multi-Page Layout (N-Up)
    if (url.includes("/general/multi-page-layout")) {
      if (!primaryFile) throw new Error("No file provided for page layout.");
      const layoutBytes = await ClientPdfEngine.multiPageLayout(
        primaryFile,
        params,
      );
      return makeResponse(config, layoutBytes, `layout_${primaryFile.name}`);
    }

    // Booklet Imposition
    if (url.includes("/general/booklet-imposition")) {
      if (!primaryFile)
        throw new Error("No file provided for booklet imposition.");
      const bookletBytes = await ClientPdfEngine.bookletImposition(
        primaryFile,
        params,
      );
      return makeResponse(config, bookletBytes, `booklet_${primaryFile.name}`);
    }

    // Scale Pages
    if (url.includes("/general/scale-pages")) {
      if (!primaryFile) throw new Error("No file provided for page scaling.");
      const scaledBytes = await ClientPdfEngine.scalePages(
        primaryFile,
        params,
      );
      return makeResponse(config, scaledBytes, `scaled_${primaryFile.name}`);
    }

    // Remove Annotations
    if (url.includes("/misc/remove-annotations")) {
      if (!primaryFile)
        throw new Error("No file provided to remove annotations.");
      const cleanBytes = await ClientPdfEngine.removeAnnotations(primaryFile);
      return makeResponse(
        config,
        cleanBytes,
        `no_annots_${primaryFile.name}`,
      );
    }

    // Remove Certificate Signature
    if (url.includes("/security/remove-cert-sign")) {
      if (!primaryFile)
        throw new Error("No file provided to remove signature.");
      const cleanBytes =
        await ClientPdfEngine.removeCertificateSign(primaryFile);
      return makeResponse(config, cleanBytes, `nosig_${primaryFile.name}`);
    }

    // Auto Rename
    if (url.includes("/misc/auto-rename")) {
      if (!primaryFile) throw new Error("No file provided for auto-rename.");
      const newName = await ClientPdfEngine.autoRename(primaryFile, params);
      const buffer = await primaryFile.arrayBuffer();
      return makeResponse(config, new Uint8Array(buffer), newName);
    }

    // OCR PDF
    if (url.includes("/misc/ocr-pdf")) {
      if (!primaryFile) throw new Error("No file provided for OCR.");
      const ocrResult = await ClientPdfEngine.ocrPdf(primaryFile, params);
      if (ocrResult.isSidecar) {
        const textEncoder = new TextEncoder();
        return makeResponse(
          config,
          textEncoder.encode(ocrResult.data as string),
          `${primaryFile.name.replace(/\.[^/.]+$/, "")}.txt`,
          "text/plain",
        );
      }
      return makeResponse(
        config,
        ocrResult.data as Uint8Array,
        `ocr_${primaryFile.name}`,
      );
    }

    // Compress / Optimize PDF
    if (url.includes("/misc/compress-pdf")) {
      if (!primaryFile) throw new Error("No file provided for compression.");
      const compressedBytes = await ClientPdfEngine.compressPdf(
        primaryFile,
        params,
      );
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
    if (url.includes("/convert/pdf/word")) {
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

    // Convert PDF to Presentation (PPTX)
    if (url.includes("/convert/pdf/presentation")) {
      if (!primaryFile) throw new Error("No PDF file provided for conversion.");
      const pptxFile = await ClientPdfEngine.pdfToPptx(primaryFile);
      const buffer = await pptxFile.arrayBuffer();
      return makeResponse(
        config,
        new Uint8Array(buffer),
        pptxFile.name,
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
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

    // Remove Images
    if (url.includes("/general/remove-image-pdf")) {
      if (!primaryFile)
        throw new Error("No PDF file provided to remove images.");
      const cleanBytes = await ClientPdfEngine.removeImages(primaryFile);
      return makeResponse(config, cleanBytes, `no_images_${primaryFile.name}`);
    }

    // Create Portfolio
    if (url.includes("/misc/create-portfolio")) {
      if (files.length === 0)
        throw new Error("No files provided for portfolio.");
      const portfolioBytes = await ClientPdfEngine.createPortfolio(files, {
        coverTitle: params.coverTitle as string,
      });
      return makeResponse(config, portfolioBytes, "portfolio.pdf");
    }

    // Cert Sign
    if (url.includes("/security/cert-sign")) {
      if (!primaryFile) throw new Error("No PDF file provided for cert-sign.");
      const signedBytes = await ClientPdfEngine.certSign(primaryFile, {
        name: params.name as string,
        reason: params.reason as string,
        location: params.location as string,
        pageNumber: params.pageNumber as number | string,
        showSignature:
          params.showSignature === true || params.showSignature === "true",
      });
      return makeResponse(config, signedBytes, `signed_${primaryFile.name}`);
    }

    // Timestamp PDF
    if (url.includes("/security/timestamp-pdf")) {
      if (!primaryFile) throw new Error("No PDF file provided for timestamp.");
      const stampedBytes = await ClientPdfEngine.timestampPdf(primaryFile);
      return makeResponse(
        config,
        stampedBytes,
        `timestamped_${primaryFile.name}`,
      );
    }

    // Validate Signature
    if (url.includes("/security/validate-signature")) {
      if (!primaryFile) {
        return makeResponse(config, [], "validation.json", "application/json");
      }
      const result = await ClientPdfEngine.validateSignatures(primaryFile);
      return makeResponse(
        config,
        result,
        "validation.json",
        "application/json",
      );
    }

    // Auto Redact
    if (
      url.includes("/security/auto-redact") ||
      url.includes("/security/redact")
    ) {
      if (!primaryFile) throw new Error("No PDF file provided for redaction.");
      const redactedBytes = await ClientPdfEngine.autoRedact(primaryFile, {
        listOfText: (params.listOfText || params.wordsToRedact) as string,
        redactColor: params.redactColor as string,
      });
      return makeResponse(
        config,
        redactedBytes,
        `redacted_${primaryFile.name}`,
      );
    }

    // Replace Invert PDF / Color
    if (url.includes("/misc/replace-invert-pdf")) {
      if (!primaryFile)
        throw new Error("No PDF file provided for color replacement.");
      const convertedBytes = await ClientPdfEngine.replaceColor(
        primaryFile,
        params,
      );
      return makeResponse(
        config,
        convertedBytes,
        `inverted_${primaryFile.name}`,
      );
    }

    // Scanner Image Split
    if (url.includes("/misc/extract-image-scans")) {
      if (!primaryFile)
        throw new Error("No PDF file provided for scan extraction.");
      const result = await ClientPdfEngine.extractImageScans(primaryFile, {
        format: (params.format as string) || "png",
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

    // Extract Bookmarks
    if (url.includes("/general/extract-bookmarks")) {
      if (!primaryFile)
        throw new Error("No PDF file provided for bookmark extraction.");
      const bookmarks = await ClientPdfEngine.extractBookmarks(primaryFile);
      return makeResponse(
        config,
        bookmarks,
        "bookmarks.json",
        "application/json",
      );
    }

    // Edit Table of Contents
    if (url.includes("/general/edit-table-of-contents")) {
      if (!primaryFile) throw new Error("No PDF file provided for TOC update.");
      const updatedBytes = await ClientPdfEngine.updateTableOfContents(
        primaryFile,
        params,
      );
      return makeResponse(
        config,
        updatedBytes,
        `toc_${primaryFile.name}`,
      );
    }

    // Add Image / Add Stamp
    if (url.includes("/misc/add-image") || url.includes("/misc/add-stamp")) {
      if (!primaryFile) throw new Error("No PDF file provided to add image.");
      const overlayFiles = files.slice(1);
      if (overlayFiles.length > 0) {
        const overlaidBytes = await ClientPdfEngine.overlayPdfs(
          primaryFile,
          overlayFiles,
          params,
        );
        return makeResponse(
          config,
          overlaidBytes,
          `stamped_${primaryFile.name}`,
        );
      }
      const buffer = await primaryFile.arrayBuffer();
      return makeResponse(
        config,
        new Uint8Array(buffer),
        `stamped_${primaryFile.name}`,
      );
    }

    // Auto Form Detection
    if (url.includes("/form/form-detection/detect")) {
      if (!primaryFile) throw new Error("No file provided for form detection.");
      const fields = await ClientPdfEngine.getFormFields(primaryFile);
      const counts = {
        textFields: fields.filter((f) => f.type === "text").length,
        checkBoxes: fields.filter((f) => f.type === "checkbox").length,
        radioButtons: fields.filter((f) => f.type === "radio").length,
      };
      const buffer = await primaryFile.arrayBuffer();
      return makeResponse(
        config,
        new Uint8Array(buffer),
        `form_${primaryFile.name}`,
        "application/pdf",
        200,
        {
          "x-stirling-detected-fields": JSON.stringify(counts),
        },
      );
    }

    // Fill Form Fields
    if (url.includes("/form/fill")) {
      if (!primaryFile) throw new Error("No PDF file provided to fill form.");
      let values: Record<string, string> = {};
      if (typeof params.data === "string") {
        try {
          values = JSON.parse(params.data);
        } catch {}
      } else if (params.data && typeof params.data === "object") {
        values = params.data as Record<string, string>;
      }
      const flatten = params.flatten === "true" || params.flatten === true;
      const filledBytes = await ClientPdfEngine.fillForm(
        primaryFile,
        values,
        flatten,
      );
      return makeResponse(config, filledBytes, `filled_${primaryFile.name}`);
    }

    // Form Fields inspection
    if (
      url.includes("/form/fields-with-coordinates") ||
      url.includes("/form/fetch-fields") ||
      url.includes("/form/fields")
    ) {
      if (primaryFile) {
        const fields = await ClientPdfEngine.getFormFields(primaryFile);
        return makeResponse(config, fields, "fields.json", "application/json");
      }
      return makeResponse(config, [], "fields.json", "application/json");
    }

    // Extract Form CSV
    if (
      url.includes("/form/extract-csv") ||
      url.includes("/form/extract-xlsx")
    ) {
      if (!primaryFile)
        throw new Error("No PDF file provided to extract form data.");
      const csvStr = await ClientPdfEngine.extractFormCsv(primaryFile);
      const textEncoder = new TextEncoder();
      return makeResponse(
        config,
        textEncoder.encode(csvStr),
        `${primaryFile.name.replace(/\.[^/.]+$/, "")}_fields.csv`,
        "text/csv",
      );
    }

    // Classify & Label
    if (url.includes("/ai/tools/classify-and-label")) {
      if (!primaryFile)
        throw new Error("No file provided for classification.");
      const classification =
        await ClientPdfEngine.classifyDocument(primaryFile);
      return makeResponse(
        config,
        classification.data,
        `classified_${primaryFile.name}`,
        "application/pdf",
        200,
        {
          "x-stirling-classification-labels": JSON.stringify(
            classification.labels,
          ),
          "x-stirling-classification-confidence": classification.confidence,
        },
      );
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
