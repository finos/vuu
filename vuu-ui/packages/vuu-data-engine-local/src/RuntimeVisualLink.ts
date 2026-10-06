import type { RowSelectionEventHandler } from "@vuu-ui/vuu-data-types";
import type { EngineDataSource } from "./EngineDataSource";

/**
 * A visual link between two dataSources. Selection in the parent restricts
 * the rows of the child to those whose childColumn value matches the
 * parentColumn value of a selected parent row. Implemented with the engine
 * link filter, so it composes with (and does not overwrite) the child's
 * client filter and baseFilter.
 */
export class RuntimeVisualLink {
  #childColumnName: string;
  #childDataSource: EngineDataSource;
  #parentColumnName: string;
  #parentDataSource: EngineDataSource;

  constructor(
    childDataSource: EngineDataSource,
    parentDataSource: EngineDataSource,
    childColumnName: string,
    parentColumnName: string,
  ) {
    this.#childColumnName = childColumnName;
    this.#childDataSource = childDataSource;
    this.#parentColumnName = parentColumnName;
    this.#parentDataSource = parentDataSource;

    parentDataSource.on("row-selection", this.handleParentSelectEvent);
    // apply any selection already present in parent
    if (parentDataSource.selectedRowsCount > 0) {
      this.handleParentSelectEvent(parentDataSource.selectedRowsCount);
    }
  }

  destroy() {
    this.remove();
  }

  remove() {
    this.#parentDataSource.removeListener(
      "row-selection",
      this.handleParentSelectEvent,
    );
    this.#childDataSource.setLinkFilter(undefined);
  }

  handleParentSelectEvent: RowSelectionEventHandler = () => {
    const values = this.#parentDataSource.getSelectedValues(
      this.#parentColumnName,
    );
    this.#childDataSource.setLinkFilter(
      values.size === 0 ? undefined : { column: this.#childColumnName, values },
    );
  };
}
