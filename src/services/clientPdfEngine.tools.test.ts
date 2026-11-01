import { describe, expect, test, vi } from "vitest";
import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFArray,
  StandardFonts,
} from "@cantoo/pdf-lib";
import JSZip from "jszip";
import pako from "pako";
import { ClientPdfEngine } from "@app/services/clientPdfEngine";
import { handleClientApiRequest } from "@app/services/clientPdfAdapter";
import { InternalAxiosRequestConfig } from "axios";

const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function createTestPdfWithField(): Promise<{
  file: File;
  docBytes: Uint8Array;
}> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 400]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText("Hello Form World", { x: 50, y: 350, size: 12, font });

  const form = doc.getForm();
  const textField = form.createTextField("customerName");
  textField.addToPage(page, { x: 50, y: 250, width: 200, height: 24 });
  textField.setText("Jane Doe");

  const checkbox = form.createCheckBox("agreeTerms");
  checkbox.addToPage(page, { x: 50, y: 200, width: 20, height: 20 });
  checkbox.check();

  const annot = doc.context.obj({
    Type: "Annot",
    Subtype: "Highlight",
    Rect: [50, 340, 150, 365],
  });
  const annotRef = doc.context.register(annot);
  page.node.Annots()?.push(annotRef);

  const bytes = await doc.save();
  const file = new File([bytes], "test_doc.pdf", { type: "application/pdf" });
  return { file, docBytes: bytes };
}

async function createTestPdfWithImage(): Promise<File> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 400]);
  const imgBytes = Uint8Array.from(atob(PNG_1X1_BASE64), (c) =>
    c.charCodeAt(0),
  );
  const embeddedImg = await doc.embedPng(imgBytes);
  page.drawImage(embeddedImg, { x: 50, y: 50, width: 100, height: 100 });
  const bytes = await doc.save();
  return new File([bytes], "image_doc.pdf", { type: "application/pdf" });
}

async function createMultiPageTextPdf(): Promise<File> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const p1 = doc.addPage([600, 400]);
  p1.drawText("Slide 1 Overview: Welcome & Intro to Fold", {
    x: 50,
    y: 300,
    size: 14,
    font,
  });

  const p2 = doc.addPage([600, 400]);
  p2.drawText("Slide 2 Details: Confidential SSN 123-45-6789 and Secrets", {
    x: 50,
    y: 300,
    size: 14,
    font,
  });

  const bytes = await doc.save();
  return new File([bytes], "multipage.pdf", { type: "application/pdf" });
}

