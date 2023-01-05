import { Tree } from "@lezer/common";

import { Expression, ColumnExpression } from "./Expression";

const peek = <T>(arr: unknown[]) => arr[arr.length - 1] as T;

export const walkExpressionTree = (tree: Tree, source: string) => {
  const queue: unknown[] = [];
  const cursor = tree.cursor();
  next: do {
    const { name, from, to } = cursor;
    console.log(
      `Node ${name} [${from}:${to}] '${source.substring(
        cursor.from,
        cursor.to
      )}'`
    );

    switch (name) {
      case "ColumnDefinitionExpression":
        break;
      case "Column":
        {
          if (queue.length === 0) {
            const columnName = source.substring(from, to);
            queue.push(new ColumnExpression(source, columnName));
          }
          // const lastFilterClause = peek<Filter>(queue).lastFilterClause;
          // if (lastFilterClause) {
          //   lastFilterClause.column = new Column(value, from, to);
          //   cursor.next();
          // } else {
          //   throw Error("wah");
          // }
        }
        break;

      case "Operator":
        {
          // const lastFilterClause = peek<Filter>(queue).lastFilterClause;
          // if (lastFilterClause) {
          //   const value = source.substring(from, to);
          //   lastFilterClause.op = value;
          //   cursor.next();
          // } else {
          //   throw Error("wah");
          // }
        }
        break;

      case "Equal":
        break;

      default:
        console.log(`%cwhat do we do with a ${name}`, "color:red");
    }
  } while (cursor.next());

  return queue[0] as Expression;
};
