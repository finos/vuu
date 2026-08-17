import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { Row } from "@vuu-ui/vuu-table";
import type { BaseRowProps } from "@vuu-ui/vuu-table-types";
import cx from "clsx";
import { useInlineAddRow } from "./useInlineAddRow";

import inlineAddRowCss from "./InlineAddRow.css";

const classBase = "vuuInlineAddRow";

export type InlineAddRowProps = BaseRowProps;

export const InlineAddRow = ({
  ariaRowIndex,
  className,
  columns,
  style,
}: InlineAddRowProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-inline-add-row",
    css: inlineAddRowCss,
    window: targetWindow,
  });

  const { containerRef, dataRow, draftRevision, inlineAddColumns } =
    useInlineAddRow({
      columns,
    });

  return (
    <div className={cx(classBase, className)} ref={containerRef}>
      <Row
        ariaRowIndex={ariaRowIndex}
        columns={inlineAddColumns}
        dataRow={dataRow}
        key={draftRevision}
        offset={0}
        searchPattern=""
        showBookends={false}
        style={style}
        virtualColSpan={0}
      />
    </div>
  );
};
