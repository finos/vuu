import {
  Dropdown,
  Option,
  ToggleButton,
  ToggleButtonGroup,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { useId } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  type HTMLAttributes,
  type KeyboardEvent,
  type SyntheticEvent,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ColumnSetModel } from "./ColumnSetModel";
import { useColumnSetsState } from "./useColumnSetModel";

import columnSetSwitcherCss from "./ColumnSetSwitcher.css";

const classBase = "vuuColumnSetSwitcher";

export interface ColumnSetSwitcherProps extends HTMLAttributes<HTMLDivElement> {
  columnSetModel: ColumnSetModel;
  /**
   * Label shown before the control.
   * @default "Columns"
   */
  label?: string;
  /**
   * Most column sets shown as segments, more than this and a dropdown is used.
   * @default 4
   */
  maxSegments?: number;
  /**
   * 'auto' shows segments, unless there are more than maxSegments sets or
   * there is not room for them, then a dropdown.
   * @default "auto"
   */
  variant?: "auto" | "dropdown" | "segmented";
}

/**
 * Switches between the column sets of a grid, for a host to place in a
 * toolbar above the grid. Hidden when there are fewer than two sets.
 */
export const ColumnSetSwitcher = ({
  className,
  columnSetModel,
  id: idProp,
  label = "Columns",
  maxSegments = 4,
  style,
  variant = "auto",
  ...htmlAttributes
}: ColumnSetSwitcherProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-column-set-switcher",
    css: columnSetSwitcherCss,
    window: targetWindow,
  });

  const id = useId(idProp);
  const labelId = `${id}-label`;
  const { activeColumnSet = "", columnSets } =
    useColumnSetsState(columnSetModel);

  const rootRef = useRef<HTMLDivElement>(null);
  // the width the segments need, measured when they no longer fit
  const [segmentsWidth, setSegmentsWidth] = useState<number | undefined>();
  const tooMany = columnSets.length > maxSegments;
  const showSegments =
    variant === "segmented" ||
    (variant === "auto" && !tooMany && segmentsWidth === undefined);

  // In auto mode, the root can shrink. When the segments overflow it, a
  // dropdown takes their place, until there is room for them again.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (variant !== "auto" || tooMany || root === null) {
      return;
    }
    const checkFit = () => {
      const group = root.querySelector<HTMLElement>(`.${classBase}-segments`);
      if (group) {
        if (group.scrollWidth > group.clientWidth + 1) {
          setSegmentsWidth(root.scrollWidth);
        }
      } else {
        setSegmentsWidth((width) =>
          width !== undefined && root.clientWidth >= width ? undefined : width,
        );
      }
    };
    checkFit();
    const observer = new ResizeObserver(checkFit);
    observer.observe(root);
    return () => observer.disconnect();
  }, [columnSets, showSegments, tooMany, variant]);

  const selectColumnSet = useCallback(
    (name?: string) => {
      if (name && columnSets.some((set) => set.name === name)) {
        columnSetModel.setActiveColumnSet(name);
      }
    },
    [columnSetModel, columnSets],
  );

  const handleToggleChange = useCallback(
    (evt: SyntheticEvent<HTMLButtonElement>) => {
      selectColumnSet(evt.currentTarget.value);
    },
    [selectColumnSet],
  );

  // Arrow keys move focus between segments, the focused set is selected,
  // as for any radiogroup.
  const handleKeyDown = useCallback(
    (evt: KeyboardEvent<HTMLDivElement>) => {
      if (evt.key.startsWith("Arrow")) {
        const { activeElement } = evt.currentTarget.ownerDocument;
        if (
          activeElement instanceof HTMLButtonElement &&
          evt.currentTarget.contains(activeElement)
        ) {
          selectColumnSet(activeElement.value);
        }
      }
    },
    [selectColumnSet],
  );

  const handleDropdownChange = useCallback(
    (_evt: SyntheticEvent, [name]: string[]) => {
      selectColumnSet(name);
    },
    [selectColumnSet],
  );

  if (columnSets.length < 2) {
    return null;
  }

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      id={id}
      ref={rootRef}
      style={
        segmentsWidth === undefined
          ? style
          : { ...style, flexBasis: segmentsWidth }
      }
    >
      <span className={`${classBase}-label`} id={labelId}>
        {label}
      </span>
      {showSegments ? (
        <ToggleButtonGroup
          aria-labelledby={labelId}
          className={`${classBase}-segments`}
          onChange={handleToggleChange}
          onKeyDown={handleKeyDown}
          value={activeColumnSet}
        >
          {columnSets.map(({ name }) => (
            <ToggleButton key={name} value={name}>
              {name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      ) : (
        <Dropdown
          aria-labelledby={labelId}
          bordered
          className={`${classBase}-dropdown`}
          onSelectionChange={handleDropdownChange}
          placeholder="Choose column set"
          selected={activeColumnSet ? [activeColumnSet] : []}
          value={activeColumnSet}
        >
          {columnSets.map(({ name }) => (
            <Option key={name} value={name} />
          ))}
        </Dropdown>
      )}
    </div>
  );
};
