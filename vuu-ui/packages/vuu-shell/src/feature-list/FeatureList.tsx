import { Palette, PaletteItem } from "@finos/vuu-layout";
import { Icon, ListProps } from "@finos/vuu-ui-controls";
import {
  FeatureProps,
  StaticFeatures,
  featureFromJson,
} from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, Key, useMemo } from "react";
import { Feature } from "../feature/Feature";

import featureListCss from "./FeatureList.css";

const classBase = "vuuFeatureList";

export type GroupedFeatureProps<P extends object | undefined = object> = Record<
  string,
  FeatureProps<P>[]
>;

export interface FeatureListProps<P extends object | undefined = object>
  extends HTMLAttributes<HTMLDivElement> {
  features: FeatureProps<P>[] | GroupedFeatureProps<P> | StaticFeatures;
  isStatic?: boolean;
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
  isStatic = false,
  ...htmlAttributes
}: FeatureListProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-feature-list",
    css: featureListCss,
    window: targetWindow,
  });

  const content = useMemo<JSX.Element[]>(() => {
    if (isStatic) {
      return Object.entries(features).map(([heading, feature], index) => {
        return (
          <div className={`${classBase}-group`} key={index}>
            <div className={`${classBase}-groupHeader`}>{heading}</div>
            <PaletteItem
              closeable
              component={featureFromJson({
                type: feature.type,
                label: feature.label,
              })}
              // key={i}
              label={feature.label}
              resizeable
              resize="defer"
              header
            >
              <Icon name="draggable" size={18} />
              <span className={`${classBase}-itemName`}>{feature.title}</span>
            </PaletteItem>
          </div>
        );
      });
    }
    if (Array.isArray(features)) {
      return [
        <div className={`${classBase}-standalone`} key={0}>
          <Palette
            key="0"
            orientation="vertical"
            ListProps={listPropsFullHeight}
          >
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
          </Palette>
        </div>,
      ];
    } else {
      return Object.entries(features).map(([heading, featureList], index) => (
        <div className={`${classBase}-group`} key={index}>
          <div className={`${classBase}-groupHeader`}>{heading}</div>
          <Palette orientation="vertical" ListProps={listPropsAutoHeight}>
            {featureList.map((featureProps: FeatureProps<object>, i: Key) => (
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
  }, [features, isStatic]);

  return (
    <div {...htmlAttributes} className={cx(classBase, "vuuScrollable")}>
      <div className={`${classBase}-header`}>{title}</div>
      <div className={`${classBase}-content`}>{content}</div>
    </div>
  );
};
