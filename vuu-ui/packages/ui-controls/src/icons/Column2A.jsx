import React from "react";
import SvgIcon, { neverRerender } from "./svg-icon";

const svgPath = (
  <>
    <path
      className="hwIcon-path hwIcon-path-1"
      d="M8,1H2A1,1,0,0,0,1,2V16a1,1,0,0,0,1,1H8Z"
    />
    <path
      className="hwIcon-path hwIcon-path-2"
      d="M16,1H10V17h6a1,1,0,0,0,1-1V2A1,1,0,0,0,16,1Z"
    />
  </>
);

export const Column2AIcon = React.memo(
  (props) => <SvgIcon {...props} size={36} svgPath={svgPath} />,
  neverRerender
);
Column2AIcon.displayName = "Column2AIcon";