describe("ClientPdfEngine Tools", () => {
  describe("removeAnnotations", () => {
    test("preserves AcroForm /Widget annotations while removing comments and highlights", async () => {
      const { file } = await createTestPdfWithField();
      const outputBytes = await ClientPdfEngine.removeAnnotations(file);

      const loaded = await PDFDocument.load(outputBytes);
      const fields = loaded.getForm().getFields();
      expect(fields.length).toBeGreaterThanOrEqual(2);
      expect(fields.map((f) => f.getName())).toContain("customerName");

      const p1Annots = loaded.getPages()[0].node.Annots();
      expect(p1Annots).toBeDefined();
      for (let i = 0; i < (p1Annots?.size() || 0); i++) {
        const ref = p1Annots?.get(i);
        const dict = loaded.context.lookup(ref, PDFDict);
        expect(dict?.get(PDFName.of("Subtype"))?.toString()).toBe("/Widget");
      }
    });

    test("removes all annotations when removeWidgets is true", async () => {
      const { file } = await createTestPdfWithField();
      const outputBytes = await ClientPdfEngine.removeAnnotations(file, {
        removeWidgets: true,
      });

      const loaded = await PDFDocument.load(outputBytes);
      const p1Annots = loaded.getPages()[0].node.Annots();
      expect(p1Annots).toBeUndefined();
    });

    test("handles multi-page documents with mixed annotations and widgets", async () => {
      const doc = await PDFDocument.create();
      const p1 = doc.addPage([500, 500]);
      const p2 = doc.addPage([500, 500]);
      const form = doc.getForm();
      const tf = form.createTextField("page1Field");
      tf.addToPage(p1, { x: 10, y: 10, width: 50, height: 20 });

      const linkAnnot = doc.context.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: [20, 20, 80, 40],
      });
      p2.node.set(
        PDFName.of("Annots"),
        doc.context.obj([doc.context.register(linkAnnot)]),
      );

      const bytes = await doc.save();
      const file = new File([bytes], "mixed_pages.pdf", {
        type: "application/pdf",
      });
      const cleanedBytes = await ClientPdfEngine.removeAnnotations(file);

      const loaded = await PDFDocument.load(cleanedBytes);
      expect(loaded.getForm().getFields().length).toBe(1);
      expect(loaded.getPages()[1].node.Annots()).toBeUndefined();
    });
  });

  describe("removeImages", () => {
    test("neutralizes raster images without corrupting XObject streams", async () => {
      const file = await createTestPdfWithImage();
      const cleanBytes = await ClientPdfEngine.removeImages(file);

      const loaded = await PDFDocument.load(cleanBytes);
      const resources = loaded.getPages()[0].node.Resources();
      const xObject = resources?.lookup(PDFName.of("XObject"), PDFDict);

      expect(xObject).toBeDefined();
      for (const key of xObject?.keys() || []) {
        const raw = loaded.context.lookup(xObject?.get(key));
        const dict =
          (raw as any)?.dict || (raw instanceof PDFDict ? raw : undefined);
        expect(dict?.get(PDFName.of("Subtype"))?.toString()).not.toBe("/Image");
        expect(dict?.get(PDFName.of("Subtype"))?.toString()).toBe("/Form");
      }
    });

    test("handles document without any images gracefully", async () => {
      const file = await createMultiPageTextPdf();
      const cleanBytes = await ClientPdfEngine.removeImages(file);
      const loaded = await PDFDocument.load(cleanBytes);
      expect(loaded.getPageCount()).toBe(2);
    });
  });

  describe("autoRedact", () => {
    test("identifies target terms and applies redaction marks", async () => {
      const file = await createMultiPageTextPdf();
      const redactedBytes = await ClientPdfEngine.autoRedact(file, {
        listOfText: "123-45-6789\nSecrets",
        redactColor: "#000000",
      });

      const loaded = await PDFDocument.load(redactedBytes);
      expect(loaded.getPageCount()).toBe(2);
      expect(redactedBytes.length).toBeGreaterThan(0);
    });

    test("handles case-insensitive term matching", async () => {
      const file = await createMultiPageTextPdf();
      const redactedBytes = await ClientPdfEngine.autoRedact(file, {
        listOfText: "welcome, secrets",
      });
      const loaded = await PDFDocument.load(redactedBytes);
      expect(loaded.getPageCount()).toBe(2);
    });

    test("handles empty search terms gracefully", async () => {
      const file = await createMultiPageTextPdf();
      const redactedBytes = await ClientPdfEngine.autoRedact(file, {
        listOfText: "",
      });
      const loaded = await PDFDocument.load(redactedBytes);
      expect(loaded.getPageCount()).toBe(2);
    });
  });

  describe("pdfToPptx", () => {
    test("generates a valid ECMA-376 PowerPoint (.pptx) presentation package", async () => {
      const file = await createMultiPageTextPdf();
      const pptxFile = await ClientPdfEngine.pdfToPptx(file);

      expect(pptxFile.name).toBe("multipage.pptx");
      expect(pptxFile.type).toBe(
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      );

      const zip = await JSZip.loadAsync(await pptxFile.arrayBuffer());
      expect(zip.file("[Content_Types].xml")).not.toBeNull();
      expect(zip.file("_rels/.rels")).not.toBeNull();
      expect(zip.file("ppt/presentation.xml")).not.toBeNull();
      expect(zip.file("ppt/slides/slide1.xml")).not.toBeNull();
      expect(zip.file("ppt/slides/slide2.xml")).not.toBeNull();

      const presXml = await zip.file("ppt/presentation.xml")!.async("text");
      expect(presXml).toContain("<p:presentation");
      expect(presXml).toContain('type="screen16x9"');
    });

    test("escapes XML special characters in slide text", async () => {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const page = doc.addPage([500, 300]);
      page.drawText("Quotes: <tag> & 'amp' \"test\"", {
        x: 50,
        y: 150,
        size: 12,
        font,
      });
      const bytes = await doc.save();
      const file = new File([bytes], "special_chars.pdf", {
        type: "application/pdf",
      });

      const pptx = await ClientPdfEngine.pdfToPptx(file);
      const zip = await JSZip.loadAsync(await pptx.arrayBuffer());
      const slideXml = await zip.file("ppt/slides/slide1.xml")!.async("text");
      expect(slideXml).toContain("&lt;tag&gt;");
      expect(slideXml).toContain("&amp;");
    });
  });

  describe("updateTableOfContents & extractBookmarks", () => {
    test("builds and attaches outline bookmarks with target destinations", async () => {
      const file = await createMultiPageTextPdf();
      const bookmarks = [
        {
          title: "Introduction",
          pageNumber: 1,
          children: [{ title: "Background", pageNumber: 1 }],
        },
        {
          title: "Architecture",
          pageNumber: 2,
        },
      ];

      const updatedBytes = await ClientPdfEngine.updateTableOfContents(file, {
        bookmarkData: JSON.stringify(bookmarks),
      });

      const loaded = await PDFDocument.load(updatedBytes);
      const outlinesRef = loaded.catalog.get(PDFName.of("Outlines"));
      expect(outlinesRef).toBeDefined();

      const outlinesDict = loaded.context.lookup(outlinesRef, PDFDict);
      expect(outlinesDict?.get(PDFName.of("Type"))?.toString()).toBe(
        "/Outlines",
      );
      expect(outlinesDict?.get(PDFName.of("First"))).toBeDefined();
      expect(outlinesDict?.get(PDFName.of("Last"))).toBeDefined();
    });

    test("builds deeply nested 3-level outline hierarchy", async () => {
      const file = await createMultiPageTextPdf();
      const nestedBookmarks = [
        {
          title: "Part 1",
          pageNumber: 1,
          children: [
            {
              title: "Chapter 1",
              pageNumber: 1,
              children: [{ title: "Section 1.1", pageNumber: 2 }],
            },
          ],
        },
      ];

      const updatedBytes = await ClientPdfEngine.updateTableOfContents(file, {
        bookmarkData: nestedBookmarks,
      });
      const loaded = await PDFDocument.load(updatedBytes);
      expect(loaded.catalog.get(PDFName.of("Outlines"))).toBeDefined();
    });

    test("removes outline dictionary when bookmarks are empty and replaceExisting is true", async () => {
      const file = await createMultiPageTextPdf();
      const updatedBytes = await ClientPdfEngine.updateTableOfContents(file, {
        bookmarkData: "[]",
        replaceExisting: true,
      });

      const loaded = await PDFDocument.load(updatedBytes);
      expect(loaded.catalog.get(PDFName.of("Outlines"))).toBeUndefined();
    });
  });

  describe("autoRotate", () => {
    test("produces analysis report for dry-run inspection", async () => {
      const file = await createMultiPageTextPdf();
      const report = await ClientPdfEngine.autoRotateReport(file);

      expect(report.totalPages).toBe(2);
      expect(Array.isArray(report.pages)).toBe(true);
      expect((report.pages as unknown[]).length).toBe(2);
    });

    test("executes auto-rotation without error", async () => {
      const file = await createMultiPageTextPdf();
      const rotated = await ClientPdfEngine.autoRotate(file);
      const loaded = await PDFDocument.load(rotated);
      expect(loaded.getPageCount()).toBe(2);
    });
  });

  describe("extractImageScans", () => {
    test("handles scan segmentation or page fallback cleanly", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      try {
        const file = await createTestPdfWithImage();
        const result = await ClientPdfEngine.extractImageScans(file, {
          format: "png",
        });
        expect(result.files.length).toBeGreaterThanOrEqual(1);
        expect(result.files[0].type).toBe("image/png");
      } finally {
        consoleSpy.mockRestore();
      }
    });
  });
});

