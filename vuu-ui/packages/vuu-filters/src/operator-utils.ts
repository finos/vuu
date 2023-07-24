export enum TextOperator {
  EQUALS = "=",
  NOT_EQUALS = "!=",
  IN = "in",
  STARTS_WITH = "startsWith",
  ENDS_WITH = "endsWith",
}

export const TEXT_OPERATORS: TextOperator[] = Object.values(TextOperator);

export enum NumericOperator {
  EQUALS = "=",
  NOT_EQUALS = "!=",
  GREATER_THAN = ">",
  GREATER_THAN_OR_EQUAL_TO = ">=",
  LESS_THAN = "<",
  LESS_THAN_OR_EQUAL_TO = "<=",
}

export const NUMERIC_OPERATORS: NumericOperator[] =
  Object.values(NumericOperator);

export const isString = (value: unknown): value is string =>
  typeof value === "string";
export const isTextOperator = (value?: string): value is TextOperator =>
  value !== undefined && value in TextOperator;

export const isNumber = (value: unknown): value is number =>
  typeof value === "number";
export const isNumericOperator = (value?: string): value is NumericOperator =>
  value !== undefined && value in NumericOperator;
