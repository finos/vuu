import { Tree } from "@finos/vuu-codemirror";
import { RelationalExpression } from "./generated/column-parser.terms";
type expressionType =
  | "arithmeticExpression"
  | "booleanCondition"
  | "booleanLiteralExpression"
  | "callExpression"
  | "colExpression"
  | "conditionalExpression"
  | "numericLiteralExpression"
  | "relationalExpression"
  | "stringLiteralExpression"
  | "unknown";

type arithmeticOp = "*" | "/" | "+" | "-" | "unknown";
type booleanOp = "and" | "or";
type relationalOp = "=" | "!=" | ">" | ">=" | "<" | "<=" | "unknown";

export interface Expression {
  type: expressionType;
  expressions?: Expression[];
  toJSON?: () => unknown;
  value?: string | number | boolean;
}

interface UnknownExpression extends Expression {
  type: "unknown";
}

interface BooleanLiteralExpression {
  type: "booleanLiteralExpression";
  value: boolean;
}

interface NumericLiteralExpression {
  type: "numericLiteralExpression";
  value: number;
}
interface StringLiteralExpression {
  type: "stringLiteralExpression";
  value: string;
}

interface ArithmeticExpression extends Expression {
  expressions: [Expression, Expression];
  op: arithmeticOp;
  type: "arithmeticExpression";
}

interface BooleanCondition extends Expression {
  expressions: Expression[];
  op: booleanOp;
  type: "booleanCondition";
}
interface RelationalExpression extends Expression {
  expressions: Expression[];
  op: relationalOp;
  type: "relationalExpression";
}

interface ColExpression extends Expression {
  column?: string;
  type: "colExpression";
}

interface CallExpression extends Expression {
  arguments: Expression[];
  functionName?: string;
  type: "callExpression";
}

type ConditionExpression = RelationalExpression | BooleanCondition;

interface ConditionalExpression extends Expression {
  type: "conditionalExpression";
  condition: ConditionExpression;
  truthyExpression: Expression;
  falsyExpression: Expression;
}

export type ColumnDefinitionExpression =
  | ArithmeticExpression
  | BooleanLiteralExpression
  | CallExpression
  | ColExpression
  | ConditionalExpression
  | NumericLiteralExpression
  | StringLiteralExpression;

class LiteralExpressionImpl implements Expression {
  type:
    | "booleanLiteralExpression"
    | "numericLiteralExpression"
    | "stringLiteralExpression";
  value: boolean | number | string;
  constructor(value: boolean | number | string) {
    this.value = value;
    switch (typeof value) {
      case "boolean":
        this.type = "booleanLiteralExpression";
        break;
      case "number":
        this.type = "numericLiteralExpression";
        break;
      default:
        this.type = "stringLiteralExpression";
    }
  }
  toJSON() {
    return {
      type: this.type,
      value: this.value,
    } as
      | StringLiteralExpression
      | BooleanLiteralExpression
      | NumericLiteralExpression;
  }
}
class ColumnExpressionImpl implements ColExpression {
  type = "colExpression" as const;
  column: string;
  constructor(columnName: string) {
    this.column = columnName;
  }
  toJSON() {
    return {
      type: this.type,
      column: this.column,
    } as ColExpression;
  }
}
class ArithmeticExpressionImpl implements ArithmeticExpression {
  #expressions: [Expression, Expression] = [
    { type: "unknown" },
    { type: "unknown" },
  ];
  #op: arithmeticOp | "unknown";
  type = "arithmeticExpression" as const;
  constructor(op: arithmeticOp | "unknown" = "unknown") {
    this.#op = op;
  }
  get op() {
    return this.#op;
  }
  set op(op: arithmeticOp) {
    this.#op = op;
  }
  get expressions() {
    return this.#expressions;
  }

  toJSON() {
    return {
      type: this.type,
      op: this.#op,
      expressions: this.#expressions,
    };
  }
}

class CallExpressionImpl implements CallExpression {
  #expressions: Expression[] = [];
  functionName: string;
  type = "callExpression" as const;
  constructor(functionName: string) {
    this.functionName = functionName;
  }

  get expressions() {
    return this.#expressions;
  }
  get arguments() {
    return this.#expressions;
  }

  toJSON() {
    return {
      type: this.type,
      functionName: this.functionName,
      arguments: this.#expressions.map((e) => e.toJSON?.()),
    } as CallExpression;
  }
}

