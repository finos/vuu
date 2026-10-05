import {
  Button,
  Dropdown,
  Input,
  Option,
  Text,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@salt-ds/core";
import {
  CloseIcon,
  FilterIcon,
  GridIcon,
  ListIcon,
  WarningIcon,
} from "@salt-ds/icons";
import type { SyntheticEvent } from "react";
import type { GroupBy, SortBy, StatusFilter } from "../data/module-model";
import type { ViewMode } from "../ModuleAdminContext";
import { inputValue } from "./ModuleForm";

const classBase = "vuuModuleAdmin";

const GROUP_LABELS: Record<GroupBy, string> = {
  none: "None",
  section: "Menu section",
  status: "Status",
};
const SORT_LABELS: Record<SortBy, string> = {
  menu: "Menu order",
  title: "Title",
  updated: "Last updated",
};

export interface ModuleToolbarProps {
  counts: Record<StatusFilter, number>;
  filter: string;
  groupBy: GroupBy;
  onFilterChange: (filter: string) => void;
  onGroupByChange: (groupBy: GroupBy) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onStatusChange: (status: StatusFilter) => void;
  onViewChange: (view: ViewMode) => void;
  sortBy: SortBy;
  status: StatusFilter;
  view: ViewMode;
}

const buttonValue = (event: SyntheticEvent<HTMLButtonElement>) =>
  event.currentTarget.value;

export const ModuleToolbar = ({
  counts,
  filter,
  groupBy,
  onFilterChange,
  onGroupByChange,
  onSortByChange,
  onStatusChange,
  onViewChange,
  sortBy,
  status,
  view,
}: ModuleToolbarProps) => (
  <div className={`${classBase}-toolbar`}>
    <ToggleButtonGroup
      aria-label="Filter by status"
      className={`${classBase}-filters`}
      onChange={(event) => onStatusChange(buttonValue(event) as StatusFilter)}
      value={status}
    >
      <ToggleButton value="all">
        All <span className={`${classBase}-count`}>{counts.all}</span>
      </ToggleButton>
      <ToggleButton value="enabled">
        Enabled <span className={`${classBase}-count`}>{counts.enabled}</span>
      </ToggleButton>
      <ToggleButton value="disabled">
        Disabled <span className={`${classBase}-count`}>{counts.disabled}</span>
      </ToggleButton>
      <ToggleButton value="attention">
        <WarningIcon aria-hidden /> Needs attention{" "}
        <span className={`${classBase}-count`}>{counts.attention}</span>
      </ToggleButton>
    </ToggleButtonGroup>
    <Input
      aria-label="Filter modules"
      bordered
      className={`${classBase}-filterInput`}
      endAdornment={
        filter ? (
          <Button
            appearance="transparent"
            aria-label="Clear filter"
            onClick={() => onFilterChange("")}
          >
            <CloseIcon aria-hidden />
          </Button>
        ) : null
      }
      inputProps={{
        onKeyDown: (event) => {
          if (event.key === "Escape") onFilterChange("");
        },
        placeholder: "Filter modules",
      }}
      onChange={(event) => onFilterChange(inputValue(event))}
      startAdornment={<FilterIcon aria-hidden />}
      value={filter}
    />
    <div className={`${classBase}-toolbarEnd`}>
      <div className={`${classBase}-select`}>
        <Text color="secondary" styleAs="label">
          Group by
        </Text>
        <Dropdown
          bordered
          aria-label="Group by"
          onSelectionChange={(_, [value]) =>
            value && onGroupByChange(value as GroupBy)
          }
          selected={[groupBy]}
          value={GROUP_LABELS[groupBy]}
        >
          {(Object.keys(GROUP_LABELS) as GroupBy[]).map((key) => (
            <Option key={key} value={key}>
              {GROUP_LABELS[key]}
            </Option>
          ))}
        </Dropdown>
      </div>
      <div className={`${classBase}-select`}>
        <Text color="secondary" styleAs="label">
          Sort
        </Text>
        <Dropdown
          bordered
          aria-label="Sort by"
          onSelectionChange={(_, [value]) =>
            value && onSortByChange(value as SortBy)
          }
          selected={[sortBy]}
          value={SORT_LABELS[sortBy]}
        >
          {(Object.keys(SORT_LABELS) as SortBy[]).map((key) => (
            <Option key={key} value={key}>
              {SORT_LABELS[key]}
            </Option>
          ))}
        </Dropdown>
      </div>
      <ToggleButtonGroup
        aria-label="View"
        onChange={(event) => onViewChange(buttonValue(event) as ViewMode)}
        value={view}
      >
        <Tooltip content="Cards">
          <ToggleButton aria-label="Cards" value="cards">
            <GridIcon aria-hidden />
          </ToggleButton>
        </Tooltip>
        <Tooltip content="List">
          <ToggleButton aria-label="List" value="table">
            <ListIcon aria-hidden />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
    </div>
  </div>
);
