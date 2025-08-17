import { Palette, PaletteItem } from "@vuu-ui/vuu-layout";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import {
  DynamicFeatureProps,
  StaticFeatureDescriptor,
  featureFromJson,
  isStaticFeatures,
} from "@vuu-ui/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, Key, ReactElement, useMemo } from "react";
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

  const content = useMemo<ReactElement[]>(() => {
    if (isStaticFeatures(features)) {
      return features.map(({ label, type }, idx) => {
        return (
          <PaletteItem
            ViewProps={{
              closeable: true,
              header: true,
              resize: "defer",
              resizeable: true,
            }}
            component={featureFromJson({ type })}
            key={idx}
            value={label}
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
          <Palette key="0" orientation="vertical">
            {features.map(({ ViewProps, ...featureProps }, i) => (
              <PaletteItem
                ViewProps={{
                  closeable: true,
                  header: true,
                  resize: "defer",
                  resizeable: true,
                  title: featureProps.title,
                  ...ViewProps,
                }}
                component={<Feature {...featureProps} />}
                key={i}
                value={featureProps.title}
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
          <Palette orientation="vertical">
            {featureList.map(
              (
                { ViewProps, ...featureProps }: DynamicFeatureProps<object>,
                i: Key,
              ) => {
                return (
                  <PaletteItem
                    ViewProps={{
                      closeable: true,
                      header: true,
                      resize: "defer",
                      resizeable: true,
                      title: featureProps.title,
                      ...ViewProps,
                    }}
                    component={<Feature {...featureProps} />}
                    key={i}
                    value={featureProps.title}
                  >
                    <Icon name="draggable" size={18} />
                    <span className={`${classBase}-itemName`}>
                      {featureProps.title}
                    </span>
                  </PaletteItem>
                );
              },
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
