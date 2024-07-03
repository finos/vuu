import { TableSchema } from "@finos/vuu-data-types";
import { Stack, StackProps } from "@finos/vuu-layout";
import { FeatureList, LayoutList } from "@finos/vuu-shell";
import { GetFeaturePaths, getFilterTableFeatures } from "@finos/vuu-utils";
import { useMemo, useState } from "react";

import "./LayoutComponentsPanel.css";

const classBase = "vuuLayoutComponentsPanel";

export interface LayoutComponentsPanelProps extends StackProps {
  tableSchemas: TableSchema[];
}

const getFeaturePath: GetFeaturePaths = ({
  env,
  fileName,
  withCss = env === "production",
}) => {
  if (env === "production") {
    const url = `/features/${fileName}.feature.js`;
    return {
      url,
      css: withCss ? `/features/${fileName}.feature.css` : undefined,
    };
  } else {
    return {
      url: `/src/features/${fileName}.feature`,
    };
  }
};

export const LayoutComponentsPanel = ({
  tableSchemas,
  ...htmlAttributes
}: LayoutComponentsPanelProps) => {
  const [active, setActive] = useState(0);

  const features = useMemo(
    () => getFilterTableFeatures(tableSchemas, getFeaturePath),
    [tableSchemas]
  );

  return (
    <Stack
      {...htmlAttributes}
      active={active}
      className={classBase}
      onTabSelectionChanged={setActive}
    >
      <LayoutList data-tab-title="Layouts" />
      <FeatureList data-tab-title="Components" features={features} />
    </Stack>
  );
};
