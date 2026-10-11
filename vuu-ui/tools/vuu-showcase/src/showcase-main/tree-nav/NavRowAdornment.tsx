import type { DataRow } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import type { MouseEvent } from "react";
import { ChromeIcon } from "../chrome/ChromeIcon";
import { favouritesStore, useFavourites } from "./nav-store";
import type { NavIndex, NavNodeData } from "./nav-tree";

const classBase = "ShowcaseNavRowAdornment";

export interface NavRowAdornmentProps {
  dataRow: DataRow;
  path?: string;
}

const FavouriteToggle = ({ label, path }: { label: string; path: string }) => {
  const isFavourite = useFavourites().includes(path);
  const handleClick = (evt: MouseEvent) => {
    // don't select the row
    evt.stopPropagation();
    favouritesStore.toggle(path);
  };
  return (
    <button
      aria-label={
        isFavourite
          ? `Remove ${label} from favourites`
          : `Add ${label} to favourites`
      }
      aria-pressed={isFavourite}
      className={cx(`${classBase}-star`, {
        [`${classBase}-star-on`]: isFavourite,
      })}
      onClick={handleClick}
      tabIndex={-1}
      type="button"
    >
      <ChromeIcon name="star" size={14} />
    </button>
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
  const label = dataRow[`Level ${dataRow.depth}`];
  return (
    <>
      {nodeData.live ? (
        <span className="ShowcaseLiveDot" title="Uses live data" />
      ) : null}
      {path ? (
        <FavouriteToggle
          label={typeof label === "string" ? label : "example"}
          path={path}
        />
      ) : null}
    </>
  );
};

/** A stable adornment renderer for a nav tree */
export const createNavRowAdornmentRenderer =
  ({ pathForKey }: NavIndex) =>
  (dataRow: DataRow) => (
    <NavRowAdornment dataRow={dataRow} path={pathForKey(dataRow.key)} />
  );
