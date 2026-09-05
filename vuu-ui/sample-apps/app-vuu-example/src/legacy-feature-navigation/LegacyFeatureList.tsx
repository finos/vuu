import { Palette, PaletteItem } from "@vuu-ui/vuu-layout";
import { Icon } from "@vuu-ui/vuu-ui-controls";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { type HTMLAttributes, type ReactElement, useMemo } from "react";
import { LegacyFeature } from "./LegacyFeature";
import type { DynamicFeatureProps } from "./types";

import featureListCss from "../../../../packages/vuu-shell/src/feature-list/FeatureList.css";

const classBase = "vuuFeatureList";

export type GroupedFeatureProps<P extends object | undefined = object> = Record<
  string,
  DynamicFeatureProps<P>[]
>;

export const LegacyFeatureList = ({
  features,
  title = "VUU TABLES",
  ...htmlAttributes
}: HTMLAttributes<HTMLDivElement> & {
  features: DynamicFeatureProps[] | GroupedFeatureProps;
}) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "legacy-vuu-feature-list",
    css: featureListCss,
    window: targetWindow,
  });

  const content = useMemo<ReactElement[]>(() => {
    const renderFeature = ({
      ViewProps,
      ...featureProps
    }: DynamicFeatureProps) => (
      <PaletteItem
        ViewProps={{
          closeable: true,
          header: true,
          resize: "defer",
          resizeable: true,
          title: featureProps.title,
          ...ViewProps,
        }}
        component={<LegacyFeature {...featureProps} />}
        key={featureProps.url}
        value={featureProps.title}
      >
        <Icon name="draggable" size={18} />
        <span className={`${classBase}-itemName`}>{featureProps.title}</span>
      </PaletteItem>
    );

    if (Array.isArray(features)) {
      return [
        <div className={`${classBase}-standalone`} key="features">
          <Palette orientation="vertical">
            {features.map(renderFeature)}
          </Palette>
        </div>,
      ];
    }

    return Object.entries(features).map(([heading, featureList]) => (
      <div className={`${classBase}-group`} key={heading}>
        <div className={`${classBase}-groupHeader`}>{heading}</div>
        <Palette orientation="vertical">
          {featureList.map(renderFeature)}
        </Palette>
      </div>
    ));
  }, [features]);

  return (
    <div {...htmlAttributes} className={cx(classBase, "vuuScrollable")}>
      <div className={`${classBase}-header`}>{title}</div>
      <div className={`${classBase}-content`}>{content}</div>
    </div>
  );
};