class RelationalExpressionImpl implements RelationalExpression {
  #expressions: [Expression, Expression] = [
    { type: "unknown" },
    { type: "unknown" },
  ];
  #op: relationalOp = "unknown";
  type = "relationalExpression" as const;

  get op() {
    return this.#op;
  }
  set op(op: relationalOp) {
    this.#op = op;
  }
  get expressions() {
    return this.#expressions;
  }

  toJSON() {
    return {
      type: this.type,
      op: this.#op,
      expressions: this.#expressions,
    } as RelationalExpression;
  }
}

class BooleanConditionImp implements BooleanCondition {
  #expressions: [Expression, Expression] = [
    { type: "unknown" },
    { type: "unknown" },
  ];
  #op: "and" | "or";
  type = "booleanCondition" as const;
  constructor(booleanOperator: "and" | "or") {
    this.#op = booleanOperator;
  }
  get op() {
    return this.#op;
  }
  get expressions() {
    return this.#expressions;
  }
  toJSON() {
    return {
      type: this.type,
      op: this.#op,
      expressions: this.#expressions.map((e) => e.toJSON?.()),
    };
  }
}

class ConditionalExpressionImpl implements ConditionalExpression {
  #expressions: [ConditionExpression, Expression, Expression];
  type = "conditionalExpression" as const;

  constructor(booleanOperator?: "and" | "or") {
    this.#expressions = [
      booleanOperator
        ? new BooleanConditionImp(booleanOperator)
        : new RelationalExpressionImpl(),
      { type: "unknown" },
      { type: "unknown" },
    ];
  }

  get expressions() {
    return this.#expressions;
  }

  get condition(): ConditionExpression {
    return this.#expressions[0];
  }
  get truthyExpression(): Expression {
    return this.#expressions[1];
  }
  set truthyExpression(expression: Expression) {
    this.#expressions[1] = expression;
  }
  get falsyExpression(): Expression {
    return this.#expressions[2];
  }
  set falsyExpression(expression: Expression) {
    this.#expressions[2] = expression;
  }

  toJSON() {
    return {
      type: this.type,
      condition: this.condition.toJSON?.(),
      truthyExpression: this.truthyExpression,
      falsyExpression: this.falsyExpression?.toJSON?.() ?? this.falsyExpression,
    };
  }
}

type PartialExpression =
  | ArithmeticExpression
  | RelationalExpression
  | ColExpression
  | CallExpression
  | BooleanCondition
  | Partial<ConditionalExpression>;

const isUnknown = (e: Expression): e is UnknownExpression =>
  e.type === "unknown";

const isArithmeticExpression = (
  expression: PotentiallyUnresolvedExpression
): expression is ArithmeticExpression =>
  expression.type === "arithmeticExpression";

const isCallExpression = (
  expression: PotentiallyUnresolvedExpression
): expression is CallExpression => expression.type === "callExpression";

const isConditionalExpression = (
  expression: PotentiallyUnresolvedExpression
): expression is ConditionalExpression =>
  expression.type === "conditionalExpression";

const isCondition = (
  expression: Expression | PartialExpression
): expression is ConditionExpression =>
  expression.type === "relationalExpression" ||
  expression.type === "booleanCondition";

const booleanConditionIsIncomplete = (
  condition: ConditionExpression
): boolean =>
  condition.expressions.length < 2 ||
  condition.expressions.some((e) => conditionIsIncomplete(e));

const isBooleanCondition = (
  expression: Expression
): expression is BooleanCondition => expression.type === "booleanCondition";

const isRelationalExpression = (
  expression?: Expression
): expression is RelationalExpression =>
  expression?.type === "relationalExpression";

const conditionIsIncomplete = (
  condition: Expression
): condition is ConditionExpression =>
  (isBooleanCondition(condition) && booleanConditionIsIncomplete(condition)) ||
  (isRelationalExpression(condition) && condition.expressions.length < 2);

