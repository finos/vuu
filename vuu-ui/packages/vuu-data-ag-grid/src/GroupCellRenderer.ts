type Column = {
  getColId: () => string;
};

type GroupCellRendererParams = {
  columnApi: {
    getRowGroupColumns: () => Column[];
  };
  data: {
    expanded: boolean;
    groupRow: boolean;
    level: number;
  };
  node: {
    data: {
      groupRow: boolean;
      [key: string]: string | boolean | number;
    };
    expanded?: boolean;
    key: string | null;
    setExpanded: (expanded: boolean) => void;
  };
};

const createSpan = (className: string) => {
  const span = document.createElement("span");
  span.className = className;
  return span;
};

const buildCellWrapper = () => {
  const wrapper = createSpan("ag-cell-wrapper");
  const groupExpanded = createSpan("ag-group-expanded ag-hidden");
  const iconOpen = createSpan("ag-icon ag-icon-tree-open");
  iconOpen.setAttribute("role", "presentation");
  iconOpen.setAttribute("unselectable", "on");

  groupExpanded.appendChild(iconOpen);
  wrapper.appendChild(groupExpanded);

  const groupContracted = createSpan("ag-group-contracted ag-hidden");
  const iconClosed = createSpan("ag-icon ag-icon-tree-closed");
  iconClosed.setAttribute("role", "presentation");
  iconClosed.setAttribute("unselectable", "on");

  groupContracted.appendChild(iconClosed);
  wrapper.appendChild(groupContracted);

  const checkbox = createSpan("ag-group-checkbox ag-invisible");
  wrapper.appendChild(checkbox);

  const groupValue = createSpan("ag-group-value");
  wrapper.appendChild(groupValue);

  return wrapper;
};

const cellWrapper = buildCellWrapper();

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
    this.eGui.appendChild(cellWrapper.cloneNode(true));
    this.eContainer = this.eGui.firstChild as HTMLElement;
    this.eValue = this.eGui.querySelector(".ag-group-value");
    this.eContracted = this.eGui.querySelector(".ag-group-contracted");
    this.eExpanded = this.eGui.querySelector(".ag-group-expanded");
    if (params.node.data) {
      const level = params.node.data.level as number;
      if (level) {
        this.eContainer?.classList.add(`ag-row-group-indent-${level}`);
      }

      const isChild = !params.node.data.groupRow;
      if (!isChild) {
        // prettier-ignore
        const col = params.columnApi
          .getRowGroupColumns()[level].getColId();
        this.params.node.key = params.node.data[col].toString();
        if (this.eValue) {
          this.eValue.textContent = params.node.data[col].toString();
        }
        const expanded = params.node.expanded;

        if (expanded) {
          this.setDisplayed(this.eContracted, false);
          this.setDisplayed(this.eExpanded, true);
        } else {
          this.setDisplayed(this.eContracted, true);
          this.setDisplayed(this.eExpanded, false);
        }
      }
    }
    this.eContracted?.addEventListener("click", this.onExpandNode.bind(this));
    this.eExpanded?.addEventListener("click", this.onContractNode.bind(this));
  }
  getGui() {
    return this.eGui;
  }

  onContractNode() {
    this.params?.node.setExpanded(false);
    this.setDisplayed(this.eContracted, true);
    this.setDisplayed(this.eExpanded, false);
  }

  onExpandNode() {
    this.params?.node.setExpanded(true);
    this.setDisplayed(this.eContracted, false);
    this.setDisplayed(this.eExpanded, true);
  }

  setDisplayed(element: HTMLSpanElement | null, displayed: boolean) {
    element?.classList.toggle("ag-hidden", !displayed);
  }

  refresh(/*params: unknown*/) {
    // throw new Error("Method not implemented.");
  }
}
