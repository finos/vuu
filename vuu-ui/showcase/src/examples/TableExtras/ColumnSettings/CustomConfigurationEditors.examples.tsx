import { BackgroundCellConfigurationEditor } from "@finos/vuu-table-extras";
import type { ColumnDescriptorCustomRenderer } from "@finos/vuu-table-types";
import { ColumnRenderPropsChangeHandler } from "@finos/vuu-utils";
import { useState } from "react";

export const DefaultBackgroundCellConfigurationEditor = () => {
  const [column, setColumn] = useState<ColumnDescriptorCustomRenderer>({
    name: "test-column",
    type: {
      name: "number",
      renderer: {
        name: "vuu.price-move-background",
      },
    },
  });
  const onChangeRendering: ColumnRenderPropsChangeHandler = (renderProps) => {
    setColumn((col) => ({
      ...col,
      type: {
        ...col.type,
        renderer: {
          ...col.type.renderer,
          ...renderProps,
        },
      },
    }));
    console.log(`change render props`, {
      renderProps,
    });
  };
  return (
    <BackgroundCellConfigurationEditor
      column={column}
      onChangeRendering={onChangeRendering}
    />
  );
};
