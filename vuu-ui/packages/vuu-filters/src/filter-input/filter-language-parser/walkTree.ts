import { Tree } from "@lezer/common";
import { Filter as FilterType } from "@finos/vuu-filter-types";

class Filter {
  #name: string | undefined;
  expression?: OrExpression;
  get lastExpression(): AndExpression | undefined {
    if (this.expression) {
      const { filters: f } = this.expression;
      return f[f.length - 1];
    }
  }
  get lastFilterClause(): FilterClause | undefined {
    const andExpression = this.lastExpression;
    if (andExpression) {
      const { filters: f } = andExpression;
      return f[f.length - 1];
    }
  }

  get name(): string | undefined {
    return this.#name;
  }
  setName(value: string) {
    this.#name = value;
  }
  toJson(): FilterType {
    return this.expression?.toJson(this.#name);
  }
}
class OrExpression {
  add(expression: AndExpression) {
    this.filters.push(expression);
  }
  filters: any[] = [];
  toJson(name?: string) {
    if (this.filters.length === 1) {
      return this.filters[0].toJson(name);
    } else if (this.filters.length > 1) {
      return {
        name,
        op: "or",
        filters: this.filters.map((f) => f.toJson()),
      };
    }
  }
}
class AndExpression {
  add(expression: FilterClause) {
    this.filters.push(expression);
  }
  filters: FilterClause[] = [];
  toJson(name?: string) {
    if (this.filters.length === 1) {
      return this.filters[0].toJson(name);
    } else if (this.filters.length > 1) {
      return {
        name,
        op: "and",
        filters: this.filters.map((f) => f.toJson()),
      };
    }
  }
}
class ColumnValueExpression {
  column?: Column;
  op?: string;
  value?: string | number;
  toJson(name?: string) {
    return {
      column: this.column?.name,
      name,
      op: this.op,
      value: this.value,
    };
  }
}
class ColumnSetExpression {
  column?: Column;
  op?: "in";
  values: (string | number)[] = [];
  toJson(name?: string) {
    return {
      column: this.column?.name,
      name,
      op: "in",
      values: this.values,
    };
  }
}

type FilterClause = ColumnValueExpression | ColumnSetExpression;

class Column {
  constructor(public name: string, private from: number, private to: number) {}
}

const peek = <T>(arr: unknown[]) => arr[arr.length - 1] as T;

export const walkTree = (tree: Tree, source: string) => {
  const queue: unknown[] = [];
  const cursor = tree.cursor();
  next: do {
    let { name, from, to } = cursor;
    // console.log(
    //   `Node ${name} [${from}:${to}] '${source.substring(
    //     cursor.from,
    //     cursor.to
    //   )}'`
    // );

    switch (name) {
      case "Filter":
        queue.push(new Filter());
        break;
      case "OrExpression":
        peek<Filter>(queue).expression = new OrExpression();
        break;
      case "AndExpression":
        peek<Filter>(queue).expression?.add(new AndExpression());
        break;
      case "And":
      case "In":
      case "LBrack":
      case "RBrack":
      case "Quote":
      case "Comma":
      case "Value":
      case "Values":
      case "FilterClause":
        // nothing to do
        break;
      case "ColumnValueExpression":
        {
          const lastExpression = peek<Filter>(queue).lastExpression;
          if (lastExpression) {
            lastExpression.add(new ColumnValueExpression());
          } else {
            throw Error("boo");
          }
        }
        break;

      case "ColumnSetExpression":
        {
          const lastExpression = peek<Filter>(queue).lastExpression;
          if (lastExpression) {
            lastExpression.add(new ColumnSetExpression());
          } else {
            throw Error("hoo");
          }
        }
        break;

      case "Column":
        {
          const lastFilterClause = peek<Filter>(queue).lastFilterClause;
          if (lastFilterClause) {
            const value = source.substring(from, to);
            lastFilterClause.column = new Column(value, from, to);
            cursor.next();
          } else {
            throw Error("wah");
          }
        }
        break;

      case "Operator":
        {
          const lastFilterClause = peek<Filter>(queue).lastFilterClause;
          if (lastFilterClause) {
            const value = source.substring(from, to);
            lastFilterClause.op = value;
            cursor.next();
          } else {
            throw Error("wah");
          }
        }
        break;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      case "String":
        // skip the open and close quote
        cursor.next();
        cursor.next();
        // cursor now points to the string content (Identifier)
        // fall thru, intentional
        ({ name, from, to } = cursor);
      // eslint-disable-next-line no-fallthrough
      case "Int":
        {
          const lastFilterClause = peek<Filter>(queue).lastFilterClause;
          if (lastFilterClause) {
            const value = source.substring(from, to);
            const typedValue = name === "Int" ? parseInt(value, 10) : value;
            if (lastFilterClause instanceof ColumnSetExpression) {
              lastFilterClause.values.push(typedValue);
            } else {
              lastFilterClause.value = typedValue;
            }
          } else {
            throw Error("wah");
          }
        }
        break;

      case "Or":
        {
          // lets p0retend for now that Or clauses only occur at te top
          peek<Filter>(queue).expression?.add(new AndExpression());
        }
        break;

      case "AsClause":
        {
          cursor.next();
          const { name: nm1 } = cursor;
          if (nm1 === "As") {
            cursor.next();
            const { name: nm2, from: f2, to: t2 } = cursor;
            if (nm2 === "Identifier") {
              peek<Filter>(queue)?.setName(source.substring(f2, t2));
            }
          } else {
            continue next;
          }
        }
        break;

      default:
      // console.log(`%cwhat do we do with a ${name}`, "color:red");
    }
  } while (cursor.next());

  return queue[0] as Filter;
};
