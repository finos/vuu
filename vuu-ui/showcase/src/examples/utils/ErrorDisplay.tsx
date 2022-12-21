import { SaltProvider } from "@salt-ds/core";
import { HTMLAttributes } from "react";

export type ErrorDisplayProps = HTMLAttributes<HTMLDivElement>;

export const ErrorDisplay = ({ children, ...props }: ErrorDisplayProps) => (
  <SaltProvider>
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
  </SaltProvider>
);
