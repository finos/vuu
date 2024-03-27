import {
  Filter,
  FilterClause,
  FilterClauseOp,
  FilterCombinatorOp,
  MultiClauseFilter,
  MultiValueFilterClause,
  SingleValueFilterClause,
} from "@finos/vuu-filter-types";
import {
  EventEmitter,
  isMultiClauseFilter,
  isMultiValueFilter,
  isSingleValueFilter,
} from "@finos/vuu-utils";

export type FilterStatusChangeHandler = (isValid: boolean) => void;
export type FilterChangeHandler = (
  filter: Partial<Filter>,
  isValid: boolean
) => void;
export type FilterClauseChangeHandler = (
  filter: Partial<FilterClause>,
  isValid: boolean
) => void;

const hasValues = ({ values }: MultiValueFilterClause) =>
  Array.isArray(values) && values.length > 0;

const isValidFilterClause = (
  filterClause: Partial<FilterClause>
): filterClause is FilterClause => {
  if (filterClause.op === undefined || filterClause.column === undefined) {
    return false;
  } else if (isMultiValueFilter(filterClause)) {
    return hasValues(filterClause);
  } else if (isSingleValueFilter(filterClause)) {
    return filterClause.value !== undefined && filterClause.value !== "";
  }
  throw Error("isValidFilterClause should never reach this far");
};

const isValidFilter = (filter?: Filter): boolean => {
  if (filter === undefined) {
    return false;
  } else if (isMultiClauseFilter(filter)) {
    return filter.filters.every(isValidFilter);
  } else {
    return isValidFilterClause(filter);
  }
};

const isValidFilterModel = (filterModel: FilterModel) => {
  if (filterModel.isMultiClauseFilter) {
    return filterModel.filterClauses.every((f) => f.isValid);
  } else {
    return (
      filterModel.filterClauses.length === 1 &&
      filterModel.filterClauses[0].isValid
    );
  }
};

export type FilterClauseModelEvents = {
  filterClause: FilterClauseChangeHandler;
  isValid: FilterStatusChangeHandler;
};

export type FilterModelEvents = {
  // TODO do we need an incomplate filter type
  filter: FilterChangeHandler;
  isValid: FilterStatusChangeHandler;
};

export class FilterClauseModel extends EventEmitter<FilterClauseModelEvents> {
  #filterClause: Partial<FilterClause>;
  #isValid: boolean;
  constructor(filterClause: Partial<FilterClause>) {
    super();
    this.#filterClause = filterClause;
    this.#isValid = isValidFilterClause(filterClause);
  }
  get isValid() {
    return this.#isValid;
  }

  private setIsValid(isValid: boolean) {
    this.#isValid = isValid;
    this.emit("isValid", isValid);
  }

  get column() {
    return this.#filterClause.column;
  }

  set column(column: undefined | string) {
    // TODO set op, value to empty
    this.#filterClause = {
      column,
    };