const firstIncompleteExpression = (
  expression: Expression
): Expression | undefined => {
  if (isUnknown(expression)) {
    return expression;
  } else if (isRelationalExpression(expression)) {
    const [operand1, operand2] = expression.expressions;
    if (expressionIsIncomplete(operand1)) {
      return firstIncompleteExpression(operand1);
    } else if (expression.op === "unknown") {
      return expression;
    } else if (expressionIsIncomplete(operand2)) {
      return firstIncompleteExpression(operand2);
    }
  } else if (isCondition(expression)) {
    const { expressions = [] } = expression;
    for (const e of expressions) {
      if (expressionIsIncomplete(e)) {
        return firstIncompleteExpression(e);
      }
    }
  } else if (isConditionalExpression(expression)) {
    const { condition, truthyExpression, falsyExpression } = expression;
    if (expressionIsIncomplete(condition)) {
      return firstIncompleteExpression(condition);
    } else if (expressionIsIncomplete(truthyExpression)) {
      return firstIncompleteExpression(truthyExpression);
    } else if (expressionIsIncomplete(falsyExpression)) {
      return firstIncompleteExpression(falsyExpression);
    }
  } else if (isArithmeticExpression(expression)) {
    const { expressions = [] } = expression;
    for (const e of expressions) {
      if (expressionIsIncomplete(e)) {
        return firstIncompleteExpression(e);
      }
    }
  }
};
const replaceUnknownExpression = (
  incompleteExpression: Expression,
  unknownExpression: UnknownExpression,
  expression: Expression
): boolean => {
  const { expressions = [] } = incompleteExpression;
  if (expressions.includes(unknownExpression)) {
    const pos = expressions.indexOf(unknownExpression);
    expressions.splice(pos, 1, expression);
    return true;
  } else {
    for (const e of expressions) {
      if (replaceUnknownExpression(e, unknownExpression, expression)) {
        return true;
      }
    }
  }
  return false;
};

const expressionIsIncomplete = (expression: Expression): boolean => {
  if (isUnknown(expression)) {
    return true;
  } else if (isConditionalExpression(expression)) {
    return (
      expressionIsIncomplete(expression.condition) ||
      expressionIsIncomplete(expression.truthyExpression) ||
      expressionIsIncomplete(expression.falsyExpression)
    );
  } else if (
    isRelationalExpression(expression) ||
    isBooleanCondition(expression)
  ) {
    return (
      expression.op === undefined ||
      expression.expressions.some((e) => expressionIsIncomplete(e))
    );
  }
  // TODO missing cases
  return false;
};

type ExpressionImpl =
  | ArithmeticExpressionImpl
  | CallExpressionImpl
  | ColumnExpressionImpl
  | ConditionalExpressionImpl
  | LiteralExpressionImpl;

type PotentiallyUnresolvedExpression = Expression | PartialExpression;

const addExpression = (
  expression: Expression,
  subExpression: PartialExpression | Expression
) => {
  const targetExpression = firstIncompleteExpression(expression);
  if (targetExpression) {
    if (targetExpression.expressions) {
      targetExpression.expressions.push(subExpression as Expression);
    } else {
      console.warn("don't know how to treat targetExpression");
    }
  } else {
    console.error("no target expression found");
  }
};

class ColumnExpression {
  #expression: ExpressionImpl | undefined;

  #callStack: CallExpression[] = [];

