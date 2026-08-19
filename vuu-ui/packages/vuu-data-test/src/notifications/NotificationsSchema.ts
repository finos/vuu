import type { SchemaColumn } from "@vuu-ui/vuu-data-types";
import type { VuuColumnDataType } from "@vuu-ui/vuu-protocol-types";

const VuuColumnDataTypes: Record<string, VuuColumnDataType> = {
  boolean: "boolean",
  char: "char",
  double: "double",
  epochtimestamp: "epochtimestamp",
  epochtimestampnano: "epochtimestampnano",
  int: "int",
  long: "long",
  string: "string",
};

/**
 * Accepts either a SchemaColumn or a column definition in the Scala server
 * 'name:Type' format, e.g. "source:String", "priority:Int".
 */
export type ColumnDefinition = SchemaColumn | string;

export const toColumn = (columnDefinition: ColumnDefinition): SchemaColumn => {
  if (typeof columnDefinition === "string") {
    const [name, dataType = ""] = columnDefinition.split(":");
    const serverDataType = VuuColumnDataTypes[dataType.toLowerCase()];
    if (name && serverDataType) {
      return { name, serverDataType };
    }
    throw Error(
      `[NotificationsSchema] invalid column definition '${columnDefinition}'`,
    );
  }
  return columnDefinition;
};

const Id = "id:String";
const Type = "type:String";
const ExpiryTime = "expiryTime:EpochTimestamp";
const Title = "title:String";
const Message = "message:String";
const Level = "level:String";
const Audience = "audience:String";

const genericColumns = [Id, Type, ExpiryTime, Title, Message, Level, Audience];

export const NotificationsSchema = {
  Id,
  Type,
  ExpiryTime,
  Title,
  Message,
  Level,
  Audience,
  /**
   * The generic notification columns, plus any additional columns.
   */
  allFrom: (...additionalColumns: ColumnDefinition[]): SchemaColumn[] =>
    [...genericColumns, ...additionalColumns].map(toColumn),
};
