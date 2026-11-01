import React, { useState, useMemo } from "react";
import {
  Container,
  Title,
  Text,
  Badge,
  Card,
  TextInput,
  Accordion,
  Group,
  Stack,
  Code,
  Paper,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { BaseToolProps } from "@app/types/tool";
import { Icon } from "@app/ui/Icon";

interface ApiEndpointInfo {
  category: string;
  name: string;
  endpoint: string;
  method: "POST" | "GET";
  description: string;
  engineMethod: string;
  parameters?: string[];
}

const API_ENDPOINTS: ApiEndpointInfo[] = [
  {
    category: "Security & Privacy",
    name: "Auto Redact",
    endpoint: "/api/v1/security/auto-redact",
    method: "POST",
    description:
      "Detects sensitive terms, computes exact page bounding boxes, and draws visual redaction marks.",
    engineMethod: "ClientPdfEngine.autoRedact",
    parameters: ["fileInput", "listOfText", "redactColor"],
  },
  {
    category: "Security & Privacy",
    name: "Remove Annotations",
    endpoint: "/api/v1/security/remove-annotations",
    method: "POST",
    description:
      "Strips visual comments, markups, and highlights while preserving interactive AcroForm widgets.",
    engineMethod: "ClientPdfEngine.removeAnnotations",
    parameters: ["fileInput", "removeWidgets?"],
  },
  {
    category: "Security & Privacy",
    name: "Sanitize PDF",
    endpoint: "/api/v1/security/sanitize-pdf",
    method: "POST",
    description:
      "Removes metadata, JavaScript streams, attachments, and embedded tracking data.",
    engineMethod: "ClientPdfEngine.sanitizePdf",
    parameters: ["fileInput"],
  },
  {
    category: "Document Conversion",
    name: "Convert to PowerPoint (PPTX)",
    endpoint: "/api/v1/convert/pdf/presentation",
    method: "POST",
    description:
      "Generates an ECMA-376 PowerPoint presentation package (.pptx) with slides containing extracted page text.",
    engineMethod: "ClientPdfEngine.pdfToPptx",
    parameters: ["fileInput"],
  },
  {
    category: "Document Conversion",
    name: "Convert to Word (DOCX)",
    endpoint: "/api/v1/convert/pdf/word",
    method: "POST",
    description:
      "Generates an ECMA-376 Word package (.docx) containing formatted document paragraphs.",
    engineMethod: "ClientPdfEngine.pdfToDocx",
    parameters: ["fileInput"],
  },
  {
    category: "Document Conversion",
    name: "Convert to Text / Markdown",
    endpoint: "/api/v1/convert/pdf/text",
    method: "POST",
    description:
      "Extracts text content across pages into plain text or structured Markdown format.",
    engineMethod: "ClientPdfEngine.pdfToText",
    parameters: ["fileInput"],
  },
  {
    category: "Document Organization",
    name: "Auto Rotate",
    endpoint: "/api/v1/misc/auto-rotate-pdf",
    method: "POST",
    description:
      "Analyzes text orientation matrices per page and corrects upside-down or sideways pages.",
    engineMethod: "ClientPdfEngine.autoRotate",
    parameters: ["fileInput", "dryRun?"],
  },
  {
    category: "Document Organization",
    name: "Edit Table of Contents",
    endpoint: "/api/v1/general/edit-table-of-contents",
    method: "POST",
    description:
      "Updates or builds hierarchical PDF outline bookmarks with target page destinations.",
    engineMethod: "ClientPdfEngine.updateTableOfContents",
    parameters: ["fileInput", "bookmarkData", "replaceExisting?"],
  },
  {
    category: "Document Organization",
    name: "Extract Bookmarks",
    endpoint: "/api/v1/general/extract-bookmarks",
    method: "POST",
    description:
      "Extracts existing outline tree bookmarks and destinations as structured JSON.",
    engineMethod: "ClientPdfEngine.extractBookmarks",
    parameters: ["fileInput"],
  },
  {
    category: "Document Optimization",
    name: "Remove Images",
    endpoint: "/api/v1/misc/remove-images",
    method: "POST",
    description:
      "Neutralizes raster image streams into lightweight blank XObjects without corrupting content streams.",
    engineMethod: "ClientPdfEngine.removeImages",
    parameters: ["fileInput"],
  },
  {
    category: "Scanner & Imaging",
    name: "Scanner Image Split",
    endpoint: "/api/v1/misc/extract-image-scans",
    method: "POST",
    description:
      "Segments multiple items (photos, receipts, cards) from flatbed scanner pages into separate cropped images.",
    engineMethod: "ClientPdfEngine.extractImageScans",
    parameters: ["fileInput", "format?", "dpi?"],
  },
  {
    category: "Forms & Fields",
    name: "Detect Form Fields",
    endpoint: "/api/v1/form/form-detection/detect",
    method: "POST",
    description:
      "Inspects AcroForm field counts and properties across text, check, and radio widgets.",
    engineMethod: "ClientPdfEngine.getFormFields",
    parameters: ["fileInput"],
  },
  {
    category: "Forms & Fields",
    name: "Fill Form Fields",
    endpoint: "/api/v1/form/fill",
    method: "POST",
    description:
      "Populates AcroForm inputs with structured key-value data, with optional visual flattening.",
    engineMethod: "ClientPdfEngine.fillForm",
    parameters: ["fileInput", "data", "flatten?"],
  },
];

const SwaggerUI: React.FC<BaseToolProps> = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");

  const filteredEndpoints = useMemo(() => {
    if (!filter.trim()) return API_ENDPOINTS;
    const q = filter.toLowerCase();
    return API_ENDPOINTS.filter(
      (ep) =>
        ep.name.toLowerCase().includes(q) ||
        ep.endpoint.toLowerCase().includes(q) ||
        ep.category.toLowerCase().includes(q) ||
        ep.description.toLowerCase().includes(q),
    );
  }, [filter]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    filteredEndpoints.forEach((ep) => set.add(ep.category));
    return Array.from(set);
  }, [filteredEndpoints]);

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <div>
          <Group justify="space-between" align="center" mb="xs">
            <Title order={2}>
              {t("swagger.title", "Client API & Tools Reference")}
            </Title>
            <Badge color="green" variant="light" size="lg">
              100% Client-Side Engine
            </Badge>
          </Group>
          <Text c="dimmed" size="sm">
            Fold processes all documents entirely within your browser sandbox
            using WebAssembly and PDF.js. No document data is sent to external
            servers.
          </Text>
        </div>

        <Paper withBorder p="md" radius="md">
          <TextInput
            placeholder={t(
              "swagger.search",
              "Search endpoints, tools, or operations...",
            )}
            value={filter}
            onChange={(e) => setFilter(e.currentTarget.value)}
            leftSection={<Icon name="search" size={16} />}
          />
        </Paper>

        <Accordion variant="separated" radius="md" defaultValue={categories[0]}>
          {categories.map((cat) => (
            <Accordion.Item key={cat} value={cat}>
              <Accordion.Control>
                <Group justify="space-between" pr="md">
                  <Text fw={600}>{cat}</Text>
                  <Badge variant="subtle">
                    {
                      filteredEndpoints.filter((ep) => ep.category === cat)
                        .length
                    }{" "}
                    endpoints
                  </Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  {filteredEndpoints
                    .filter((ep) => ep.category === cat)
                    .map((ep) => (
                      <Card
                        key={ep.endpoint}
                        withBorder
                        padding="sm"
                        radius="sm"
                      >
                        <Group
                          justify="space-between"
                          align="flex-start"
                          mb="xs"
                        >
                          <div>
                            <Group gap="xs" mb={4}>
                              <Badge
                                color={ep.method === "POST" ? "blue" : "teal"}
                                size="sm"
                              >
                                {ep.method}
                              </Badge>
                              <Text fw={600} size="sm">
                                {ep.name}
                              </Text>
                            </Group>
                            <Code>{ep.endpoint}</Code>
                          </div>
                          <Badge color="gray" variant="outline" size="xs">
                            {ep.engineMethod}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed" mb="xs">
                          {ep.description}
                        </Text>
                        {ep.parameters && ep.parameters.length > 0 && (
                          <Group gap={4}>
                            <Text size="xs" fw={500}>
                              Parameters:
                            </Text>
                            {ep.parameters.map((param) => (
                              <Badge
                                key={param}
                                size="xs"
                                variant="light"
                                color="gray"
                              >
                                {param}
                              </Badge>
                            ))}
                          </Group>
                        )}
                      </Card>
                    ))}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Stack>
    </Container>
  );
};

export default SwaggerUI;
