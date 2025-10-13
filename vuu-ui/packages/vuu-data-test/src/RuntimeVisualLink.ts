import { DataSource, RowSelectionEventHandler } from "@vuu-ui/vuu-data-types";
import { TickingArrayDataSource } from "./TickingArrayDataSource";
import { buildColumnMap } from "@vuu-ui/vuu-utils";

export class RuntimeVisualLink {
  #childColumnName: string;
  #childDataSource: DataSource;
  #parentColumnName: string;
  #parentDataSource: DataSource;

  constructor(
    childDataSource: DataSource,
    parentDataSource: DataSource,
    childColumnName: string,
    parentColumnName: string,
  ) {
    this.#childColumnName = childColumnName;
    this.#childDataSource = childDataSource;
    this.#parentColumnName = parentColumnName;
    this.#parentDataSource = parentDataSource;

    parentDataSource.on("row-selection", this.handleParentSelectEvent);
  }

  destroy() {
    // do we need to do anything
  }

  remove() {
    this.#parentDataSource?.removeListener(
      "row-selection",
      this.handleParentSelectEvent,
    );
    this.#childDataSource.baseFilter = { filter: "" };
  }

  handleParentSelectEvent: RowSelectionEventHandler = () => {
    if (this.#childDataSource) {
      const selectedValues = this.pickUniqueSelectedValues();
      if (selectedValues.length === 0) {
        this.#childDataSource.baseFilter = undefined;
      } else if (selectedValues.length === 1) {
        this.#childDataSource.baseFilter = {
          filter: `${this.#childColumnName} = "${selectedValues[0]}"`,
        };
      } else {
        this.#childDataSource.baseFilter = {
          filter: `${this.#childColumnName} in ["${selectedValues.join('","')}"]`,
        };
      }
    }
  };

  private pickUniqueSelectedValues() {
    const dataSource = this.#parentDataSource as TickingArrayDataSource;
    const map = buildColumnMap(dataSource.columns);
    const colIndex = map[this.#parentColumnName];
    const set = new Set();

    for (const key of dataSource.getSelectedRowIds()) {
      const row = dataSource.getRowByKey(key);
      if (row) {
        set.add(row[colIndex]);
      }
    }
    return Array.from(set) as string[];
  }
}
