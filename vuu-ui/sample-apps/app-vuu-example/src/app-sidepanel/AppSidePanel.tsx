import { TableSchema } from "@finos/vuu-data";
import { Palette, PaletteItem, ViewProps } from "@finos/vuu-layout";
import { Feature, Features } from "@finos/vuu-shell";
import {
  Accordion,
  AccordionGroup,
  AccordionHeader,
  AccordionPanel,
} from "@salt-ds/core";
import { Dropdown, SelectionChangeHandler } from "@salt-ds/lab";
import cx from "classnames";
import { ReactElement, useMemo, useState } from "react";

import "./AppSidePanel.css";

const NO_FEATURES: Features = {};
const NULL_FEATURE = {};
export interface AppSidePanelProps {
  features?: Features;
  tables?: Map<string, TableSchema>;
  ViewProps?: Partial<ViewProps>;
}

type FeatureDescriptor = {
  className: string;
  css: string;
  js: string;
  name: string;
  title: string;
};

const byModule = (schema1: TableSchema, schema2: TableSchema) => {
  const m1 = schema1.table.module.toLowerCase();
  const m2 = schema2.table.module.toLowerCase();
  if (m1 < m2) {
    return -1;
  } else if (m1 > m2) {
    return 1;
  } else if (schema1.table.table < schema2.table.table) {
    return -1;
  } else if (schema1.table.table > schema2.table.table) {
    return 1;
  } else {
    return 0;
  }
};

const capitalize = (text: string) =>
  text.length === 0 ? "" : text[0].toUpperCase() + text.slice(1);

const regexp_worfify = /(?<!(^|[A-Z]))(?=[A-Z])|(?<!^)(?=[A-Z][a-z])/;
const wordify = (text: string) => {
  const [firstWord, ...rest] = text.split(regexp_worfify);
  return `${capitalize(firstWord)} ${rest.join(" ")}`;
};

const classBase = "vuuAppSidePanel";

export const AppSidePanel = ({
  features = NO_FEATURES,
  tables,
  ViewProps,
}: AppSidePanelProps) => {
  const gridFeatures = useMemo(
    () =>
      Object.entries(features).map(([featureName, { title, url, css }]) => {
        return {
          className: featureName,
          css,
          js: url,
          name: featureName,
          title,
        } as FeatureDescriptor;
      }),
    [features]
  );

  const [selectedFeature, setSelectedFeature] = useState<FeatureDescriptor>(
    gridFeatures[0] ?? NULL_FEATURE
  );
  const handleSelectFeature: SelectionChangeHandler = (event, item) => {
    const feature = gridFeatures.find((f) => f.title === item);
    if (feature) {
      setSelectedFeature(feature);
    }
  };

  const paletteItems = useMemo(() => {
    return tables === undefined
      ? []
      : Array.from(tables.values())
          .sort(byModule)
          .map((schema) => {
            const { className, css, js } = selectedFeature;
            return {
              component: (
                <Feature
                  css={css}
                  params={{
                    className,
                    schema,
                    style: { height: "100%" },
                  }}
                  url={js}
                />
              ),
              id: schema.table.table,
              label: `${schema.table.module} ${wordify(schema.table.table)}`,
            };
          });
  }, [selectedFeature, tables]);

  const featureSelection = (): ReactElement => {
    const featureNames = gridFeatures.map((f) => f.title);
    if (featureNames.length === 1) {
      return <div>{featureNames[0]}</div>;
    } else {
      return (
        <Dropdown<string>
          className="vuuFeatureDropdown"
          fullWidth
          onSelectionChange={handleSelectFeature}
          selected={selectedFeature?.title}
          source={featureNames}
        />
      );
    }
  };

  return (
    <div className={cx(classBase)}>
      <AccordionGroup>
        <Accordion value="layouts">
          <AccordionHeader>My Layouts</AccordionHeader>
          <AccordionPanel id="layouts" key={"layouts"}></AccordionPanel>
        </Accordion>
        <Accordion defaultExpanded value="tables">
          <AccordionHeader>Vuu Tables</AccordionHeader>
          <AccordionPanel id="tables" key={"tables"}>
            <>
              {featureSelection()}
              <Palette
                orientation="vertical"
                style={{ width: "100%", height: "100%" }}
                ViewProps={ViewProps}
              >
                {paletteItems.map((spec) => (
                  <PaletteItem
                    closeable
                    key={spec.id}
                    label={spec.label}
                    resizeable
                    resize="defer"
                    header
                  >
                    {spec.component}
                  </PaletteItem>
                ))}
              </Palette>
            </>
          </AccordionPanel>
        </Accordion>
        <Accordion value="templates">
          <AccordionHeader>Layout Templates</AccordionHeader>
          <AccordionPanel></AccordionPanel>
        </Accordion>
      </AccordionGroup>
    </div>
  );
};
