import {
  DataSource,
  DataSourceRow,
  RowSelectionEventHandler,
  Selection,
  SelectionItem,
} from "@finos/vuu-data-types";
import { buildColumnMap } from "@finos/vuu-utils";
import { TickingArrayDataSource } from "./TickingArrayDataSource";

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
    this.#childDataSource.filter = { filter: "" };
  }

  handleParentSelectEvent: RowSelectionEventHandler = (selection) => {
    if (this.#childDataSource) {
      const selectedValues = this.pickUniqueSelectedValues(selection);
      this.#childDataSource.filter = {
        filter: `${this.#childColumnName} in ["${selectedValues.join('","')}"]`,
      };
    }
  };

  private pickUniqueSelectedValues(selection: Selection) {
    const data = (this.#parentDataSource as TickingArrayDataSource).currentData;
    const selectedRows = selection.reduce<DataSourceRow[]>(
      (rows, selected: SelectionItem) => {
        if (Array.isArray(selected)) {
          for (let i = selected[0]; i <= selected[1]; i++) {
            const row = data[i];
            if (row) {
              rows.push(row);
            }
          }
        } else {
          const row = data[selected];
          if (row) {
            rows.push(row);
          }
        }
        return rows;
      },
      [],
    );

    const map = buildColumnMap(this.#parentDataSource.columns);
    const set = new Set();
    const colIndex = map[this.#parentColumnName];
    for (const row of selectedRows) {
      set.add(row[colIndex]);
    }
    return Array.from(set) as string[];
  }
}
