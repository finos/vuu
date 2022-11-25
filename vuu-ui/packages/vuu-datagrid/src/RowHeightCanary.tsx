import { useRowHeight } from "./use-row-height";
import "./RowHeightCanary.css";

export const RowHeightCanary = () => {
  const rowHeightCanary = useRowHeight();
  return <div className="Grid-rowHeightCanary" ref={rowHeightCanary} />;
};
