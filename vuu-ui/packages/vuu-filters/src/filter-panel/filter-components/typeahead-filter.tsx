import { useTypeaheadSuggestions } from "@finos/vuu-data";
import { TypeaheadParams } from "@finos/vuu-protocol-types";
import "./typeahead-filter.css";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, DropdownOpenIcon } from "../icons";

export type TypeaheadFilterProps = {
  defaultTypeaheadParams: TypeaheadParams;
  onFilterSubmit: (newFilter: string[], query: string) => void;
  filterValues?: string[];
};

export const TypeaheadFilter = ({
  defaultTypeaheadParams,
  filterValues = [],
  onFilterSubmit,
}: TypeaheadFilterProps) => {
  const [tableName, columnName] = defaultTypeaheadParams;
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const getSuggestions = useTypeaheadSuggestions();

  //close dropdown when clicking outside
  useEffect(() => {
    const closeDropdown = (event: MouseEvent): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    window.addEventListener("click", closeDropdown);

    return () => {
      window.removeEventListener("click", closeDropdown);
    };
  }, []);

  // Update selections when column or typing
  useEffect(() => {
    const params: TypeaheadParams = searchValue
      ? [tableName, columnName, searchValue]
      : defaultTypeaheadParams;

    getSuggestions(params).then((options) => {
      if (searchValue) {
        options.unshift(`${searchValue}...`);
      }
      setSuggestions(options);
    });
  }, [
    searchValue,
    columnName,
    tableName,
    getSuggestions,
    defaultTypeaheadParams,
  ]);

  // Select search input on render after toggle changed
  useEffect(() => {
    setSearchValue("");
    if (showDropdown && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showDropdown]);

  const getUpdatedSelection = (
    selectedValue: string,
    isStartsWithFilter: boolean
  ) => {
    if (isSelected(selectedValue))
      return filterValues.filter((suggestion) => suggestion !== selectedValue);

    if (isStartsWithFilter) return [selectedValue];

    return [...filterValues, selectedValue];
  };

  const onTagAddOrRemove =
    (tagValue: string) => (e: React.MouseEvent<HTMLSpanElement>) => {
      e.stopPropagation();
      const isStartsWithFilter = /\.\.\.$/.test(tagValue); // Does the value end in elipsis
      const newSelection = getUpdatedSelection(tagValue, isStartsWithFilter);
      const query = getTypeaheadQuery(
        newSelection,
        columnName,
        isStartsWithFilter
      );
      onFilterSubmit(newSelection, query);
    };

  const isSelected = (selected: string) => filterValues.includes(selected);

  return (
    <div className="dropdown-container" ref={ref}>
      <div
        onClick={() => setShowDropdown(!showDropdown)}
        className="dropdown-input"
      >
        <div className="dropdown-selected-value">
          <div className="dropdown-tags">
            {filterValues.map((suggestion) => (
              <div key={suggestion} className="dropdown-tag-item">
                {suggestion}
                <span
                  onClick={onTagAddOrRemove(suggestion)}
                  className="dropdown-tag-close"
                >
                  <CloseIcon />
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="dropdown-tools">
          <div className="dropdown-tool">
            <DropdownOpenIcon />
          </div>
        </div>
      </div>
      {showDropdown && (
        <div className="dropdown-menu">
          <div className="search-box">
            <input
              onChange={(e) => setSearchValue(e.target.value)}
              ref={searchRef}
              id="input-field"
            />
          </div>
          {suggestions.map((suggestion: string) => (
            <div
              key={suggestion}
              className={`dropdown-item ${
                isSelected(suggestion) && "selected"
              }`}
              onClick={onTagAddOrRemove(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getTypeaheadQuery = (
  filterValues: string[],
  column: string,
  isStartsWithFilter?: boolean
) => {
  if (filterValues.length === 0) {
    return "";
  }

  if (isStartsWithFilter) {
    const startsWith = filterValues[0].substring(0, filterValues[0].length - 3);
    return `${column} starts "${startsWith}"`; // multiple starts with filters not currently supported
  }

  return `${column} in ${JSON.stringify(filterValues)}`;
};
