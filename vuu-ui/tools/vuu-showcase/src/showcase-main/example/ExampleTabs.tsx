import {
  TabList,
  Tab,
  TabPanel,
  type TabPanelProps,
  TabTrigger,
  Tabs,
} from "@salt-ds/core";
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
  <Tabs
    className={`${classBase}-root`}
    onChange={(_: SyntheticEvent | null, tab: string) => onChange(tab as T)}
    value={value}
  >
    <TabList
      appearance="transparent"
      aria-label="Example views"
      className={classBase}
    >
      {tabs.map(({ count, id, label }) => (
        <Tab key={id} value={id}>
          <TabTrigger>
            {label}
            {count !== undefined ? (
              <span className={`${classBase}-count`}>{count}</span>
            ) : null}
          </TabTrigger>
        </Tab>
      ))}
    </TabList>
    {children}
  </Tabs>
);

export const ExampleTabPanel = (props: TabPanelProps) => (
  <TabPanel {...props} />
);
