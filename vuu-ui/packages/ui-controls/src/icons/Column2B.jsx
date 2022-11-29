import React from "react";
import SvgIcon, { neverRerender } from "./svg-icon";

const svgLink = (
  <>
    <path
      className="hwIcon-path hwIcon-path-1"
      d="M11,1H2A1,1,0,0,0,1,2V16a1,1,0,0,0,1,1h9Z"
    />
    <path
      className="hwIcon-path hwIcon-path-2"
      d="M16,1H13V17h3a1,1,0,0,0,1-1V2A1,1,0,0,0,16,1Z"
    />
  </>
);

export const Column2BIcon = React.memo(
  () => <SvgIcon svgPath={svgLink} />,
  neverRerender
);
Column2BIcon.displayName = "Column2BIcon";
