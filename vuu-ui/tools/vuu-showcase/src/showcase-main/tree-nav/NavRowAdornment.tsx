import type { DataRow } from "@vuu-ui/vuu-table-types";
import { ToggleButton } from "@salt-ds/core";
import { type MouseEvent, useLayoutEffect, useRef } from "react";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { useDocTabs } from "../doc-tabs/doc-tabs-store";
import { isWorkspaceExample } from "../workspace/workspace-model";
import { favouritesStore, useFavourites } from "./nav-store";
import type { NavIndex, NavNodeData } from "./nav-tree";

const classBase = "ShowcaseNavRowAdornment";

export interface NavRowAdornmentProps {
  dataRow: DataRow;
  path?: string;
}

export const fixtureTitle = (testFileCount: number) =>
  `Test fixture, used by ${testFileCount} Playwright test file${testFileCount === 1 ? "" : "s"}`;

const FavouriteToggle = ({ label, path }: { label: string; path: string }) => {
  const isFavourite = useFavourites().includes(path);
  const handleClick = (evt: MouseEvent) => {
    // don't select the row
    evt.stopPropagation();
    favouritesStore.toggle(path);
  };
  return (
    <ToggleButton
      aria-label={
        isFavourite
          ? `Remove ${label} from favourites`
          : `Add ${label} to favourites`
      }
      className={`${classBase}-star`}
      onClick={handleClick}
      selected={isFavourite}
      tabIndex={-1}
      value="favourite"
    >
      <ChromeIcon name="star" size={14} />
    </ToggleButton>
  );
};

/**
 * Marks the row as draggable, an example can be dropped onto another to make
 * a workspace. The whole cell is the drag source, the drag itself is handled
 * by ShowcaseNav. TreeTable offers no way to set props on a cell, so the
 * attribute is set here.
 */
const DragGrip = () => {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const cell = ref.current?.closest<HTMLElement>(".vuuTableGroupCell");
    if (cell) {
      cell.draggable = true;
      return () => cell.removeAttribute("draggable");
    }
  }, []);
  return (
    <span
      aria-hidden
      className={`${classBase}-grip`}
      onClick={(evt) => evt.stopPropagation()}
      ref={ref}
      title="Drag onto the example, or a workspace, to combine"
    >
      <ChromeIcon name="grip" size={14} />
    </span>
  );
};

/**
 * Identifies the example a row represents, for the context menu etc, and
 * marks the row if the example is open in a tab other than the active tab.
 */
const DocumentMarker = ({ label, path }: { label: string; path: string }) => {
  const { activeId, tabs } = useDocTabs();
  const tab = tabs.find((t) => t.path === path);
  const inTab = tabs.length > 1 && tab !== undefined && tab.id !== activeId;
  return (
    <span
      className={inTab ? `${classBase}-inTab` : `${classBase}-doc`}
      data-nav-label={label}
      data-nav-path={path}
      hidden
    />
  );
};

export const NavRowAdornment = ({ dataRow, path }: NavRowAdornmentProps) => {
  const nodeData = (dataRow.nodeData ?? {}) as NavNodeData;
  const isFolder = dataRow.childCount > 0;
  if (isFolder) {
    return typeof nodeData.count === "number" ? (
      <span className={`${classBase}-count`}>{nodeData.count}</span>
    ) : null;
  }
  if (typeof nodeData.order === "number") {
    // a numbered docs chapter, positioned before the label by css
    return (
      <span className={`${classBase}-ordinal`}>
        {String(nodeData.order).padStart(2, "0")}
      </span>
    );
  }
  const label = dataRow[`Level ${dataRow.depth}`];
  const title = typeof label === "string" ? label : "example";
  return (
    <>
      {path && isWorkspaceExample(nodeData) ? (
        <>
          <DocumentMarker label={title} path={path} />
          {/* positioned before the label by css */}
          <DragGrip />
        </>
      ) : null}
      {nodeData.fixtureFor?.length ? (
        <span
          className={`${classBase}-fixture`}
          title={fixtureTitle(nodeData.fixtureFor.length)}
        >
          <ChromeIcon name="flask" size={12} />
        </span>
      ) : null}
      {nodeData.live ? (
        <span className="ShowcaseLiveDot" title="Uses live data" />
      ) : null}
      {path ? <FavouriteToggle label={title} path={path} /> : null}
    </>
  );
};

/** A stable adornment renderer for a nav tree */
export const createNavRowAdornmentRenderer =
  ({ pathForKey }: NavIndex) =>
  (dataRow: DataRow) => (
    <NavRowAdornment dataRow={dataRow} path={pathForKey(dataRow.key)} />
  );
