import { HTMLAttributes } from "react";

export interface ComponentProps extends HTMLAttributes<HTMLDivElement> {
  height: number;
  width: number;
}

export const Component = ({ height, width }: ComponentProps) => {
  return (
    <div
      style={{
        background: "yellow",
        width,
        height,
      }}
    />
  );
};
