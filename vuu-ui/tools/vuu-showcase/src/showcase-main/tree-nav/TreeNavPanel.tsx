import type { TreeNodeFilterPredicate } from "@vuu-ui/vuu-data-local";
import { TreeTable, type TreeTableProps } from "@vuu-ui/vuu-datatable";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import type { CSSProperties, ReactNode } from "react";
import { useTreeNavPanel } from "./useTreeNavPanel";

import "./TreeNavPanel.css";

const classBase = "vuuTreeNavPanel";

const isNotHeading = ({ depth }: DataRow) => depth !== 1;

export interface TreeNavPanelProps extends Pick<
  TreeTableProps,
  "autoSelectRowKey" | "onSelect" | "renderNodeAdornment" | "rowHeight"
> {
  className?: string;
  /**
   * Filter applied to tree nodes. When provided, the panel is controlled and
   * the consumer is responsible for the filter UI, usually via header.
   */
  filterPredicate?: TreeNodeFilterPredicate;
  footer?: ReactNode;
  /**
   * Content above the tree. Defaults to a simple label filter, pass null to
   * render no header.
   */
  header?: ReactNode;
  /**
   * Vertical guide lines connect the children of an expanded node, the
   * selected node is marked on its guide.
   */
  indentGuides?: boolean;
  /** Text highlighted in node labels, usually the current filter text */
  searchPattern?: string;
  source: TreeSourceNode[];
  style?: CSSProperties;
  /**
   * Top level nodes are rendered as non selectable section headings, always
   * expanded, with their children un-indented beneath them.
   */
  topLevelHeadings?: boolean;
}

/**
 * Tree navigation, with optional header and footer. Appearance can be
 * customised via the --vuuTreeNavPanel-* custom properties.
 */
export const TreeNavPanel = ({
  autoSelectRowKey,
  className,
  filterPredicate: filterPredicateProp,
  footer,
  header,
  indentGuides = false,
  onSelect,
  renderNodeAdornment,
  rowHeight = 30,
  searchPattern: searchPatternProp,
  source,
  style,
  topLevelHeadings = false,
}: TreeNavPanelProps) => {
  const { dataSource, defaultFilter, searchPattern } = useTreeNavPanel({
    filterPredicate: filterPredicateProp,
    searchPattern: searchPatternProp,
    source,
    useDefaultFilter: header === undefined,
  });

  return (
    <div
      className={cx(classBase, className, {
        [`${classBase}-headings`]: topLevelHeadings,
        [`${classBase}-indentGuides`]: indentGuides,
      })}
      style={style}
    >
      {header === undefined ? (
        <div className={`${classBase}-header`}>{defaultFilter}</div>
      ) : header === null ? null : (
        <div className={`${classBase}-header`}>{header}</div>
      )}
      <div className={`${classBase}-treeContainer`}>
        <TreeTable
          autoSelectRowKey={autoSelectRowKey}
          dataSource={dataSource}
          isRowSelectable={topLevelHeadings ? isNotHeading : undefined}
          onSelect={onSelect}
          renderNodeAdornment={renderNodeAdornment}
          revealSelected
          rowHeight={rowHeight}
          searchPattern={searchPattern}
          showColumnHeaders={false}
          width="100%"
        />
      </div>
      {footer ? <div className={`${classBase}-footer`}>{footer}</div> : null}
    </div>
  );
};
