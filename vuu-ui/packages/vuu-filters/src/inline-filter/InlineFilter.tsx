import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import inlineFilteCss from "./InlineFilter.css";
import { useHeaderProps } from "packages/vuu-table/src";

const classBase = "vuuInlineFilter";

export const InlineFilter = () => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-inline-filter",
    css: inlineFilteCss,
    window: targetWindow,
  });

  const { columns, virtualColSpan } = useHeaderProps();

  return <div className={classBase} />;
};
