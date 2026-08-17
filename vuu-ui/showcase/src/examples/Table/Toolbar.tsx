import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

const toolbarStyle: CSSProperties = {
  alignItems: "center",
  background: "var(--saltToolbar-background, white)",
  borderBottom: "1px solid #d6d6d6",
  display: "flex",
  gap: 8,
  minHeight: 40,
  padding: "4px 8px",
};

export const Toolbar = ({ children, style, ...props }: ToolbarProps) => (
  <div {...props} style={{ ...toolbarStyle, ...style }}>
    {children}
  </div>
);

export const ToolbarTooltray = ({
  children,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    style={{
      alignItems: "center",
      display: "flex",
      gap: 8,
      marginLeft: "auto",
      ...style,
    }}
  >
    {children}
  </div>
);
