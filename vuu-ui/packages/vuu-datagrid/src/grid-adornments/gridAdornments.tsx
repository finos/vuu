import React, { ReactNode } from "react";

export interface GridAdornmentProps {
  children: ReactNode;
  height?: number;
}

export type GridAdornment = React.FunctionComponent<GridAdornmentProps>;

export const Header: GridAdornment = ({ children, height }) => {
  return (
    <div
      className="header"
      style={{ position: "absolute", top: 0, height, width: "100%" }}
    >
      {children}
    </div>
  );
};

export const Footer: GridAdornment = ({ children, height }) => {
  return (
    <div
      className="header"
      style={{ position: "absolute", bottom: 0, height, width: "100%" }}
    >
      {children}
    </div>
  );
};

export const InlineHeader: GridAdornment = ({ children, height }) => {
  return (
    <div
      className="inline-header"
      style={{ position: "absolute", bottom: 0, height, width: "100%" }}
    >
      {children}
    </div>
  );
};
