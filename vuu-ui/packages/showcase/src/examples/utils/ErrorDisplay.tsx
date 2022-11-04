import { ToolkitProvider } from "@heswell/uitk-core";
import { HTMLAttributes } from "react";

export type ErrorDisplayProps = HTMLAttributes<HTMLDivElement>;

export const ErrorDisplay = ({ children, ...props }: ErrorDisplayProps) => (
  <ToolkitProvider>
    <div
      {...props}
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  </ToolkitProvider>
);
