import { HTMLAttributes } from "react";
import "./LayoutStartPanel.css";

const classBase = "vuuLayoutStartPanel";

export interface LayoutStartPanelProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export const LayoutStartPanel = (htmlAttributes: LayoutStartPanelProps) => {
  return (
    <div {...htmlAttributes} className={classBase}>
      <header className={`${classBase}-title`}>Start by adding a table</header>
      <div className={`${classBase}-text`}>
        To add a table, drag any of the Vuu Tables to this area or click the
        button below
      </div>
    </div>
  );
};
