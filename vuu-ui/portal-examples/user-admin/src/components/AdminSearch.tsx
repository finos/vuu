import { SearchIcon } from "@salt-ds/icons";
import { VuuInput } from "@vuu-ui/vuu-ui-controls";
import cx from "clsx";

export interface AdminSearchProps {
  className?: string;
  defaultValue?: string;
  label: string;
  onSearch: (value: string) => void;
  placeholder?: string;
}

/** Commits on Enter only; clearing the input and pressing Enter resets it. */
export const AdminSearch = ({
  className,
  defaultValue,
  label,
  onSearch,
  placeholder = "Search users, groups and roles",
}: AdminSearchProps) => (
  <VuuInput
    bordered
    className={cx("vuuIdentityAdmin-search", className)}
    commitOnBlur={false}
    commitWhenCleared={false}
    defaultValue={defaultValue}
    inputProps={{ "aria-label": label, title: "Press Enter to search" }}
    onCommit={(_, value) => onSearch(String(value).trim())}
    placeholder={placeholder}
    startAdornment={<SearchIcon aria-hidden />}
  />
);
