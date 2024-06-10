import { Palette, PaletteItem } from "@finos/vuu-layout";
import { Icon, ListProps } from "@finos/vuu-ui-controls";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, useMemo } from "react";
import { Feature, FeatureProps } from "../feature/Feature";

import featureListCss from "./FeatureList.css";

const classBase = "vuuFeatureList";

export type GroupedFeatureProps<P extends object | undefined = object> = Record<
  string,
  FeatureProps<P>[]
>;

export interface FeatureListProps<P extends object | undefined = object>
  extends HTMLAttributes<HTMLDivElement> {
  features: FeatureProps<P>[] | GroupedFeatureProps<P>;
}

const listPropsFullHeight: Partial<ListProps> = {
  height: undefined,
  itemHeight: 40,
};
const listPropsAutoHeight: Partial<ListProps> = {
  displayedItemCount: 100,
  height: undefined,
  itemHeight: 40,
};

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

  const content = useMemo<JSX.Element[]>(() => {
    if (Array.isArray(features)) {
      return [
        <Palette key="0" orientation="vertical" ListProps={listPropsFullHeight}>
          {features.map((featureProps, i) => (
            <PaletteItem
              closeable
              component={<Feature {...featureProps} />}
              key={i}
              label={featureProps.title}
              resizeable
              resize="defer"
              header
            >
              <Icon name="draggable" size={18} />
              <span className={`${classBase}-itemName`}>
                {featureProps.title}
              </span>
            </PaletteItem>
          ))}
        </Palette>,
      ];
    } else {
      return Object.entries(features).map(([heading, featureList], index) => (
        <div className={`${classBase}-group`} key={index}>
          <div className={`${classBase}-groupHeader`}>{heading}</div>
          <Palette orientation="vertical" ListProps={listPropsAutoHeight}>
            {featureList.map((featureProps, i) => (
              <PaletteItem
                closeable
                component={<Feature {...featureProps} />}
                key={i}
                label={featureProps.title}
                resizeable
                resize="defer"
                header
              >
                <Icon name="draggable" size={18} />
                <span className={`${classBase}-itemName`}>
                  {featureProps.title}
                </span>
              </PaletteItem>
            ))}
          </Palette>
        </div>
      ));
    }
  }, [features]);

  return (
    <div {...htmlAttributes} className={cx(classBase, "vuuScrollable")}>
      <div className={`${classBase}-header`}>{title}</div>
      <div className={`${classBase}-content`}>{content}</div>
    </div>
  );
};
