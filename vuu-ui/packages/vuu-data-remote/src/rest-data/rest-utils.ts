import { DataSourceRow } from "@finos/vuu-data-types";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { ColumnMap } from "@finos/vuu-utils";

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = Json[];
export type JsonObject = { [key: string]: Json };
export type Json = JsonPrimitive | JsonArray | JsonObject;
export type JsonHandler = (rowIndex: number, json: JsonObject) => void;

export const NDJsonReader =
  (startIndex: number, jsonHandler: JsonHandler, onEnd: () => void) =>
  (response: Response) => {
    if (response.ok && response.body) {
      const stream = response.body.getReader();
      const decoder = new TextDecoder();
      const matcher = /\r?\n/;
      let buf = "";
      let index = startIndex;

      const loop: () => void = () =>
        stream.read().then(({ done, value }) => {
          if (done) {
            if (buf.length > 0) jsonHandler(index, JSON.parse(buf));
            onEnd();
          } else {
            const chunk = decoder.decode(value, {
              stream: true
            });
            buf += chunk;

            const jsonFragments = buf.split(matcher);
            buf = jsonFragments.pop() ?? "";
            for (const jsonFragment of jsonFragments) {
              jsonHandler(index, JSON.parse(jsonFragment));
              index += 1;
            }
            return loop();
          }
        });
      return loop();
    } else {
      throw Error(`response invalid ${response.status} ${response.statusText}`);
    }
  };

export const jsonToDataSourceRow = (
  rowIndex: number,
  json: JsonObject,
  columnMap: ColumnMap
): DataSourceRow => {
  const dataSourceRow: DataSourceRow = [
    rowIndex,
    rowIndex,
    true,
    false,
    0,
    0,
    json.ric as string,
    0
  ];
  for (const [column, colIdx] of Object.entries(columnMap)) {
    dataSourceRow[colIdx] = json[column] as VuuRowDataItemType;
  }
  return dataSourceRow;
};
