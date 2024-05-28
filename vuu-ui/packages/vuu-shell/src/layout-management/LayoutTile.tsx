import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { LayoutMetadata } from "./layoutTypes";

import layoutTileCss from "./LayoutTile.css";

const classBase = "vuuLayoutTile";

type LayoutTileProps = {
  metadata: LayoutMetadata;
  handleLoadLayout: (layoutId?: string) => void;
};

export const LayoutTile = (props: LayoutTileProps) => {
  const { metadata, handleLoadLayout } = props;
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-layout-tile",
    css: layoutTileCss,
    window: targetWindow,
  });

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