    const isValid = isValidFilterClause(this.#filterClause);
    this.emit("filterClause", this.#filterClause, isValid);
    if (isValid !== this.#isValid) {
      this.setIsValid(isValid);
    }
  }

  get op() {
    return this.#filterClause.op;
  }

  setOp(op: undefined | FilterClauseOp) {
    this.#filterClause = {
      ...this.#filterClause,
      op,
    };
    const isValid = isValidFilterClause(this.#filterClause);
    this.emit("filterClause", this.#filterClause, isValid);
    if (isValid !== this.#isValid) {
      this.setIsValid(isValid);
    }
  }

  setValue(
    value:
      | undefined
      | string
      | string[]
      | number
      | number[]
      | boolean
      | boolean[],
    isFinal = true
  ) {
    console.log(`setValue ${value} isFinal(${isFinal})`);
    if (isSingleValueFilter(this.#filterClause)) {
      this.#filterClause = {
        ...this.#filterClause,
        value,
      } as SingleValueFilterClause;
    } else if (Array.isArray(value)) {
      this.#filterClause = {
        ...this.#filterClause,
        values: value,
      } as MultiValueFilterClause;
    }

    const isValid = isValidFilterClause(this.#filterClause);
    if (isValid !== this.#isValid) {
      this.setIsValid(isValid);
    }
    if (isFinal) {
      this.emit("filterClause", this.#filterClause, isValid);
    }
  }

  asFilter(throwIfInvalid = true): FilterClause {
    if (throwIfInvalid && !this.#isValid) {
      throw Error("Invalid filter model cannot be returned as Filter");
    }
    return this.#filterClause as FilterClause;
  }
}

export class FilterModel extends EventEmitter<FilterModelEvents> {
  #children: FilterClauseModel[] = [];
  #isValid: boolean;
  #op?: FilterCombinatorOp;

  constructor(filter?: Filter) {
    super();
    if (isMultiClauseFilter(filter)) {
      this.#op = filter.op;
      filter.filters.forEach((f) => this.addFilterClause(f as FilterClause));
    } else if (filter) {
      this.addFilterClause(filter);
    } else {
      this.addNewFilterClause();
    }

    this.#isValid = isValidFilter(filter);
  }
  get isValid() {
    return this.#isValid;
  }

  private setIsValid(isValid: boolean) {
    this.#isValid = isValid;
    this.emit("isValid", isValid);
  }

  addNewFilterClause(operator?: FilterCombinatorOp) {
    const count = this.#children.length;
    if (!operator && !this.#op && count === 1) {
      this.#op = "and";
    } else if (operator && !this.#op && count === 1) {
      this.#op = operator;
    } else if (operator && this.#op && operator !== this.#op) {
      throw Error(
        "FilterModel: use setOp to change the Filter combinator operator"
      );
    }

    const filterClauseModel = new FilterClauseModel({});
    filterClauseModel.on("isValid", this.onFilterClauseStatusChange);
    filterClauseModel.on("filterClause", this.onFilterClauseChange);
    this.#children.push(filterClauseModel);
    this.setIsValid(false);
  }

  addFilterClause(filterClause: Partial<FilterClause> = {}) {
    const filterClauseModel = new FilterClauseModel(filterClause);
    filterClauseModel.on("isValid", this.onFilterClauseStatusChange);
    filterClauseModel.on("filterClause", this.onFilterClauseChange);
    this.#children.push(filterClauseModel);
  }

  removeFilterClause(filterClause: FilterClauseModel) {
    // We never allow the last clause to be removed
    if (this.isMultiClauseFilter) {
      const doomedFilter = this.filterClauses.indexOf(filterClause);
      if (doomedFilter !== -1) {
        this.filterClauses.splice(doomedFilter, 1);
        // If we're down the the last clause, we are no longer multi-clause
        if (this.filterClauses.length === 1) {
          this.#op = undefined;
        }
        this.checkValidStatus();
      }
    }
  }

  checkValidStatus() {
    const nowValid = isValidFilterModel(this);

    if (nowValid !== this.#isValid) {
      this.setIsValid(nowValid);
    }
  }

  onFilterClauseChange: FilterChangeHandler = () => {
    this.emit("filter", this.asFilter(false), this.#isValid);
  };

  onFilterClauseStatusChange = (isValid: boolean) => {
    if (!isValid && this.#isValid) {
      this.setIsValid(false);
    } else {
      this.checkValidStatus();
    }
  };

  getFilterClause(index: number) {
    return this.#children[index];
  }

  get op() {
    return this.#op;
  }

  setOp(op: FilterCombinatorOp) {
    this.#op = op;
    this.emit("filter", this.asFilter(false), this.#isValid);
  }

  get filterClauses() {
    return this.#children;
  }

  get isMultiClauseFilter() {
    return this.#op === "and" || this.#op === "or";
  }

  asFilter(throwIfInvalid = true): Filter {
    if (throwIfInvalid && !this.#isValid) {
      throw Error("Invalid filter model cannot be returned as Filter");
    }
    if (this.#op === "and" || this.#op === "or") {
      return {
        op: this.#op,
        filters: this.#children.map((f) => f.asFilter(throwIfInvalid)),
      } as MultiClauseFilter;
    } else {
      return this.#children[0].asFilter(throwIfInvalid);
    }
  }
}
