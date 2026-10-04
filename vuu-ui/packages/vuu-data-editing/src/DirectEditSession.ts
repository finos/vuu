import type { DataSource } from "@vuu-ui/vuu-data-types";
import type { RpcResult, VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { EventEmitter } from "@vuu-ui/vuu-utils";
import type {
  TableEditSession,
  TableEditSessionEvents,
} from "./TableEditSession";

export type DirectEditSessionConstructorProps = {
  dataSource: DataSource;
};

/**
 * A lightweight edit session for services that allow cells to be edited
 * directly on the source table. There is no begin/end lifecycle, no session
 * table and no local tracking of edits - each committed edit is sent
 * immediately via the dataSource editCell RPC.
 */
export class DirectEditSession
  extends EventEmitter<TableEditSessionEvents>
  implements TableEditSession
{
  #dataSource: DataSource;

  constructor({ dataSource }: DirectEditSessionConstructorProps) {
    super();
    this.#dataSource = dataSource;
  }

  get dataSource() {
    return this.#dataSource;
  }

  get inEditMode() {
    return false;
  }

  isCellEdited(_key: string, _columnName: string) {
    return false;
  }

  async commit(
    key: string,
    columnName: string,
    _originalValue: VuuRowDataItemType,
    typedValue: string | number | boolean,
    isValid: boolean,
  ): Promise<RpcResult> {
    if (!isValid) {
      return { errorMessage: "Invalid value", type: "ERROR_RESULT" };
    }
    const editCell = this.#dataSource.editCell;
    if (editCell === undefined) {
      throw Error("[DirectEditSession] datasource does not support editCell");
    }
    const response = await editCell.call(
      this.#dataSource,
      key,
      columnName,
      typedValue,
    );
    if (response === undefined) {
      throw Error(
        "[DirectEditSession] datasource returned no response from editCell",
      );
    }
    return response;
  }
}
