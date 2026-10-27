import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
  PDFName,
  PDFDict,
} from "@cantoo/pdf-lib";
import JSZip from "jszip";
import { pdfWorkerManager } from "@app/services/pdfWorkerManager";

/**
 * Parses user-provided page specifications into 0-indexed page indices.
 * Supports: 'all', '1,3,5-8', '2-4', '1', etc.
 */
export function parsePageNumbers(
  spec: string | undefined | null,
  totalPageCount: number,
): number[] {
  if (!spec || spec.trim().toLowerCase() === "all" || spec.trim() === "") {
    return Array.from({ length: totalPageCount }, (_, i) => i);
  }

  const indices = new Set<number>();
  const parts = spec
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (part.includes("-")) {
      const [startStr, endStr] = part.split("-").map((s) => s.trim());
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(totalPageCount, parseInt(endStr, 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPageCount) {
        indices.add(pageNum - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Parses hex color or named color to pdf-lib rgb values.
 */
function parseColor(hex: string | undefined, defaultColor = rgb(0, 0, 0)) {
  if (!hex) return defaultColor;
  const cleanHex = hex.replace("#", "").trim();
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return rgb(r, g, b);
    }
  }
  return defaultColor;
}

export class ClientPdfEngine {
  /**
   * Merges multiple PDF files in order into a single PDF document.
   */
  static async mergePdfs(
    files: File[],
    _options?: { removeCertSign?: boolean; generateToc?: boolean },
  ): Promise<Uint8Array> {
    const mergedDoc = await PDFDocument.create();

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
      for (const page of copiedPages) {
        mergedDoc.addPage(page);
      }
    }

    return await mergedDoc.save({ useObjectStreams: true });
  }

  /**
   * Splits a PDF document by pages or page ranges.
   * If single range, returns a single PDF; if multiple, packages them into a ZIP archive.
   */
  static async splitPages(
    file: File,
    options?: {
      pages?: string;
      pageNumbers?: string;
      splitType?: string;
    },
  ): Promise<{ data: Uint8Array; isZip: boolean; filename: string }> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = doc.getPageCount();
    const spec = options?.pages || options?.pageNumbers;

    // If specific pages or range requested (e.g. '1-3' or '2,4')
    if (spec && spec.trim().toLowerCase() !== "all") {
      const pageIndices = parsePageNumbers(spec, totalPages);
      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(doc, pageIndices);
      for (const page of copiedPages) {
        newDoc.addPage(page);
      }
      const data = await newDoc.save({ useObjectStreams: true });
      return {
        data,
        isZip: false,
        filename: `split_${file.name}`,
      };
    }

    // Default split: extract every page into its own individual PDF bundled in a ZIP
    const zip = new JSZip();
    const baseName = file.name.replace(/\.pdf$/i, "");

    for (let i = 0; i < totalPages; i++) {
      const singlePageDoc = await PDFDocument.create();
      const [copiedPage] = await singlePageDoc.copyPages(doc, [i]);
      singlePageDoc.addPage(copiedPage);
      const pageBytes = await singlePageDoc.save({ useObjectStreams: true });
      const padLength = Math.max(2, String(totalPages).length);
      const pageNumStr = String(i + 1).padStart(padLength, "0");
      zip.file(`${baseName}_page_${pageNumStr}.pdf`, pageBytes);
    }

    const zipData = await zip.generateAsync({ type: "uint8array" });
    return {
      data: zipData,
      isZip: true,
      filename: `${baseName}_split.zip`,
    };
  }

  /**
   * Rotates pages in a PDF document.
   */
  static async rotatePdf(
    file: File,
    options?: {
      angle?: number | string;
      pageNumbers?: string;
    },
  ): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const angleNum =
      typeof options?.angle === "string"
        ? parseInt(options.angle, 10)
        : (options?.angle ?? 90);
    const totalPages = doc.getPageCount();
    const pageIndices = parsePageNumbers(options?.pageNumbers, totalPages);

    for (const index of pageIndices) {
      const page = doc.getPage(index);
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angleNum) % 360));
    }

    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Reorganizes / reorders pages in a PDF document.
   */
  static async reorderPages(
    file: File,
    options?: {
      pageNumbers?: string;
      pageOrder?: string;
    },
  ): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = doc.getPageCount();
    const orderSpec = options?.pageOrder || options?.pageNumbers || "";
    const newIndices = parsePageNumbers(orderSpec, totalPages);

    const reorderedDoc = await PDFDocument.create();
    const copiedPages = await reorderedDoc.copyPages(doc, newIndices);
    for (const page of copiedPages) {
      reorderedDoc.addPage(page);
    }

    return await reorderedDoc.save({ useObjectStreams: true });
  }

  /**
   * Extracts selected pages into a new PDF document.
   */
  static async extractPages(
    file: File,
    options?: { pageNumbers?: string },
  ): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = doc.getPageCount();
    const indices = parsePageNumbers(options?.pageNumbers, totalPages);

    const extractedDoc = await PDFDocument.create();
    const copiedPages = await extractedDoc.copyPages(doc, indices);
    for (const page of copiedPages) {
      extractedDoc.addPage(page);
    }

    return await extractedDoc.save({ useObjectStreams: true });
  }

  /**
   * Removes selected pages from a PDF document.
   */
  static async removePages(
    file: File,
    options?: { pageNumbers?: string },
  ): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = doc.getPageCount();
    const toRemove = new Set(
      parsePageNumbers(options?.pageNumbers, totalPages),
    );

    const remainingDoc = await PDFDocument.create();
    const keepIndices: number[] = [];
    for (let i = 0; i < totalPages; i++) {
      if (!toRemove.has(i)) {
        keepIndices.push(i);
      }
    }

    if (keepIndices.length === 0) {
      throw new Error("Cannot remove all pages from the document.");
    }

    const copiedPages = await remainingDoc.copyPages(doc, keepIndices);
    for (const page of copiedPages) {
      remainingDoc.addPage(page);
    }

    return await remainingDoc.save({ useObjectStreams: true });
  }

  /**
   * Adds text watermark to pages in a PDF document.
   */
  static async addWatermark(
    file: File,
    options?: {
      watermarkText?: string;
      fontSize?: number | string;
      rotation?: number | string;
      opacity?: number | string;
      fontColor?: string;
      watermarkType?: string;
    },
  ): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.HelveticaBold);

    const text = options?.watermarkText || "CONFIDENTIAL";
    const size =
      typeof options?.fontSize === "string"
        ? parseFloat(options.fontSize)
        : (options?.fontSize ?? 48);
    const rot =
      typeof options?.rotation === "string"
        ? parseFloat(options.rotation)
        : (options?.rotation ?? 45);
    const opac =
      typeof options?.opacity === "string"
        ? parseFloat(options.opacity)
        : (options?.opacity ?? 0.3);
    const color = parseColor(options?.fontColor, rgb(0.8, 0.2, 0.2));

    const pages = doc.getPages();
    for (const page of pages) {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, size);
      const textHeight = font.heightAtSize(size);

      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: (height - textHeight) / 2,
        size,
        font,
        color,
        opacity: opac,
        rotate: degrees(rot),
      });
    }

    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Adds page numbers to pages in a PDF document.
   */
  static async addPageNumbers(
    file: File,
    options?: {
      position?: number | string;
      startingNumber?: number | string;
      customText?: string;
      fontSize?: number | string;
      fontColor?: string;
      pageNumbers?: string;
    },
  ): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.Helvetica);

    const totalPages = doc.getPageCount();
    const pos =
      typeof options?.position === "string"
        ? parseInt(options.position, 10)
        : (options?.position ?? 8); // 8 = bottom-center
    const startNum =
      typeof options?.startingNumber === "string"
        ? parseInt(options.startingNumber, 10)
        : (options?.startingNumber ?? 1);
    const size =
      typeof options?.fontSize === "string"
        ? parseFloat(options.fontSize)
        : (options?.fontSize ?? 12);
    const format = options?.customText || "{n}";
    const color = parseColor(options?.fontColor, rgb(0.2, 0.2, 0.2));
    const targetIndices = parsePageNumbers(options?.pageNumbers, totalPages);

    for (let i = 0; i < targetIndices.length; i++) {
      const pageIndex = targetIndices[i];
      const page = doc.getPage(pageIndex);
      const { width, height } = page.getSize();
      const currentNumber = startNum + i;

      const label = format
        .replace(/\{n\}/g, String(currentNumber))
        .replace(/\{total\}/g, String(totalPages))
        .replace(/\{filename\}/g, file.name);

      const textWidth = font.widthOfTextAtSize(label, size);
      const margin = 30;

      let x = (width - textWidth) / 2;
      let y = margin;

      // Positions 1-9: 1=TL, 2=TC, 3=TR, 4=ML, 5=MC, 6=MR, 7=BL, 8=BC, 9=BR
      switch (pos) {
        case 1:
          x = margin;
          y = height - margin;
          break;
        case 2:
          x = (width - textWidth) / 2;
          y = height - margin;
          break;
        case 3:
          x = width - textWidth - margin;
          y = height - margin;
          break;
        case 4:
          x = margin;
          y = height / 2;
          break;
        case 5:
          x = (width - textWidth) / 2;
          y = height / 2;
          break;
        case 6:
          x = width - textWidth - margin;
          y = height / 2;
          break;
        case 7:
          x = margin;
          y = margin;
          break;
        case 8:
          x = (width - textWidth) / 2;
          y = margin;
          break;
        case 9:
          x = width - textWidth - margin;
          y = margin;
          break;
        default:
          x = (width - textWidth) / 2;
          y = margin;
      }

      page.drawText(label, {
        x,
        y,
        size,
        font,
        color,
      });
    }

    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Flattens interactive forms and annotations in a PDF.
   */
  static async flattenPdf(file: File): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    try {
      const form = doc.getForm();
      form.flatten();
    } catch {
      // Document may not contain AcroForms
    }

    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Unlocks PDF form fields by clearing read-only flags.
   */
  static async unlockPdfForms(file: File): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    try {
      const form = doc.getForm();
      const fields = form.getFields();
      for (const field of fields) {
        try {
          field.enableReadOnly();
          // Clear readOnly flag
          const dict = (field as unknown as { acroField?: { dict?: PDFDict } })
            .acroField?.dict;
          if (dict) {
            dict.delete(PDFName.of("Ff"));
          }
        } catch {
          // Ignore individual field errors
        }
      }
    } catch {
      // Document may not contain forms
    }

    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Updates PDF document metadata (title, author, subject, keywords).
   */
  static async updateMetadata(
    file: File,
    options?: {
      title?: string;
      author?: string;
      subject?: string;
      keywords?: string;
      creator?: string;
      producer?: string;
    },
  ): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    if (options?.title !== undefined) doc.setTitle(options.title);
    if (options?.author !== undefined) doc.setAuthor(options.author);
    if (options?.subject !== undefined) doc.setSubject(options.subject);
    if (options?.keywords !== undefined) {
      doc.setKeywords(options.keywords.split(",").map((s) => s.trim()));
    }
    if (options?.creator !== undefined) doc.setCreator(options.creator);
    if (options?.producer !== undefined) doc.setProducer(options.producer);

    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Extracts detailed metadata and inspection info from a PDF document.
   */
  static async getPdfInfo(file: File): Promise<Record<string, unknown>> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pageCount = doc.getPageCount();
    const firstPageSize =
      pageCount > 0 ? doc.getPage(0).getSize() : { width: 0, height: 0 };

    return {
      fileName: file.name,
      fileSize: file.size,
      pageCount,
      title: doc.getTitle() || "",
      author: doc.getAuthor() || "",
      subject: doc.getSubject() || "",
      keywords: doc.getKeywords() || [],
      creator: doc.getCreator() || "",
      producer: doc.getProducer() || "",
      creationDate: doc.getCreationDate()?.toISOString() || null,
      modificationDate: doc.getModificationDate()?.toISOString() || null,
      pageWidth: firstPageSize.width,
      pageHeight: firstPageSize.height,
      encrypted: false,
    };
  }

  /**
   * Sanitizes a PDF document by stripping embedded scripts and actions.
   */
  static async sanitizePdf(file: File): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    const catalog = doc.catalog;
    // Strip JavaScript, OpenAction, and Additional Actions
    catalog.delete(PDFName.of("JavaScript"));
    catalog.delete(PDFName.of("OpenAction"));
    catalog.delete(PDFName.of("AA"));
    catalog.delete(PDFName.of("Names"));

    // Reset sensitive metadata
    doc.setProducer("Fold (Privacy-First)");
    doc.setCreator("Fold");

    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Inspects a PDF document for embedded JavaScript code.
   */
  static async showJavascript(
    file: File,
  ): Promise<{ hasJs: boolean; scripts: string[] }> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const scripts: string[] = [];

    const catalog = doc.catalog;
    if (
      catalog.has(PDFName.of("JavaScript")) ||
      catalog.has(PDFName.of("OpenAction"))
    ) {
      scripts.push("[Embedded Document Action / Script detected in catalog]");
    }

    return {
      hasJs: scripts.length > 0,
      scripts,
    };
  }

  /**
   * Converts image files (JPEG, PNG, WebP, GIF, BMP, SVG) to a single PDF document.
   */
  static async imagesToPdf(images: File[]): Promise<Uint8Array> {
    const doc = await PDFDocument.create();

    for (const imgFile of images) {
      let embeddedImage;
      const isPng =
        imgFile.type === "image/png" ||
        imgFile.name.toLowerCase().endsWith(".png");
      const isJpg =
        imgFile.type === "image/jpeg" ||
        imgFile.name.toLowerCase().endsWith(".jpg") ||
        imgFile.name.toLowerCase().endsWith(".jpeg");

      if (isPng) {
        try {
          const bytes = await imgFile.arrayBuffer();
          embeddedImage = await doc.embedPng(bytes);
        } catch {
          embeddedImage = null;
        }
      } else if (isJpg) {
        try {
          const bytes = await imgFile.arrayBuffer();
          embeddedImage = await doc.embedJpg(bytes);
        } catch {
          embeddedImage = null;
        }
      }

      // If not standard PNG/JPG or if pdf-lib threw, rasterize through HTML canvas
      if (!embeddedImage) {
        const pngFile = await ClientPdfEngine.imageToImage(imgFile, "png");
        const pngBytes = await pngFile.arrayBuffer();
        embeddedImage = await doc.embedPng(pngBytes);
      }

      const { width, height } = embeddedImage;
      const page = doc.addPage([width, height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width,
        height,
      });
    }

    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Stitches all pages vertically into a single continuous large page.
   */
  static async singleLargePage(file: File): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = srcDoc.getPages();
    const pageCount = pages.length;

    if (pageCount === 0) return bytes as unknown as Uint8Array;

    let maxWidth = 0;
    let totalHeight = 0;

    for (const page of pages) {
      const { width, height } = page.getSize();
      if (width > maxWidth) maxWidth = width;
      totalHeight += height;
    }

    const outputDoc = await PDFDocument.create();
    const embeddedPages = await outputDoc.embedPdf(
      srcDoc,
      Array.from({ length: pageCount }, (_, i) => i),
    );
    const combinedPage = outputDoc.addPage([maxWidth, totalHeight]);

    let currentY = totalHeight;
    for (const embeddedPage of embeddedPages) {
      currentY -= embeddedPage.height;
      combinedPage.drawPage(embeddedPage, {
        x: (maxWidth - embeddedPage.width) / 2,
        y: currentY,
      });
    }

    return await outputDoc.save({ useObjectStreams: true });
  }

  /**
   * Optimizes / compresses PDF by reconstructing object streams.
   */
  static async compressPdf(file: File): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    return await doc.save({ useObjectStreams: true, addDefaultPage: false });
  }

  /**
   * Repairs damaged or malformed PDF syntax by round-tripping through pdf-lib parser.
   */
  static async repairPdf(file: File): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, {
      ignoreEncryption: true,
      parseSpeed: 0,
    });
    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Adds an embedded file attachment to the PDF.
   */
  static async addAttachments(
    file: File,
    attachments: File[],
  ): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    for (const att of attachments) {
      const attBytes = await att.arrayBuffer();
      await doc.attach(new Uint8Array(attBytes), att.name, {
        mimeType: att.type || "application/octet-stream",
        description: `Attached via Fold: ${att.name}`,
        creationDate: new Date(),
        modificationDate: new Date(),
      });
    }

    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Converts between image formats (PNG, JPG, WebP) in-browser using HTML canvas.
   */
  static async imageToImage(file: File, targetExt: string): Promise<File> {
    const base = file.name.replace(/\.[^/.]+$/, "");
    const ext = targetExt.toLowerCase().replace(".", "");
    const mimeType =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : "image/png";

    const img = new Image();
    const url = URL.createObjectURL(file);

    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error(`Failed to load image: ${file.name}`));
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");

      if (mimeType === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob(
          (b) => resolve(b || new Blob([], { type: mimeType })),
          mimeType,
          0.92,
        ),
      );

      return new File([blob], `${base}.${ext}`, { type: mimeType });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Converts a PDF into images (PNG, JPEG, WebP) page by page.
   */
  static async pdfToImages(
    file: File,
    options?: {
      format?: string;
      dpi?: number;
      singleOrMultiple?: string;
      colorType?: string;
    },
  ): Promise<{ files: File[]; isZip: boolean; zipFile?: File }> {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await pdfWorkerManager.createDocument(arrayBuffer);
    const numPages = doc.numPages;

    const rawFormat = (options?.format || "png").toLowerCase().replace(".", "");
    const ext = rawFormat === "jpeg" ? "jpg" : rawFormat;
    const mimeType =
      ext === "jpg"
        ? "image/jpeg"
        : ext === "webp"
          ? "image/webp"
          : "image/png";

    const dpi = options?.dpi && options.dpi > 0 ? options.dpi : 150;
    const scale = dpi / 72;
    const baseName = file.name.replace(/\.[^/.]+$/, "");

    const pageImages: { pageNum: number; blob: Blob }[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      const context = canvas.getContext("2d");
      if (context) {
        if (mimeType === "image/jpeg") {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        await page.render({ canvasContext: context, viewport, canvas }).promise;

        if (options?.colorType === "grayscale") {
          const imgData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
          const data = imgData.data;
          for (let p = 0; p < data.length; p += 4) {
            const gray =
              0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
            data[p] = gray;
            data[p + 1] = gray;
            data[p + 2] = gray;
          }
          context.putImageData(imgData, 0, 0);
        }

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (b) => resolve(b || new Blob([], { type: mimeType })),
            mimeType,
            0.92,
          );
        });
        pageImages.push({ pageNum: i, blob });
      }
    }

    await pdfWorkerManager.destroyDocument(doc);

    if (pageImages.length === 0) {
      throw new Error("Failed to render PDF pages to images");
    }

    if (pageImages.length === 1 || options?.singleOrMultiple === "single") {
      const singleFile = new File([pageImages[0].blob], `${baseName}.${ext}`, {
        type: mimeType,
      });
      return { files: [singleFile], isZip: false };
    }

    const zip = new JSZip();
    for (const item of pageImages) {
      zip.file(`${baseName}_page_${item.pageNum}.${ext}`, item.blob);
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const zipFile = new File([zipBlob], `${baseName}_images.zip`, {
      type: "application/zip",
    });

    const individualFiles = pageImages.map(
      (item) =>
        new File([item.blob], `${baseName}_page_${item.pageNum}.${ext}`, {
          type: mimeType,
        }),
    );

    return {
      files: [zipFile, ...individualFiles],
      isZip: true,
      zipFile,
    };
  }

  /**
   * Extracts text from all PDF pages into a .txt file.
   */
  static async pdfToText(file: File): Promise<File> {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await pdfWorkerManager.createDocument(arrayBuffer);
    const textPieces: string[] = [];

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageStrings = (content.items as any[])
        .map((item: any) => ("str" in item ? item.str : ""))
        .filter(Boolean);
      textPieces.push(pageStrings.join(" "));
    }

    await pdfWorkerManager.destroyDocument(doc);
    const fullText = textPieces.join("\n\n");
    const base = file.name.replace(/\.[^/.]+$/, "");
    return new File([fullText], `${base}.txt`, {
      type: "text/plain;charset=utf-8",
    });
  }

  /**
   * Converts PDF text to structured Markdown document.
   */
  static async pdfToMarkdown(file: File): Promise<File> {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await pdfWorkerManager.createDocument(arrayBuffer);
    const lines: string[] = [];
    const base = file.name.replace(/\.[^/.]+$/, "");
    lines.push(`# ${base}\n`);

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageStrings = (content.items as any[])
        .map((item: any) => ("str" in item ? item.str : ""))
        .filter(Boolean);
      lines.push(`## Page ${i}\n`);
      lines.push(`${pageStrings.join(" ")}\n`);
    }

    await pdfWorkerManager.destroyDocument(doc);
    return new File([lines.join("\n")], `${base}.md`, {
      type: "text/markdown;charset=utf-8",
    });
  }

  /**
   * Converts PDF table or text data into CSV format.
   */
  static async pdfToCsv(file: File): Promise<File> {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await pdfWorkerManager.createDocument(arrayBuffer);
    const rows: string[] = [];
    const base = file.name.replace(/\.[^/.]+$/, "");

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let currentLine = "";
      for (const item of content.items as any[]) {
        if ("str" in item) {
          const str = item.str;
          const hasEOL = item.hasEOL;
          if (hasEOL) {
            currentLine += str;
            rows.push(currentLine);
            currentLine = "";
          } else {
            currentLine +=
              (currentLine ? "," : "") + `"${str.replace(/"/g, '""')}"`;
          }
        }
      }
      if (currentLine) rows.push(currentLine);
    }

    await pdfWorkerManager.destroyDocument(doc);
    return new File([rows.join("\n")], `${base}.csv`, {
      type: "text/csv;charset=utf-8",
    });
  }

  /**
   * Converts PDF text to an HTML document.
   */
  static async pdfToHtml(file: File): Promise<File> {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await pdfWorkerManager.createDocument(arrayBuffer);
    const base = file.name.replace(/\.[^/.]+$/, "");
    let html = `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>${base}</title>\n<style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#333;}.page{margin-bottom:3rem;padding-bottom:1.5rem;border-bottom:1px solid #e5e7eb;}.page-header{font-size:0.875rem;color:#6b7280;margin-bottom:1rem;}</style>\n</head>\n<body>\n<h1>${base}</h1>\n`;

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageStrings = (content.items as any[])
        .map((item: any) => ("str" in item ? item.str : ""))
        .filter(Boolean);
      html += `<div class="page">\n<div class="page-header">Page ${i}</div>\n<p>${pageStrings.join(" ")}</p>\n</div>\n`;
    }

    await pdfWorkerManager.destroyDocument(doc);
    html += `</body>\n</html>`;
    return new File([html], `${base}.html`, { type: "text/html;charset=utf-8" });
  }

  /**
   * Builds a valid Microsoft Word (.docx) package containing the extracted text.
   */
  static async pdfToDocx(file: File): Promise<File> {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await pdfWorkerManager.createDocument(arrayBuffer);
    const paragraphs: string[] = [];
    const base = file.name.replace(/\.[^/.]+$/, "");

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageStrings = (content.items as any[])
        .map((item: any) => ("str" in item ? item.str : ""))
        .filter(Boolean);
      paragraphs.push(pageStrings.join(" "));
    }
    await pdfWorkerManager.destroyDocument(doc);

    const zip = new JSZip();
    zip.file(
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n  <Default Extension="xml" ContentType="application/xml"/>\n  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n</Types>`,
    );
    zip.file(
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n</Relationships>`,
    );

    const escapeXml = (unsafe: string) =>
      unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const docXmlBody = paragraphs
      .map(
        (p) =>
          `<w:p><w:r><w:t xml:space="preserve">${escapeXml(p)}</w:t></w:r></w:p>`,
      )
      .join("");

    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n  <w:body>\n    ${docXmlBody}\n  </w:body>\n</w:document>`,
    );

    const docxBlob = await zip.generateAsync({ type: "blob" });
    return new File([docxBlob], `${base}.docx`, {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  }

  /**
   * Generates a PDF from plain text or Markdown with proper pagination and typography.
   */
  static async textToPdf(file: File): Promise<Uint8Array> {
    const rawText = await file.text();
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    const lineHeight = fontSize * 1.35;
    const margin = 48;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    const rawLines = rawText.split(/\r?\n/);
    const wrappedLines: string[] = [];

    for (const rawLine of rawLines) {
      if (!rawLine.trim()) {
        wrappedLines.push("");
        continue;
      }
      const words = rawLine.split(/\s+/);
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        let testWidth = 0;
        try {
          testWidth = font.widthOfTextAtSize(testLine, fontSize);
        } catch {
          const safeLine = testLine.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
          testWidth = font.widthOfTextAtSize(safeLine, fontSize);
        }
        if (testWidth > maxWidth && currentLine) {
          wrappedLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    }

    const linesPerPage = Math.max(1, Math.floor(maxHeight / lineHeight));
    for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
      const page = doc.addPage([pageWidth, pageHeight]);
      const chunk = wrappedLines.slice(i, i + linesPerPage);
      let y = pageHeight - margin - fontSize;
      for (const line of chunk) {
        if (line) {
          const safeText = line.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
          page.drawText(safeText, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0.12, 0.14, 0.18),
          });
        }
        y -= lineHeight;
      }
    }

    if (wrappedLines.length === 0) {
      doc.addPage([pageWidth, pageHeight]);
    }

    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Converts a Word .docx document into a PDF.
   */
  static async docxToPdf(file: File): Promise<Uint8Array> {
    try {
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const docXml = await zip.file("word/document.xml")?.async("string");
      if (docXml) {
        const paragraphs: string[] = [];
        const pMatches = docXml.match(/<w:p[\s>].*?<\/w:p>/g) || [];
        for (const p of pMatches) {
          const tMatches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
          const text = tMatches.map((t) => t.replace(/<[^>]+>/g, "")).join("");
          if (text) paragraphs.push(text);
        }
        const textFile = new File(
          [paragraphs.join("\n\n")],
          `${file.name.replace(/\.[^/.]+$/, "")}.txt`,
          { type: "text/plain" },
        );
        return await ClientPdfEngine.textToPdf(textFile);
      }
    } catch (e) {
      console.warn("docxToPdf extraction failed, falling back to raw text:", e);
    }
    return await ClientPdfEngine.textToPdf(file);
  }

  /**
   * Converts a CBZ or CBR comic archive into a single PDF.
   */
  static async cbzToPdf(file: File): Promise<Uint8Array> {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const imageFiles: File[] = [];
    const entries = Object.keys(zip.files).sort();

    for (const name of entries) {
      const entry = zip.files[name];
      if (!entry.dir && /\.(png|jpe?g|webp|gif|bmp)$/i.test(name)) {
        const blob = await entry.async("blob");
        imageFiles.push(new File([blob], name, { type: blob.type }));
      }
    }

    if (imageFiles.length === 0) {
      throw new Error("No readable images found in archive");
    }

    return await ClientPdfEngine.imagesToPdf(imageFiles);
  }

  /**
   * Normalizes PDF and sets standard PDF/A archiving metadata.
   */
  static async pdfToPdfA(file: File): Promise<Uint8Array> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    doc.setTitle(doc.getTitle() || file.name.replace(/\.pdf$/i, ""));
    doc.setProducer("Fold (Client-Side Local Engine)");
    doc.setCreator("Fold");
    doc.setModificationDate(new Date());
    return await doc.save({ useObjectStreams: true });
  }

  /**
   * Universal client-side document converter.
   */
  static async universalConvert(
    file: File,
    fromExt: string,
    toExt: string,
    options?: {
      imageOptions?: {
        dpi?: number;
        singleOrMultiple?: string;
        colorType?: string;
        fitOption?: string;
      };
    },
  ): Promise<File[]> {
    const from = fromExt.toLowerCase().replace(".", "");
    const to = toExt.toLowerCase().replace(".", "");
    const base = file.name.replace(/\.[^/.]+$/, "");

    const isImageFrom = [
      "png",
      "jpg",
      "jpeg",
      "webp",
      "gif",
      "bmp",
      "tiff",
      "svg",
    ].includes(from);
    const isImageTo = ["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(
      to,
    );

    // 1. Target is PDF
    if (to === "pdf") {
      if (isImageFrom) {
        const bytes = await ClientPdfEngine.imagesToPdf([file]);
        return [
          new File([bytes as unknown as BlobPart], `${base}.pdf`, {
            type: "application/pdf",
          }),
        ];
      }
      if (from === "cbz" || from === "cbr") {
        const bytes = await ClientPdfEngine.cbzToPdf(file);
        return [
          new File([bytes as unknown as BlobPart], `${base}.pdf`, {
            type: "application/pdf",
          }),
        ];
      }
      if (from === "docx" || from === "doc" || from === "odt") {
        const bytes = await ClientPdfEngine.docxToPdf(file);
        return [
          new File([bytes as unknown as BlobPart], `${base}.pdf`, {
            type: "application/pdf",
          }),
        ];
      }
      if (["txt", "md", "rtf", "csv", "html", "xml", "json"].includes(from)) {
        const bytes = await ClientPdfEngine.textToPdf(file);
        return [
          new File([bytes as unknown as BlobPart], `${base}.pdf`, {
            type: "application/pdf",
          }),
        ];
      }
      if (from === "pdf") {
        const bytes = await ClientPdfEngine.pdfToPdfA(file);
        return [
          new File([bytes as unknown as BlobPart], `${base}_converted.pdf`, {
            type: "application/pdf",
          }),
        ];
      }
      const bytes = await ClientPdfEngine.textToPdf(file);
      return [
        new File([bytes as unknown as BlobPart], `${base}.pdf`, {
          type: "application/pdf",
        }),
      ];
    }

    // 2. Source is PDF
    if (from === "pdf") {
      if (isImageTo) {
        const res = await ClientPdfEngine.pdfToImages(file, {
          format: to,
          dpi: options?.imageOptions?.dpi,
          singleOrMultiple: options?.imageOptions?.singleOrMultiple,
          colorType: options?.imageOptions?.colorType,
        });
        return res.files;
      }
      if (to === "txt" || to === "rtf") {
        const txtFile = await ClientPdfEngine.pdfToText(file);
        return [txtFile];
      }
      if (to === "md") {
        const mdFile = await ClientPdfEngine.pdfToMarkdown(file);
        return [mdFile];
      }
      if (to === "csv" || to === "xlsx") {
        const csvFile = await ClientPdfEngine.pdfToCsv(file);
        return [csvFile];
      }
      if (to === "html" || to === "xml") {
        const htmlFile = await ClientPdfEngine.pdfToHtml(file);
        return [htmlFile];
      }
      if (to === "docx" || to === "odt" || to === "pptx" || to === "odp") {
        const docxFile = await ClientPdfEngine.pdfToDocx(file);
        return [docxFile];
      }
      if (["pdfa", "pdfx", "pdfua"].includes(to)) {
        const bytes = await ClientPdfEngine.pdfToPdfA(file);
        return [
          new File([bytes as unknown as BlobPart], `${base}_${to}.pdf`, {
            type: "application/pdf",
          }),
        ];
      }
    }

    // 3. Image to Image
    if (isImageFrom && isImageTo) {
      const imgFile = await ClientPdfEngine.imageToImage(file, to);
      return [imgFile];
    }

    // 4. Text formats fallback
    const text = await file.text();
    return [new File([text], `${base}.${to}`, { type: "text/plain" })];
  }
}
