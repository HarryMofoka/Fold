// Meters an in-browser automation run.

import apiClient from "@app/services/apiClient";

/** One input document's page count (0 for non-PDF / unknown) and byte size. */
export interface AutomationMeterInput {
  pages: number;
  bytes: number;
}

export interface AutomationMeterPayload {
  /** Only the existing Automate tool is included in a self-hosted Server licence. */
  source?: "AUTOMATE" | "PROCESSOR";
  automationName?: string;
  operations?: string[];
  inputs: AutomationMeterInput[];
}

export function meterAutomationRun(payload: AutomationMeterPayload): void {
  void apiClient
    .post(`/api/v1/automation/meter`, payload, { suppressErrorToast: true })
    .catch(() => {
      // Best-effort billing; the automation already succeeded in the browser.
    });
}
