import { LayoutMetadata } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes } from "react";

import layoutTileCss from "./LayoutTile.css";

const classBase = "vuuLayoutTile";

export interface LayoutTileProps extends HTMLAttributes<HTMLDivElement> {
  metadata: LayoutMetadata;
  onLoadLayout: (layoutId?: string) => void;
}

export const LayoutTile = ({
  metadata,
  onLoadLayout,
  ...htmlAttributes
}: LayoutTileProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-layout-tile",
    css: layoutTileCss,
    window: targetWindow,
  });

  return (
    <div
      {...htmlAttributes}
      className={`${classBase}-layoutTile`}
      key={metadata?.id}
      onClick={() => onLoadLayout(metadata?.id)}
    >
      <img className={`${classBase}-screenshot`} src={metadata?.screenshot} />
      <div>
        <div className={`${classBase}-layoutName`}>{metadata?.name}</div>
        <div className={`${classBase}-layoutDetails`}>
          <div>{`${metadata?.created}`}</div>
        </div>
      </div>
    </div>
  );
};
