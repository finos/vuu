import { Button, Input, ToggleButton } from "@salt-ds/core";
import type { ChangeEvent, KeyboardEvent } from "react";
import { ChromeIcon, type ChromeIconName } from "../chrome/ChromeIcon";
import type { NavFilterChip, NavFilterState } from "./nav-filter";

import "./NavFilter.css";

const classBase = "ShowcaseNavFilter";

const chips: { chip: NavFilterChip; icon?: ChromeIconName; label: string }[] = [
  { chip: "live", label: "Live data" },
  { chip: "fixtures", icon: "flask", label: "Test fixtures" },
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
      <Input
        className={`${classBase}-field`}
        endAdornment={
          filter.query ? (
            <Button
              appearance="transparent"
              aria-label="Clear filter"
              className={`${classBase}-clear`}
              onClick={() => onChange({ ...filter, query: "" })}
            >
              <ChromeIcon name="close" size={14} />
            </Button>
          ) : (
            <kbd aria-hidden>/</kbd>
          )
        }
        inputProps={{
          "aria-label": placeholder,
          onKeyDown: handleKeyDown,
          spellCheck: false,
        }}
        onChange={handleChange}
        placeholder={placeholder}
        startAdornment={<ChromeIcon name="filter" />}
        value={filter.query}
      />
      {showChips ? (
        <div className={`${classBase}-chips`} role="group" aria-label="Show">
          {chips.map(({ chip, icon, label }) => (
            <ToggleButton
              className={`${classBase}-chip`}
              key={chip}
              onChange={() => toggleChip(chip)}
              selected={filter.chip === chip}
              value={chip}
            >
              {icon ? (
                <ChromeIcon name={icon} size={12} />
              ) : (
                <span className="ShowcaseLiveDot" />
              )}
              {label}
            </ToggleButton>
          ))}
        </div>
      ) : null}
    </div>
  );
};
