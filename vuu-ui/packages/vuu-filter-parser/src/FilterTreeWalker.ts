import { Tree } from "@lezer/common";
import {
  Filter,
  FilterCombinatorOp,
  MultipleValueFilterClauseOp,
  SingleValueFilterClauseOp,
} from "@finos/vuu-filter-types";
import {
  isMultiClauseFilter,
  isMultiValueFilter,
  isSingleValueFilter,
} from "@finos/vuu-utils";

class FilterExpression {
  public name: string | undefined;
  #filter: Partial<Filter> | undefined = undefined;

  setFilterCombinatorOp(op: string, filter = this.#filter) {
    if (isMultiClauseFilter(filter) && filter.op === op) {
      return;
    } else {
      this.#filter = {
        op: op as FilterCombinatorOp,
        filters: [this.#filter as Filter],
      };
    }
  }

  add(filter: Partial<Filter>) {
    if (this.#filter === undefined) {
      this.#filter = filter;
    } else if (isMultiClauseFilter(this.#filter)) {
      this.#filter.filters.push(filter as Filter);
    } else {
      throw Error(`Invalid filter passed to FilterExpression`);
    }
  }

  setColumn(column: string, filter = this.#filter) {
    if (isMultiClauseFilter(filter)) {
      const target = filter.filters.at(-1);
      if (target) {
        this.setColumn(column, target);
      }
    } else if (filter) {
      filter.column = column;
    }
  }
  setOp(value: string, filter = this.#filter) {
    if (isMultiClauseFilter(filter)) {
      const target = filter.filters.at(-1);
      if (target) {
        this.setOp(value, target);
      }
    } else if (filter) {
      filter.op = value as
        | SingleValueFilterClauseOp
        | MultipleValueFilterClauseOp;
    }
  }
  setValue(value: string | number | boolean, filter = this.#filter) {
    if (isMultiClauseFilter(filter)) {
      const target = filter.filters.at(-1);
      if (target) {
        this.setValue(value, target);
      }
    } else if (isMultiValueFilter(filter)) {
      filter.values ??= [];
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      filter.values.push(value);
    } else if (isSingleValueFilter(filter)) {
      filter.value = value;
    }
  }

  toJSON(filter = this.#filter) {
    if (this.name) {
      return {
        ...filter,
        name: this.name,
      };
    } else {
      return filter;
    }
  }
}

export const walkTree = (tree: Tree, source: string) => {
  const filterExpression = new FilterExpression();
  const cursor = tree.cursor();
  do {
    const { name, from, to } = cursor;
    switch (name) {
      case "ColumnValueExpression":
        filterExpression.add({});
        break;
      case "ColumnSetExpression":
        filterExpression.add({ op: "in" });
        break;

      case "Or":
      case "And":
        filterExpression.setFilterCombinatorOp(source.substring(from, to));
        break;

      case "Column":
        filterExpression.setColumn(source.substring(from, to));
        break;

      case "Operator":
        filterExpression.setOp(source.substring(from, to));
        break;

      case "String":
        filterExpression.setValue(source.substring(from + 1, to - 1));
        break;

      case "Number":
        filterExpression.setValue(parseFloat(source.substring(from, to)));
        break;

      case "True":
        filterExpression.setValue(true);
        break;

      case "False":
        filterExpression.setValue(false);
        break;

      case "FilterName":
        filterExpression.name = source.substring(from, to);
        break;

      default:
    }
  } while (cursor.next());

  return filterExpression.toJSON();
};
