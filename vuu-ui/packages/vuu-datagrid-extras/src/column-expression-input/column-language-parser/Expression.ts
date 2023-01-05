export type expressionType =
  | "column"
  | "number"
  | "callExpression"
  | "binaryExpression"
  | "parenthesizedExpression";

export class Expression {
  constructor(public source: string) {}
}

export class BinaryExpression extends Expression {
  toString() {
    return "BinaryExpression";
  }
}

export class CallExpression extends Expression {
  toString() {
    return "CallExpression";
  }
}

export class ColumnExpression extends Expression {
  public columnName: string;
  constructor(source: string, columnName: string) {
    super(source);
    this.columnName = columnName;
  }
  toString() {
    return `ColumnExpression column=${this.columnName} '${this.source}'`;
  }
}

export class NumberExpression extends Expression {
  toString() {
    return "NumberExpression";
  }
}
export class ParenthesizedExpression extends Expression {
  toString() {
    return "ParenthesizedExpression";
  }
}
