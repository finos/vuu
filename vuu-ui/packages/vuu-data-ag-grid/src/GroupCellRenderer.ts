import { GroupCellRendererParams } from "ag-grid-community";

export class GroupCellRenderer {
  private eGui: HTMLDivElement | null = null;
  private eContainer: HTMLSpanElement | null = null;
  private eValue: HTMLSpanElement | null = null;
  private eContracted: HTMLSpanElement | null = null;
  private eExpanded: HTMLSpanElement | null = null;

  private params: GroupCellRendererParams | undefined;
  init(params: GroupCellRendererParams) {
    this.params = params;

    this.eGui = document.createElement("div");

    const TEMPLATE =
      /* html */
      `<span class="ag-cell-wrapper">
              <span class="ag-group-expanded" ref="eExpanded">
              <span class="ag-icon ag-icon-tree-open" unselectable="on" role="presentation"></span>
              </span>
              <span class="ag-group-contracted" ref="eContracted">
              <span class="ag-icon ag-icon-tree-closed" unselectable="on" role="presentation"></span></span>
              <span class="ag-group-checkbox ag-invisible" ref="eCheckbox"></span>
              <span class="ag-group-value" ref="eValue"></span>
          </span>`;
    this.eGui.innerHTML = TEMPLATE;
    this.eContainer = this.eGui.querySelector("span.ag-cell-wrapper");
    this.eValue = this.eGui.querySelector('span[ref="eValue"]');
    this.eContracted = this.eGui.querySelector('span[ref="eContracted"]');
    this.eExpanded = this.eGui.querySelector('span[ref="eExpanded"]');
    if (params.node.data) {
      const level = params.data.level;
      if (level) {
        this.eContainer?.classList.add(`ag-row-group-indent-${level}`);
      }

      const isChild = !params.node.data.groupRow;

      if (!isChild) {
        // prettier-ignore
        const col = params.columnApi
          .getRowGroupColumns()[params.data.level].getColId();
        this.params.node.key = params.node.data[col];
        if (this.eValue) {
          this.eValue.innerHTML = params.node.data[col];
        }
      }
      if (isChild) {
        this.setDisplayed(this.eContracted, false);
        this.setDisplayed(this.eExpanded, false);
      } else {
        const expanded = params.data.expanded;

        if (expanded) {
          this.setDisplayed(this.eContracted, false);
          this.setDisplayed(this.eExpanded, true);
        } else {
          this.setDisplayed(this.eContracted, true);
          this.setDisplayed(this.eExpanded, false);
        }
      }
    }
    this.eContracted?.addEventListener("click", this.onContracted.bind(this));
    this.eExpanded?.addEventListener("click", this.onExpanded.bind(this));
  }
  getGui() {
    return this.eGui;
  }

  onExpanded() {
    this.params?.node.setExpanded(false);
    this.setDisplayed(this.eContracted, true);
    this.setDisplayed(this.eExpanded, false);
  }

  onContracted() {
    this.params?.node.setExpanded(true);
    this.setDisplayed(this.eContracted, false);
    this.setDisplayed(this.eExpanded, true);
  }

  setDisplayed(element: HTMLSpanElement | null, displayed: boolean) {
    element?.classList.toggle("ag-hidden", !displayed);
  }

  refresh(params: unknown) {
    console.log(`GroupCellRenderer refresh called`, {
      params,
    });
    // throw new Error("Method not implemented.");
  }
}
