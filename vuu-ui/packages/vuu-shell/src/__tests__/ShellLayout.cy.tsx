import {
  DefaultShell,
  SimpleShellCustomHeader,
  SimpleShellNoWorkspaceTabs,
  SimpleShellCustomPlaceholder,
  SimpleShellMultiLayouts,
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

  describe("WHEN rendered with a default layout and custom placeholder", () => {
    it("THEN custom layout is rendered", () => {
      cy.mount(<SimpleShellCustomPlaceholder />);
      cy.findByTestId("shell").should("be.sizedToFillViewport");
      cy.findByTestId("custom-placeholder").should("be.visible");
    });
    describe("AND WHEN workspace tab is added", () => {
      it("THEN custom placeholder is used to create new layout", () => {
        cy.mount(<SimpleShellCustomPlaceholder />);
        cy.findByRole("img", { name: "Create Tab" }).realClick();
        cy.findAllByRole("tab").should("have.length", 2);

        cy.findByTestId("custom-placeholder").should("be.visible");
      });
    });
  });

  describe("WHEN rendered with two layouts and custom placeholders", () => {
    it("THEN custom layout with active index is rendered", () => {
      cy.mount(<SimpleShellMultiLayouts />);
      cy.findByTestId("shell").should("be.sizedToFillViewport");
      cy.findByTestId("custom-placeholder2").should("be.visible");
    });
    describe("AND WHEN workspace tab is added", () => {
      it("THEN custom placeholder is used to create new layout", () => {
        cy.mount(<SimpleShellMultiLayouts />);
        cy.findByRole("img", { name: "Create Tab" }).realClick();
        cy.findAllByRole("tab").should("have.length", 3);

        cy.findByTestId("custom-placeholder2").should("be.visible");
      });
    });
  });
});