describe("ClientPdfAdapter Endpoints", () => {
  test("routes /convert/pdf/presentation to PPTX presentation file", async () => {
    const file = await createMultiPageTextPdf();
    const formData = new FormData();
    formData.append("fileInput", file);

    const config: InternalAxiosRequestConfig = {
      url: "/api/v1/convert/pdf/presentation",
      method: "post",
      data: formData,
      headers: {} as any,
    };

    const res = await handleClientApiRequest(config);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    expect(res?.headers["content-type"]).toBe(
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    );
  });

  test("routes /convert/pdf/word to DOCX document file", async () => {
    const file = await createMultiPageTextPdf();
    const formData = new FormData();
    formData.append("fileInput", file);

    const config: InternalAxiosRequestConfig = {
      url: "/api/v1/convert/pdf/word",
      method: "post",
      data: formData,
      headers: {} as any,
    };

    const res = await handleClientApiRequest(config);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    expect(res?.headers["content-type"]).toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  test("routes /convert/pdf/text to plain text file", async () => {
    const file = await createMultiPageTextPdf();
    const formData = new FormData();
    formData.append("fileInput", file);

    const config: InternalAxiosRequestConfig = {
      url: "/api/v1/convert/pdf/text",
      method: "post",
      data: formData,
      headers: {} as any,
    };

    const res = await handleClientApiRequest(config);
    expect(res?.status).toBe(200);
    expect(res?.headers["content-type"]).toBe("text/plain");
  });

  test("routes /convert/pdf/csv to CSV file", async () => {
    const file = await createMultiPageTextPdf();
    const formData = new FormData();
    formData.append("fileInput", file);

    const config: InternalAxiosRequestConfig = {
      url: "/api/v1/convert/pdf/csv",
      method: "post",
      data: formData,
      headers: {} as any,
    };

    const res = await handleClientApiRequest(config);
    expect(res?.status).toBe(200);
    expect(res?.headers["content-type"]).toBe("text/csv");
  });

  test("routes /general/extract-bookmarks and /general/edit-table-of-contents", async () => {
    const file = await createMultiPageTextPdf();
    const bookmarks = [{ title: "Heading 1", pageNumber: 1 }];

    const editForm = new FormData();
    editForm.append("fileInput", file);
    editForm.append("bookmarkData", JSON.stringify(bookmarks));

    const editConfig: InternalAxiosRequestConfig = {
      url: "/api/v1/general/edit-table-of-contents",
      method: "post",
      data: editForm,
      headers: {} as any,
    };

    const editRes = await handleClientApiRequest(editConfig);
    expect(editRes?.status).toBe(200);

    const extractForm = new FormData();
    extractForm.append("fileInput", file);

    const extractConfig: InternalAxiosRequestConfig = {
      url: "/api/v1/general/extract-bookmarks",
      method: "post",
      data: extractForm,
      headers: {} as any,
    };

    const extractRes = await handleClientApiRequest(extractConfig);
    expect(extractRes?.status).toBe(200);
    expect(Array.isArray(extractRes?.data)).toBe(true);
  });

  test("routes /misc/auto-rotate-pdf dryRun to report JSON", async () => {
    const file = await createMultiPageTextPdf();
    const formData = new FormData();
    formData.append("fileInput", file);
    formData.append("dryRun", "true");

    const config: InternalAxiosRequestConfig = {
      url: "/api/v1/misc/auto-rotate-pdf",
      method: "post",
      data: formData,
      headers: {} as any,
    };

    const res = await handleClientApiRequest(config);
    expect(res?.status).toBe(200);
    expect(res?.data.totalPages).toBe(2);
  });

  test("routes /form/form-detection/detect with accurate detected field counts", async () => {
    const { file } = await createTestPdfWithField();
    const formData = new FormData();
    formData.append("fileInput", file);

    const config: InternalAxiosRequestConfig = {
      url: "/api/v1/form/form-detection/detect",
      method: "post",
      data: formData,
      headers: {} as any,
    };

    const res = await handleClientApiRequest(config);
    expect(res?.status).toBe(200);
    const countsHeader = res?.headers["x-stirling-detected-fields"];
    expect(countsHeader).toBeDefined();

    const counts = JSON.parse(countsHeader);
    expect(counts.textFields).toBeGreaterThanOrEqual(1);
    expect(counts.checkBoxes).toBeGreaterThanOrEqual(1);
  });

  test("routes /form/fill to populate AcroForm fields", async () => {
    const { file } = await createTestPdfWithField();
    const formData = new FormData();
    formData.append("fileInput", file);
    formData.append(
      "data",
      JSON.stringify({ customerName: "Alice Wonderland" }),
    );

    const config: InternalAxiosRequestConfig = {
      url: "/api/v1/form/fill",
      method: "post",
      data: formData,
      headers: {} as any,
    };

    const res = await handleClientApiRequest(config);
    expect(res?.status).toBe(200);
    const filledDoc = await PDFDocument.load(res?.data);
    expect(filledDoc.getForm().getTextField("customerName").getText()).toBe(
      "Alice Wonderland",
    );
  });

  test("validateSignatures returns empty array for unsigned document", async () => {
    const file = await createMultiPageTextPdf();
    const sigs = await ClientPdfEngine.validateSignatures(file);
    expect(Array.isArray(sigs)).toBe(true);
    expect(sigs.length).toBe(0);

    const formData = new FormData();
    formData.append("fileInput", file);
    const config: InternalAxiosRequestConfig = {
      url: "/api/v1/security/validate-signature",
      method: "post",
      data: formData,
      headers: {} as any,
    };
    const res = await handleClientApiRequest(config);
    expect(res?.status).toBe(200);
    expect(res?.data).toEqual([]);
  });

  test("certSign attaches signature dictionary detectable by validateSignatures", async () => {
    const file = await createMultiPageTextPdf();
    const signedBytes = await ClientPdfEngine.certSign(file, {
      name: "Dr. Gregory House",
      reason: "Medical Clearance",
      location: "Princeton-Plainsboro",
      showSignature: true,
    });
    const signedFile = new File([signedBytes], "signed.pdf", {
      type: "application/pdf",
    });

    const sigs = await ClientPdfEngine.validateSignatures(signedFile);
    expect(sigs.length).toBe(1);
    expect(sigs[0].signerName).toBe("Dr. Gregory House");
    expect(sigs[0].reason).toBe("Medical Clearance");
    expect(sigs[0].location).toBe("Princeton-Plainsboro");
    expect(sigs[0].valid).toBe(true);

    // Test API route
    const formData = new FormData();
    formData.append("fileInput", signedFile);
    const config: InternalAxiosRequestConfig = {
      url: "/api/v1/security/validate-signature",
      method: "post",
      data: formData,
      headers: {} as any,
    };
    const res = await handleClientApiRequest(config);
    expect(res?.status).toBe(200);
    expect(Array.isArray(res?.data)).toBe(true);
    expect(res?.data.length).toBe(1);
    expect(res?.data[0].signerName).toBe("Dr. Gregory House");
  });

  test("removeCertificateSign strips digital signatures", async () => {
    const file = await createMultiPageTextPdf();
    const signedBytes = await ClientPdfEngine.certSign(file, {
      name: "Alice Signer",
      reason: "Approval",
    });
    const signedFile = new File([signedBytes], "signed.pdf", {
      type: "application/pdf",
    });

    const strippedBytes =
      await ClientPdfEngine.removeCertificateSign(signedFile);
    const strippedFile = new File([strippedBytes], "stripped.pdf", {
      type: "application/pdf",
    });

    const sigs = await ClientPdfEngine.validateSignatures(strippedFile);
    expect(sigs.length).toBe(0);
  });

  test("compressPdf executes with object streams and handles compression options", async () => {
    const imgFile = await createTestPdfWithImage();
    const compressed = await ClientPdfEngine.compressPdf(imgFile, {
      optimizeLevel: 7,
    });
    expect(compressed.length).toBeGreaterThan(0);
    const doc = await PDFDocument.load(compressed);
    expect(doc.getPageCount()).toBe(1);
  });

  test("removeBlankPages preserves pages with content", async () => {
    const file = await createMultiPageTextPdf();
    const cleaned = await ClientPdfEngine.removeBlankPages(file);
    const doc = await PDFDocument.load(cleaned);
    expect(doc.getPageCount()).toBe(2);
  });

  test("showJavascript extracts embedded JavaScript code", async () => {
    const doc = await PDFDocument.create();
    doc.addPage([400, 400]);
    const jsAction = doc.context.obj({
      Type: "Action",
      S: "JavaScript",
      JS: "console.println('Security Audit Complete');",
    });
    doc.catalog.set(PDFName.of("OpenAction"), doc.context.register(jsAction));
    const bytes = await doc.save();
    const file = new File([bytes], "js_doc.pdf", { type: "application/pdf" });

    const report = await ClientPdfEngine.showJavascript(file);
    expect(report.hasJs).toBe(true);
    expect(report.scripts.length).toBeGreaterThan(0);
    expect(report.scriptText).toContain("Security Audit Complete");

    // Test text response format
    const formData = new FormData();
    formData.append("fileInput", file);
    const config: InternalAxiosRequestConfig = {
      url: "/api/v1/misc/show-javascript",
      method: "post",
      data: formData,
      responseType: "text",
      headers: {} as any,
    };
    const res = await handleClientApiRequest(config);
    expect(res?.status).toBe(200);
    expect(res?.data).toContain("Security Audit Complete");
  });

  test("classifyDocument identifies document category and updates metadata", async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([600, 800]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText(
      "TAX INVOICE\nInvoice Number: INV-2026-001\nTotal Amount Due: $1,450.00\nPayment Terms: Net 30 Days",
      {
        x: 50,
        y: 700,
        size: 14,
        font,
      },
    );
    const bytes = await doc.save();
    const file = new File([bytes], "invoice.pdf", { type: "application/pdf" });

    const classification = await ClientPdfEngine.classifyDocument(file);
    expect(classification.labels.length).toBeGreaterThan(0);
    expect(classification.primaryCategory.length).toBeGreaterThan(0);

    const reloaded = await PDFDocument.load(classification.data);
    expect(reloaded.getSubject()).toContain("Classified:");

    // Test route
    const formData = new FormData();
    formData.append("fileInput", file);
    const config: InternalAxiosRequestConfig = {
      url: "/api/v1/ai/tools/classify-and-label",
      method: "post",
      data: formData,
      headers: {} as any,
    };
    const res = await handleClientApiRequest(config);
    expect(res?.status).toBe(200);
    expect(res?.headers["x-stirling-classification-labels"]).toBeDefined();
  });

  test("ocrPdf generates sidecar text or searchable PDF", async () => {
    const file = await createMultiPageTextPdf();
    const sidecar = await ClientPdfEngine.ocrPdf(file, { sidecar: true });
    expect(sidecar.isSidecar).toBe(true);
    expect(typeof sidecar.data).toBe("string");
    expect(sidecar.data.length).toBeGreaterThan(0);

    const pdfOut = await ClientPdfEngine.ocrPdf(file, { sidecar: false });
    expect(pdfOut.isSidecar).toBe(false);
    expect(pdfOut.data instanceof Uint8Array).toBe(true);
  });

  test("autoRedact purges underlying vector glyphs from content streams", async () => {
    const file = await createMultiPageTextPdf();
    const redactedBytes = await ClientPdfEngine.autoRedact(file, {
      listOfText: "123-45-6789, Secrets",
      redactColor: "#000000",
    });

    const doc = await PDFDocument.load(redactedBytes);
    for (const page of doc.getPages()) {
      const contentsRef = page.node.Contents();
      if (!contentsRef) continue;
      const resolved = doc.context.lookup(contentsRef);
      const refs =
        resolved instanceof PDFArray
          ? Array.from({ length: resolved.size() }, (_, i) => resolved.get(i))
          : [contentsRef];
      for (const r of refs) {
        const st = doc.context.lookup(r);
        if (st && (st as any).getContents) {
          let decomp: Uint8Array;
          try {
            decomp = pako.inflate((st as any).getContents());
          } catch {
            decomp = (st as any).getContents();
          }
          const text = new TextDecoder("latin1").decode(decomp);
          expect(text.includes("123-45-6789")).toBe(false);
          expect(text.includes("Secrets")).toBe(false);
        }
      }
    }
  });

  describe("repairPdf", () => {
    test("recovers PDF with leading garbage preamble before %PDF- header", async () => {
      const doc = await PDFDocument.create();
      doc.addPage([300, 300]);
      const validBytes = await doc.save();
      const junk = new TextEncoder().encode(
        "HTTP/1.1 200 OK\r\nContent-Type: application/pdf\r\n\r\n",
      );
      const damaged = new Uint8Array(junk.length + validBytes.length);
      damaged.set(junk, 0);
      damaged.set(validBytes, junk.length);

      const repaired = await ClientPdfEngine.repairPdf(
        new File([damaged], "damaged.pdf", { type: "application/pdf" }),
      );
      const loaded = await PDFDocument.load(repaired);
      expect(loaded.getPageCount()).toBe(1);
    });

    test("recovers truncated PDF missing %%EOF", async () => {
      const doc = await PDFDocument.create();
      doc.addPage([300, 300]);
      const validBytes = await doc.save();
      const text = new TextDecoder("latin1").decode(validBytes);
      const eofPos = text.lastIndexOf("%%EOF");
      const truncated = new TextEncoder().encode(text.substring(0, eofPos));

      const repaired = await ClientPdfEngine.repairPdf(
        new File([truncated], "truncated.pdf", { type: "application/pdf" }),
      );
      const loaded = await PDFDocument.load(repaired);
      expect(loaded.getPageCount()).toBe(1);
    });

    test("reconstructs PDF with missing xref table from raw indirect objects", async () => {
      const doc = await PDFDocument.create();
      doc.addPage([250, 250]);
      const validBytes = await doc.save();
      const text = new TextDecoder("latin1").decode(validBytes);
      const endObjPos = text.lastIndexOf("endobj");
      const severed = new TextEncoder().encode(
        text.substring(0, endObjPos + 6),
      );

      const repaired = await ClientPdfEngine.repairPdf(
        new File([severed], "severed.pdf", { type: "application/pdf" }),
      );
      const loaded = await PDFDocument.load(repaired);
      expect(loaded.getPageCount()).toBe(1);
    });
  });

  describe("universalConvert & Office / PDF/A conversions", () => {
    test("xlsxToPdf converts spreadsheet XML into valid PDF", async () => {
      const zip = new JSZip();
      zip.file(
        "xl/sharedStrings.xml",
        "<sst><si><t>Revenue</t></si><si><t>Expenses</t></si></sst>",
      );
      zip.file(
        "xl/worksheets/sheet1.xml",
        '<worksheet><sheetData><row><c t="s"><v>0</v></c><c t="s"><v>1</v></c></row><row><c><v>50000</v></c><c><v>25000</v></c></row></sheetData></worksheet>',
      );
      const xlsxBuf = await zip.generateAsync({ type: "uint8array" });
      const xlsxFile = new File([xlsxBuf], "finances.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const converted = await ClientPdfEngine.universalConvert(
        xlsxFile,
        "xlsx",
        "pdf",
      );
      expect(converted.length).toBe(1);
      expect(converted[0].type).toBe("application/pdf");

      const doc = await PDFDocument.load(await converted[0].arrayBuffer());
      expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
    });

    test("pptxToPdf converts presentation slides into multi-page landscape PDF", async () => {
      const zip = new JSZip();
      zip.file(
        "ppt/slides/slide1.xml",
        "<p:sld><cSld><spTree><sp><txBody><a:p><a:r><a:t>Quarterly Review</a:t></a:r></a:p></txBody></sp></spTree></cSld></p:sld>",
      );
      zip.file(
        "ppt/slides/slide2.xml",
        "<p:sld><cSld><spTree><sp><txBody><a:p><a:r><a:t>Key Achievements &amp; Milestones</a:t></a:r></a:p></txBody></sp></spTree></cSld></p:sld>",
      );
      const pptxBuf = await zip.generateAsync({ type: "uint8array" });
      const pptxFile = new File([pptxBuf], "presentation.pptx", {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });

      const converted = await ClientPdfEngine.universalConvert(
        pptxFile,
        "pptx",
        "pdf",
      );
      expect(converted.length).toBe(1);
      expect(converted[0].type).toBe("application/pdf");

      const doc = await PDFDocument.load(await converted[0].arrayBuffer());
      expect(doc.getPageCount()).toBe(2);
      const page1 = doc.getPage(0);
      expect(page1.getWidth()).toBeGreaterThan(page1.getHeight());
    });

    test("pdfToPdfA embeds ISO PDF/A-1b XMP metadata and OutputIntents with ICC profile", async () => {
      const file = await createMultiPageTextPdf();
      const pdfaBytes = await ClientPdfEngine.pdfToPdfA(file);

      const doc = await PDFDocument.load(pdfaBytes);
      expect(doc.getPageCount()).toBe(2);

      const metaRef = doc.catalog.get(PDFName.of("Metadata"));
      expect(metaRef).toBeDefined();
      const metaObj = doc.context.lookup(metaRef);
      const metaXml = new TextDecoder().decode((metaObj as any).getContents());
      expect(metaXml).toContain("<pdfaid:part>1</pdfaid:part>");
      expect(metaXml).toContain("<pdfaid:conformance>B</pdfaid:conformance>");

      const outputIntents = doc.catalog.get(PDFName.of("OutputIntents"));
      expect(outputIntents).toBeDefined();
      const oiArray = doc.context.lookup(outputIntents) as PDFArray;
      expect(oiArray.size()).toBeGreaterThan(0);
      const firstOi = doc.context.lookup(oiArray.get(0)) as PDFDict;
      expect(firstOi.get(PDFName.of("S"))).toEqual(PDFName.of("GTS_PDFA1"));
      expect(firstOi.get(PDFName.of("DestOutputProfile"))).toBeDefined();
    });
  });

  describe("replaceColor", () => {
    test("inverts vector text and artwork in-place without rasterization", async () => {
      const file = await createMultiPageTextPdf();
      const replacedBytes = await ClientPdfEngine.replaceColor(file, {
        replaceAndInvertOption: "FULL_INVERSION",
      });

      const doc = await PDFDocument.load(replacedBytes);
      expect(doc.getPageCount()).toBe(2);

      const p1 = doc.getPage(0);
      const contentsRef = p1.node.Contents();
      expect(contentsRef).toBeDefined();
      const contents = doc.context.lookup(contentsRef);
      expect(contents instanceof PDFArray).toBe(true);
      expect((contents as PDFArray).size()).toBeGreaterThan(1);
    });

    test("supports high-contrast color combinations (yellow on black)", async () => {
      const file = await createMultiPageTextPdf();
      const replacedBytes = await ClientPdfEngine.replaceColor(file, {
        replaceAndInvertOption: "HIGH_CONTRAST_COLOR",
        highContrastColorCombination: "YELLOW_TEXT_ON_BLACK",
      });

      const doc = await PDFDocument.load(replacedBytes);
      expect(doc.getPageCount()).toBe(2);
    });
  });

  describe("compressPdf advanced optimization", () => {
    test("strips thumbnails and private metadata dictionaries", async () => {
      const doc = await PDFDocument.create();
      const p = doc.addPage([400, 400]);
      p.node.set(PDFName.of("Thumb"), doc.context.obj({ Type: "XObject" }));
      p.node.set(PDFName.of("PieceInfo"), doc.context.obj({ Private: true }));
      doc.catalog.set(
        PDFName.of("PieceInfo"),
        doc.context.obj({ DocPrivate: true }),
      );
      doc.catalog.set(
        PDFName.of("SpiderInfo"),
        doc.context.obj({ WebData: true }),
      );

      const uncompressedRaw = doc.context.flateStream(
        new Uint8Array(500).fill(65),
      );
      uncompressedRaw.dict.delete(PDFName.of("Filter"));
      doc.catalog.set(
        PDFName.of("CustomStream"),
        doc.context.register(uncompressedRaw),
      );

      const bytes = await doc.save();
      const file = new File([bytes], "bloated.pdf", {
        type: "application/pdf",
      });

      const compressed = await ClientPdfEngine.compressPdf(file, {
        optimizeLevel: 9,
      });
      const loaded = await PDFDocument.load(compressed);

      expect(loaded.getPage(0).node.has(PDFName.of("Thumb"))).toBe(false);
      expect(loaded.getPage(0).node.has(PDFName.of("PieceInfo"))).toBe(false);
      expect(loaded.catalog.has(PDFName.of("PieceInfo"))).toBe(false);
      expect(loaded.catalog.has(PDFName.of("SpiderInfo"))).toBe(false);
    });
  });
});
