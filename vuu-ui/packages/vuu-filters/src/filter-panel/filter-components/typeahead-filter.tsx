import { useTypeaheadSuggestions } from "@finos/vuu-data";
import { TypeaheadParams } from "@finos/vuu-protocol-types";
import "./typeahead-filter.css";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, Icon } from "../Icons";

export const TypeaheadFilter = ({
  filterParams,
  existingFilters,
  onFilterSubmit,
}: Props) => {
  const [tableName, columnName] = filterParams;
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<
    string[] | null
  >(existingFilters ?? null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const startsWithFilter = useRef<boolean>(false);

  useEffect(() => {
    setSearchValue("");
    if (showDropdown && searchRef.current) {
      searchRef.current.focus();
    }
  }, [showDropdown]);

  const ref = useRef<HTMLDivElement>(null);

  // get suggestions & filters on column select
  useEffect(() => {
    getSuggestions(filterParams).then((response) => {
      setSuggestions(response);
    });

    const selected = existingFilters ?? null;
    setSelectedSuggestions(selected);
  }, [columnName]);

  //close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any): void => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  });

  // get suggestions while typing
  useEffect(() => {
    getSuggestions([tableName, columnName, searchValue]).then((options) => {
      if (searchValue) options.unshift(`${searchValue}...`);
      setSuggestions(options);
    });
  }, [searchValue]);

  // on select new, check if "starts with" filter selected and rebuild query
  useEffect(() => {
    startsWithFilter.current = isStartsWithFilter();
    const filterQuery = getTypeaheadQuery(
      selectedSuggestions,
      columnName,
      startsWithFilter.current
    );
    onFilterSubmit(filterQuery, selectedSuggestions, columnName);
  }, [selectedSuggestions]);

  const isStartsWithFilter = () => {
    if (selectedSuggestions && selectedSuggestions[0]) {
      const lastThreeCharacters = selectedSuggestions[0].substring(
        selectedSuggestions[0].length - 3,
        selectedSuggestions[0].length
      );

      if (selectedSuggestions.length === 1 && lastThreeCharacters === "...") {
        return true;
      }
    }

    return false;
  };

  const handleDropdownToggle = (event: React.MouseEvent): void => {
    event.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const getSuggestions = useTypeaheadSuggestions();

  const onSearch = ({ target }: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchValue(target.value);
  };

  const suggestionSelected = (value: string) => {
    setSelectedSuggestions(getUpdatedSelection(value));
  };

  const getUpdatedSelection = (selectedValue: string) => {
    if (isAlreadySelected(selectedValue)) return removeOption(selectedValue);

    if (isStartsWithVal(selectedValue) || startsWithFilter.current)
      return [selectedValue];

    return [...(selectedSuggestions ?? []), selectedValue];
  };

  const getDisplay = () => {
    if (!selectedSuggestions || selectedSuggestions.length === 0)
      return "Filter";

    return (
      <div className="dropdown-tags">
        {selectedSuggestions.map((suggestion) => (
          <div key={suggestion} className="dropdown-tag-item">
            {suggestion}
            <span
              onClick={(e) => onTagRemove(e, suggestion)}
              className="dropdown-tag-close"
            >
              <CloseIcon />
            </span>
          </div>
        ))}
      </div>
    );
  };

  const onTagRemove = (e: React.MouseEvent, suggestion: string): void => {
    e.stopPropagation();
    const newSelection = removeOption(suggestion);
    setSelectedSuggestions(newSelection);
    const filterQuery = getTypeaheadQuery(
      newSelection,
      columnName,
      startsWithFilter.current
    );
    onFilterSubmit(filterQuery, selectedSuggestions);
  };

  const removeOption = (option: string): string[] | null => {
    if (selectedSuggestions) {
      const newSelection = selectedSuggestions.filter((o) => o !== option);
      return newSelection.length > 0 ? newSelection : null;
    }

    return null;
  };

  const isSelected = (selected: string): boolean => {
    return selectedSuggestions?.includes(selected) ?? false;
  };

  function isStartsWithVal(selectedVal: string) {
    return selectedVal === searchValue + "...";
  }

  const isAlreadySelected = (selectedValue: string): boolean => {
    if (selectedSuggestions)
      return (
        selectedSuggestions.findIndex(
          (suggestion) => suggestion === selectedValue
        ) >= 0
      );

    return false;
  };

  return (
    <>
      <div className="dropdown-container" ref={ref}>
        <div onClick={handleDropdownToggle} className="dropdown-input">
          <div className="dropdown-selected-value">{getDisplay()}</div>
          <div className="dropdown-tools">
            <div className="dropdown-tool">
              <Icon />
            </div>
          </div>
        </div>
        {showDropdown && (
          <div className="dropdown-menu">
            <div className="search-box">
              <input
                onChange={onSearch}
                value={searchValue}
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
                onClick={() => {
                  suggestionSelected(suggestion);
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

function getTypeaheadQuery(
  filterValues: string[] | null,
  column: string,
  isStartsWithFilter?: boolean
) {
  if (!filterValues || filterValues.length === 0) {
    return;
  }

  if (isStartsWithFilter) {
    const startsWith = filterValues[0].slice(0, -3);
    return `${column} starts ${startsWith}`;
  }

  return `${column} in ${JSON.stringify(filterValues)}`;
}

interface Props {
  filterParams: TypeaheadParams;
  existingFilters: string[] | null;
  onFilterSubmit: Function;
}
