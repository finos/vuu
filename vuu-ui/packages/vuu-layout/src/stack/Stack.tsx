import { Tab, Tabstrip, TabstripProps } from "@finos/vuu-ui-controls";
import { useId } from "@finos/vuu-utils";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import React, {
  ForwardedRef,
  forwardRef,
  ReactElement,
  ReactNode,
  useCallback,
  useRef,
} from "react";
import { getDefaultTabLabel } from "../layout-reducer";
import { StackProps } from "./stackTypes";

import stackCss from "./Stack.css";

const classBase = "vuuTabs";

const getDefaultTabIcon = () => undefined;

const getChildElements = <T extends ReactElement = ReactElement>(
  children: ReactNode,
): T[] => {
  const elements: T[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      elements.push(child as T);
    } else {
      console.warn(`Stack has unexpected child element type`);
    }
  });
  return elements;
};

const DefaultTabstripProps: Partial<TabstripProps> = {
  allowAddTab: false,
  allowCloseTab: false,
  allowRenameTab: false,
};

export const Stack = forwardRef(function Stack(
  {
    TabstripProps = DefaultTabstripProps,
    active = 0,
    children,
    className: classNameProp,
    getTabIcon = getDefaultTabIcon,
    getTabLabel = getDefaultTabLabel,
    id: idProp,
    keyBoardActivation = "manual",
    // onMouseDown,
    onAddTab,
    onMoveTab,
    onTabClose,
    onTabEdit,
    onTabSelectionChanged,
    showTabs = "top",
    style,
  }: StackProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-stack",
    css: stackCss,
    window: targetWindow,
  });

  const id = useId(idProp);
  const tabLabelsRef = useRef<string[]>([]);
  const {
    allowCloseTab,
    allowRenameTab,
    className: tabstripClassName,
  } = TabstripProps;

  const handleExitEditMode = useCallback(
    (
      _oldText: string,
      newText: string,
      _allowDeactivation: boolean,
      tabIndex: number,
    ) => {
      onTabEdit?.(tabIndex, newText);
    },
    [onTabEdit],
  );

  const activeChild = () => {
    //TODO need to inject an id if child does not have one, so we can
    // establish the aria-controls relationship. In a Vuu layout, there
    // will always be an id.
    if (React.isValidElement(children)) {
      return children;
    }
    if (Array.isArray(children)) {
      return children[active] ?? null;
    }
    return null;
  };

  // The list of existing Tab Labels is required only when assigning a default label
  // to a new Tab. We rebuild on each render
  tabLabelsRef.current.length = 0;

  const renderTabs = () =>
    getChildElements(children).map((child, idx) => {
      const {
        closeable = allowCloseTab,
        id: childId = `${id}-${idx}`,
        "data-tab-location": tabLocation,
      } = child.props;
      const label = getTabLabel(child, idx, tabLabelsRef.current);
      tabLabelsRef.current.push(label);
      return (
        <Tab
          ariaControls={childId}
          data-icon={getTabIcon(child, idx)}
          key={childId}
          id={`${childId}-tab`}
          index={idx}
          label={label}
          location={tabLocation}
          closeable={closeable}
          editable={allowRenameTab}
        />
      );
    });

  const child = activeChild();
  const isHorizontal = showTabs === "left" || showTabs === "right";
  const tabstripOrientation = isHorizontal ? "vertical" : "horizontal";

  return (
    <div
      className={cx(classBase, classNameProp, {
        [`${classBase}-horizontal`]: isHorizontal,
      })}
      style={style}
      id={id}
      ref={ref}
    >
      {showTabs ? (
        <Tabstrip
          aria-label="data tabs"
          {...TabstripProps}
          activeTabIndex={
            TabstripProps?.activeTabIndex ?? (child === null ? -1 : active)
          }
          allowDragDrop={TabstripProps.allowDragDrop !== false}
          animateSelectionThumb
          className={cx("vuuTabHeader", tabstripClassName)}
          keyBoardActivation={keyBoardActivation}
          onActiveChange={onTabSelectionChanged}
          onAddTab={onAddTab}
          onCloseTab={onTabClose}
          onExitEditMode={handleExitEditMode}
          onMoveTab={onMoveTab}
          orientation={tabstripOrientation}
        >
          {renderTabs()}
        </Tabstrip>
      ) : null}
      <div
        aria-labelledby={`${id}-${active}`}
        className={`${classBase}-tabPanel`}
        role="tabpanel"
      >
        {child}
      </div>
    </div>
  );
});
Stack.displayName = "Stack";
