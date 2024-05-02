import { Palette, PaletteItem } from "@finos/vuu-layout";
import { ListProps } from "@finos/vuu-ui-controls";
import { HTMLAttributes } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import { Feature, FeatureProps } from "../feature/Feature";

import featureListCss from "./FeatureList.css";

const classBase = "vuuFeatureList";

export interface FeatureListProps extends HTMLAttributes<HTMLDivElement> {
  features: FeatureProps[];
}

export const FeatureList = ({
  features,
  title = "VUU TABLES",
  ...htmlAttributes
}: FeatureListProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-feature-list",
    css: featureListCss,
    window: targetWindow,
  });

  const ViewProps = {};

  const listProps: Partial<ListProps> = {
    height: "100%",
  };

  return (
    <div {...htmlAttributes} className={classBase}>
      <div className={`${classBase}-header`}>{title}</div>
      <div className={`${classBase}-content`}>
        <Palette
          orientation="vertical"
          ListProps={listProps}
          ViewProps={ViewProps}
        >
          {features.map((featureProps, i) => (
            <PaletteItem
              closeable
              key={i}
              label={featureProps.title}
              resizeable
              resize="defer"
              header
            >
              <Feature {...featureProps} />
            </PaletteItem>
          ))}
        </Palette>
      </div>
    </div>
  );
};
