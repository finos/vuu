import { memo } from "react";

export const VirtualColSpan = memo(function VirtualColSpan({
  width,
}: {
  width: number;
}) {
  return (
    <div
      className="vuuVirtualColSpan"
      style={{ display: "inline-block", width }}
    />
  );
});
