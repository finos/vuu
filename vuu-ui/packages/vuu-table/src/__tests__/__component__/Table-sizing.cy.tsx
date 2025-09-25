// TODO try and get TS path alias working to avoid relative paths like this
import { CheckboxSelection } from "../../../../../showcase/src/examples/Table/TableSelection.examples";
import { TestTable } from "../../../../../showcase/src/examples/Table/Misc.examples";
import {
  ViewportRowLimitDefaultRowHeight,
  ViewportRowLimitExplicitRowHeight,
  MaxViewportRowLimitRowsExceedLimit,
  MaxViewportRowLimitFewRows,
} from "../../../../../showcase/src/examples/Table/TableLayout.examples";
import { LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";

const haveHeight = (value: number) => (el: JQuery<HTMLElement>) =>
  expect(el.height()).eq(value);
const haveWidth = (value: number) => (el: JQuery<HTMLElement>) =>
  expect(el.width()).eq(value);

describe("explicit sizing", () => {
  it("no scrollbars required, columns default (static) sizing, width greater than combined column width", () => {
    cy.mount(<TestTable height={625} rowCount={20} width={1000} />);
    cy.findByTestId("test-table").should(haveWidth(1000));
    cy.findByTestId("test-table").should(haveHeight(625));
    cy.get(".vuuTable-scrollbarContainer").should(haveWidth(1000));
    cy.get(".vuuTable-scrollbarContainer").should(haveHeight(600));
    cy.get(".vuuTable-contentContainer").should(haveWidth(1000));
    cy.get(".vuuTable-contentContainer").should(haveHeight(625));
    cy.findAllByRole("table").should(haveWidth(908));
    // 20 rows @ 20 plus header height 25
    cy.findAllByRole("table").should(haveHeight(425));
  });

  it("no scrollbars required, columns fit sizing, width greater than combined default column width", () => {
    cy.mount(
      <TestTable columnLayout="fit" height={625} rowCount={20} width={1000} />,
    );
    cy.findByTestId("test-table").should(haveWidth(1000));
    cy.findByTestId("test-table").should(haveHeight(625));
    cy.get(".vuuTable-scrollbarContainer").should(haveWidth(1000));
    cy.get(".vuuTable-scrollbarContainer").should(haveHeight(600));
    cy.get(".vuuTable-contentContainer").should(haveWidth(1000));
    cy.get(".vuuTable-contentContainer").should(haveHeight(625));
    cy.findAllByRole("table").should(haveWidth(1000));
    // 20 rows @ 20 plus header height 25
    cy.findAllByRole("table").should(haveHeight(425));
  });

  it("vertical scrollbar required, columns default (static) sizing, width greater than combined column width", () => {
    cy.mount(<TestTable height={625} rowCount={100} width={1000} />);
    cy.findByTestId("test-table").should(haveWidth(1000));
    cy.findByTestId("test-table").should(haveHeight(625));
    cy.get(".vuuTable-scrollbarContainer").should(haveWidth(1000));
    cy.get(".vuuTable-scrollbarContainer").should(haveHeight(600));
    cy.get(".vuuTable-contentContainer").should(haveWidth(990));
    cy.get(".vuuTable-contentContainer").should(haveHeight(625));
    cy.findAllByRole("table").should(haveWidth(908));
    // 100 rows @ 20 plus header height 25
    cy.findAllByRole("table").should(haveHeight(2025));
  });

  it("vertical scrollbar required, columns fit sizing, width greater than combined column width", () => {
    cy.mount(
      <TestTable columnLayout="fit" height={625} rowCount={100} width={1000} />,
    );
    cy.findByTestId("test-table").should(haveWidth(1000));
    cy.findByTestId("test-table").should(haveHeight(625));
    cy.get(".vuuTable-scrollbarContainer").should(haveWidth(1000));
    cy.get(".vuuTable-scrollbarContainer").should(haveHeight(600));
    cy.get(".vuuTable-contentContainer").should(haveWidth(990));
    cy.get(".vuuTable-contentContainer").should(haveHeight(625));
    cy.findAllByRole("table").should(haveWidth(990));
    // 100 rows @ 20 plus header height 25
    cy.findAllByRole("table").should(haveHeight(2025));
  });

  it("vertical scrollbars required, checkbox selection, columns fit sizing, width greater than combined default column width", () => {
    cy.mount(
      <LocalDataSourceProvider>
        <CheckboxSelection columnLayout="fit" height={625} width={1000} />
      </LocalDataSourceProvider>,
    );
    cy.findByTestId("table").should(haveWidth(1000));
    cy.findByTestId("table").should(haveHeight(625));
    cy.get(".vuuTable-scrollbarContainer").should(haveWidth(1000));
    cy.get(".vuuTable-scrollbarContainer").should(haveHeight(600));
    cy.get(".vuuTable-contentContainer").should(haveWidth(990));
    cy.get(".vuuTable-contentContainer").should(haveHeight(625));
    cy.findAllByRole("table").should(haveWidth(990));
  });

  it("vertical and horizontal scrollbars required, columns default (static) sizing, width greater than combined column width", () => {
    cy.mount(<TestTable height={625} rowCount={100} width={800} />);
    cy.findByTestId("test-table").should(haveWidth(800));
    cy.findByTestId("test-table").should(haveHeight(625));
    cy.get(".vuuTable-scrollbarContainer").should(haveWidth(800));
    cy.get(".vuuTable-scrollbarContainer").should(haveHeight(600));
    cy.get(".vuuTable-contentContainer").should(haveWidth(790));
    cy.get(".vuuTable-contentContainer").should(haveHeight(615));
    cy.findAllByRole("table").should(haveWidth(908));
    // 100 rows @ 20 plus header height 25
    cy.findAllByRole("table").should(haveHeight(2025));
  });
});

describe("viewportRowLimit", () => {
  describe("WHEN rendered with default rowHeight", () => {
    it("THEN expected classname is present and all dimensions are correct", () => {
      cy.mount(<ViewportRowLimitDefaultRowHeight />);
      const container = cy.findByTestId("table");
      container.should("have.class", "vuuTable-viewportRowLimit");
      cy.findByTestId("table").should(haveHeight(235));
      cy.get(".vuuTable-contentContainer").should(haveHeight(225));
      cy.get(".vuuTable-scrollbarContainer").should(haveHeight(210));
    });
  });

  describe("WHEN rendered with explicit rowHeight", () => {
    it("THEN expected classname is present", () => {
      cy.mount(<ViewportRowLimitExplicitRowHeight />);
      cy.findByTestId("table").should(haveHeight(335));
      cy.get(".vuuTable-contentContainer").should(haveHeight(325));
      cy.get(".vuuTable-scrollbarContainer").should(haveHeight(310));
    });
  });
});

describe("maxViewportRowLimit", () => {
  describe("WHEN rendered with more rows than viewport can accommodate", () => {
    it("THEN height is based on rows rendered", () => {
      cy.mount(<MaxViewportRowLimitRowsExceedLimit />);
      const container = cy.findByTestId("table");
      container.should("have.class", "vuuTable-maxViewportRowLimit");
      cy.findByTestId("table").should((el) => expect(el.height()).eq(235));
      cy.get(".vuuTable-contentContainer").should((el) =>
        expect(el.height()).eq(225),
      );
      cy.get(".vuuTable-scrollbarContainer").should((el) =>
        expect(el.height()).eq(210),
      );
    });
  });

  describe("WHEN rendered with not enough rows to fill viewport, no horizontal scrollbar", () => {
    it("THEN height id reduced to just accommodate visible rows", () => {
      cy.mount(<MaxViewportRowLimitFewRows />);
      cy.findByTestId("table").should((el) => expect(el.height()).eq(105));
      cy.get(".vuuTable-contentContainer").should((el) =>
        expect(el.height()).eq(105),
      );
      cy.get(".vuuTable-scrollbarContainer").should((el) =>
        expect(el.height()).eq(80),
      );
    });
  });
  describe("WHEN rendered with not enough rows to fill viewport, with horizontal scrollbar", () => {
    it("THEN height id reduced to just accommodate visible rows", () => {
      cy.mount(<MaxViewportRowLimitFewRows width={300} />);
      cy.findByTestId("table").should((el) => expect(el.height()).eq(115));
      cy.get(".vuuTable-contentContainer").should((el) =>
        expect(el.height()).eq(105),
      );
      cy.get(".vuuTable-scrollbarContainer").should((el) =>
        expect(el.height()).eq(90),
      );
    });
  });
});
