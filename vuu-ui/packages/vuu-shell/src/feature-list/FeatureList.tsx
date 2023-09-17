import { Palette, PaletteItem } from "@finos/vuu-layout";
import { HTMLAttributes } from "react";
import { Feature, FeatureProps } from "../feature/Feature";

import "./FeatureList.css";

const classBase = "vuuFeatureList";

export interface FeatureListProps extends HTMLAttributes<HTMLDivElement> {
  features: FeatureProps[];
}

export const FeatureList = ({
  features,
  title = "VUU TABLES",
  ...htmlAttributes
}: FeatureListProps) => {
  const ViewProps = {};

  console.log({ features });

  return (
    <div {...htmlAttributes} className={classBase}>
      <div className={`${classBase}-header`}>{title}</div>
      <Palette orientation="vertical" ViewProps={ViewProps}>
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
  );
};
