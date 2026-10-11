import { type KeyboardEvent, useRef } from "react";

export interface ExampleTab<T extends string = string> {
  count?: number;
  id: T;
  label: string;
}

export interface ExampleTabsProps<T extends string = string> {
  idPrefix: string;
  onChange: (tab: T) => void;
  tabs: ExampleTab<T>[];
  value: T;
}

const classBase = "ShowcaseExampleTabs";

export const tabId = (idPrefix: string, tab: string) =>
  `${idPrefix}-tab-${tab}`;
export const panelId = (idPrefix: string, tab: string) =>
  `${idPrefix}-panel-${tab}`;

/** ARIA tabs, arrow keys move between tabs (automatic activation) */
export const ExampleTabs = <T extends string = string>({
  idPrefix,
  onChange,
  tabs,
  value,
}: ExampleTabsProps<T>) => {
  const listRef = useRef<HTMLDivElement>(null);
  const handleKeyDown = (e: KeyboardEvent) => {
    const index = tabs.findIndex((tab) => tab.id === value);
    const nextIndex =
      e.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : e.key === "ArrowLeft"
          ? (index - 1 + tabs.length) % tabs.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? tabs.length - 1
              : -1;
    if (nextIndex !== -1) {
      e.preventDefault();
      onChange(tabs[nextIndex].id);
      listRef.current
        ?.querySelectorAll<HTMLButtonElement>("[role=tab]")
        [nextIndex]?.focus();
    }
  };
  return (
    <div
      aria-label="Example views"
      className={classBase}
      onKeyDown={handleKeyDown}
      ref={listRef}
      role="tablist"
    >
      {tabs.map(({ count, id, label }) => (
        <button
          aria-controls={panelId(idPrefix, id)}
          aria-selected={id === value}
          className={`${classBase}-tab`}
          id={tabId(idPrefix, id)}
          key={id}
          onClick={() => onChange(id)}
          role="tab"
          tabIndex={id === value ? 0 : -1}
          type="button"
        >
          {label}
          {count !== undefined ? (
            <span className={`${classBase}-count`}>{count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
};
