import React, { useRef, useState } from "react";
import cx from "classnames";
import {
  Button,
  CloseIcon,
  FilterIcon,
  StateButton,
} from "@vuu-ui/ui-controls";
import { Toolbar, Tooltray, useViewContext } from "@vuu-ui/vuu-layout";

import "./query-filter.css";

const isValidQuery = (filterQuery) => {
  if (!filterQuery || !filterQuery.trim()) {
    return false;
  }
  // TODO match against regex
  return true;
};

const buildFilterQuery = (filters, joinOp = "or") =>
  Object.values(filters)
    .filter(({ enabled }) => enabled)
    .map(({ filterQuery }) => filterQuery)
    .join(` ${joinOp} `);

const QueryFilter = ({ onChange }) => {
  const { save } = useViewContext();

  // const filterRef = useRef(load("query-filter") ?? {})
  const filterRef = useRef({});
  const [filters, setFilters] = useState(filterRef.current);
  const [joinOp, setJoinOp] = useState("or");

  const [filterValue, setFilterValue] = useState("");

  const handleFilterValueChange = (e) => {
    setFilterValue(e.target.value);
  };

  const addFilter = (filter) => {
    let match, filterQuery, filterName;
    /* eslint-disable no-cond-assign */
    if ((match = filter.match(/(.*)\s+as\s+(\S+)/))) {
      [, filterQuery, filterName] = match;
    } else {
      filterQuery = filter;
      filterName = filter;
    }

    const newState = {
      ...filters,
      [filterName]: {
        filterQuery,
        enabled: true,
      },
    };

    onChange(buildFilterQuery(newState));

    setFilters((filterRef.current = newState));

    save(filterRef.current, "query-filter");
  };

  const removeFilter = (filterName) => {
    const newState = {
      ...filters,
    };

    delete newState[filterName];

    onChange(buildFilterQuery(newState));

    setFilters((filterRef.current = newState));

    save(filterRef.current, "query-filter");
  };

  // useEffect(() => () => save(filterRef.current, "query-filter") ,[save])

  const handleKeyDown = ({ key }) => {
    if (key === "Enter") {
      if (isValidQuery(filterValue)) {
        addFilter(filterValue);
        setFilterValue("");
      } else {
        console.log("not valid yet");
      }
    }
  };

  const toggleFilter = (filterName) => {
    const newState = {
      ...filters,
      [filterName]: {
        ...filters[filterName],
        enabled: !filters[filterName].enabled,
      },
    };

    onChange(buildFilterQuery(newState, joinOp));
    setFilters(newState);
  };

  const toggleOr = (evt, value) => {
    const op = joinOp === "or" ? "and" : "or";
    if (joinOp !== op) {
      onChange(buildFilterQuery(filters, op));
      setJoinOp(op);
    }
  };

  const handleClearFilters = () => {
    setFilters({});
    setFilterValue("");
    onChange("");
  };

  const handleFilterTagKeyDown = ({ key }, filterName) => {
    if (key === "Backspace") {
      removeFilter(filterName);
    }
  };

  const ToggleBoolean = () => (
    <StateButton
      width={25}
      className={cx(`${classBase}-andor`, {
        [`${classBase}-andor-selected`]: joinOp === "or",
      })}
      checked={joinOp === "or"}
      onChange={toggleOr}
    >
      {joinOp}
    </StateButton>
  );

  const classBase = "hwQueryFilter";
  const filterKeys = Object.keys(filters);
  return (
    <Toolbar className={cx(classBase)}>
      <FilterIcon />
      <input
        aria-label="filter text"
        className="hwFilterInput"
        onChange={handleFilterValueChange}
        onKeyDown={handleKeyDown}
        placeholder="filter query [as name]"
        value={filterValue}
        width={170}
      />
      {filterKeys.length > 0 ? (
        <Tooltray>
          {filterKeys.reduce((list, filterName, i, arr) => {
            list.push(
              <StateButton
                className={cx(`${classBase}-pill`)}
                checked={filters[filterName].enabled}
                key={i}
                onChange={() => toggleFilter(filterName)}
                onKeyDown={(e) => handleFilterTagKeyDown(e, filterName)}
              >
                <span>{filterName}</span>
              </StateButton>
            );
            if (i < arr.length - 1) {
              list.push(<ToggleBoolean />);
            }
            return list;
          }, [])}
        </Tooltray>
      ) : null}
      {filterKeys.length > 0 ? (
        <Button onPress={handleClearFilters}>
          <CloseIcon />
        </Button>
      ) : null}
    </Toolbar>
  );
};

export default QueryFilter;
