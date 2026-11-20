import {
  Tab,
  TabBar,
  TabList,
  TabPanel,
  TabTrigger,
  Tabs,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  Children,
  type HTMLAttributes,
  isValidElement,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useState,
} from "react";

import tabbedConfigPanelCss from "./TabbedConfigPanel.css";

const classBase = "vuuTabbedConfigPanel";

export interface ConfigPanelTabProps {
  /**
   * The content of the tab panel.
   */
  children?: ReactNode;
  className?: string;
  /**
   * A disabled tab is shown, but cannot be selected.
   */
  disabled?: boolean;
  /**
   * The label of the tab.
   */
  label: ReactNode;
  /**
   * Identifies the tab, must be unique within the panel.
   */
  value: string;
}

/**
 * Describes one tab of a TabbedConfigPanel. It renders nothing by itself,
 * TabbedConfigPanel reads its props to render the tab and its panel.
 */
export const ConfigPanelTab = (_props: ConfigPanelTabProps) => null;

const isConfigPanelTab = (
  node: ReactNode,
): node is ReactElement<ConfigPanelTabProps> =>
  isValidElement<ConfigPanelTabProps>(node) &&
  typeof node.props.value === "string";

export interface TabbedConfigPanelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> {
  /**
   * The tabs, each a ConfigPanelTab, in order. Falsy children are ignored,
   * so tabs can be included conditionally.
   */
  children: ReactNode;
  /**
   * The tab selected initially (uncontrolled). Defaults to the first tab
   * that is not disabled.
   */
  defaultValue?: string;
  /**
   * Accessible name of the tab list.
   */
  tabListLabel?: string;
  /**
   * Invoked when the user selects a tab.
   */
  onChange?: (value: string) => void;
  /**
   * The selected tab (controlled).
   */
  value?: string;
}

/**
 * A tabbed panel for configuration UI, e.g. in a context panel. The host
 * decides which tabs it includes, and what each shows, with ConfigPanelTab
 * children.
 */
export const TabbedConfigPanel = ({
  children,
  className,
  defaultValue,
  onChange,
  tabListLabel = "Settings",
  value: valueProp,
  ...htmlAttributes
}: TabbedConfigPanelProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-tabbed-config-panel",
    css: tabbedConfigPanelCss,
    window: targetWindow,
  });

  const tabs = Children.toArray(children).filter(isConfigPanelTab);

  const [uncontrolledValue, setUncontrolledValue] = useState<
    string | undefined
  >(
    () =>
      defaultValue ?? tabs.find(({ props }) => !props.disabled)?.props.value,
  );
  const value = valueProp ?? uncontrolledValue;

  const handleChange = useCallback(
    (_e: SyntheticEvent | null, newValue: string) => {
      setUncontrolledValue(newValue);
      onChange?.(newValue);
    },
    [onChange],
  );

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      <Tabs onChange={handleChange} value={value}>
        <TabBar>
          <TabList appearance="transparent" aria-label={tabListLabel}>
            {tabs.map(({ props }) => (
              <Tab
                disabled={props.disabled}
                key={props.value}
                value={props.value}
              >
                <TabTrigger>{props.label}</TabTrigger>
              </Tab>
            ))}
          </TabList>
        </TabBar>
        {tabs.map(({ props }) => (
          <TabPanel
            className={cx(`${classBase}-panel`, props.className)}
            key={props.value}
            value={props.value}
          >
            {props.children}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
};
