import { describe, expect, it, vi } from "vitest";
import { render as rtlRender, screen, fireEvent } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";

vi.mock("@app/ui/Icon", () => ({
  Icon: () => null,
}));

import SwaggerUI from "@app/tools/SwaggerUI";

const render = (ui: React.ReactNode) =>
  rtlRender(<MantineProvider>{ui}</MantineProvider>);

describe("SwaggerUI", () => {
  it("renders Client API & Tools Reference interface without throwing", () => {
    render(<SwaggerUI />);
    expect(screen.getByText("100% Client-Side Engine")).toBeInTheDocument();
    expect(screen.getByText(/Fold processes all documents/i)).toBeInTheDocument();
  });

  it("filters endpoints when typing in the search box", () => {
    render(<SwaggerUI />);
    const searchInput = screen.getByPlaceholderText("swagger.search");
    fireEvent.change(searchInput, { target: { value: "redact" } });
    expect(screen.getByText("Auto Redact")).toBeInTheDocument();
  });
});