  setCondition(booleanOperator?: "and" | "or") {
    if (this.#expression === undefined) {
      this.addExpression(new ConditionalExpressionImpl(booleanOperator));
    } else if (isConditionalExpression(this.#expression)) {
      if (expressionIsIncomplete(this.#expression.condition)) {
        const condition = booleanOperator
          ? new BooleanConditionImp(booleanOperator)
          : new RelationalExpressionImpl();
        this.addExpression(condition);
      } else if (isUnknown(this.#expression.truthyExpression)) {
        this.#expression.truthyExpression = new ConditionalExpressionImpl(
          booleanOperator
        );
      } else if (expressionIsIncomplete(this.#expression.truthyExpression)) {
        const condition = booleanOperator
          ? new BooleanConditionImp(booleanOperator)
          : new RelationalExpressionImpl();
        this.addExpression(condition);
      } else if (isUnknown(this.#expression.falsyExpression)) {
        this.#expression.falsyExpression = new ConditionalExpressionImpl(
          booleanOperator
        );
      } else if (expressionIsIncomplete(this.#expression.falsyExpression)) {
        const condition = booleanOperator
          ? new BooleanConditionImp(booleanOperator)
          : new RelationalExpressionImpl();
        this.addExpression(condition);
      }
    } /*else if (isCallExpression(this.#expression)) {
      this.addExpression(new RelationalExpressionImpl());
    } */ else {
      console.error("setCondition called unexpectedly");
    }
  }

  addExpression(expression: ExpressionImpl | Expression) {
    if (this.#callStack.length > 0) {
      const currentCallExpression = this.#callStack.at(-1);
      currentCallExpression?.arguments.push(expression as Expression);
    } else if (this.#expression === undefined) {
      this.#expression = expression as ExpressionImpl;
    } else if (isArithmeticExpression(this.#expression)) {
      const targetExpression = firstIncompleteExpression(this.#expression);
      if (targetExpression && isUnknown(targetExpression)) {
        replaceUnknownExpression(
          this.#expression,
          targetExpression,
          expression
        );
      }
    } else if (isConditionalExpression(this.#expression)) {
      if (expressionIsIncomplete(this.#expression)) {
        const targetExpression = firstIncompleteExpression(this.#expression);
        if (targetExpression && isUnknown(targetExpression)) {
          replaceUnknownExpression(
            this.#expression,
            targetExpression,
            expression
          );
        } else if (targetExpression) {
          addExpression(targetExpression, expression);
        }
      }
    }
  }

  setFunction(functionName: string) {
    const callExpression = new CallExpressionImpl(functionName);
    this.addExpression(callExpression);
    this.#callStack.push(callExpression);
  }

  setColumn(columnName: string) {
    this.addExpression(new ColumnExpressionImpl(columnName));
  }

  setArithmeticOp(value: string) {
    const op = value as arithmeticOp;
    const expression = this.#expression as Expression;
    if (isArithmeticExpression(expression)) {
      expression.op = op;
    }
    //  else {
    //   const targetExpression = firstIncompleteExpression(this.#expression);
    //   if (targetExpression) {
    //     targetExpression.op = op;
    //   }
    // }
  }

  setRelationalOperator(value: string) {
    const op = value as relationalOp;
    if (this.#expression && isConditionalExpression(this.#expression)) {
      const targetExpression = firstIncompleteExpression(this.#expression);
      if (isRelationalExpression(targetExpression)) {
        targetExpression.op = op;
      } else {
        console.error(`no target expression found (op = ${value})`);
      }
    }
  }

  setValue(value: string | number | boolean) {
    const literalExpression = new LiteralExpressionImpl(value);
    if (this.#expression === undefined) {
      this.#expression = literalExpression;
    } else if (isArithmeticExpression(this.#expression)) {
      this.addExpression(literalExpression);
    } else if (isCallExpression(this.#expression)) {
      // TODO this might not be correct if call arguments include nested expression(s)
      this.#expression.arguments.push(literalExpression);
    } else if (isConditionalExpression(this.#expression)) {
      if (expressionIsIncomplete(this.#expression)) {
        const targetExpression = firstIncompleteExpression(this.#expression);
        if (targetExpression && isUnknown(targetExpression)) {
          replaceUnknownExpression(
            this.#expression,
            targetExpression,
            literalExpression
          );
        } else if (targetExpression) {
          addExpression(targetExpression, literalExpression);
        }
      } else {
        console.log("what do we do with value, in a complete expression");
      }
    }
  }

  closeBrace() {
    this.#callStack.pop();
  }

  get expression() {
    return this.#expression;
  }

  toJSON() {
    return this.#expression?.toJSON() as ColumnDefinitionExpression;
  }
}

export const walkTree = (tree: Tree, source: string) => {
  const columnExpression = new ColumnExpression();
  const cursor = tree.cursor();
  do {
    const { name, from, to } = cursor;
    switch (name) {
      case "AndCondition":
        columnExpression.setCondition("and");
        break;

      case "OrCondition":
        columnExpression.setCondition("or");
        break;

      case "RelationalExpression":
        // TODO this breaks when the relationalexpression is an argument to a CallExpression
        columnExpression.setCondition();
        break;

      case "ArithmeticExpression":
        columnExpression.addExpression(new ArithmeticExpressionImpl());
        break;

      case "Column":
        {
          const columnName = source.substring(from, to);
          columnExpression.setColumn(columnName);
        }
        break;

      case "Function":
        {
          const functionName = source.substring(from, to);
          columnExpression.setFunction(functionName);
        }
        break;

      case "Times":
      case "Divide":
      case "Plus":
      case "Minus":
        {
          const op = source.substring(from, to);
          columnExpression.setArithmeticOp(op);
        }
        break;

      case "RelationalOperator":
        {
          const op = source.substring(from, to);
          columnExpression.setRelationalOperator(op);
        }
        break;

      case "False":
      case "True":
        {
          const value = source.substring(from, to);
          columnExpression.setValue(value === "true" ? true : false);
        }
        break;

      case "String":
        columnExpression.setValue(source.substring(from + 1, to - 1));
        break;

      case "Number":
        columnExpression.setValue(parseFloat(source.substring(from, to)));
        break;

      case "CloseBrace":
        columnExpression.closeBrace();
        break;

      default:
    }
  } while (cursor.next());

  return columnExpression.toJSON();
};
