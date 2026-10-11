import {
  TabListNext,
  TabNext,
  TabNextPanel,
  type TabNextPanelProps,
  TabNextTrigger,
  TabsNext,
} from "@salt-ds/lab";
import type { ReactNode, SyntheticEvent } from "react";

export interface ExampleTab<T extends string = string> {
  count?: number;
  id: T;
  label: string;
}

export interface ExampleTabsProps<T extends string = string> {
  /** the tab panels, see ExampleTabPanel */
  children: ReactNode;
  onChange: (tab: T) => void;
  tabs: ExampleTab<T>[];
  value: T;
}

const classBase = "ShowcaseExampleTabs";

export const ExampleTabs = <T extends string = string>({
  children,
  onChange,
  tabs,
  value,
}: ExampleTabsProps<T>) => (
  <TabsNext
    className={`${classBase}-root`}
    onChange={(_: SyntheticEvent | null, tab: string) => onChange(tab as T)}
    value={value}
  >
    <TabListNext
      appearance="transparent"
      aria-label="Example views"
      className={classBase}
    >
      {tabs.map(({ count, id, label }) => (
        <TabNext key={id} value={id}>
          <TabNextTrigger>
            {label}
            {count !== undefined ? (
              <span className={`${classBase}-count`}>{count}</span>
            ) : null}
          </TabNextTrigger>
        </TabNext>
      ))}
    </TabListNext>
    {children}
  </TabsNext>
);

export const ExampleTabPanel = (props: TabNextPanelProps) => (
  <TabNextPanel {...props} />
);
