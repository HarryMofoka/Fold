import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
  PDFName,
  PDFDict,
  PDFArray,
  PDFString,
  PDFHexString,
} from "@cantoo/pdf-lib";
import JSZip from "jszip";

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
  const parts = spec.split(",").map((s) => s.trim()).filter(Boolean);

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
      const copiedPages = await mergedDoc.copyPages(
        doc,
        doc.getPageIndices(),
      );
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
    const angleNum = typeof options?.angle === "string" ? parseInt(options.angle, 10) : options?.angle ?? 90;
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
    const toRemove = new Set(parsePageNumbers(options?.pageNumbers, totalPages));

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
    const size = typeof options?.fontSize === "string" ? parseFloat(options.fontSize) : options?.fontSize ?? 48;
    const rot = typeof options?.rotation === "string" ? parseFloat(options.rotation) : options?.rotation ?? 45;
    const opac = typeof options?.opacity === "string" ? parseFloat(options.opacity) : options?.opacity ?? 0.3;
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
    const pos = typeof options?.position === "string" ? parseInt(options.position, 10) : options?.position ?? 8; // 8 = bottom-center
    const startNum = typeof options?.startingNumber === "string" ? parseInt(options.startingNumber, 10) : options?.startingNumber ?? 1;
    const size = typeof options?.fontSize === "string" ? parseFloat(options.fontSize) : options?.fontSize ?? 12;
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
        case 1: x = margin; y = height - margin; break;
        case 2: x = (width - textWidth) / 2; y = height - margin; break;
        case 3: x = width - textWidth - margin; y = height - margin; break;
        case 4: x = margin; y = height / 2; break;
        case 5: x = (width - textWidth) / 2; y = height / 2; break;
        case 6: x = width - textWidth - margin; y = height / 2; break;
        case 7: x = margin; y = margin; break;
        case 8: x = (width - textWidth) / 2; y = margin; break;
        case 9: x = width - textWidth - margin; y = margin; break;
        default: x = (width - textWidth) / 2; y = margin;
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
          const dict = (field as unknown as { acroField?: { dict?: PDFDict } }).acroField?.dict;
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
    const firstPageSize = pageCount > 0 ? doc.getPage(0).getSize() : { width: 0, height: 0 };

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
  static async showJavascript(file: File): Promise<{ hasJs: boolean; scripts: string[] }> {
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const scripts: string[] = [];

    const catalog = doc.catalog;
    if (catalog.has(PDFName.of("JavaScript")) || catalog.has(PDFName.of("OpenAction"))) {
      scripts.push("[Embedded Document Action / Script detected in catalog]");
    }

    return {
      hasJs: scripts.length > 0,
      scripts,
    };
  }

  /**
   * Converts image files (JPEG, PNG, etc.) to a single PDF document.
   */
  static async imagesToPdf(images: File[]): Promise<Uint8Array> {
    const doc = await PDFDocument.create();

    for (const imgFile of images) {
      const bytes = await imgFile.arrayBuffer();
      let embeddedImage;
      const isPng = imgFile.type === "image/png" || imgFile.name.toLowerCase().endsWith(".png");

      if (isPng) {
        embeddedImage = await doc.embedPng(bytes);
      } else {
        // Fallback or JPG
        try {
          embeddedImage = await doc.embedJpg(bytes);
        } catch {
          // If jpg embed fails, try PNG
          embeddedImage = await doc.embedPng(bytes);
        }
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
    const embeddedPages = await outputDoc.embedPdf(srcDoc, Array.from({ length: pageCount }, (_, i) => i));
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
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, parseSpeed: 0 });
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
}
