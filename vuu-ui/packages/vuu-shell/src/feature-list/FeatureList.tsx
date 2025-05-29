import { Palette, PaletteItem } from "@vuu-ui/vuu-layout";
import { Icon, ListProps } from "@vuu-ui/vuu-ui-controls";
import {
  DynamicFeatureProps,
  StaticFeatureDescriptor,
  featureFromJson,
  isStaticFeatures,
} from "@vuu-ui/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, Key, useMemo } from "react";
import { Feature } from "../feature/Feature";

import featureListCss from "./FeatureList.css";

const classBase = "vuuFeatureList";

export type GroupedFeatureProps<P extends object | undefined = object> = Record<
  string,
  DynamicFeatureProps<P>[]
>;

export interface FeatureListProps extends HTMLAttributes<HTMLDivElement> {
  features:
    | DynamicFeatureProps[]
    | GroupedFeatureProps
    | StaticFeatureDescriptor[];
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
    if (isStaticFeatures(features)) {
      return features.map(({ label, type }, idx) => {
        return (
          <PaletteItem
            closeable
            component={featureFromJson({ type })}
            key={idx}
            label={label}
            resizeable
            resize="defer"
            header
          >
            <Icon name="draggable" size={18} />
            <span className={`${classBase}-itemName`}>{label}</span>
          </PaletteItem>
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
            {featureList.map(
              (featureProps: DynamicFeatureProps<object>, i: Key) => (
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
              ),
            )}
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
