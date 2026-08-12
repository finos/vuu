import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Row } from "@vuu-ui/vuu-table";
import type { BaseRowProps } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import { useInlineAddRow } from "./useInlineAddRow";

import inlineAddRowCss from "./InlineAddRow.css";

const classBase = "vuuInlineAddRow";

export interface InlineAddRowProps extends BaseRowProps {}

export const InlineAddRow = ({
  ariaRowIndex,
  className,
  columns,
  style,
  virtualColSpan = 0,
}: InlineAddRowProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-inline-add-row",
    css: inlineAddRowCss,
    window: targetWindow,
  });

  const { containerRef, dataRow, editableColumns } = useInlineAddRow({
    columns,
  });

  return (
    <div className={cx(classBase, className)} ref={containerRef}>
      <Row
        ariaRowIndex={ariaRowIndex}
        columns={editableColumns}
        dataRow={dataRow}
        offset={0}
        searchPattern=""
        showBookends={false}
        style={style}
        virtualColSpan={virtualColSpan}
      />
    </div>
  );
};
