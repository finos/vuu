import type { DataRow } from "@vuu-ui/vuu-table-types";
import { ToggleButton } from "@salt-ds/core";
import type { MouseEvent } from "react";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { useExampleDragSource } from "../workspace/workspace-drag";
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

/** Drag handle, an example can be dropped onto another to make a workspace */
const DragGrip = ({ label, path }: { label: string; path: string }) => {
  const dragProps = useExampleDragSource({ path, title: label });
  return (
    <span
      {...dragProps}
      aria-hidden
      className={`${classBase}-grip`}
      onClick={(evt) => evt.stopPropagation()}
      title="Drag onto the example, or a workspace, to combine"
    >
      <ChromeIcon name="grip" size={14} />
    </span>
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
        // positioned before the label by css
        <DragGrip label={title} path={path} />
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
