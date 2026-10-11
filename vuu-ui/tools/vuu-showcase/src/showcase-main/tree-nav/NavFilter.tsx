import cx from "clsx";
import type { ChangeEvent, KeyboardEvent } from "react";
import { ChromeIcon, type ChromeIconName } from "../chrome/ChromeIcon";
import type { NavFilterChip, NavFilterState } from "./nav-filter";

import "./NavFilter.css";

const classBase = "ShowcaseNavFilter";

const chips: { chip: NavFilterChip; icon?: ChromeIconName; label: string }[] = [
  { chip: "live", label: "Live data" },
  { chip: "favourites", icon: "star", label: "Favourites" },
  { chip: "recent", icon: "clock", label: "Recent" },
];

export interface NavFilterProps {
  filter: NavFilterState;
  onChange: (filter: NavFilterState) => void;
  placeholder: string;
  showChips?: boolean;
}

export const NavFilter = ({
  filter,
  onChange,
  placeholder,
  showChips = false,
}: NavFilterProps) => {
  const handleChange = (evt: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...filter, query: evt.target.value });

  const handleKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === "Escape") {
      if (filter.query) {
        onChange({ ...filter, query: "" });
      } else {
        evt.currentTarget.blur();
      }
    }
  };

  const toggleChip = (chip: NavFilterChip) =>
    onChange({ ...filter, chip: filter.chip === chip ? undefined : chip });

  return (
    <div className={classBase}>
      <div className={`${classBase}-field`}>
        <ChromeIcon name="filter" />
        <input
          aria-label={placeholder}
          className={`${classBase}-input`}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          type="text"
          value={filter.query}
        />
        {filter.query ? (
          <button
            aria-label="Clear filter"
            className={`${classBase}-clear`}
            onClick={() => onChange({ ...filter, query: "" })}
            type="button"
          >
            <ChromeIcon name="close" size={14} />
          </button>
        ) : (
          <kbd aria-hidden>/</kbd>
        )}
      </div>
      {showChips ? (
        <div className={`${classBase}-chips`} role="group" aria-label="Show">
          {chips.map(({ chip, icon, label }) => (
            <button
              aria-pressed={filter.chip === chip}
              className={cx(`${classBase}-chip`, {
                [`${classBase}-chip-on`]: filter.chip === chip,
              })}
              key={chip}
              onClick={() => toggleChip(chip)}
              type="button"
            >
              {icon ? (
                <ChromeIcon name={icon} size={12} />
              ) : (
                <span className="ShowcaseLiveDot" />
              )}
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
