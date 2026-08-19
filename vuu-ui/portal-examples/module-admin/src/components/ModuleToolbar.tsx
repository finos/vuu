import {
  Dropdown,
  Option,
  Text,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@salt-ds/core";
import {
  GridIcon,
  InfoIcon,
  ListIcon,
  TreeIcon,
  WarningIcon,
} from "@salt-ds/icons";
import type { SyntheticEvent } from "react";
import {
  type GroupBy,
  type SortBy,
  type StatusFilter,
  relativeTime,
} from "../data/module-model";

const classBase = "vuuModuleAdmin";

export type ViewMode = "cards" | "tree" | "table";

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
  filter: StatusFilter;
  groupBy: GroupBy;
  lastCheckedAt?: number;
  onFilterChange: (filter: StatusFilter) => void;
  onGroupByChange: (groupBy: GroupBy) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onViewChange: (view: ViewMode) => void;
  sortBy: SortBy;
  view: ViewMode;
}

const buttonValue = (event: SyntheticEvent<HTMLButtonElement>) =>
  event.currentTarget.value;

export const ModuleToolbar = ({
  counts,
  filter,
  groupBy,
  lastCheckedAt,
  onFilterChange,
  onGroupByChange,
  onSortByChange,
  onViewChange,
  sortBy,
  view,
}: ModuleToolbarProps) => (
  <div className={`${classBase}-toolbar`}>
    <ToggleButtonGroup
      aria-label="Filter modules"
      className={`${classBase}-filters`}
      onChange={(event) => onFilterChange(buttonValue(event) as StatusFilter)}
      value={filter}
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
    <span className={`${classBase}-toolbarSpacer`} />
    <Text
      className={`${classBase}-checkedNote`}
      color="secondary"
      styleAs="label"
    >
      <InfoIcon aria-hidden />
      {lastCheckedAt
        ? `Remote status checked from this browser · ${relativeTime(lastCheckedAt)}`
        : "Remote status not checked yet"}
    </Text>
    {view !== "tree" ? (
      <>
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
      </>
    ) : null}
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
      <Tooltip content="Menu structure">
        <ToggleButton aria-label="Menu structure" value="tree">
          <TreeIcon aria-hidden />
        </ToggleButton>
      </Tooltip>
      <Tooltip content="Table">
        <ToggleButton aria-label="Table" value="table">
          <ListIcon aria-hidden />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  </div>
);
