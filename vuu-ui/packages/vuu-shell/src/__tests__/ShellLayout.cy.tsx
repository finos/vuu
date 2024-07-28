import {
  DefaultShell,
  SimpleShellCustomHeader,
  SimpleShellNoWorkspaceTabs,
} from "../../../../showcase/src/examples/Shell/ShellLayout.examples";

describe("ShellLayout", () => {
  describe("WHEN rendered with no configuration", () => {
    it("THEN simple workspace is rendered", () => {
      cy.mount(<DefaultShell />);
      cy.findByTestId("shell").should("have.class", "vuuShell");
      cy.findByTestId("shell").should("be.sizedToFillViewport");
      cy.findByRole("banner").should("be.visible");
      cy.findByRole("banner").should("have.class", "vuuAppHeader");
      cy.findByRole("tablist", { name: "Workspace Tabs" }).should("be.visible");
    });
  });

  describe("WHEN rendered with a custom header", () => {
    it("THEN that header is rendered", () => {
      cy.mount(<SimpleShellCustomHeader />);
      cy.findByRole("banner", { name: "Custom Header" }).should("be.visible");
      cy.findByRole("tablist", { name: "Workspace Tabs" }).should("be.visible");
    });
  });

  describe("WHEN rendered with workspace tabs disabled", () => {
    it("THEN no workspace tabs are rendered", () => {
      cy.mount(<SimpleShellNoWorkspaceTabs />);
      cy.findByTestId("shell").should("be.sizedToFillViewport");
      cy.findByRole("tablist", { name: "Workspace Tabs" }).should("not.exist");
    });
  });
});
