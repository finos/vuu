import { LayoutMetadata } from "./layoutTypes";

import "./LayoutTile.css";

const classBase = "vuuLayoutTile";

type LayoutTileProps = {
  metadata: LayoutMetadata;
  handleLoadLayout: (layoutId?: string) => void;
};

export const LayoutTile = (props: LayoutTileProps) => {
  const { metadata, handleLoadLayout } = props;

  return (
    <div role="listitem">
      <div
        className={`${classBase}-layoutTile`}
        key={metadata?.id}
        role="button"
        onClick={() => handleLoadLayout(metadata?.id)}
      >
        <img className={`${classBase}-screenshot`} src={metadata?.screenshot} />
        <div>
          <div className={`${classBase}-layoutName`}>{metadata?.name}</div>
          <div className={`${classBase}-layoutDetails`}>
            <div>{`${metadata?.user}, ${metadata?.created}`}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
