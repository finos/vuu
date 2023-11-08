import { VuuRange, VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { ArrayDataSource } from "@finos/vuu-data";

export type UpdateHandler = (
  updates: (RowUpdates | RowInsert | RowDelete)[]
) => void;

export interface UpdateGenerator {
  setDataSource: (dataSource: ArrayDataSource) => void;
  setRange: (range: VuuRange) => void;
  setUpdateHandler: (updateHandler: UpdateHandler) => void;
}

export type UpdateType = "I" | "D" | "U";

// Allow up to 20 updates https://catchts.com/even-length
type MAXIMUM_ALLOWED_BOUNDARY = 20;
type RepeatingTuple<
  Tuple extends Array<unknown>,
  Result extends Array<unknown> = [],
  Count extends ReadonlyArray<number> = []
> = Count["length"] extends MAXIMUM_ALLOWED_BOUNDARY
  ? Result
  : Tuple extends []
  ? []
  : Result extends []
  ? RepeatingTuple<Tuple, Tuple, [...Count, 1]>
  : RepeatingTuple<Tuple, Result | [...Result, ...Tuple], [...Count, 1]>;

type UpdatePairs = RepeatingTuple<[number, VuuRowDataItemType]>;
export type RowUpdates = ["U", number, ...UpdatePairs];
export type RowInsert = ["I", ...VuuRowDataItemType[]];
export type RowDelete = ["D", string];
