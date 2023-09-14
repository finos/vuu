import { VuuRange, VuuRowDataItemType } from "@finos/vuu-protocol-types";

export interface UpdateGenerator {
  setData: (data: ReadonlyArray<VuuRowDataItemType[]>) => void;
  setRange: (range: VuuRange) => void;
  setUpdateHandler: (updateHandler: UpdateHandler) => void;
}

export type UpdateHandler = (updates: RowUpdates[]) => void;

export type RowUpdates =
  | [number, number, VuuRowDataItemType]
  | [number, number, VuuRowDataItemType, number, VuuRowDataItemType]
  | [
      number,
      number,
      VuuRowDataItemType,
      number,
      VuuRowDataItemType,
      number,
      VuuRowDataItemType
    ]
  | [
      number,
      number,
      VuuRowDataItemType,
      number,
      VuuRowDataItemType,
      number,
      VuuRowDataItemType,
      number,
      VuuRowDataItemType
    ]
  | [
      number,
      number,
      VuuRowDataItemType,
      number,
      VuuRowDataItemType,
      number,
      VuuRowDataItemType,
      number,
      VuuRowDataItemType,
      number,
      VuuRowDataItemType
    ];
